import { normalizeLanguageTag } from './language-catalog.mjs';

export const CAMPAIGN_LOCALE_REGISTRY_VERSION = 1;

const DIRECTIONS = new Set(['ltr', 'rtl', 'auto']);

function localeError(context, path, message) {
  throw new Error(`${context}.${path}: ${message}`);
}

function canonicalTag(value, context, path) {
  try {
    return normalizeLanguageTag(value);
  } catch {
    return localeError(context, path, `"${String(value ?? '')}" is not a valid BCP-47 tag.`);
  }
}

function uniqueTags(values, context, path) {
  const result = [];
  for (const [index, value] of (values ?? []).entries()) {
    const tag = canonicalTag(value, context, `${path}[${index}]`);
    if (result.includes(tag)) localeError(context, `${path}[${index}]`, `duplicate locale ${tag}.`);
    result.push(tag);
  }
  return result;
}

function assertAcyclicFallbacks(locales, context) {
  const edges = new Map(locales.map((locale) => [locale.tag, locale.fallbacks ?? []]));
  const visiting = new Set();
  const visited = new Set();

  function visit(tag, trail = []) {
    if (visited.has(tag)) return;
    if (visiting.has(tag)) {
      localeError(context, 'locales', `fallback cycle detected: ${[...trail, tag].join(' -> ')}.`);
    }
    visiting.add(tag);
    for (const fallback of edges.get(tag) ?? []) visit(fallback, [...trail, tag]);
    visiting.delete(tag);
    visited.add(tag);
  }

  for (const locale of locales) visit(locale.tag);
}

export function normalizeLocaleRegistry(value, context = 'campaign.localeRegistry') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    localeError(context, 'value', 'must be an object.');
  }
  if (value.version !== CAMPAIGN_LOCALE_REGISTRY_VERSION) {
    localeError(
      context,
      'version',
      `must be ${CAMPAIGN_LOCALE_REGISTRY_VERSION}; received ${String(value.version)}.`,
    );
  }
  if (!Array.isArray(value.locales) || value.locales.length === 0) {
    localeError(context, 'locales', 'must contain at least one locale.');
  }

  const locales = value.locales.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return localeError(context, `locales[${index}]`, 'must be an object.');
    }
    const tag = canonicalTag(entry.tag, context, `locales[${index}].tag`);
    const direction = entry.direction ?? 'auto';
    if (!DIRECTIONS.has(direction)) {
      localeError(context, `locales[${index}].direction`, 'must be ltr, rtl or auto.');
    }
    const fallbacks = uniqueTags(entry.fallbacks ?? [], context, `locales[${index}].fallbacks`);
    if (fallbacks.includes(tag)) {
      localeError(context, `locales[${index}].fallbacks`, `${tag} cannot fall back to itself.`);
    }
    return {
      tag,
      direction,
      ...(fallbacks.length ? { fallbacks } : {}),
    };
  });

  const tags = locales.map(({ tag }) => tag);
  if (new Set(tags).size !== tags.length) {
    localeError(context, 'locales', 'contains duplicate canonical locale tags.');
  }
  for (const [index, locale] of locales.entries()) {
    for (const fallback of locale.fallbacks ?? []) {
      if (!tags.includes(fallback)) {
        localeError(
          context,
          `locales[${index}].fallbacks`,
          `${fallback} is not configured by this campaign.`,
        );
      }
    }
  }

  const defaultLocale = canonicalTag(value.defaultLocale, context, 'defaultLocale');
  const sourceLocale = canonicalTag(value.sourceLocale, context, 'sourceLocale');
  if (!tags.includes(defaultLocale)) {
    localeError(context, 'defaultLocale', `${defaultLocale} is not configured by this campaign.`);
  }
  if (!tags.includes(sourceLocale)) {
    localeError(context, 'sourceLocale', `${sourceLocale} is not configured by this campaign.`);
  }
  assertAcyclicFallbacks(locales, context);

  return {
    version: CAMPAIGN_LOCALE_REGISTRY_VERSION,
    locales,
    defaultLocale,
    sourceLocale,
  };
}

export function localeRegistryFromLanguages(
  languages,
  defaultLocale,
  sourceLocale = defaultLocale,
  context = 'campaign.localeRegistry',
) {
  const tags = uniqueTags(languages, context, 'locales');
  if (tags.length === 0) localeError(context, 'locales', 'must contain at least one locale.');
  return normalizeLocaleRegistry(
    {
      version: CAMPAIGN_LOCALE_REGISTRY_VERSION,
      locales: tags.map((tag) => ({ tag, direction: 'auto' })),
      defaultLocale: defaultLocale ?? tags[0],
      sourceLocale: sourceLocale ?? defaultLocale ?? tags[0],
    },
    context,
  );
}

export function legacyFieldsFromLocaleRegistry(registry) {
  const normalized = normalizeLocaleRegistry(registry);
  return {
    languages: normalized.locales.map(({ tag }) => tag),
    defaultLanguage: normalized.defaultLocale,
  };
}

function canonicalObjectKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const result = [];
  for (const key of Object.keys(value)) {
    try {
      result.push(normalizeLanguageTag(key));
    } catch {
      // Non-locale object keys are expected throughout campaign JSON.
    }
  }
  return result;
}

