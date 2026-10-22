export const AI_CAPABILITIES = Object.freeze([
  'text',
  'structured-output',
  'vision',
  'image-prompt',
  'image-generation',
  'web',
]);

export const AI_ROLE_CAPABILITIES = Object.freeze({
  prose: Object.freeze(['text', 'structured-output']),
  extraction: Object.freeze(['text', 'structured-output', 'vision']),
  imagePrompt: Object.freeze(['text', 'structured-output', 'image-prompt']),
  image: Object.freeze(['image-generation']),
});

export const REMOTE_PROVIDER_REGISTRY = Object.freeze({
  openai: Object.freeze({
    id: 'openai',
    label: 'OpenAI',
    transport: 'openai',
    remote: true,
    defaultBaseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://developers.openai.com/api/docs',
    privacyUrl: 'https://platform.openai.com/docs/guides/your-data',
    pricingUrl: 'https://openai.com/api/pricing/',
    defaultModels: Object.freeze([
      Object.freeze({
        id: 'gpt-5-mini',
        capabilities: Object.freeze(['text', 'structured-output', 'vision', 'image-prompt', 'web']),
      }),
      Object.freeze({
        id: 'gpt-image-2.5-flare',
        capabilities: Object.freeze(['image-generation']),
      }),
    ]),
  }),
  xai: Object.freeze({
    id: 'xai',
    label: 'xAI / Grok',
    transport: 'openai',
    remote: true,
    defaultBaseUrl: 'https://api.x.ai/v1',
    docsUrl: 'https://docs.x.ai/',
    privacyUrl: 'https://docs.x.ai/developers/faq/security',
    pricingUrl: 'https://docs.x.ai/developers/models',
    defaultModels: Object.freeze([
      Object.freeze({
        id: 'grok-4-1-fast',
        capabilities: Object.freeze(['text', 'structured-output', 'vision', 'image-prompt', 'web']),
      }),
      Object.freeze({
        id: 'grok-imagine-image',
        capabilities: Object.freeze(['image-generation']),
      }),
    ]),
  }),
  gemini: Object.freeze({
    id: 'gemini',
    label: 'Google Gemini',
    transport: 'gemini',
    remote: true,
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    privacyUrl: 'https://ai.google.dev/gemini-api/terms',
    pricingUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    defaultModels: Object.freeze([
      Object.freeze({
        id: 'gemini-2.5-flash',
        capabilities: Object.freeze(['text', 'structured-output', 'vision', 'image-prompt']),
      }),
      Object.freeze({
        id: 'gemini-2.5-flash-image',
        capabilities: Object.freeze(['image-generation']),
      }),
    ]),
  }),
});

function cleanCapabilities(value) {
  const requested = Array.isArray(value)
    ? value
    : String(value || '')
        .split(',')
        .map((item) => item.trim());
  return [...new Set(requested.filter((item) => AI_CAPABILITIES.includes(item)))];
}

export function normalizeProviderModels(value, defaults = []) {
  const entries = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  const normalized = entries
    .map((entry) => {
      if (typeof entry === 'string') {
        const [id, capabilityList = ''] = entry.split('|', 2);
        return { id: id.trim(), capabilities: cleanCapabilities(capabilityList) };
      }
      return {
        id: String(entry?.id || '').trim(),
        capabilities: cleanCapabilities(entry?.capabilities),
      };
    })
    .filter((entry) => entry.id)
    .map((entry) => ({ ...entry, id: entry.id.slice(0, 180) }));
  const merged = new Map();
  for (const entry of [...defaults, ...normalized]) {
    const id = String(entry?.id || '').trim();
    if (!id) continue;
    const current = merged.get(id);
    merged.set(id, {
      id,
      capabilities: [
        ...new Set([...(current?.capabilities ?? []), ...cleanCapabilities(entry.capabilities)]),
      ],
    });
  }
  return [...merged.values()].slice(0, 100);
}

export function modelSupportsRole(model, role) {
  const required = AI_ROLE_CAPABILITIES[role];
  if (!required) return false;
  return required.every((capability) => model?.capabilities?.includes(capability));
}

export function isRemoteProvider(provider) {
  return Boolean(REMOTE_PROVIDER_REGISTRY[provider]?.remote);
}

export function publicProviderRegistry() {
  return Object.values(REMOTE_PROVIDER_REGISTRY).map(
    ({ id, label, transport, remote, docsUrl, privacyUrl, pricingUrl }) => ({
      id,
      label,
      transport,
      remote,
      docsUrl,
      privacyUrl,
      pricingUrl,
    }),
  );
}

export function providerModel(config, provider, modelId) {
  return config.providers?.[provider]?.models?.find((model) => model.id === modelId) ?? null;
}

export function assertEngineCapability(config, engine, role) {
  if (engine.provider === 'ollama') {
    if (role === 'image') throw new Error('Ollama cannot render images in QuestKeeper.');
    return engine;
  }
  if (engine.provider === 'comfyui') {
    if (role !== 'image') throw new Error('ComfyUI is available only for image rendering.');
    return engine;
  }
  const provider = REMOTE_PROVIDER_REGISTRY[engine.provider];
  if (!provider) throw new Error(`Choose a compatible ${role} model for this task.`);
  const model = providerModel(config, engine.provider, engine.model);
  if (!model) throw new Error(`The selected ${role} model is not in the saved provider catalog.`);
  if (!modelSupportsRole(model, role)) {
    throw new Error(`The selected model does not support the ${role} role.`);
  }
  if (!config.providers[engine.provider].apiKey) {
    throw new Error(`Add the ${provider.label} API key in AI setup first.`);
  }
  return engine;
}
