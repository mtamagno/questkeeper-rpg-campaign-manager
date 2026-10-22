const OPEN_SRD_52 = Object.freeze({
  source: 'SRD 5.2.1',
  license: 'CC-BY-4.0',
  url: 'https://www.dndbeyond.com/srd',
});

const field = (key, storageKey, en, it, options = []) => ({
  key,
  storageKey,
  labels: { en, it },
  options,
});

export const RULESET_PROFILES = Object.freeze([
  {
    id: 'dnd-2014',
    names: { en: '5E fantasy (2014)', it: 'Fantasy 5E (2014)' },
    characterTerms: { en: 'Character', it: 'Personaggio' },
    fields: [
      field('ancestry', 'race', 'Race', 'Razza'),
      field('class', 'classType', 'Class', 'Classe'),
      field('specialization', 'subclass', 'Subclass', 'Sottoclasse'),
      field('background', 'background', 'Background', 'Background'),
    ],
  },
  {
    id: 'dnd-2024',
    names: { en: '5E fantasy (2024)', it: 'Fantasy 5E (2024)' },
    characterTerms: { en: 'Character', it: 'Personaggio' },
    fields: [
      field('ancestry', 'race', 'Species', 'Specie', [
        { value: 'Dwarf', provenance: OPEN_SRD_52 },
        { value: 'Elf', provenance: OPEN_SRD_52 },
        { value: 'Gnome', provenance: OPEN_SRD_52 },
        { value: 'Goliath', provenance: OPEN_SRD_52 },
        { value: 'Halfling', provenance: OPEN_SRD_52 },
        { value: 'Human', provenance: OPEN_SRD_52 },
        { value: 'Orc', provenance: OPEN_SRD_52 },
        { value: 'Tiefling', provenance: OPEN_SRD_52 },
      ]),
      field(
        'class',
        'classType',
        'Class',
        'Classe',
        [
          'Barbarian',
          'Bard',
          'Cleric',
          'Druid',
          'Fighter',
          'Monk',
          'Paladin',
          'Ranger',
          'Rogue',
          'Sorcerer',
          'Warlock',
          'Wizard',
        ].map((value) => ({ value, provenance: OPEN_SRD_52 })),
      ),
      field('specialization', 'subclass', 'Subclass', 'Sottoclasse'),
      field('background', 'background', 'Background', 'Background'),
    ],
  },
  {
    id: 'pf2e-remaster',
    names: { en: 'Pathfinder 2e Remaster', it: 'Pathfinder 2e Remaster' },
    characterTerms: { en: 'Adventurer', it: 'Avventuriero' },
    fields: [
      field('ancestry', 'race', 'Ancestry', 'Ascendenza'),
      field('specialization', 'subclass', 'Heritage / archetype', 'Retaggio / archetipo'),
      field('class', 'classType', 'Class', 'Classe'),
      field('background', 'background', 'Background', 'Background'),
    ],
  },
  {
    id: 'coc7e',
    names: { en: 'Cosmic horror investigators (7e)', it: 'Investigatori horror cosmico (7a)' },
    characterTerms: { en: 'Investigator', it: 'Investigatore' },
    fields: [field('class', 'classType', 'Occupation', 'Occupazione')],
  },
  {
    id: 'generic',
    names: { en: 'Generic / custom RPG', it: 'GDR generico / personalizzato' },
    characterTerms: { en: 'Character', it: 'Personaggio' },
    fields: [
      field('ancestry', 'race', 'Origin / ancestry', 'Origine / ascendenza'),
      field('class', 'classType', 'Role / archetype', 'Ruolo / archetipo'),
      field('specialization', 'subclass', 'Specialization', 'Specializzazione'),
      field('background', 'background', 'Background', 'Background'),
    ],
  },
]);

export function resolveRulesetProfile(id) {
  return RULESET_PROFILES.find((profile) => profile.id === id) ?? RULESET_PROFILES.at(-1);
}

export function inferRulesetId(edition = '') {
  const value = String(edition).toLowerCase();
  if (value.includes('2024') || value.includes('5.5')) return 'dnd-2024';
  if (value.includes('d&d') || value.includes('5e')) return 'dnd-2014';
  if (value.includes('pathfinder')) return 'pf2e-remaster';
  if (value.includes('cthulhu')) return 'coc7e';
  return 'generic';
}

export function normalizeGameSystem(value, edition = '') {
  const id = value?.id || inferRulesetId(edition);
  const profile = resolveRulesetProfile(id);
  return {
    id: profile.id,
    edition: String(value?.edition ?? edition ?? ''),
    customLabels:
      profile.id === 'generic' && value?.customLabels && typeof value.customLabels === 'object'
        ? value.customLabels
        : {},
  };
}

export function publicRulesetProfiles() {
  return RULESET_PROFILES.map((profile) => structuredClone(profile));
}
