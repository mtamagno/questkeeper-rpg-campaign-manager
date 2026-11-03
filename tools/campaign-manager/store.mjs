import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

import {
  assertCampaignEntityIds,
  assertEntityIdAvailable,
  ENTITY_TYPES,
  generateEntityId,
} from './entity-identity.mjs';
import { normalizeLanguageTag } from './language-catalog.mjs';
import {
  findLocaleReferences,
  inspectCampaignLocales,
  legacyFieldsFromLocaleRegistry,
  localeRegistryFromLanguages,
  normalizeLocaleRegistry,
} from './campaign-locales.mjs';
import { normalizeGameSystem } from './ruleset-profiles.mjs';
import { CAMPAIGN_PALETTE_IDS, normalizeCustomPalette } from './campaign-palettes.mjs';
import {
  normalizeCampaignNarrativeMood,
  normalizeSessionNarrativeMood,
} from './narrative-moods.mjs';
import storagePaths from '../storage-paths.cjs';

const { createCampaignBackup, resolveStoragePaths } = storagePaths;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ENTITY_TYPE_SET = new Set(ENTITY_TYPES);
const CAMPAIGN_PALETTES = new Set(CAMPAIGN_PALETTE_IDS);
const campaignWriteLocks = new Map();

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function withCampaignWrite(campaignId, work) {
  const previous = campaignWriteLocks.get(campaignId) ?? Promise.resolve();
  let release;
  const current = new Promise((resolveLock) => (release = resolveLock));
  const tail = previous.then(() => current);
  campaignWriteLocks.set(campaignId, tail);
  await previous;
  try {
    return await work();
  } finally {
    release();
    if (campaignWriteLocks.get(campaignId) === tail) campaignWriteLocks.delete(campaignId);
  }
}

export function validateId(value, label = 'ID') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new Error(`${label} must contain only lowercase letters, numbers and hyphens.`);
  }
  return value;
}

function registryFromInput(input, context = 'campaign.localeRegistry') {
  if (input.localeRegistry) return normalizeLocaleRegistry(input.localeRegistry, context);
  const languages = input.languages ?? ['en'];
  const defaultLocale = input.defaultLanguage ?? languages[0];
  return localeRegistryFromLanguages(languages, defaultLocale, defaultLocale, context);
}

function registryFromLanguageUpdate(currentRegistry, input, context) {
  if (input.localeRegistry) return normalizeLocaleRegistry(input.localeRegistry, context);
  if (!input.languages && !input.defaultLanguage) return currentRegistry;

  const currentByTag = new Map(currentRegistry.locales.map((locale) => [locale.tag, locale]));
  const requestedTags = (input.languages ?? currentRegistry.locales.map(({ tag }) => tag)).map(
    (tag) => normalizeLanguageTag(tag),
  );
  const configured = new Set(requestedTags);
  const defaultLocale = normalizeLanguageTag(
    input.defaultLanguage ??
      (configured.has(currentRegistry.defaultLocale)
        ? currentRegistry.defaultLocale
        : requestedTags[0]),
  );
  if (!configured.has(defaultLocale)) {
    throw new Error('The default language must be one of the selected campaign languages.');
  }
  const sourceLocale = configured.has(currentRegistry.sourceLocale)
    ? currentRegistry.sourceLocale
    : defaultLocale;
  return normalizeLocaleRegistry(
    {
      version: currentRegistry.version,
      locales: requestedTags.map((tag) => {
        const current = currentByTag.get(tag);
        const fallbacks = (current?.fallbacks ?? []).filter((fallback) => configured.has(fallback));
        return {
          tag,
          direction: current?.direction ?? 'auto',
          ...(fallbacks.length ? { fallbacks } : {}),
        };
      }),
      defaultLocale,
      sourceLocale,
    },
    context,
  );
}

function normalizeCampaignPalette(value, fallback = 'heroic') {
  const palette = value ?? fallback;
  if (!CAMPAIGN_PALETTES.has(palette)) {
    throw new Error('Campaign palette must be heroic, gothic, neutral or custom.');
  }
  return palette;
}

