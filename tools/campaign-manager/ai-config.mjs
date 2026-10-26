import { cpus, freemem, platform, totalmem } from 'node:os';
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { normalizeProviderModels, REMOTE_PROVIDER_REGISTRY } from './ai-providers.mjs';
import storagePaths from '../storage-paths.cjs';

const execFileAsync = promisify(execFile);
const { resolveStoragePaths } = storagePaths;

export const AI_SETUP_STATES = Object.freeze(['unseen', 'deferred', 'manual', 'draft', 'complete']);

export const TEXT_MODELS = Object.freeze([
  {
    id: 'qwen3:1.7b',
    label: 'Qwen 3 · 1.7B',
    sizeGb: 1.4,
    minRamGb: 6,
    minCores: 4,
    note: 'Fastest option for older laptops; shorter and less nuanced prose.',
  },
  {
    id: 'qwen3:4b',
    label: 'Qwen 3 · 4B',
    sizeGb: 2.5,
    minRamGb: 8,
    minCores: 4,
    note: 'Balanced default for multilingual recaps and campaign notes.',
  },
  {
    id: 'gemma3:12b',
    label: 'Gemma 3 · 12B',
    sizeGb: 8.1,
    minRamGb: 16,
    minCores: 8,
    note: 'Richer prose and context retention on a capable desktop.',
  },
  {
    id: 'gemma3:27b',
    label: 'Gemma 3 · 27B',
    sizeGb: 17,
    minRamGb: 32,
    minCores: 12,
    note: 'Highest local quality here; expect slower CPU-only generation.',
  },
]);

export const IMAGE_MODELS = Object.freeze([
  {
    id: 'sdxl-turbo-fp16',
    label: 'SDXL Turbo · FP16',
    fileName: 'sd_xl_turbo_1.0_fp16.safetensors',
    sizeGb: 6.94,
    minRamGb: 16,
    minVramGb: 6,
    license: 'Stability AI Community License',
    licenseUrl: 'https://huggingface.co/stabilityai/sdxl-turbo/blob/main/LICENSE.md',
    sourceUrl:
      'https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors?download=true',
    note: 'A fast 512px checkpoint for ComfyUI. Review its license before downloading.',
  },
]);

const DEFAULT_CONFIG = Object.freeze({
  setupState: 'unseen',
  setupComplete: false,
  roles: {
    prose: { provider: 'off', model: '' },
    extraction: { provider: 'off', model: '' },
    imagePrompt: { provider: 'off', model: '' },
    image: { provider: 'off', model: '' },
  },
  providers: Object.fromEntries(
    Object.values(REMOTE_PROVIDER_REGISTRY).map((provider) => [
      provider.id,
      {
        apiKey: '',
        baseUrl: provider.defaultBaseUrl,
        models: provider.defaultModels,
      },
    ]),
  ),
  text: {
    provider: 'off',
    ollamaUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'qwen3:4b',
    openaiModel: 'gpt-5-mini',
    ollamaModels: TEXT_MODELS.map((model) => model.id),
    openaiModels: ['gpt-5-mini'],
    openaiApiKey: '',
  },
  image: {
    provider: 'off',
    comfyUrl: 'http://127.0.0.1:8188',
    comfyRoot: '',
    comfyCheckpoint: 'sd_xl_turbo_1.0_fp16.safetensors',
    openaiModel: 'gpt-image-2.5-flare',
    comfyCheckpoints: IMAGE_MODELS.map((model) => model.fileName),
    openaiModels: ['gpt-image-2.5-flare', 'gpt-image-2.5-sunburst'],
  },
});

function cloneDefaults() {
  return structuredClone(DEFAULT_CONFIG);
}

function configPath(projectRoot) {
  return resolveStoragePaths(projectRoot).aiConfigFile;
}

function httpLocalhost(value, fallback) {
  try {
    const url = new URL(String(value || fallback));
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error();
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return url.origin;
  } catch {
    throw new Error('Local AI URLs must point to localhost or 127.0.0.1.');
  }
}

