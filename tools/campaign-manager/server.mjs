import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { open, readFile, rename, rm, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import {
  createCampaign,
  deleteCampaign,
  deleteEntity,
  exportCampaign,
  getCampaign,
  getState,
  importCampaign,
  saveEntity,
  saveImage,
  updateCampaign,
} from './store.mjs';
import {
  detectHardware,
  IMAGE_MODELS,
  publicAiConfig,
  readAiConfig,
  recommendModels,
  TEXT_MODELS,
  validateComfyRoot,
  writeAiConfig,
} from './ai-config.mjs';
import {
  discoverLocalModels,
  generateDraftImages,
  generateImagePromptsWithText,
  importEntityWithAi,
  processNotesWithText,
  testAiProvider,
} from './ai-service.mjs';
import {
  publicPublishingConfig,
  readPublishingConfig,
  testPublishingConnection,
  uploadBuild,
  writePublishingConfig,
} from './publishing.mjs';

const MANAGER_ROOT = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(MANAGER_ROOT, '..', '..');
const PUBLIC_ROOT = join(MANAGER_ROOT, 'public');
const TRANSCRIBER_ROOT = join(PROJECT_ROOT, 'discord-transcriber');
const TOKEN = randomBytes(24).toString('hex');
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const jobs = new Map();
const children = new Set();
const hardwarePromise = detectHardware();
let activeServer;
let shuttingDown = false;

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(value));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request exceeds the 12 MB limit.');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function assertToken(request) {
  if (request.headers['x-manager-token'] !== TOKEN) throw new Error('Invalid manager token.');
}

function assertSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return;
  const expected = `http://${request.headers.host}`;
  if (origin !== expected) throw new Error('Cross-origin manager requests are not allowed.');
}

function jobSnapshot() {
  return Object.fromEntries(
    [...jobs.entries()].map(([key, job]) => [key, { ...job, process: undefined }]),
  );
}

function appendLog(job, text) {
  job.logs = `${job.logs}${text}`.slice(-20_000);
  job.updatedAt = new Date().toISOString();
}

function startBackgroundJob(kind, work) {
  const current = jobs.get(kind);
  if (current && current.status === 'running') return current;
  const job = {
    kind,
    status: 'running',
    logs: '',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(kind, job);
  Promise.resolve()
    .then(() => work(job))
    .then(() => {
      job.status = 'success';
      job.updatedAt = new Date().toISOString();
    })
    .catch((error) => {
      appendLog(job, `\n${error instanceof Error ? error.message : 'Unknown error'}\n`);
      job.status = 'failed';
    });
  return job;
}

async function runLoggedCommand(command, args, cwd, job) {
  await new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd, windowsHide: true, env: { ...process.env } });
    child.stdout.on('data', (data) => appendLog(job, data.toString()));
    child.stderr.on('data', (data) => appendLog(job, data.toString()));
    child.once('error', rejectRun);
    child.once('close', (code) =>
      code === 0 ? resolveRun() : rejectRun(new Error(`Build exited with code ${code}.`)),
    );
  });
}

async function buildOutputDirectory() {
  const workspace = JSON.parse(await readFile(join(PROJECT_ROOT, 'angular.json'), 'utf8'));
  const projectName = Object.keys(workspace.projects ?? {})[0];
  if (!projectName) throw new Error('No Angular project was found.');
  return join(PROJECT_ROOT, 'dist', projectName, 'browser');
}

