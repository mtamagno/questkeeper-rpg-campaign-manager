import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const GROUPS = Object.freeze({
  characters: 'characters',
  npcs: 'npcs',
  sessions: 'sessions',
  maps: 'maps',
  'party-relationships': 'partyRelationships',
  'npc-relationships': 'npcRelationships',
});

const PROTECTED_KEYS = new Set([
  'id',
  'name',
  'url',
  'path',
  'profileImageUrl',
  'portraitImageUrl',
  'sourceId',
  'targetId',
  'sessionId',
  'spellId',
  'qualifiedId',
]);

function hash(value) {
  return createHash('sha256')
    .update(String(value ?? ''))
    .digest('hex');
}

function entityId(type, entity, index) {
  if (entity?.id) return entity.id;
  if (entity?.sourceId && entity?.targetId) return `${entity.sourceId}->${entity.targetId}`;
  return `${type}-${index + 1}`;
}

function isLocalizedText(value, sourceLanguage) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value[sourceLanguage] === 'string'
  );
}

function collectLocalizedFields(value, sourceLanguage, targetLanguage, path = [], result = []) {
  if (!value || typeof value !== 'object') return result;
  if (isLocalizedText(value, sourceLanguage)) {
    result.push({
      path: path.join('.'),
      source: value[sourceLanguage],
      target: typeof value[targetLanguage] === 'string' ? value[targetLanguage] : '',
    });
    return result;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (PROTECTED_KEYS.has(key)) continue;
    collectLocalizedFields(entry, sourceLanguage, targetLanguage, [...path, key], result);
  }
  return result;
}

export function buildTranslationPlan({
  campaign,
  sourceLanguage,
  targetLanguage,
  entityTypes = Object.keys(GROUPS),
  entityIds = [],
  fieldPaths = [],
  applied = {},
}) {
  if (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage) {
    throw new Error('Choose two different campaign languages.');
  }
  const allowedIds = new Set(entityIds);
  const allowedPaths = new Set(fieldPaths);
  const items = [];
  for (const type of entityTypes) {
    const property = GROUPS[type];
    if (!property) throw new Error(`Unsupported translation entity type: ${type}`);
    for (const [index, entity] of (campaign[property] ?? []).entries()) {
      const id = entityId(type, entity, index);
      if (allowedIds.size && !allowedIds.has(id)) continue;
      for (const field of collectLocalizedFields(entity, sourceLanguage, targetLanguage)) {
        if (!field.source.trim() || (allowedPaths.size && !allowedPaths.has(field.path))) continue;
        const key = `${type}:${id}:${field.path}`;
        const sourceHash = hash(field.source);
        const targetHash = hash(field.target);
        const previous = applied[key];
        const status = !field.target.trim()
          ? 'missing'
          : previous?.sourceHash === sourceHash && previous?.targetHash === targetHash
            ? 'current'
            : 'stale';
        items.push({
          key,
          entityType: type,
          entityId: id,
          path: field.path,
          source: field.source,
          target: field.target,
          sourceHash,
          targetHash,
          status,
          selected: status !== 'current',
        });
      }
    }
  }
  return { sourceLanguage, targetLanguage, items };
}

function setLocalizedPath(entity, path, language, value) {
  const segments = path.split('.').filter(Boolean);
  let cursor = entity;
  for (let index = 0; index < segments.length - 1; index += 1) {
    cursor = cursor?.[segments[index]];
    if (!cursor || typeof cursor !== 'object')
      throw new Error(`Translation path disappeared: ${path}`);
  }
  const localized = cursor?.[segments.at(-1)];
  if (!localized || typeof localized !== 'object' || Array.isArray(localized)) {
    throw new Error(`Translation target is no longer localized text: ${path}`);
  }
  localized[language] = value;
}

export function applyTranslationDraft(campaign, draft, { overwrite = false } = {}) {
  if (!draft || draft.status !== 'reviewed') throw new Error('Review the translation draft first.');
  const updated = structuredClone(campaign);
  const applied = [];
  const skipped = [];
  for (const item of draft.items ?? []) {
    if (!item.selected) continue;
    if (!String(item.draft ?? '').trim()) {
      skipped.push({ key: item.key, reason: 'empty-draft' });
      continue;
    }
    const property = GROUPS[item.entityType];
    const entity = (updated[property] ?? []).find(
      (candidate, index) => entityId(item.entityType, candidate, index) === item.entityId,
    );
    if (!entity)
      throw new Error(`Translation entity disappeared: ${item.entityType}/${item.entityId}`);
    const current = collectLocalizedFields(entity, draft.sourceLanguage, draft.targetLanguage).find(
      (field) => field.path === item.path,
    );
    if (!current || hash(current.source) !== item.sourceHash) {
      throw new Error(`Source changed after this draft was created: ${item.key}`);
    }
    if (current.target.trim() && current.target !== item.draft && !overwrite) {
      throw new Error(`Overwrite consent is required for ${item.key}.`);
    }
    setLocalizedPath(entity, item.path, draft.targetLanguage, item.draft);
    applied.push({ key: item.key, sourceHash: item.sourceHash, targetHash: hash(item.draft) });
  }
  return { campaign: updated, report: { applied, skipped, completed: true } };
}

export async function readTranslationWorkspace(root, campaignId) {
  try {
    return JSON.parse(await readFile(join(root, `${campaignId}.json`), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 1, applied: {} };
    throw error;
  }
}

export async function writeTranslationWorkspace(root, campaignId, workspace) {
  const file = join(root, `${campaignId}.json`);
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ version: 1, ...workspace }, null, 2)}\n`, 'utf8');
  await rename(temporary, file);
}

export function mergeAppliedRecords(previous = {}, report = {}) {
  const next = { ...previous };
  const appliedAt = new Date().toISOString();
  for (const item of report.applied ?? []) next[item.key] = { ...item, appliedAt };
  return next;
}

export const TRANSLATABLE_ENTITY_TYPES = Object.freeze(Object.keys(GROUPS));
