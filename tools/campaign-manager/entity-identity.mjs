const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ENTITY_TYPES = Object.freeze(['characters', 'npcs', 'sessions', 'maps']);

const ENTITY_LABELS = Object.freeze({
  characters: 'player character',
  npcs: 'NPC',
  sessions: 'session',
  maps: 'map',
});

function slugifyIdentity(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52);
}

export function generateEntityId(campaign, type, label) {
  if (!ENTITY_TYPES.includes(type)) throw new Error('Unsupported entity type.');
  const fallback =
    type === 'characters' ? 'character' : type === 'npcs' ? 'npc' : type.slice(0, -1);
  const base = slugifyIdentity(label) || fallback;
  const used = new Set(entityIdentityRows(campaign).map((row) => row.id));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error(`Could not generate a unique ID for this ${ENTITY_LABELS[type]}.`);
}

export function entityIdentityRows(campaign) {
  return ENTITY_TYPES.flatMap((type) =>
    (campaign?.[type] ?? []).map((entity) => ({
      type,
      label: ENTITY_LABELS[type],
      id: entity?.id,
      source: entity?.__source,
    })),
  );
}

export function auditCampaignEntityIds(campaign) {
  const rows = entityIdentityRows(campaign);
  const invalid = rows.filter((row) => typeof row.id !== 'string' || !ID_PATTERN.test(row.id));
  const grouped = new Map();
  for (const row of rows.filter((item) => typeof item.id === 'string')) {
    const owners = grouped.get(row.id) ?? [];
    owners.push(row);
    grouped.set(row.id, owners);
  }
  const duplicates = [...grouped.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([id, owners]) => ({ id, owners }));
  return { invalid, duplicates };
}

function sourceSuffix(rows) {
  const sources = rows.map((row) => row.source).filter(Boolean);
  return sources.length ? ` Files: ${sources.join(', ')}.` : '';
}

export function assertCampaignEntityIds(campaign) {
  const audit = auditCampaignEntityIds(campaign);
  if (audit.invalid.length) {
    const row = audit.invalid[0];
    throw new Error(
      `Invalid ${row.label} ID "${String(row.id)}". Use lowercase letters, numbers and hyphens only.${sourceSuffix([row])}`,
    );
  }
  if (audit.duplicates.length) {
    const conflict = audit.duplicates[0];
    const owners = conflict.owners.map((owner) => owner.label).join(' and ');
    throw new Error(
      `Entity ID "${conflict.id}" is used by ${owners}. IDs must be unique across characters, NPCs, sessions and maps.${sourceSuffix(conflict.owners)}`,
    );
  }
  return audit;
}

export function assertEntityIdAvailable(campaign, type, id, previousId) {
  if (!ENTITY_TYPES.includes(type)) throw new Error('Unsupported entity type.');
  assertCampaignEntityIds(campaign);
  const owner = entityIdentityRows(campaign).find(
    (row) => row.id === id && !(row.type === type && row.id === previousId),
  );
  if (owner) {
    throw new Error(
      `Entity ID "${id}" is already used by a ${owner.label}. Choose a different ID.`,
    );
  }
}
