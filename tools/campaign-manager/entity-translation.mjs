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
        const previous = applied[`${targetLanguage}:${key}`] ?? applied[key];
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

/**
 * Validates a source and an arbitrary target subset against the campaign registry.
 * The returned order is stable and duplicate-free so repeated plans are idempotent.
 */
export function normalizeTranslationTargets({
  availableLanguages,
  sourceLanguage,
  targetLanguages,
}) {
  const available = new Set((availableLanguages ?? []).map(String));
  if (!available.has(sourceLanguage)) {
    throw new Error('The source language is no longer configured for this campaign.');
  }
  const targets = [
    ...new Set((targetLanguages ?? []).map(String).filter((language) => language.trim())),
  ];
  if (!targets.length) throw new Error('Choose at least one target campaign language.');
  for (const target of targets) {
    if (target === sourceLanguage)
      throw new Error('Source and target languages must be different.');
    if (!available.has(target)) {
      throw new Error(`The target language ${target} is no longer configured for this campaign.`);
    }
  }
  return targets;
}

/** Builds independent plans for one, two or N target locales. */
export function buildTranslationPlans({ targetLanguages, availableLanguages, ...input }) {
  const targets = normalizeTranslationTargets({
    availableLanguages,
    sourceLanguage: input.sourceLanguage,
    targetLanguages,
  });
  return {
    sourceLanguage: input.sourceLanguage,
    targetLanguages: targets,
    drafts: Object.fromEntries(
      targets.map((targetLanguage) => [
        targetLanguage,
        buildTranslationPlan({ ...input, targetLanguage }),
      ]),
    ),
  };
}

/** Runs independent target work while preserving completed results across partial failures. */
export async function runTranslationTargetBatch({
  targetLanguages,
  completedTargets = [],
  regenerate = false,
  worker,
}) {
  const completed = new Set(completedTargets);
  const results = {};
  const failures = {};
  for (const targetLanguage of targetLanguages) {
    if (!regenerate && completed.has(targetLanguage)) {
      results[targetLanguage] = { status: 'preserved' };
      continue;
    }
    try {
      results[targetLanguage] = await worker(targetLanguage);
    } catch (error) {
      failures[targetLanguage] = error instanceof Error ? error.message : String(error);
    }
  }
  return { results, failures };
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
  return {
    campaign: updated,
    report: { applied, skipped, completed: true, targetLanguage: draft.targetLanguage },
  };
}

export async function readTranslationWorkspace(root, campaignId) {
  try {
    const workspace = JSON.parse(await readFile(join(root, `${campaignId}.json`), 'utf8'));
    if (workspace.drafts || !workspace.draft?.targetLanguage) return workspace;
    return {
      ...workspace,
      version: 2,
      drafts: { [workspace.draft.targetLanguage]: workspace.draft },
      activeTarget: workspace.draft.targetLanguage,
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 2, applied: {}, drafts: {} };
    throw error;
  }
}

export async function writeTranslationWorkspace(root, campaignId, workspace) {
  const file = join(root, `${campaignId}.json`);
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify({ version: 2, ...workspace }, null, 2)}\n`, 'utf8');
  await rename(temporary, file);
}

export function mergeAppliedRecords(previous = {}, report = {}) {
  const next = { ...previous };
  const appliedAt = new Date().toISOString();
  for (const item of report.applied ?? []) {
    const key = report.targetLanguage ? `${report.targetLanguage}:${item.key}` : item.key;
    next[key] = { ...item, targetLanguage: report.targetLanguage, appliedAt };
  }
  return next;
}

export const TRANSLATABLE_ENTITY_TYPES = Object.freeze(Object.keys(GROUPS));