function identityLocaleKeys(manifestEntry, campaign) {
  return [
    manifestEntry?.name,
    manifestEntry?.description,
    manifestEntry?.status,
    campaign?.name,
    campaign?.description,
    campaign?.storySoFar,
  ].flatMap(canonicalObjectKeys);
}

function discoverLocalizedKeys(value, knownTags, result = new Set()) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value)) {
    for (const entry of value) discoverLocalizedKeys(entry, knownTags, result);
    return result;
  }

  const entries = Object.entries(value);
  const canonicalEntries = entries.map(([key, entry]) => {
    try {
      return [normalizeLanguageTag(key), entry];
    } catch {
      return [undefined, entry];
    }
  });
  const looksLocalized =
    canonicalEntries.some(([tag]) => tag !== undefined && knownTags.has(tag)) &&
    entries.every(([, entry]) => typeof entry === 'string');
  if (looksLocalized) {
    for (const [tag] of canonicalEntries) if (tag !== undefined) result.add(tag);
    return result;
  }
  for (const [, entry] of entries) discoverLocalizedKeys(entry, knownTags, result);
  return result;
}

function sameRegistry(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function inspectCampaignLocales(
  bundle,
  campaignId = bundle?.manifestEntry?.id ?? 'campaign',
) {
  const context = `campaign[${campaignId}].localeRegistry`;
  const manifestRegistry = bundle?.manifestEntry?.localeRegistry;
  const campaignRegistry = bundle?.campaign?.localeRegistry;
  let registry;
  let origin;

  if (manifestRegistry || campaignRegistry) {
    const left = manifestRegistry
      ? normalizeLocaleRegistry(manifestRegistry, `${context}.manifest`)
      : undefined;
    const right = campaignRegistry
      ? normalizeLocaleRegistry(campaignRegistry, `${context}.data`)
      : undefined;
    if (left && right && !sameRegistry(left, right)) {
      localeError(context, 'copies', 'campaigns.json and data/campaign.json disagree.');
    }
    registry = left ?? right;
    origin = manifestRegistry && campaignRegistry ? 'registry' : 'partial-registry';
  } else {
    const declared = [
      ...(bundle?.manifestEntry?.languages ?? []),
      ...(bundle?.campaign?.languages ?? []),
    ];
    const declaredTags = declared.map((tag, index) =>
      canonicalTag(tag, context, `legacyLanguages[${index}]`),
    );
    const detected = [
      ...new Set(
        declaredTags.length
          ? declaredTags
          : identityLocaleKeys(bundle?.manifestEntry, bundle?.campaign),
      ),
    ];
    if (detected.length === 0) {
      localeError(
        context,
        'legacy',
        'no locale metadata or localized identity keys could be detected.',
      );
    }
    const requestedDefault =
      bundle?.manifestEntry?.defaultLanguage ?? bundle?.campaign?.defaultLanguage;
    const normalizedDefault = requestedDefault
      ? canonicalTag(requestedDefault, context, 'legacyDefaultLanguage')
      : undefined;
    const defaultLocale = detected.includes(normalizedDefault)
      ? normalizedDefault
      : detected.includes('en')
        ? 'en'
        : detected[0];
    registry = localeRegistryFromLanguages(detected, defaultLocale, defaultLocale, context);
    origin = declared.length ? 'legacy-metadata' : 'localized-keys';
  }

  const configured = new Set(registry.locales.map(({ tag }) => tag));
  const discovered = discoverLocalizedKeys(bundle, configured);
  const orphanLocaleKeys = [...discovered].filter((tag) => !configured.has(tag)).sort();
  const required = origin !== 'registry';

  return {
    registry,
    origin,
    migration: {
      required,
      provisionalSource: required,
      orphanLocaleKeys,
      affectedFiles: required ? ['campaigns.json', `${campaignId}/data/campaign.json`] : [],
      proseWillBeRewritten: false,
    },
  };
}

function fallbackOrder(registry, requestedLocale) {
  const normalized = normalizeLocaleRegistry(registry);
  const locales = new Map(normalized.locales.map((locale) => [locale.tag, locale]));
  const result = [];
  const visited = new Set();

  function append(tag) {
    if (!tag || visited.has(tag) || !locales.has(tag)) return;
    visited.add(tag);
    result.push(tag);
    for (const fallback of locales.get(tag).fallbacks ?? []) append(fallback);
  }

  let requested;
  try {
    requested = normalizeLanguageTag(requestedLocale);
  } catch {
    requested = undefined;
  }
  append(requested);
  append(normalized.defaultLocale);
  append(normalized.sourceLocale);
  return result;
}

export function resolveLocalizedText(value, requestedLocale, registry) {
  const localized = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  let canonicalRequested;
  try {
    canonicalRequested = normalizeLanguageTag(requestedLocale);
  } catch {
    canonicalRequested = undefined;
  }
  for (const locale of fallbackOrder(registry, requestedLocale)) {
    const text = typeof localized[locale] === 'string' ? localized[locale] : '';
    if (text.length > 0) {
      return {
        requestedLocale,
        resolvedLocale: locale,
        value: text,
        isFallback: locale !== canonicalRequested,
        isMissing: false,
      };
    }
  }
  return {
    requestedLocale,
    value: '',
    isFallback: false,
    isMissing: true,
  };
}
