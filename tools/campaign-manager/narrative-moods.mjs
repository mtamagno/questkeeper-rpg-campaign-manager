export const NARRATIVE_MOODS = Object.freeze(['default', 'light', 'dark']);
export const NARRATIVE_MOOD_BLOCKS = Object.freeze(['summary', 'storySoFar', 'prose']);

const MOOD_SET = new Set(NARRATIVE_MOODS);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeNarrativeMood(value, label = 'Narrative mood') {
  const mood = value ?? 'default';
  if (!MOOD_SET.has(mood)) {
    throw new Error(`${label} must be default, light or dark.`);
  }
  return mood;
}

export function normalizeCampaignNarrativeMood(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Campaign narrative mood must be an object.');
  }
  const seen = new Set();
  const phases = (value.phases ?? []).map((phase, index) => {
    if (!phase || typeof phase !== 'object' || Array.isArray(phase)) {
      throw new Error(`Narrative phase ${index + 1} must be an object.`);
    }
    const id = String(phase.id ?? '').trim();
    const startsAtSessionId = String(phase.startsAtSessionId ?? '').trim();
    if (!ID_PATTERN.test(id)) {
      throw new Error(
        `Narrative phase ${index + 1} ID must use lowercase letters, numbers and hyphens.`,
      );
    }
    if (seen.has(id)) throw new Error(`Narrative phase ID "${id}" is duplicated.`);
    seen.add(id);
    if (!ID_PATTERN.test(startsAtSessionId)) {
      throw new Error(
        `Narrative phase "${id}" must reference a published session ID using lowercase letters, numbers and hyphens.`,
      );
    }
    const label = String(phase.label ?? '').trim();
    return {
      id,
      ...(label ? { label } : {}),
      startsAtSessionId,
      mood: normalizeNarrativeMood(phase.mood, `Narrative phase "${id}" mood`),
    };
  });
  return {
    default: normalizeNarrativeMood(value.default, 'Campaign narrative mood'),
    ...(phases.length ? { phases } : {}),
  };
}

export function normalizeSessionNarrativeMood(entity) {
  const next = { ...entity };
  if (entity.mood !== undefined) {
    const mood = normalizeNarrativeMood(entity.mood, 'Session narrative mood');
    if (mood === 'default') delete next.mood;
    else next.mood = mood;
  }
  if (entity.blockMoods !== undefined) {
    if (
      !entity.blockMoods ||
      typeof entity.blockMoods !== 'object' ||
      Array.isArray(entity.blockMoods)
    ) {
      throw new Error('Session block moods must be an object.');
    }
    const blockMoods = Object.fromEntries(
      NARRATIVE_MOOD_BLOCKS.map((block) => [
        block,
        normalizeNarrativeMood(entity.blockMoods[block], `Session ${block} mood`),
      ]).filter(([, mood]) => mood !== 'default'),
    );
    if (Object.keys(blockMoods).length) next.blockMoods = blockMoods;
    else delete next.blockMoods;
  }
  return next;
}

export function resolveNarrativeMood(campaign, sessions, session, block) {
  let resolved = campaign?.narrativeMood?.default ?? 'default';
  if (!session) return resolved;
  const ordered = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const targetIndex = ordered.findIndex(({ id }) => id === session.id);
  if (targetIndex >= 0) {
    for (const phase of campaign?.narrativeMood?.phases ?? []) {
      const milestoneIndex = ordered.findIndex(({ id }) => id === phase.startsAtSessionId);
      if (milestoneIndex >= 0 && milestoneIndex <= targetIndex && phase.mood !== 'default') {
        resolved = phase.mood;
      }
    }
  }
  if (session.mood && session.mood !== 'default') resolved = session.mood;
  if (block && session.blockMoods?.[block] && session.blockMoods[block] !== 'default') {
    resolved = session.blockMoods[block];
  }
  return resolved;
}