function slugifyCampaignName(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52);
}

function stableNameHash(value) {
  let hash = 2166136261;
  for (const character of String(value ?? '')) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function generateCampaignId(manifest, name, defaultLanguage, requestedId) {
  const used = new Set((manifest ?? []).map((entry) => entry.id));
  if (String(requestedId ?? '').trim()) {
    const requested = validateId(String(requestedId).trim(), 'Campaign ID');
    if (used.has(requested)) throw new Error(`Campaign "${requested}" already exists.`);
    return requested;
  }
  const label = String(name?.[defaultLanguage] ?? '').trim();
  const readable = slugifyCampaignName(label);
  const base = readable || `campaign-${stableNameHash(label)}`;
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error('Could not generate a unique campaign ID.');
}

function assertDefaultLocalizedValue(value, defaultLanguage, label) {
  if (!String(value?.[defaultLanguage] ?? '').trim()) {
    throw new Error(`${label} is required in the default language (${defaultLanguage}).`);
  }
}

function assertInside(base, target) {
  const rel = relative(resolve(base), resolve(target));
  if (rel.startsWith('..') || rel === '..') throw new Error('Unsafe path rejected.');
  return target;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (fallback !== undefined && error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

export function campaignsRoot(projectRoot) {
  return resolveStoragePaths(projectRoot).campaignsRoot;
}

function campaignRoot(projectRoot, campaignId) {
  validateId(campaignId, 'Campaign ID');
  return assertInside(campaignsRoot(projectRoot), join(campaignsRoot(projectRoot), campaignId));
}

function dataRoot(projectRoot, campaignId) {
  return join(campaignRoot(projectRoot, campaignId), 'data');
}

async function loadManifested(folder) {
  const manifest = await readJson(join(folder, 'manifest.json'), []);
  const entries = [];
  for (const fileName of manifest) {
    if (typeof fileName !== 'string' || !/^[a-z0-9-]+\.json$/.test(fileName)) continue;
    entries.push(await readJson(join(folder, fileName)));
  }
  return entries;
}

export async function getState(projectRoot) {
  const manifestPath = join(campaignsRoot(projectRoot), 'campaigns.json');
  const manifest = await readJson(manifestPath, []);
  const campaigns = [];
  for (const entry of manifest) {
    const base = dataRoot(projectRoot, entry.id);
    const [campaign, characters, npcs, sessions, maps] = await Promise.all([
      readJson(join(base, 'campaign.json'), {}),
      readJson(join(base, 'characters', 'manifest.json'), []),
      readJson(join(base, 'npcs', 'manifest.json'), []),
      readJson(join(base, 'sessions', 'manifest.json'), []),
      readJson(join(base, 'maps.json'), []),
    ]);
    campaigns.push({
      ...entry,
      details: campaign,
      localeContract: inspectCampaignLocales({ manifestEntry: entry, campaign }, entry.id),
      counts: {
        characters: characters.length,
        npcs: npcs.length,
        sessions: sessions.length,
        maps: maps.length,
      },
    });
  }
  return { campaigns };
}

export async function getCampaign(projectRoot, campaignId) {
  const root = dataRoot(projectRoot, campaignId);
  const manifest = await readJson(join(campaignsRoot(projectRoot), 'campaigns.json'), []);
  const manifestEntry = manifest.find((entry) => entry.id === campaignId);
  if (!manifestEntry) throw new Error(`Campaign "${campaignId}" does not exist.`);

  const [campaign, characters, npcs, sessions, maps, partyRelationships, npcRelationships] =
    await Promise.all([
      readJson(join(root, 'campaign.json'), {}),
      loadManifested(join(root, 'characters')),
      loadManifested(join(root, 'npcs')),
      loadManifested(join(root, 'sessions')),
      readJson(join(root, 'maps.json'), []),
      readJson(join(root, 'party-relationships.json'), []),
      readJson(join(root, 'npc-relationships.json'), []),
    ]);

  const gameSystem = normalizeGameSystem(
    campaign.gameSystem ?? manifestEntry.gameSystem,
    campaign.edition,
  );
  const bundle = {
    manifestEntry: { ...manifestEntry, gameSystem },
    campaign: { ...campaign, gameSystem },
    characters,
    npcs,
    sessions,
    maps,
    partyRelationships,
    npcRelationships,
  };
  return {
    ...bundle,
    localeContract: inspectCampaignLocales(bundle, campaignId),
  };
}

export async function createCampaign(projectRoot, input) {
  const localeRegistry = registryFromInput(input);
  const { languages, defaultLanguage } = legacyFieldsFromLocaleRegistry(localeRegistry);
  assertDefaultLocalizedValue(input.name, defaultLanguage, 'Campaign name');

  const manifestPath = join(campaignsRoot(projectRoot), 'campaigns.json');
  const manifest = await readJson(manifestPath, []);
  const id = generateCampaignId(manifest, input.name, defaultLanguage, input.id);
  const root = campaignRoot(projectRoot, id);
  if (await exists(root)) throw new Error(`Campaign "${id}" already exists.`);
  const gameSystem = normalizeGameSystem(input.gameSystem, input.edition);
  const narrativeMood = normalizeCampaignNarrativeMood(input.campaign?.narrativeMood);

  const base = join(root, 'data');
  await Promise.all([
    mkdir(join(base, 'characters'), { recursive: true }),
    mkdir(join(base, 'npcs'), { recursive: true }),
    mkdir(join(base, 'sessions'), { recursive: true }),
    mkdir(join(root, 'images', 'group'), { recursive: true }),
    mkdir(join(root, 'images', 'characters'), { recursive: true }),
    mkdir(join(root, 'images', 'npcs'), { recursive: true }),
    mkdir(join(root, 'images', 'maps'), { recursive: true }),
    mkdir(join(root, 'images', 'sessions'), { recursive: true }),
  ]);

  const entry = {
    id,
    localeRegistry,
    languages,
    defaultLanguage,
    palette: normalizeCampaignPalette(input.palette),
    ...(input.palette === 'custom'
      ? { customPalette: normalizeCustomPalette(input.customPalette) }
      : {}),
    name: input.name,
    description: input.description ?? { [defaultLanguage]: '' },
    thumbnail: '',
    status: input.status ?? { [defaultLanguage]: 'In progress' },
    gameSystem,
  };
  const campaign = {
    name: input.name,
    description: input.description ?? { [defaultLanguage]: '' },
    localeRegistry,
    languages,
    defaultLanguage,
    edition: gameSystem.edition || 'Custom RPG',
    gameSystem: entry.gameSystem,
    startDate: input.startDate || new Date().toISOString().slice(0, 10),
    dungeonMaster: input.dungeonMaster?.trim() || 'Game Master',
    partyName: input.partyName?.trim() || 'The Party',
    ...(narrativeMood ? { narrativeMood } : {}),
    heroImages: [],
    storySoFar: Object.fromEntries(languages.map((language) => [language, ''])),
  };

  await Promise.all([
    writeJson(join(base, 'campaign.json'), campaign),
    writeJson(join(base, 'characters', 'manifest.json'), []),
    writeJson(join(base, 'npcs', 'manifest.json'), []),
    writeJson(join(base, 'sessions', 'manifest.json'), []),
    writeJson(join(base, 'maps.json'), []),
    writeJson(join(base, 'party-relationships.json'), []),
    writeJson(join(base, 'npc-relationships.json'), []),
  ]);
  await writeJson(manifestPath, [...manifest, entry]);
  return getCampaign(projectRoot, id);
}

export async function updateCampaign(projectRoot, campaignId, input) {
  const current = await getCampaign(projectRoot, campaignId);
  const manifestPath = join(campaignsRoot(projectRoot), 'campaigns.json');
  const manifest = await readJson(manifestPath, []);
  const currentRegistry = current.localeContract.registry;
  const currentLegacy = legacyFieldsFromLocaleRegistry(currentRegistry);
  if (current.localeContract.migration.required && input.localeRegistry) {
    throw new Error(
      `Campaign "${campaignId}" must use the reviewed locale migration before localeRegistry can be saved.`,
    );
  }
  if (current.localeContract.migration.required) {
    const requestedLanguages = input.languages
      ? input.languages.map((tag) => normalizeLanguageTag(tag))
      : currentLegacy.languages;
    const requestedDefault = input.defaultLanguage
      ? normalizeLanguageTag(input.defaultLanguage)
      : currentLegacy.defaultLanguage;
    if (
      JSON.stringify(requestedLanguages) !== JSON.stringify(currentLegacy.languages) ||
      requestedDefault !== currentLegacy.defaultLanguage
    ) {
      throw new Error(
        `Campaign "${campaignId}" locale metadata must be migrated before changing languages.`,
      );
    }
  }
  const localeRegistry = current.localeContract.migration.required
    ? currentRegistry
    : registryFromLanguageUpdate(currentRegistry, input, `campaign[${campaignId}].localeRegistry`);
  if (!current.localeContract.migration.required) {
    const nextTags = new Set(localeRegistry.locales.map(({ tag }) => tag));
    const removedTags = currentRegistry.locales
      .map(({ tag }) => tag)
      .filter((tag) => !nextTags.has(tag));
    for (const tag of removedTags) {
      const references = findLocaleReferences(current, tag);
      if (references.length > 0 && input.localeRemovalResolutions?.[tag] !== 'archive') {
        throw new Error(
          `Campaign language ${tag} still has ${references.length} populated reference(s) ` +
            `(${references.slice(0, 3).join(', ')}). Choose the explicit archive option before ` +
            `removing it from the active registry.`,
        );
      }
    }
  }
  const { languages, defaultLanguage } = legacyFieldsFromLocaleRegistry(localeRegistry);
  const nextName = input.name ?? current.manifestEntry.name;
  assertDefaultLocalizedValue(nextName, defaultLanguage, 'Campaign name');
  const nextPalette = normalizeCampaignPalette(input.palette ?? current.manifestEntry.palette);
  const suppliedCustomPalette = Object.hasOwn(input, 'customPalette');
  const nextCustomPalette = suppliedCustomPalette
    ? normalizeCustomPalette(input.customPalette)
    : current.manifestEntry.customPalette;
  if (nextPalette === 'custom' && !nextCustomPalette) {
    throw new Error('Custom palette data is required. Duplicate a preset to begin.');
  }
  const localeFields = current.localeContract.migration.required
    ? {}
    : { localeRegistry, languages, defaultLanguage };
  const nextEntry = {
    ...current.manifestEntry,
    ...localeFields,
    palette: nextPalette,
    ...(nextCustomPalette ? { customPalette: nextCustomPalette } : {}),
    name: nextName,
    description: input.description ?? current.manifestEntry.description,
    status: input.status ?? current.manifestEntry.status,
    thumbnail: input.thumbnail ?? current.manifestEntry.thumbnail,
    gameSystem: normalizeGameSystem(
      input.gameSystem ?? current.manifestEntry.gameSystem,
      input.edition ?? input.campaign?.edition ?? current.campaign.edition,
    ),
  };
  const campaignPatch = { ...(input.campaign ?? {}) };
  delete campaignPatch.localeRegistry;
  delete campaignPatch.languages;
  delete campaignPatch.defaultLanguage;
  const nextCampaign = {
    ...current.campaign,
    ...campaignPatch,
    ...localeFields,
    name: nextEntry.name,
    description: nextEntry.description,
    gameSystem: nextEntry.gameSystem,
  };
  if (Object.hasOwn(input.campaign ?? {}, 'narrativeMood')) {
    const narrativeMood = normalizeCampaignNarrativeMood(input.campaign.narrativeMood);
    if (narrativeMood) nextCampaign.narrativeMood = narrativeMood;
    else delete nextCampaign.narrativeMood;
  }
  await Promise.all([
    writeJson(
      manifestPath,
      manifest.map((entry) => (entry.id === campaignId ? nextEntry : entry)),
    ),
    writeJson(join(dataRoot(projectRoot, campaignId), 'campaign.json'), nextCampaign),
  ]);
  return getCampaign(projectRoot, campaignId);
}

function localeRevision(manifestEntry, campaign) {
  return createHash('sha256').update(JSON.stringify({ manifestEntry, campaign })).digest('hex');
}

async function readLocaleSource(projectRoot, campaignId) {
  const manifestPath = join(campaignsRoot(projectRoot), 'campaigns.json');
  const manifest = await readJson(manifestPath, []);
  const manifestEntry = manifest.find((entry) => entry.id === campaignId);
  if (!manifestEntry) throw new Error(`Campaign "${campaignId}" does not exist.`);
  const campaignPath = join(dataRoot(projectRoot, campaignId), 'campaign.json');
  const campaign = await readJson(campaignPath, {});
  return { manifest, manifestPath, manifestEntry, campaign, campaignPath };
}

export async function previewCampaignLocaleMigration(projectRoot, campaignId) {
  const source = await readLocaleSource(projectRoot, campaignId);
  const localeContract = inspectCampaignLocales(source, campaignId);
  return {
    campaignId,
    revision: localeRevision(source.manifestEntry, source.campaign),
    registry: localeContract.registry,
    origin: localeContract.origin,
    ...localeContract.migration,
    legacyFields: legacyFieldsFromLocaleRegistry(localeContract.registry),
    backupRequired: localeContract.migration.required,
  };
}

export async function migrateCampaignLocaleRegistry(projectRoot, campaignId, input = {}) {
  return withCampaignWrite(campaignId, async () => {
    const source = await readLocaleSource(projectRoot, campaignId);
    const currentRevision = localeRevision(source.manifestEntry, source.campaign);
    if (input.revision && input.revision !== currentRevision) {
      throw new Error(
        `Campaign "${campaignId}" changed after the locale migration preview. Review it again.`,
      );
    }
    const inspected = inspectCampaignLocales(source, campaignId);
    let registry = input.localeRegistry
      ? normalizeLocaleRegistry(input.localeRegistry, `campaign[${campaignId}].localeRegistry`)
      : inspected.registry;
    if (input.sourceLocale) {
      registry = normalizeLocaleRegistry(
        { ...registry, sourceLocale: input.sourceLocale },
        `campaign[${campaignId}].localeRegistry`,
      );
    }
    const legacyFields = legacyFieldsFromLocaleRegistry(registry);
    const complete =
      !inspected.migration.required &&
      JSON.stringify(source.manifestEntry.localeRegistry) === JSON.stringify(registry) &&
      JSON.stringify(source.campaign.localeRegistry) === JSON.stringify(registry);
    if (complete) {
      return {
        changed: false,
        backup: undefined,
        campaign: await getCampaign(projectRoot, campaignId),
      };
    }

    const backup = await createCampaignBackup(projectRoot);
    const nextEntry = { ...source.manifestEntry, ...legacyFields, localeRegistry: registry };
    const nextCampaign = { ...source.campaign, ...legacyFields, localeRegistry: registry };
    await Promise.all([
      writeJson(
        source.manifestPath,
        source.manifest.map((entry) => (entry.id === campaignId ? nextEntry : entry)),
      ),
      writeJson(source.campaignPath, nextCampaign),
    ]);
    return { changed: true, backup, campaign: await getCampaign(projectRoot, campaignId) };
  });
}

async function moveToTrash(projectRoot, source, label) {
  if (!(await exists(source))) return;
  const trash = join(resolveStoragePaths(projectRoot).trashRoot, `${nowStamp()}-${label}`);
  await mkdir(dirname(trash), { recursive: true });
  await rename(source, trash);
}

export async function deleteCampaign(projectRoot, campaignId, confirmation) {
  validateId(campaignId, 'Campaign ID');
  if (confirmation !== campaignId) throw new Error('Campaign confirmation does not match.');
  const manifestPath = join(campaignsRoot(projectRoot), 'campaigns.json');
  const manifest = await readJson(manifestPath, []);
  if (!manifest.some((entry) => entry.id === campaignId)) throw new Error('Campaign not found.');
  await moveToTrash(projectRoot, campaignRoot(projectRoot, campaignId), campaignId);
  await writeJson(
    manifestPath,
    manifest.filter((entry) => entry.id !== campaignId),
  );
}

function validateEntity(type, entity) {
  if (!ENTITY_TYPE_SET.has(type)) throw new Error('Unsupported entity type.');
  if (entity?.id) validateId(entity.id, 'Entity ID');
  const label = type === 'sessions' ? entity?.title : entity?.name;
  if (typeof label !== 'string' && typeof label !== 'object') {
    throw new Error(
      type === 'sessions' ? 'Session title is required.' : 'Entity name is required.',
    );
  }
}

export async function saveEntity(projectRoot, campaignId, type, entity, previousId) {
  validateEntity(type, entity);
  return withCampaignWrite(campaignId, async () => {
    const base = dataRoot(projectRoot, campaignId);
    const campaign = await getCampaign(projectRoot, campaignId);
    const label = type === 'sessions' ? entity.title : entity.name;
    const normalizedEntity = type === 'sessions' ? normalizeSessionNarrativeMood(entity) : entity;
    const prepared = {
      ...normalizedEntity,
      id: entity.id || generateEntityId(campaign, type, localizedIdentityLabel(label)),
    };
    validateId(prepared.id, 'Entity ID');
    assertEntityIdAvailable(campaign, type, prepared.id, previousId);

    if (type === 'maps') {
      const path = join(base, 'maps.json');
      const maps = await readJson(path, []);
      const matchId = previousId ?? prepared.id;
      const existsAlready = maps.some((item) => item.id === matchId);
      const next = existsAlready
        ? maps.map((item) => (item.id === matchId ? prepared : item))
        : [...maps, prepared];
      await writeJson(path, next);
      return prepared;
    }

    const folder = join(base, type);
    const manifestPath = join(folder, 'manifest.json');
    const manifest = await readJson(manifestPath, []);
    const oldFile = previousId ? `${validateId(previousId)}.json` : undefined;
    const fileName = `${prepared.id}.json`;
    if (oldFile && oldFile !== fileName) {
      await moveToTrash(projectRoot, join(folder, oldFile), `${campaignId}-${type}-${previousId}`);
    }
    await writeJson(join(folder, fileName), prepared);
    const nextManifest = oldFile
      ? manifest.includes(oldFile)
        ? manifest.map((item) => (item === oldFile ? fileName : item))
        : [...manifest, fileName]
      : [...manifest, fileName];
    await writeJson(manifestPath, [...new Set(nextManifest)]);
    return prepared;
  });
}

export async function saveRelationshipSet(projectRoot, campaignId, type, entries) {
  if (!['partyRelationships', 'npcRelationships'].includes(type)) {
    throw new Error('Unsupported relationship collection.');
  }
  if (!Array.isArray(entries)) throw new Error('Relationship collection must be a list.');
  const fileName =
    type === 'partyRelationships' ? 'party-relationships.json' : 'npc-relationships.json';
  return withCampaignWrite(campaignId, async () => {
    await writeJson(join(dataRoot(projectRoot, campaignId), fileName), entries);
    return entries;
  });
}

function localizedIdentityLabel(value) {
  if (typeof value === 'string') return value;
  return Object.values(value ?? {}).find((entry) => String(entry || '').trim()) ?? '';
}

export async function deleteEntity(projectRoot, campaignId, type, entityId) {
  validateId(entityId, 'Entity ID');
  if (!ENTITY_TYPE_SET.has(type)) throw new Error('Unsupported entity type.');
  const base = dataRoot(projectRoot, campaignId);
  if (type === 'maps') {
    const path = join(base, 'maps.json');
    const maps = await readJson(path, []);
    await writeJson(
      path,
      maps.filter((item) => item.id !== entityId),
    );
    return;
  }
  const folder = join(base, type);
  const fileName = `${entityId}.json`;
  const manifestPath = join(folder, 'manifest.json');
  const manifest = await readJson(manifestPath, []);
  await moveToTrash(projectRoot, join(folder, fileName), `${campaignId}-${type}-${entityId}`);
  await writeJson(
    manifestPath,
    manifest.filter((item) => item !== fileName),
  );
}

export async function saveImage(projectRoot, campaignId, input) {
  const category = ['group', 'characters', 'npcs', 'maps', 'sessions'].includes(input.category)
    ? input.category
    : 'group';
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
    input.dataUrl ?? '',
  );
  if (!match) throw new Error('Only PNG, JPEG and WebP images are supported.');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 8 * 1024 * 1024) throw new Error('Image exceeds the 8 MB limit.');
  const extension = match[1] === 'image/jpeg' ? 'jpg' : match[1].split('/')[1];
  const stem =
    String(input.fileName ?? 'image')
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'image';
  const fileName = `${stem}-${Date.now()}.${extension}`;
  const imageDir = join(campaignRoot(projectRoot, campaignId), 'images', category);
  const path = assertInside(imageDir, join(imageDir, fileName));
  await mkdir(imageDir, { recursive: true });
  await writeFile(path, buffer);
  return { path: `images/${category}/${fileName}`, bytes: buffer.length };
}

export async function exportCampaign(projectRoot, campaignId) {
  const data = await getCampaign(projectRoot, campaignId);
  return {
    format: 'campaign-companion-bundle',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
    note: 'Images are not embedded. Copy the campaign images folder separately.',
  };
}

export async function importCampaign(projectRoot, bundle) {
  if (bundle?.format !== 'campaign-companion-bundle' || bundle?.version !== 1) {
    throw new Error('This is not a supported Campaign Companion bundle.');
  }
  assertCampaignEntityIds({
    characters: bundle.characters ?? [],
    npcs: bundle.npcs ?? [],
    sessions: bundle.sessions ?? [],
    maps: bundle.maps ?? [],
  });
  const id = validateId(bundle.manifestEntry?.id, 'Campaign ID');
  const localeRegistry = inspectCampaignLocales(bundle, id).registry;
  const legacyFields = legacyFieldsFromLocaleRegistry(localeRegistry);
  await createCampaign(projectRoot, {
    id,
    localeRegistry,
    ...legacyFields,
    name: bundle.manifestEntry.name,
    description: bundle.manifestEntry.description,
    status: bundle.manifestEntry.status,
    gameSystem: bundle.campaign?.gameSystem ?? bundle.manifestEntry?.gameSystem,
    edition: bundle.campaign?.edition,
    startDate: bundle.campaign?.startDate,
    dungeonMaster: bundle.campaign?.dungeonMaster,
    partyName: bundle.campaign?.partyName,
  });
  await updateCampaign(projectRoot, id, {
    ...bundle.manifestEntry,
    campaign: bundle.campaign,
  });
  for (const character of bundle.characters ?? [])
    await saveEntity(projectRoot, id, 'characters', character);
  for (const npc of bundle.npcs ?? []) await saveEntity(projectRoot, id, 'npcs', npc);
  for (const session of bundle.sessions ?? [])
    await saveEntity(projectRoot, id, 'sessions', session);
  for (const map of bundle.maps ?? []) await saveEntity(projectRoot, id, 'maps', map);
  const base = dataRoot(projectRoot, id);
  await Promise.all([
    writeJson(join(base, 'party-relationships.json'), bundle.partyRelationships ?? []),
    writeJson(join(base, 'npc-relationships.json'), bundle.npcRelationships ?? []),
  ]);
  return getCampaign(projectRoot, id);
}
