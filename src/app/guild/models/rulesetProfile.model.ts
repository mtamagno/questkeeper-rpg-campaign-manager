export type RulesetIdentityKey = 'ancestry' | 'class' | 'specialization' | 'background';

export interface CampaignGameSystem {
  readonly id: string;
  readonly edition?: string;
  readonly customLabels?: Partial<Record<RulesetIdentityKey, string>>;
}

export interface RulesetIdentityField {
  readonly key: RulesetIdentityKey;
  readonly storageKey: 'race' | 'classType' | 'subclass' | 'background';
  readonly labels: { readonly en: string; readonly it: string };
}

export interface RulesetProfile {
  readonly id: string;
  readonly characterTerms: { readonly en: string; readonly it: string };
  readonly fields: ReadonlyArray<RulesetIdentityField>;
}

export interface RulesetDisplayIdentity {
  readonly system: string;
  readonly edition?: string;
  readonly label: string;
}

const displayIdentities: Readonly<
  Record<
    string,
    { readonly system: string; readonly edition: { readonly en: string; readonly it: string } }
  >
> = {
  'dnd-2014': {
    system: 'Dungeons & Dragons',
    edition: { en: '5th Edition (2014)', it: '5a Edizione (2014)' },
  },
  'dnd-2024': {
    system: 'Dungeons & Dragons',
    edition: { en: '5th Edition (2024)', it: '5a Edizione (2024)' },
  },
  'pf2e-remaster': {
    system: 'Pathfinder',
    edition: { en: 'Second Edition Remaster', it: 'Seconda Edizione Remaster' },
  },
  coc7e: {
    system: 'Call of Cthulhu',
    edition: { en: '7th Edition', it: '7a Edizione' },
  },
};

export function inferRulesetId(edition = ''): string {
  const value = edition.toLocaleLowerCase();
  if (value.includes('2024') || value.includes('5.5')) return 'dnd-2024';
  if (value.includes('d&d') || value.includes('dungeons & dragons') || value.includes('5e')) {
    return 'dnd-2014';
  }
  if (value.includes('pathfinder')) return 'pf2e-remaster';
  if (value.includes('cthulhu')) return 'coc7e';
  return 'generic';
}

/** Resolves a public name without leaking internal IDs or guessing D&D for unknown legacy data. */
export function rulesetDisplayIdentity(
  system?: CampaignGameSystem,
  legacyEdition = '',
  language = 'en',
): RulesetDisplayIdentity {
  const locale = language === 'it' ? 'it' : 'en';
  const authoredLabel = String(system?.edition ?? legacyEdition).trim();
  const requestedId = system?.id || inferRulesetId(legacyEdition);
  const known = displayIdentities[requestedId];
  if (known !== undefined) {
    const edition = known.edition[locale];
    return { system: known.system, edition, label: `${known.system} · ${edition}` };
  }
  const generic = authoredLabel || (locale === 'it' ? 'GDR personalizzato' : 'Custom RPG');
  return { system: generic, label: generic };
}

const genericFields: ReadonlyArray<RulesetIdentityField> = [
  {
    key: 'ancestry',
    storageKey: 'race',
    labels: { en: 'Origin / ancestry', it: 'Origine / ascendenza' },
  },
  {
    key: 'class',
    storageKey: 'classType',
    labels: { en: 'Role / archetype', it: 'Ruolo / archetipo' },
  },
  {
    key: 'specialization',
    storageKey: 'subclass',
    labels: { en: 'Specialization', it: 'Specializzazione' },
  },
  { key: 'background', storageKey: 'background', labels: { en: 'Background', it: 'Background' } },
];

const profiles: ReadonlyArray<RulesetProfile> = [
  {
    id: 'dnd-2014',
    characterTerms: { en: 'Character', it: 'Personaggio' },
    fields: [
      { key: 'ancestry', storageKey: 'race', labels: { en: 'Race', it: 'Razza' } },
      { key: 'class', storageKey: 'classType', labels: { en: 'Class', it: 'Classe' } },
      {
        key: 'specialization',
        storageKey: 'subclass',
        labels: { en: 'Subclass', it: 'Sottoclasse' },
      },
      genericFields[3],
    ],
  },
  {
    id: 'dnd-2024',
    characterTerms: { en: 'Character', it: 'Personaggio' },
    fields: [
      { key: 'ancestry', storageKey: 'race', labels: { en: 'Species', it: 'Specie' } },
      { key: 'class', storageKey: 'classType', labels: { en: 'Class', it: 'Classe' } },
      {
        key: 'specialization',
        storageKey: 'subclass',
        labels: { en: 'Subclass', it: 'Sottoclasse' },
      },
      genericFields[3],
    ],
  },
  {
    id: 'pf2e-remaster',
    characterTerms: { en: 'Adventurer', it: 'Avventuriero' },
    fields: [
      { key: 'ancestry', storageKey: 'race', labels: { en: 'Ancestry', it: 'Ascendenza' } },
      {
        key: 'specialization',
        storageKey: 'subclass',
        labels: { en: 'Heritage / archetype', it: 'Retaggio / archetipo' },
      },
      { key: 'class', storageKey: 'classType', labels: { en: 'Class', it: 'Classe' } },
      genericFields[3],
    ],
  },
  {
    id: 'coc7e',
    characterTerms: { en: 'Investigator', it: 'Investigatore' },
    fields: [
      { key: 'class', storageKey: 'classType', labels: { en: 'Occupation', it: 'Occupazione' } },
    ],
  },
  { id: 'generic', characterTerms: { en: 'Character', it: 'Personaggio' }, fields: genericFields },
];

export function resolveRulesetProfile(system?: CampaignGameSystem): RulesetProfile {
  const base = profiles.find((profile) => profile.id === system?.id) ?? profiles.at(-1)!;
  if (base.id !== 'generic' || system?.customLabels === undefined) return base;
  return {
    ...base,
    fields: base.fields
      .map((field) => {
        const label = system.customLabels?.[field.key];
        return label === undefined ? field : { ...field, labels: { en: label, it: label } };
      })
      .filter((field) => field.labels.en.length > 0),
  };
}