function modelCatalog(value, defaults, selected) {
  const entries = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(/[\n,]/)
        .map((item) => item.trim());
  return [...new Set([...defaults, ...entries, selected].map((item) => String(item || '').trim()))]
    .filter(Boolean)
    .map((item) => item.slice(0, 180))
    .slice(0, 50);
}

function remoteBaseUrl(value, fallback) {
  try {
    const url = new URL(String(value || fallback));
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error();
    return url.href.replace(/\/$/, '');
  } catch {
    throw new Error('Remote provider URLs must use HTTPS (or localhost for development).');
  }
}

function roleSelection(value, fallback) {
  return {
    provider: String(value?.provider || fallback?.provider || 'off').slice(0, 40),
    model: String(value?.model || fallback?.model || '')
      .trim()
      .slice(0, 180),
  };
}

export function normalizeAiSetupState(input = {}, previous = {}) {
  if (AI_SETUP_STATES.includes(input.setupState)) return input.setupState;
  if (input.setupComplete === true) return 'complete';
  if (AI_SETUP_STATES.includes(previous.setupState) && input.setupComplete === undefined) {
    return previous.setupState;
  }
  return 'unseen';
}

export function normalizeAiConfig(input = {}, previous = cloneDefaults()) {
  const setupState = normalizeAiSetupState(input, previous);
  const textProvider = ['off', 'ollama', 'openai'].includes(input.text?.provider)
    ? input.text.provider
    : 'off';
  const imageProvider = ['off', 'comfyui', 'openai'].includes(input.image?.provider)
    ? input.image.provider
    : 'off';
  const requestedKey = String(input.text?.openaiApiKey ?? '').trim();
  const currentKey = String(previous.text?.openaiApiKey ?? '').trim();
  const ollamaModel = String(input.text?.ollamaModel || DEFAULT_CONFIG.text.ollamaModel).slice(
    0,
    100,
  );
  const openaiTextModel = String(input.text?.openaiModel || DEFAULT_CONFIG.text.openaiModel).slice(
    0,
    100,
  );
  const comfyCheckpoint = String(
    input.image?.comfyCheckpoint || DEFAULT_CONFIG.image.comfyCheckpoint,
  ).slice(0, 180);
  const openaiImageModel = String(
    input.image?.openaiModel || DEFAULT_CONFIG.image.openaiModel,
  ).slice(0, 100);
  const providers = {};
  for (const provider of Object.values(REMOTE_PROVIDER_REGISTRY)) {
    const requested = input.providers?.[provider.id] ?? {};
    const current = previous.providers?.[provider.id] ?? DEFAULT_CONFIG.providers[provider.id];
    const legacyOpenAi = provider.id === 'openai';
    const requestedKey = String(
      requested.apiKey ?? (legacyOpenAi ? input.text?.openaiApiKey : '') ?? '',
    ).trim();
    const currentKey = String(
      current.apiKey ?? (legacyOpenAi ? previous.text?.openaiApiKey : '') ?? '',
    ).trim();
    const legacyModels = legacyOpenAi
      ? [
          ...(input.text?.openaiModels ?? previous.text?.openaiModels ?? []),
          ...(input.image?.openaiModels ?? previous.image?.openaiModels ?? []),
        ].map((id) => ({
          id,
          capabilities: String(id).includes('image')
            ? ['image-generation']
            : ['text', 'structured-output', 'vision', 'image-prompt', 'web'],
        }))
      : [];
    providers[provider.id] = {
      apiKey: requested.removeApiKey === true ? '' : requestedKey || currentKey,
      baseUrl: remoteBaseUrl(requested.baseUrl, current.baseUrl || provider.defaultBaseUrl),
      models: normalizeProviderModels(requested.models, [
        ...provider.defaultModels,
        ...(current.models ?? []),
        ...legacyModels,
      ]),
    };
  }
  const legacyText =
    textProvider === 'off'
      ? { provider: 'off', model: '' }
      : {
          provider: textProvider,
          model: textProvider === 'ollama' ? ollamaModel : openaiTextModel,
        };
  const legacyImage =
    imageProvider === 'off'
      ? { provider: 'off', model: '' }
      : {
          provider: imageProvider,
          model: imageProvider === 'comfyui' ? comfyCheckpoint : openaiImageModel,
        };
  const textRoleFallback = input.text?.provider
    ? legacyText
    : (previous.roles?.prose ?? legacyText);
  const extractionRoleFallback = input.text?.provider
    ? legacyText
    : (previous.roles?.extraction ?? legacyText);
  const promptRoleFallback = input.text?.provider
    ? legacyText
    : (previous.roles?.imagePrompt ?? legacyText);
  const imageRoleFallback = input.image?.provider
    ? legacyImage
    : (previous.roles?.image ?? legacyImage);
  return {
    setupState,
    setupComplete: setupState === 'complete',
    roles: {
      prose: roleSelection(input.roles?.prose, textRoleFallback),
      extraction: roleSelection(input.roles?.extraction, extractionRoleFallback),
      imagePrompt: roleSelection(input.roles?.imagePrompt, promptRoleFallback),
      image: roleSelection(input.roles?.image, imageRoleFallback),
    },
    providers,
    text: {
      provider: textProvider,
      ollamaUrl: httpLocalhost(input.text?.ollamaUrl, DEFAULT_CONFIG.text.ollamaUrl),
      ollamaModel,
      openaiModel: openaiTextModel,
      ollamaModels: modelCatalog(
        input.text?.ollamaModels ?? previous.text?.ollamaModels,
        DEFAULT_CONFIG.text.ollamaModels,
        ollamaModel,
      ),
      openaiModels: modelCatalog(
        input.text?.openaiModels ?? previous.text?.openaiModels,
        DEFAULT_CONFIG.text.openaiModels,
        openaiTextModel,
      ),
      openaiApiKey: requestedKey || currentKey,
    },
    image: {
      provider: imageProvider,
      comfyUrl: httpLocalhost(input.image?.comfyUrl, DEFAULT_CONFIG.image.comfyUrl),
      comfyRoot: String(input.image?.comfyRoot ?? previous.image?.comfyRoot ?? '').trim(),
      comfyCheckpoint,
      openaiModel: openaiImageModel,
      comfyCheckpoints: modelCatalog(
        input.image?.comfyCheckpoints ?? previous.image?.comfyCheckpoints,
        DEFAULT_CONFIG.image.comfyCheckpoints,
        comfyCheckpoint,
      ),
      openaiModels: modelCatalog(
        input.image?.openaiModels ?? previous.image?.openaiModels,
        DEFAULT_CONFIG.image.openaiModels,
        openaiImageModel,
      ),
    },
  };
}

