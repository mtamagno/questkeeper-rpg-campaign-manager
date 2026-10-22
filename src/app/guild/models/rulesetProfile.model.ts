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
