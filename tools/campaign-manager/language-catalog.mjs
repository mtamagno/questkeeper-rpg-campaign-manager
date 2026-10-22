export const CAMPAIGN_LANGUAGE_CATALOG = Object.freeze([
  ['en', 'English', 'Inglese'],
  ['it', 'Italian', 'Italiano'],
  ['es', 'Spanish', 'Spagnolo'],
  ['es-MX', 'Spanish (Mexico)', 'Spagnolo (Messico)'],
  ['fr', 'French', 'Francese'],
  ['fr-CA', 'French (Canada)', 'Francese (Canada)'],
  ['de', 'German', 'Tedesco'],
  ['pt', 'Portuguese', 'Portoghese'],
  ['pt-BR', 'Portuguese (Brazil)', 'Portoghese (Brasile)'],
  ['nl', 'Dutch', 'Olandese'],
  ['pl', 'Polish', 'Polacco'],
  ['cs', 'Czech', 'Ceco'],
  ['sk', 'Slovak', 'Slovacco'],
  ['ro', 'Romanian', 'Rumeno'],
  ['hu', 'Hungarian', 'Ungherese'],
  ['sv', 'Swedish', 'Svedese'],
  ['da', 'Danish', 'Danese'],
  ['no', 'Norwegian', 'Norvegese'],
  ['fi', 'Finnish', 'Finlandese'],
  ['el', 'Greek', 'Greco'],
  ['tr', 'Turkish', 'Turco'],
  ['uk', 'Ukrainian', 'Ucraino'],
  ['ru', 'Russian', 'Russo'],
  ['ar', 'Arabic', 'Arabo'],
  ['he', 'Hebrew', 'Ebraico'],
  ['hi', 'Hindi', 'Hindi'],
  ['ja', 'Japanese', 'Giapponese'],
  ['ko', 'Korean', 'Coreano'],
  ['zh-Hans', 'Chinese (Simplified)', 'Cinese (semplificato)'],
  ['zh-Hant', 'Chinese (Traditional)', 'Cinese (tradizionale)'],
]);

export function normalizeLanguageTag(value) {
  const source = String(value || '').trim();
  if (!source || source.length > 64) throw new Error('Enter a valid BCP-47 language tag.');
  try {
    const [canonical] = Intl.getCanonicalLocales(source);
    if (!canonical) throw new Error();
    return canonical;
  } catch {
    throw new Error('Enter a valid BCP-47 language tag.');
  }
}

export function normalizeCampaignLanguages(values) {
  const normalized = (values ?? ['en']).map(normalizeLanguageTag);
  const unique = [...new Set(normalized)];
  if (!unique.length) throw new Error('Choose at least one campaign language.');
  return unique;
}

export function publicLanguageCatalog() {
  return CAMPAIGN_LANGUAGE_CATALOG.map(([code, en, it]) => ({ code, names: { en, it } }));
}