export async function readAiConfig(projectRoot) {
  try {
    const parsed = JSON.parse(await readFile(configPath(projectRoot), 'utf8'));
    return normalizeAiConfig(parsed, cloneDefaults());
  } catch (error) {
    if (error?.code === 'ENOENT') return cloneDefaults();
    throw error;
  }
}

export async function writeAiConfig(projectRoot, input) {
  const path = configPath(projectRoot);
  const previous = await readAiConfig(projectRoot);
  const config = normalizeAiConfig(input, previous);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return config;
}

export async function writeAiSetupState(projectRoot, setupState) {
  if (!AI_SETUP_STATES.includes(setupState)) throw new Error('Unknown AI setup state.');
  const previous = await readAiConfig(projectRoot);
  const roles =
    setupState === 'manual'
      ? Object.fromEntries(
          Object.keys(previous.roles).map((role) => [role, { provider: 'off', model: '' }]),
        )
      : previous.roles;
  return writeAiConfig(projectRoot, {
    ...previous,
    setupState,
    setupComplete: setupState === 'complete',
    roles,
    text: { ...previous.text, provider: setupState === 'manual' ? 'off' : previous.text.provider },
    image: {
      ...previous.image,
      provider: setupState === 'manual' ? 'off' : previous.image.provider,
    },
  });
}

