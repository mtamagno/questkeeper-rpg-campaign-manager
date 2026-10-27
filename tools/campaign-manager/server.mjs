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
  writeAiSetupState,
} from './ai-config.mjs';
import {
  discoverLocalModels,
  discoverRemoteModels,
  generateDraftImages,
  generateImagePromptsWithText,
  generateNotebookDraftWithText,
  translateCampaignDraft,
  importEntityWithAi,
  processNotesWithText,
  testAiProvider,
} from './ai-service.mjs';
import {
  assertEngineCapability,
  isRemoteProvider,
  publicProviderRegistry,
} from './ai-providers.mjs';
import {
  publicPublishingConfig,
  readPublishingConfig,
  testPublishingConnection,
  uploadBuild,
  writePublishingConfig,
} from './publishing.mjs';
import { probeCompanion, resolveCompanionControl } from './companion-status.mjs';
import { publicLanguageCatalog } from './language-catalog.mjs';
import { publicRulesetProfiles } from './ruleset-profiles.mjs';
import { formatSpawnFailure, resolveNpmInvocation } from './runtime-command.mjs';
import storagePaths from '../storage-paths.cjs';

const {
  createCampaignBackup,
  materializeCampaigns,
  prepareStorage,
  publicStorageSummary,
  resolveStoragePaths,
} = storagePaths;

const MANAGER_ROOT = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(MANAGER_ROOT, '..', '..');
await prepareStorage(PROJECT_ROOT);
const STORAGE_PATHS = resolveStoragePaths(PROJECT_ROOT);
const COMPANION_PORT = Number(process.env.QUESTKEEPER_COMPANION_PORT || 4200);
const COMPANION_URL = `http://127.0.0.1:${COMPANION_PORT}`;
const PUBLIC_ROOT = join(MANAGER_ROOT, 'public');
const TRANSCRIBER_ROOT = join(PROJECT_ROOT, 'discord-transcriber');
const TOKEN = randomBytes(24).toString('hex');
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const jobs = new Map();
const children = new Set();
const companionHandshakes = new Map();
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

function sendCompanionJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': new URL(COMPANION_URL).origin,
    Vary: 'Origin',
  });
  response.end(JSON.stringify(value));
}

function managerUrlFor(request) {
  const url = new URL(`http://${request.headers.host}`);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('The local Manager URL is not trusted.');
  }
  return url.origin;
}

function issueCompanionHandshake(request, campaignId) {
  const token = randomBytes(24).toString('hex');
  const managerUrl = managerUrlFor(request);
  companionHandshakes.set(token, {
    managerUrl,
    campaignId: typeof campaignId === 'string' ? campaignId : '',
    expiresAt: Date.now() + 60_000,
  });
  const url = new URL(COMPANION_URL);
  if (campaignId) url.pathname = `/${encodeURIComponent(campaignId)}`;
  url.searchParams.set('qkManager', managerUrl);
  url.searchParams.set('qkHandshake', token);
  return { url: url.toString(), expiresInSeconds: 60 };
}

