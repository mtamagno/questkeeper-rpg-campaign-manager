import { cpus, freemem, platform, totalmem } from 'node:os';
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

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
  setupComplete: false,
  text: {
    provider: 'off',
    ollamaUrl: 'http://127.0.0.1:11434',
    ollamaModel: 'qwen3:4b',
    openaiModel: 'gpt-5-mini',
    openaiApiKey: '',
  },
  image: {
    provider: 'off',
    comfyUrl: 'http://127.0.0.1:8188',
    comfyRoot: '',
    comfyCheckpoint: 'sd_xl_turbo_1.0_fp16.safetensors',
    openaiModel: 'gpt-image-2.5-flare',
  },
});

function cloneDefaults() {
  return structuredClone(DEFAULT_CONFIG);
}

function configPath(projectRoot) {
  return join(projectRoot, '.campaign-manager', 'ai-config.json');
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

export function normalizeAiConfig(input = {}, previous = cloneDefaults()) {
  const textProvider = ['off', 'ollama', 'openai'].includes(input.text?.provider)
    ? input.text.provider
    : 'off';
  const imageProvider = ['off', 'comfyui', 'openai'].includes(input.image?.provider)
    ? input.image.provider
    : 'off';
  const requestedKey = String(input.text?.openaiApiKey ?? '').trim();
  const currentKey = String(previous.text?.openaiApiKey ?? '').trim();
  return {
    setupComplete: Boolean(input.setupComplete),
    text: {
      provider: textProvider,
      ollamaUrl: httpLocalhost(input.text?.ollamaUrl, DEFAULT_CONFIG.text.ollamaUrl),
      ollamaModel: String(input.text?.ollamaModel || DEFAULT_CONFIG.text.ollamaModel).slice(0, 100),
      openaiModel: String(input.text?.openaiModel || DEFAULT_CONFIG.text.openaiModel).slice(0, 100),
      openaiApiKey: requestedKey || currentKey,
    },
    image: {
      provider: imageProvider,
      comfyUrl: httpLocalhost(input.image?.comfyUrl, DEFAULT_CONFIG.image.comfyUrl),
      comfyRoot: String(input.image?.comfyRoot ?? previous.image?.comfyRoot ?? '').trim(),
      comfyCheckpoint: String(
        input.image?.comfyCheckpoint || DEFAULT_CONFIG.image.comfyCheckpoint,
      ).slice(0, 180),
      openaiModel: String(input.image?.openaiModel || DEFAULT_CONFIG.image.openaiModel).slice(
        0,
        100,
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

export function publicAiConfig(config) {
  return {
    ...config,
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