export function publicAiConfig(config) {
  return {
    ...config,
    providers: Object.fromEntries(
      Object.entries(config.providers ?? {}).map(([id, provider]) => [
        id,
        {
          ...provider,
          apiKey: undefined,
          keyConfigured: Boolean(provider.apiKey),
        },
      ]),
    ),
    text: {
      ...config.text,
      openaiApiKey: undefined,
      openaiKeyConfigured: Boolean(config.text.openaiApiKey),
    },
  };
}

export function recommendModels(hardware) {
  const eligible = TEXT_MODELS.filter(
    (model) => hardware.ramGb >= model.minRamGb && hardware.logicalCores >= model.minCores,
  );
  const text = eligible.at(-1) ?? TEXT_MODELS[0];
  const image = IMAGE_MODELS[0];
  const localImageRecommended =
    hardware.ramGb >= image.minRamGb && (hardware.vramGb ?? 0) >= image.minVramGb;
  return {
    textModelId: text.id,
    imageModelId: image.id,
    localImageRecommended,
    imageReason: localImageRecommended
      ? `Detected resources meet the ${image.minRamGb} GB RAM / ${image.minVramGb} GB VRAM baseline.`
      : 'A remote image provider or manual illustrations will usually be smoother on this machine.',
  };
}

async function windowsGpus() {
  if (platform() !== 'win32') return [];
  try {
    const script =
      'Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM | ConvertTo-Json -Compress';
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 8000 },
    );
    const raw = JSON.parse(stdout.trim() || '[]');
    const adapters = (Array.isArray(raw) ? raw : [raw]).map((gpu) => ({
      name: String(gpu.Name || 'Graphics adapter'),
      vramGb: gpu.AdapterRAM ? Math.round((Number(gpu.AdapterRAM) / 1024 ** 3) * 10) / 10 : null,
    }));
    try {
      const { stdout: nvidiaOutput } = await execFileAsync(
        'nvidia-smi.exe',
        ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits'],
        { windowsHide: true, timeout: 8000 },
      );
      for (const line of nvidiaOutput.trim().split('\n').filter(Boolean)) {
        const separator = line.lastIndexOf(',');
        const name = line.slice(0, separator).trim();
        const memoryMb = Number(line.slice(separator + 1).trim());
        const existing = adapters.find(
          (adapter) =>
            adapter.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(adapter.name.toLowerCase()),
        );
        const vramGb = Number.isFinite(memoryMb) ? Math.round((memoryMb / 1024) * 10) / 10 : null;
        if (existing) existing.vramGb = vramGb;
        else adapters.push({ name, vramGb });
      }
    } catch {
      // Win32_VideoController remains a useful fallback on non-NVIDIA systems.
    }
    return adapters;
  } catch {
    return [];
  }
}

export async function detectHardware() {
  const processors = cpus();
  const gpus = await windowsGpus();
  const vramGb = gpus.reduce((largest, gpu) => Math.max(largest, gpu.vramGb ?? 0), 0) || null;
  return {
    platform: platform(),
    cpu: processors[0]?.model?.trim() || 'Unknown processor',
    logicalCores: processors.length || 1,
    ramGb: Math.round((totalmem() / 1024 ** 3) * 10) / 10,
    freeRamGb: Math.round((freemem() / 1024 ** 3) * 10) / 10,
    gpus,
    vramGb,
  };
}

export async function validateComfyRoot(root) {
  const resolved = resolve(String(root || ''));
  if (!root || resolved === resolve('.'))
    throw new Error('Choose the ComfyUI installation folder.');
  await stat(join(resolved, 'models', 'checkpoints'));
  return resolved;
}