function consumeCompanionHandshake(request, url) {
  if (request.headers.origin !== new URL(COMPANION_URL).origin) {
    throw new Error('The Companion origin is not trusted.');
  }
  const token = url.searchParams.get('token') ?? '';
  const handshake = companionHandshakes.get(token);
  companionHandshakes.delete(token);
  if (!handshake || handshake.expiresAt < Date.now()) {
    throw new Error('The local Companion handshake is invalid or expired.');
  }
  return {
    managerUrl: handshake.managerUrl,
    campaignId: handshake.campaignId,
  };
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

async function runLoggedCommand(invocation, cwd, job, label) {
  await new Promise((resolveRun, rejectRun) => {
    let child;
    try {
      child = spawn(invocation.command, invocation.args, {
        cwd,
        windowsHide: true,
        env: { ...process.env },
      });
    } catch (error) {
      rejectRun(new Error(formatSpawnFailure(label, invocation, error)));
      return;
    }
    child.stdout.on('data', (data) => appendLog(job, data.toString()));
    child.stderr.on('data', (data) => appendLog(job, data.toString()));
    child.once('error', (error) =>
      rejectRun(new Error(formatSpawnFailure(label, invocation, error))),
    );
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

function taskEngine(input, config, role) {
  const fallback = config.roles?.[role] ?? {};
  const provider = String(input?.provider || fallback.provider || '').trim();
  const model = String(input?.model || fallback.model || '').trim();
  if (!provider || provider === 'off' || !model)
    throw new Error(`Choose a compatible ${role} model for this task.`);
  if (provider === 'ollama') {
    if (role === 'image' || !config.text.ollamaModels.includes(model))
      throw new Error(`The selected ${role} model is not in the saved AI model catalog.`);
  } else if (provider === 'comfyui') {
    if (role !== 'image' || !config.image.comfyCheckpoints.includes(model))
      throw new Error(`The selected ${role} model is not in the saved AI model catalog.`);
  }
  return assertEngineCapability(config, { provider, model }, role);
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
  if (kind === 'install')
    return {
      ...resolveNpmInvocation(['ci']),
      cwd: PROJECT_ROOT,
      displayName: 'dependency install',
    };
  if (kind === 'build')
    return {
      ...resolveNpmInvocation(['run', 'build']),
      cwd: PROJECT_ROOT,
      displayName: 'production build',
    };
  if (kind === 'preview') {
    return {
      ...resolveNpmInvocation([
        'run',
        'start',
        '--',
        '--host',
        '127.0.0.1',
        '--port',
        String(COMPANION_PORT),
      ]),
      cwd: PROJECT_ROOT,
      url: COMPANION_URL,
      displayName: 'Companion preview',
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
    const config = await readFile(STORAGE_PATHS.scribeEnvFile, 'utf8');
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
    transcriptDirectory: STORAGE_PATHS.transcriptsRoot,
  };
}

async function startJob(kind) {
  const current = jobs.get(kind);
  if (current && ['running', 'stopping'].includes(current.status)) return current;
  if (kind === 'preview') {
    const probe = await probeCompanion(globalThis.fetch, COMPANION_URL);
    if (probe.questKeeper) {
      return {
        kind,
        status: 'success',
        logs: `Reused the Companion already running on port ${COMPANION_PORT}.\n`,
        updatedAt: new Date().toISOString(),
      };
    }
    if (probe.reachable) throw new Error(`Port ${COMPANION_PORT} is used by another application.`);
  }
  if (kind === 'transcriber' && !(await transcriberStatus()).configured) {
    throw new Error('Configure discord-transcriber/.env before starting Discord Scribe.');
  }
  if (['build', 'preview'].includes(kind)) await materializeCampaigns(PROJECT_ROOT);
  const command = commandForJob(kind);
  const job = {
    kind,
    status: 'running',
    logs: `$ ${command.display ?? `${command.command} ${command.args.join(' ')}`}\n`,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    url: command.url,
    runtimePath: command.runtimePath,
    commandDisplay: command.display,
  };
  jobs.set(kind, job);
  let child;
  try {
    child = spawn(command.command, command.args, {
      cwd: command.cwd,
      windowsHide: true,
      detached: kind === 'preview',
      env: {
        ...process.env,
        BROWSER: 'none',
        QUESTKEEPER_SCRIBE_ENV: STORAGE_PATHS.scribeEnvFile,
        QUESTKEEPER_TRANSCRIPTS_DIR: STORAGE_PATHS.transcriptsRoot,
        QUESTKEEPER_LOG_DIR: STORAGE_PATHS.logsRoot,
        ...(command.env ?? {}),
      },
    });
  } catch (error) {
    appendLog(job, `\n${formatSpawnFailure(command.displayName ?? kind, command, error)}\n`);
    job.errorCode = typeof error?.code === 'string' ? error.code : 'UNKNOWN_SPAWN_ERROR';
    job.status = 'failed';
    return job;
  }
  job.process = child;
  children.add(child);
  child.stdout.on('data', (data) => appendLog(job, data.toString()));
  child.stderr.on('data', (data) => appendLog(job, data.toString()));
  child.on('error', (error) => {
    appendLog(job, `\n${formatSpawnFailure(command.displayName ?? kind, command, error)}\n`);
    job.errorCode = typeof error?.code === 'string' ? error.code : 'UNKNOWN_SPAWN_ERROR';
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
  } else if (kind === 'preview' && job.process.pid) {
    try {
      process.kill(-job.process.pid, 'SIGTERM');
    } catch {
      job.process.kill('SIGTERM');
    }
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
  const jobState = jobSnapshot();
  const companion = resolveCompanionControl({
    dependenciesReady,
    job: jobState.preview,
    probe: await probeCompanion(globalThis.fetch, COMPANION_URL),
    url: COMPANION_URL,
  });
  return {
    dependenciesReady,
    languageCatalog: publicLanguageCatalog(),
    rulesetProfiles: publicRulesetProfiles(),
    transcriber: await transcriberStatus(),
    jobs: jobState,
    companion,
    ai: {
      config: publicAiConfig(aiConfig),
      registry: publicProviderRegistry(),
      hardware,
      recommendations: recommendModels(hardware),
      models: { text: TEXT_MODELS, image: IMAGE_MODELS },
    },
    publishing: publicPublishingConfig(publishingConfig),
    storage: {
      ...publicStorageSummary(STORAGE_PATHS),
      node: {
        executable: process.execPath,
        version: process.version,
        source: process.execPath.startsWith(STORAGE_PATHS.runtimeRoot) ? 'private' : 'system',
      },
    },
  };
}

function openStorageFolder(target) {
  const allowed = {
    application: STORAGE_PATHS.applicationRoot,
    runtime: STORAGE_PATHS.runtimeRoot,
    campaigns: STORAGE_PATHS.campaignsRoot,
    configuration: STORAGE_PATHS.configRoot,
    transcripts: STORAGE_PATHS.transcriptsRoot,
    backups: STORAGE_PATHS.backupsRoot,
    logs: STORAGE_PATHS.logsRoot,
    cache: STORAGE_PATHS.cacheRoot,
  };
  const destination = allowed[target];
  if (!destination) throw new Error('Unknown storage location.');
  const command =
    process.platform === 'win32'
      ? ['explorer.exe', [destination]]
      : process.platform === 'darwin'
        ? ['open', [destination]]
        : ['xdg-open', [destination]];
  const child = spawn(command[0], command[1], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.once('error', () => {});
  child.unref();
  return destination;
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
  const root = STORAGE_PATHS.campaignsRoot;
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
  if (request.method === 'GET' && url.pathname === '/api/companion-handshake') {
    sendCompanionJson(response, 200, consumeCompanionHandshake(request, url));
    return;
  }
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

  if (request.method === 'POST' && url.pathname === '/api/storage/open') {
    const body = await readBody(request);
    sendJson(response, 200, { path: openStorageFolder(body.target) });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/companion-handshake') {
    const body = await readBody(request);
    sendJson(response, 201, issueCompanionHandshake(request, body.campaignId));
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/storage/backup') {
    sendJson(response, 201, await createCampaignBackup(PROJECT_ROOT));
    return;
  }
  if (request.method === 'GET' && url.pathname === '/api/storage/export') {
    const { campaigns } = await getState(PROJECT_ROOT);
    const bundles = await Promise.all(
      campaigns.map((campaign) => exportCampaign(PROJECT_ROOT, campaign.id)),
    );
    sendJson(response, 200, {
      format: 'questkeeper-all-campaigns',
      version: 1,
      exportedAt: new Date().toISOString(),
      campaigns: bundles,
      note: 'Images are not embedded. Use Back up now for a complete local copy.',
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/shutdown') {
    const body = await readBody(request);
    if (body.confirmation !== 'quit') throw new Error('Confirm the local shutdown request.');
    const scope = body.scope === 'manager' ? 'manager' : 'all';
    const runningJobs = [...jobs.values()]
      .filter((job) => ['running', 'stopping'].includes(job.status))
      .map((job) => job.kind);
    response.once('finish', () =>
      setImmediate(() => void shutdown({ stopLocalServices: scope === 'all' })),
    );
    sendJson(response, 200, {
      closing: true,
      stoppedServices: scope === 'all' ? runningJobs : [],
      preservedServices: scope === 'manager' ? runningJobs : [],
      scope,
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
  if (request.method === 'PUT' && url.pathname === '/api/ai/setup-state') {
    const config = await writeAiSetupState(PROJECT_ROOT, (await readBody(request)).setupState);
    sendJson(response, 200, { config: publicAiConfig(config) });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/ai/test') {
    const body = await readBody(request);
    const config = await readAiConfig(PROJECT_ROOT);
    sendJson(response, 200, { message: await testAiProvider(config, body) });
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
    const discovered = input.provider
      ? await discoverRemoteModels(config, input.provider)
      : await discoverLocalModels(config, input.kind);
    const next = structuredClone(config);
    if (input.provider) {
      next.providers[input.provider].models = [
        ...next.providers[input.provider].models,
        ...discovered.map((id) => ({ id, capabilities: [] })),
      ];
    } else if (input.kind === 'text')
      next.text.ollamaModels = [...next.text.ollamaModels, ...discovered];
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
      appendLog(currentJob, 'Building and validating the production site…\n');
      await materializeCampaigns(PROJECT_ROOT);
      await runLoggedCommand(
        resolveNpmInvocation(['run', 'build']),
        PROJECT_ROOT,
        currentJob,
        'publishing build',
      );
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
    const stoppedKind = {
      'transcriber-stop': 'transcriber',
      'preview-stop': 'preview',
    }[parts[2]];
    const job = stoppedKind ? await stopJob(stoppedKind) : await startJob(parts[2]);
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
    const engine = taskEngine(input.engine, config, 'extraction');
    if (isRemoteProvider(engine.provider) && input.remoteConsent !== true)
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
    parts[4] === 'translate' &&
    parts.length === 5
  ) {
    const input = await readBody(request);
    const config = await readAiConfig(PROJECT_ROOT);
    const engine = taskEngine(input.engine, config, 'prose');
    if (isRemoteProvider(engine.provider) && input.remoteConsent !== true) {
      throw new Error('Confirm that this translation scope may be sent to the remote provider.');
    }
    const result = await translateCampaignDraft({
      config,
      content: input.content,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      selection: engine,
    });
    sendJson(response, 200, {
      ...result,
      notice: 'Draft only. Review and explicitly apply each translation before saving.',
    });
    return;
  }
  if (
    request.method === 'POST' &&
    parts[3] === 'ai' &&
    parts[4] === 'generate-notebook' &&
    parts.length === 5
  ) {
    const input = await readBody(request);
    const config = await readAiConfig(PROJECT_ROOT);
    const promptEngine = taskEngine(input.engines?.imagePrompt, config, 'imagePrompt');
    const imageEngine = taskEngine(input.engines?.image, config, 'image');
    if (
      [promptEngine, imageEngine].some((engine) => isRemoteProvider(engine.provider)) &&
      input.remoteConsent !== true
    ) {
      throw new Error(
        'Confirm that this notebook brief may be sent to the selected remote provider.',
      );
    }
    const campaign = await getCampaign(PROJECT_ROOT, campaignId);
    const language = input.language || campaign.manifestEntry.defaultLanguage || 'en';
    const planned = await generateNotebookDraftWithText({
      config,
      campaign,
      character: input.character,
      brief: input.brief,
      styleDirectives: input.styleDirectives,
      language,
      pageCount: input.pageCount,
      selection: promptEngine,
    });
    const prompts = [
      { kind: 'front', prompt: planned.draft.frontCover.prompt },
      { kind: 'back', prompt: planned.draft.backCover.prompt },
      ...planned.draft.pages.map((page, index) => ({
        kind: 'page',
        index,
        prompt: page.prompt,
      })),
    ];
    const rendered = await generateDraftImages({
      config,
      prompts,
      selection: imageEngine,
      limit: prompts.length,
    });
    const characterStem =
      String(input.character?.id || input.character?.name || 'character')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'character';
    const savedImages = [];
    for (const image of rendered.images) {
      const suffix = image.kind === 'page' ? `page-${Number(image.index) + 1}` : image.kind;
      const saved = await saveImage(PROJECT_ROOT, campaignId, {
        category: 'characters',
        fileName: `${characterStem}-notebook-${suffix}.webp`,
        dataUrl: image.dataUrl,
      });
      savedImages.push({ ...image, path: saved.path, dataUrl: undefined });
    }
    const languages = campaign.manifestEntry.languages ?? campaign.campaign.languages ?? ['en'];
    const localized = (value) =>
      Object.fromEntries(
        languages.map((code) => [code, code === language ? String(value || '') : '']),
      );
    const front = savedImages.find((image) => image.kind === 'front');
    const back = savedImages.find((image) => image.kind === 'back');
    const pages = planned.draft.pages.map((page, index) => {
      const image = savedImages.find((entry) => entry.kind === 'page' && entry.index === index);
      return {
        id:
          String(page.id || page.title || `page-${index + 1}`)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || `page-${index + 1}`,
        title: localized(page.title),
        era: localized(page.era),
        reflection: localized(page.reflection),
        mood: page.mood,
        image: { url: image?.path ?? '', alt: page.alt },
      };
    });
    sendJson(response, 200, {
      notebook: {
        title: localized(planned.draft.title),
        description: localized(planned.draft.description),
        password: input.password || 'cambiami',
        styleDirectives: String(input.styleDirectives || '').trim(),
        frontCover: { url: front?.path ?? '', alt: planned.draft.frontCover.alt },
        backCover: { url: back?.path ?? '', alt: planned.draft.backCover.alt },
        pages,
      },
      provider: { imagePrompt: promptEngine, image: imageEngine },
      notice: 'Draft only. Review every cover, page, caption, and reflection before saving.',
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
      ? taskEngine(input.engines?.imagePrompt, config, 'imagePrompt')
      : null;
    const imageEngine = input.includeImages
      ? taskEngine(input.engines?.image, config, 'image')
      : null;
    const usesRemote = [proseEngine, promptEngine, imageEngine].some((engine) =>
      isRemoteProvider(engine?.provider),
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

async function shutdown({ stopLocalServices = true } = {}) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (stopLocalServices) {
    await Promise.all([...jobs.keys()].map((kind) => stopJob(kind)));
    for (const child of children) child.kill();
  } else {
    for (const job of jobs.values()) {
      if (job.kind !== 'preview' || !job.process) continue;
      job.process.stdout?.removeAllListeners();
      job.process.stderr?.removeAllListeners();
      job.process.unref();
    }
  }
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