async function pullOllamaModel(modelId) {
  const config = await readAiConfig(PROJECT_ROOT);
  if (!config.text.ollamaModels.includes(modelId))
    throw new Error('Add this model to the Ollama catalog before downloading it.');
  const model = TEXT_MODELS.find((item) => item.id === modelId) ?? {
    id: modelId,
    label: modelId,
    sizeGb: 'unknown size',
  };
  return startBackgroundJob('ai-text-model', async (job) => {
    appendLog(job, `Requesting ${model.label} (${model.sizeGb} GB) from Ollama…\n`);
    const response = await fetch(`${config.text.ollamaUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model.id, stream: true }),
      signal: AbortSignal.timeout(3_600_000),
    });
    if (!response.ok || !response.body) {
      throw new Error(`Ollama download failed: ${response.statusText}`);
    }
    let pending = '';
    for await (const chunk of response.body) {
      pending += Buffer.from(chunk).toString('utf8');
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines.filter(Boolean)) {
        const update = JSON.parse(line);
        const progress = update.total
          ? ` ${Math.round((Number(update.completed || 0) / Number(update.total)) * 100)}%`
          : '';
        appendLog(job, `${update.status || 'Downloading'}${progress}\n`);
      }
    }
    appendLog(job, `${model.label} is ready.\n`);
  });
}

function taskEngine(input, config, kind) {
  const isText = kind !== 'image';
  const fallbackProvider = isText ? config.text.provider : config.image.provider;
  const provider = String(input?.provider || fallbackProvider);
  const allowedProviders = isText ? ['ollama', 'openai'] : ['comfyui', 'openai'];
  if (!allowedProviders.includes(provider))
    throw new Error(`Choose a ${kind} model for this task.`);
  const fallbackModel = isText
    ? provider === 'ollama'
      ? config.text.ollamaModel
      : config.text.openaiModel
    : provider === 'comfyui'
      ? config.image.comfyCheckpoint
      : config.image.openaiModel;
  const model = String(input?.model || fallbackModel).trim();
  const catalog = isText
    ? provider === 'ollama'
      ? config.text.ollamaModels
      : config.text.openaiModels
    : provider === 'comfyui'
      ? config.image.comfyCheckpoints
      : config.image.openaiModels;
  if (!model || !catalog.includes(model))
    throw new Error(`The selected ${kind} model is not in the saved AI model catalog.`);
  return { provider, model };
}

async function downloadImageModel(input) {
  const model = IMAGE_MODELS.find((item) => item.id === input.modelId);
  if (!model) throw new Error('Unknown or unsupported image model.');
  if (input.licenseAccepted !== true)
    throw new Error('Accept the model license before downloading.');
  const comfyRoot = await validateComfyRoot(input.comfyRoot);
  const target = join(comfyRoot, 'models', 'checkpoints', model.fileName);
  return startBackgroundJob('ai-image-model', async (job) => {
    try {
      await stat(target);
      appendLog(job, `${model.fileName} is already installed.\n`);
      return;
    } catch {
      // Download it below.
    }
    const partial = `${target}.questkeeper-partial`;
    appendLog(job, `Downloading ${model.label} (${model.sizeGb} GB)…\n`);
    const response = await fetch(model.sourceUrl, { signal: AbortSignal.timeout(3_600_000) });
    if (!response.ok || !response.body)
      throw new Error(`Model download failed: ${response.statusText}`);
    const expected = Number(response.headers.get('content-length') || 0);
    const file = await open(partial, 'w', 0o600);
    let received = 0;
    let lastProgress = -1;
    try {
      for await (const chunk of response.body) {
        const buffer = Buffer.from(chunk);
        await file.write(buffer);
        received += buffer.length;
        const progress = expected ? Math.floor((received / expected) * 100) : 0;
        if (progress >= lastProgress + 5) {
          lastProgress = progress;
          appendLog(
            job,
            expected
              ? `${progress}% downloaded\n`
              : `${Math.round(received / 1024 ** 2)} MB downloaded\n`,
          );
        }
      }
    } finally {
      await file.close();
    }
    await rename(partial, target).catch(async (error) => {
      await rm(partial, { force: true });
      throw error;
    });
    appendLog(job, `${model.fileName} is ready in ComfyUI.\n`);
  });
}

function commandForJob(kind) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  if (kind === 'install') return { command: npm, args: ['ci'], cwd: PROJECT_ROOT };
  if (kind === 'build') return { command: npm, args: ['run', 'build'], cwd: PROJECT_ROOT };
  if (kind === 'preview') {
    return {
      command: npm,
      args: ['run', 'start', '--', '--host', '127.0.0.1', '--port', '4200'],
      cwd: PROJECT_ROOT,
      url: 'http://127.0.0.1:4200',
    };
  }
  if (kind === 'transcriber') {
    return process.platform === 'win32'
      ? {
          command: process.env.ComSpec || 'cmd.exe',
          args: ['/d', '/c', join(TRANSCRIBER_ROOT, 'start.bat')],
          cwd: TRANSCRIBER_ROOT,
          display: 'start Discord Scribe',
        }
      : {
          command: 'bash',
          args: [join(TRANSCRIBER_ROOT, 'start.sh')],
          cwd: TRANSCRIBER_ROOT,
          display: 'start Discord Scribe',
        };
  }
  throw new Error('Unknown project action.');
}

async function transcriberStatus() {
  let configFilePresent = false;
  let configured = false;
  let environmentReady = false;
  try {
    const config = await readFile(join(TRANSCRIBER_ROOT, '.env'), 'utf8');
    configFilePresent = true;
    const token = config.match(/^DISCORD_TOKEN\s*=\s*(.+)$/m)?.[1]?.trim();
    configured = Boolean(token && token !== 'replace-me');
  } catch {
    // A fresh public template intentionally has no secret configuration file.
  }
  try {
    const python =
      process.platform === 'win32'
        ? join(TRANSCRIBER_ROOT, '.venv', 'Scripts', 'python.exe')
        : join(TRANSCRIBER_ROOT, '.venv', 'bin', 'python');
    await stat(python);
    environmentReady = true;
  } catch {
    // The launch script creates the environment on first use.
  }
  return {
    configFilePresent,
    configured,
    environmentReady,
    transcriptDirectory: 'discord-transcriber/transcripts/',
  };
}

async function startJob(kind) {
  const current = jobs.get(kind);
  if (current && ['running', 'stopping'].includes(current.status)) return current;
  if (kind === 'transcriber' && !(await transcriberStatus()).configured) {
    throw new Error('Configure discord-transcriber/.env before starting Discord Scribe.');
  }
  const command = commandForJob(kind);
  const job = {
    kind,
    status: 'running',
    logs: `$ ${command.display ?? `${command.command} ${command.args.join(' ')}`}\n`,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: command.url,
  };
  const child = spawn(command.command, command.args, {
    cwd: command.cwd,
    windowsHide: true,
    env: { ...process.env, BROWSER: 'none' },
  });
  job.process = child;
  jobs.set(kind, job);
  children.add(child);
  child.stdout.on('data', (data) => appendLog(job, data.toString()));
  child.stderr.on('data', (data) => appendLog(job, data.toString()));
  child.on('error', (error) => {
    appendLog(job, `\n${error.message}\n`);
    job.status = 'failed';
  });
  child.on('close', (code) => {
    children.delete(child);
    if (job.stopRequested) job.status = 'stopped';
    else if (['preview', 'transcriber'].includes(kind) && code === 0) job.status = 'stopped';
    else if (['preview', 'transcriber'].includes(kind) && job.status === 'running')
      job.status = 'failed';
    else job.status = code === 0 ? 'success' : 'failed';
    job.exitCode = code;
    job.updatedAt = new Date().toISOString();
  });
  return job;
}

async function stopJob(kind) {
  const job = jobs.get(kind);
  if (!job?.process || !['running', 'stopping'].includes(job.status)) {
    return job ?? { kind, status: 'stopped', logs: '', updatedAt: new Date().toISOString() };
  }
  job.stopRequested = true;
  job.status = 'stopping';
  appendLog(job, '\nStopping…\n');
  if (process.platform === 'win32' && job.process.pid) {
    await new Promise((resolveStop) => {
      const killer = spawn('taskkill.exe', ['/pid', String(job.process.pid), '/T', '/F'], {
        windowsHide: true,
      });
      killer.once('close', resolveStop);
      killer.once('error', () => {
        job.process.kill();
        resolveStop();
      });
    });
  } else {
    job.process.kill('SIGTERM');
  }
  return job;
}

async function projectStatus() {
  let dependenciesReady = false;
  try {
    await stat(join(PROJECT_ROOT, 'node_modules', '@angular', 'core'));
    dependenciesReady = true;
  } catch {
    // Expected on a fresh clone.
  }
  const hardware = await hardwarePromise;
  const aiConfig = await readAiConfig(PROJECT_ROOT);
  const publishingConfig = await readPublishingConfig(PROJECT_ROOT);
  return {
    dependenciesReady,
    transcriber: await transcriberStatus(),
    jobs: jobSnapshot(),
    ai: {
      config: publicAiConfig(aiConfig),
      hardware,
      recommendations: recommendModels(hardware),
      models: { text: TEXT_MODELS, image: IMAGE_MODELS },
    },
    publishing: publicPublishingConfig(publishingConfig),
  };
}

async function serveStatic(response, pathname) {
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const path = resolve(PUBLIC_ROOT, requested);
  const rel = relative(PUBLIC_ROOT, path);
  if (rel.startsWith('..') || rel === '..') return false;
  try {
    let content = await readFile(path);
    if (requested === 'index.html') {
      content = Buffer.from(content.toString('utf8').replace('__MANAGER_TOKEN__', TOKEN));
    }
    response.writeHead(200, {
      'Content-Type': TYPES[extname(path)] ?? 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(content);
    return true;
  } catch {
    return false;
  }
}

async function serveCampaignAsset(response, pathname) {
  const prefix = '/campaign-assets/';
  if (!pathname.startsWith(prefix)) return false;
  const requested = decodeURIComponent(pathname.slice(prefix.length));
  const root = join(PROJECT_ROOT, 'src', 'campaigns');
  const path = resolve(root, requested);
  const rel = relative(root, path);
  if (!requested || rel.startsWith('..') || rel === '..') return false;
  const contentType = TYPES[extname(path).toLowerCase()];
  if (!contentType?.startsWith('image/')) return false;
  try {
    const content = await readFile(path);
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(content);
    return true;
  } catch {
    return false;
  }
}

async function routeApi(request, response, url) {
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (request.method === 'GET' && url.pathname === '/api/state') {
    sendJson(response, 200, { ...(await getState(PROJECT_ROOT)), ...(await projectStatus()) });
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/jobs') {
    sendJson(response, 200, await projectStatus());
    return;
  }
  if (request.method === 'POST') assertToken(request);
  if (request.method === 'PUT') assertToken(request);
  if (request.method === 'DELETE') assertToken(request);
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) assertSameOrigin(request);

  if (request.method === 'POST' && url.pathname === '/api/shutdown') {
    const body = await readBody(request);
    if (body.confirmation !== 'quit') throw new Error('Confirm the local shutdown request.');
    const runningJobs = [...jobs.values()]
      .filter((job) => ['running', 'stopping'].includes(job.status))
      .map((job) => job.kind);
    response.once('finish', () => setImmediate(() => void shutdown()));
    sendJson(response, 200, {
      closing: true,
      stoppedServices: runningJobs,
      message: 'QuestKeeper is shutting down. You can close this browser tab.',
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/ai/setup') {
    const hardware = await hardwarePromise;
    const config = await readAiConfig(PROJECT_ROOT);
    sendJson(response, 200, {
      config: publicAiConfig(config),
      hardware,
      recommendations: recommendModels(hardware),
      models: { text: TEXT_MODELS, image: IMAGE_MODELS },
    });
    return;
  }
  if (request.method === 'PUT' && url.pathname === '/api/ai/setup') {
    const config = await writeAiConfig(PROJECT_ROOT, await readBody(request));
    sendJson(response, 200, { config: publicAiConfig(config) });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/ai/test') {
    const body = await readBody(request);
    const config = await readAiConfig(PROJECT_ROOT);
    sendJson(response, 200, { message: await testAiProvider(config, body.kind) });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/ai/models/text') {
    const job = await pullOllamaModel((await readBody(request)).modelId);
    sendJson(response, 202, { job: { ...job, process: undefined } });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/ai/models/image') {
    const job = await downloadImageModel(await readBody(request));
    sendJson(response, 202, { job: { ...job, process: undefined } });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/ai/models/discover') {
    const input = await readBody(request);
    const config = await readAiConfig(PROJECT_ROOT);
    const discovered = await discoverLocalModels(config, input.kind);
    const next = structuredClone(config);
    if (input.kind === 'text') next.text.ollamaModels = [...next.text.ollamaModels, ...discovered];
    else if (input.kind === 'image')
      next.image.comfyCheckpoints = [...next.image.comfyCheckpoints, ...discovered];
    else throw new Error('Unknown model discovery kind.');
    const saved = await writeAiConfig(PROJECT_ROOT, next);
    sendJson(response, 200, { discovered, config: publicAiConfig(saved) });
    return;
  }
  if (request.method === 'PUT' && url.pathname === '/api/publishing/setup') {
    const config = await writePublishingConfig(PROJECT_ROOT, await readBody(request));
    sendJson(response, 200, { config: publicPublishingConfig(config) });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/publishing/test') {
    const input = await readBody(request);
    const config = await readPublishingConfig(PROJECT_ROOT);
    if (config.protocol === 'ftp' && input.insecureConsent !== true)
      throw new Error('Confirm the unencrypted FTP warning, or choose FTPS.');
    sendJson(response, 200, { message: await testPublishingConnection(config) });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/publishing/publish') {
    const input = await readBody(request);
    const config = await readPublishingConfig(PROJECT_ROOT);
    if (config.protocol === 'ftp' && input.insecureConsent !== true)
      throw new Error('Confirm the unencrypted FTP warning, or choose FTPS.');
    const job = startBackgroundJob('ftp-publish', async (currentJob) => {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      appendLog(currentJob, 'Building and validating the production site…\n');
      await runLoggedCommand(npm, ['run', 'build'], PROJECT_ROOT, currentJob);
      const output = await buildOutputDirectory();
      await stat(output);
      await uploadBuild(config, output, (message) => appendLog(currentJob, message));
    });
    sendJson(response, 202, { job: { ...job, process: undefined } });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/campaigns') {
    sendJson(response, 201, await createCampaign(PROJECT_ROOT, await readBody(request)));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/import') {
    sendJson(response, 201, await importCampaign(PROJECT_ROOT, await readBody(request)));
    return;
  }
  if (request.method === 'POST' && parts[1] === 'actions' && parts.length === 3) {
    const job =
      parts[2] === 'transcriber-stop' ? await stopJob('transcriber') : await startJob(parts[2]);
    sendJson(response, 202, { job: { ...job, process: undefined } });
    return;
  }
  if (parts[1] !== 'campaigns' || parts.length < 3) {
    sendJson(response, 404, { error: 'API route not found.' });
    return;
  }

  const campaignId = parts[2];
  if (
    request.method === 'POST' &&
    parts[3] === 'ai' &&
    parts[4] === 'import-entity' &&
    parts.length === 5
  ) {
    const input = await readBody(request);
    const config = await readAiConfig(PROJECT_ROOT);
    const engine = taskEngine(input.engine, config, 'entity');
    if (engine.provider === 'openai' && input.remoteConsent !== true)
      throw new Error('Confirm that these sheet sources may be sent to the remote provider.');
    const campaign = await getCampaign(PROJECT_ROOT, campaignId);
    const result = await importEntityWithAi({
      config,
      campaign,
      entityType: input.entityType,
      language: input.language || campaign.manifestEntry.defaultLanguage || 'en',
      selection: engine,
      images: input.images,
      sourceUrl: input.sourceUrl,
    });
    sendJson(response, 200, {
      ...result,
      notice: 'Draft only. Review every imported field before saving.',
    });
    return;
  }
  if (
    request.method === 'POST' &&
    parts[3] === 'ai' &&
    parts[4] === 'process-notes' &&
    parts.length === 5
  ) {
    const input = await readBody(request);
    const config = await readAiConfig(PROJECT_ROOT);
    const proseEngine = taskEngine(input.engines?.prose, config, 'prose');
    const promptEngine = input.includeImages
      ? taskEngine(input.engines?.imagePrompt, config, 'image prompt')
      : null;
    const imageEngine = input.includeImages
      ? taskEngine(input.engines?.image, config, 'image')
      : null;
    const usesRemote = [proseEngine, promptEngine, imageEngine].some(
      (engine) => engine?.provider === 'openai',
    );
    if (usesRemote && input.remoteConsent !== true) {
      throw new Error('Confirm that these notes may be sent to the configured remote provider.');
    }
    const campaign = await getCampaign(PROJECT_ROOT, campaignId);
    const proseResult = await processNotesWithText({
      config,
      campaign,
      notes: input.notes,
      language: input.language || campaign.manifestEntry.defaultLanguage || 'en',
      selection: proseEngine,
    });
    const draft = proseResult.draft;
    const images = [];
    if (input.includeImages) {
      const plan = await generateImagePromptsWithText({
        config,
        campaign,
        draft,
        notes: input.notes,
        language: input.language || campaign.manifestEntry.defaultLanguage || 'en',
        selection: promptEngine,
      });
      draft.imagePrompts = plan.prompts;
      const rendered = await generateDraftImages({
        config,
        prompts: plan.prompts,
        selection: imageEngine,
      });
      for (const [index, image] of rendered.images.entries()) {
        const saved = await saveImage(PROJECT_ROOT, campaignId, {
          category: 'sessions',
          fileName: `ai-session-${input.sessionNumber || 'draft'}-${index + 1}.webp`,
          dataUrl: image.dataUrl,
        });
        images.push({ ...image, path: saved.path, dataUrl: undefined });
      }
    }
    sendJson(response, 200, {
      draft: { ...draft, generatedImages: images },
      provider: {
        prose: proseEngine,
        imagePrompt: promptEngine,
        image: imageEngine,
      },
      notice: 'Draft only. Review every field before saving.',
    });
    return;
  }
  if (request.method === 'GET' && parts.length === 3) {
    sendJson(response, 200, await getCampaign(PROJECT_ROOT, campaignId));
    return;
  }
  if (request.method === 'PUT' && parts.length === 3) {
    sendJson(
      response,
      200,
      await updateCampaign(PROJECT_ROOT, campaignId, await readBody(request)),
    );
    return;
  }
  if (request.method === 'DELETE' && parts.length === 3) {
    const body = await readBody(request);
    await deleteCampaign(PROJECT_ROOT, campaignId, body.confirmation);
    sendJson(response, 200, { ok: true });
    return;
  }
  if (request.method === 'GET' && parts[3] === 'export' && parts.length === 4) {
    sendJson(response, 200, await exportCampaign(PROJECT_ROOT, campaignId));
    return;
  }
  if (request.method === 'POST' && parts[3] === 'images' && parts.length === 4) {
    sendJson(response, 201, await saveImage(PROJECT_ROOT, campaignId, await readBody(request)));
    return;
  }
  const type = parts[3];
  if (request.method === 'POST' && parts.length === 4) {
    sendJson(
      response,
      201,
      await saveEntity(PROJECT_ROOT, campaignId, type, await readBody(request)),
    );
    return;
  }
  if (request.method === 'PUT' && parts.length === 5) {
    sendJson(
      response,
      200,
      await saveEntity(PROJECT_ROOT, campaignId, type, await readBody(request), parts[4]),
    );
    return;
  }
  if (request.method === 'DELETE' && parts.length === 5) {
    await deleteEntity(PROJECT_ROOT, campaignId, type, parts[4]);
    sendJson(response, 200, { ok: true });
    return;
  }
  sendJson(response, 404, { error: 'API route not found.' });
}

function openBrowser(url) {
  const command =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];
  const child = spawn(command[0], command[1], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();
}

export function startServer({
  port = Number.parseInt(process.env.QUESTKEEPER_MANAGER_PORT || '4173', 10),
  open = false,
} = {}) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
    try {
      if (url.pathname.startsWith('/api/')) await routeApi(request, response, url);
      else if (request.method === 'GET' && (await serveCampaignAsset(response, url.pathname)))
        return;
      else if (!(await serveStatic(response, url.pathname))) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
      }
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  server.listen(port, '127.0.0.1', () => {
    activeServer = server;
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    const url = `http://127.0.0.1:${actualPort}`;
    console.log(`Campaign Manager ready at ${url}`);
    console.log('Press Ctrl+C to stop it.');
    if (open) openBrowser(url);
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && port < 4183) {
      startServer({ port: port + 1, open });
    } else {
      console.error(error);
      process.exitCode = 1;
    }
  });
  return server;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) startServer({ open: process.argv.includes('--open') });

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await Promise.all([...jobs.keys()].map((kind) => stopJob(kind)));
  for (const child of children) child.kill();
  const forcedExit = setTimeout(() => process.exit(0), 1_500);
  forcedExit.unref();
  activeServer?.closeIdleConnections?.();
  if (!activeServer) process.exit(0);
  activeServer.close(() => {
    clearTimeout(forcedExit);
    process.exit(0);
  });
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
