const IDS = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const QUEST_STATES = Object.freeze([
  'rumour',
  'active',
  'paused',
  'completed',
  'failed',
  'abandoned',
]);
export const QUEST_AUDIENCES = Object.freeze(['party', 'owners', 'gm']);
export const QUEST_SCOPES = Object.freeze(['party', 'character']);
const TERMINAL_STATES = new Set(['completed', 'failed', 'abandoned']);

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

export function orderedQuestUpdates(quest) {
  return [...(quest.updates ?? [])].sort(
    (a, b) =>
      String(a.recordedAt).localeCompare(String(b.recordedAt)) ||
      String(a.id).localeCompare(String(b.id)),
  );
}

export function currentQuestUpdate(quest) {
  return orderedQuestUpdates(quest).at(-1);
}

export function validateQuest(quest, campaign, path = `quests/${quest?.id ?? 'unknown'}.json`) {
  if (quest?.schemaVersion !== 1) fail(`${path}.schemaVersion`, 'must be 1.');
  if (!IDS.test(quest?.id ?? ''))
    fail(`${path}.id`, 'must use lowercase letters, numbers and hyphens.');
  if (!QUEST_SCOPES.includes(quest.scope))
    fail(`${path}.scope`, `must be ${QUEST_SCOPES.join(' or ')}.`);
  if (!QUEST_AUDIENCES.includes(quest.audience))
    fail(`${path}.audience`, `must be ${QUEST_AUDIENCES.join(', ')}.`);
  const owners = quest.ownerCharacterIds ?? [];
  if (quest.scope === 'party' && owners.length)
    fail(`${path}.ownerCharacterIds`, 'must be empty for party quests.');
  if (quest.scope === 'character' && !owners.length)
    fail(`${path}.ownerCharacterIds`, 'needs at least one owner.');
  const characterIds = new Set((campaign?.characters ?? []).map((item) => item.id));
  owners.forEach((id, index) => {
    if (!characterIds.has(id))
      fail(`${path}.ownerCharacterIds[${index}]`, `unknown character "${id}".`);
  });
  if (!quest.title || !quest.summary) fail(path, 'title and summary locale maps are required.');
  const defaultLocale =
    campaign?.manifestEntry?.localeRegistry?.defaultLocale ??
    campaign?.manifestEntry?.defaultLanguage;
  if (defaultLocale && !String(quest.title[defaultLocale] ?? '').trim())
    fail(`${path}.title.${defaultLocale}`, 'is required in the campaign default locale.');
  if (defaultLocale && !String(quest.summary[defaultLocale] ?? '').trim())
    fail(`${path}.summary.${defaultLocale}`, 'is required in the campaign default locale.');
  if (!Array.isArray(quest.updates) || !quest.updates.length)
    fail(`${path}.updates`, 'needs at least one evolution update.');
  const updateIds = new Set();
  const sessionIds = new Set((campaign?.sessions ?? []).map((item) => item.id));
  const npcIds = new Set((campaign?.npcs ?? []).map((item) => item.id));
  const locationIds = new Set((campaign?.maps ?? []).map((item) => item.id));
  const referenceSets = {
    session: sessionIds,
    character: characterIds,
    npc: npcIds,
    location: locationIds,
  };
  const validateReferences = (references, base) => {
    for (const [refIndex, reference] of (references ?? []).entries()) {
      const known = referenceSets[reference.kind];
      if (!known) fail(`${base}[${refIndex}].kind`, 'unsupported reference kind.');
      if (!known.has(reference.id))
        fail(`${base}[${refIndex}].id`, `unknown ${reference.kind} "${reference.id}".`);
    }
  };
  validateReferences(quest.related, `${path}.related`);
  let previous = '';
  let previousState;
  for (const [index, update] of quest.updates.entries()) {
    const base = `${path}.updates[${index}]`;
    if (!IDS.test(update?.id ?? '')) fail(`${base}.id`, 'must be a stable lowercase ID.');
    if (updateIds.has(update.id)) fail(`${base}.id`, `duplicates update "${update.id}".`);
    updateIds.add(update.id);
    if (!QUEST_STATES.includes(update.state))
      fail(`${base}.state`, `unsupported state "${update.state}".`);
    if (previousState && TERMINAL_STATES.has(previousState))
      fail(
        `${base}.state`,
        `cannot follow terminal state "${previousState}"; correct the terminal update instead.`,
      );
    if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(update.recordedAt ?? ''))
      fail(`${base}.recordedAt`, 'must be an ISO date or timestamp.');
    if (previous && update.recordedAt < previous)
      fail(`${base}.recordedAt`, 'must not precede the previous update.');
    previous = update.recordedAt;
    if (update.sessionId && !sessionIds.has(update.sessionId))
      fail(`${base}.sessionId`, `unknown session "${update.sessionId}".`);
    validateReferences(update.evidence, `${base}.evidence`);
    if (update.image) {
      const imageUrl = String(update.image.url ?? '');
      if (!imageUrl.startsWith('images/') || imageUrl.includes('..') || imageUrl.includes('\\')) {
        fail(`${base}.image.url`, 'must be a safe campaign-relative images/ path.');
      }
      if (
        !update.image.alt ||
        (defaultLocale && !String(update.image.alt[defaultLocale] ?? '').trim())
      ) {
        fail(
          `${base}.image.alt.${defaultLocale ?? 'default'}`,
          'is required for an illustrated update.',
        );
      }
    }
    previousState = update.state;
  }
  return quest;
}

export function validateQuestCollection(quests, campaign) {
  const ids = new Set();
  for (const quest of quests ?? []) {
    if (ids.has(quest.id)) fail(`quests/${quest.id}.json`, 'duplicate quest ID.');
    ids.add(quest.id);
    validateQuest(quest, campaign);
  }
  return quests;
}
