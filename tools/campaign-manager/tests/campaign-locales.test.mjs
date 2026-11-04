import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findLocaleReferences,
  inspectCampaignLocales,
  localeRegistryFromLanguages,
  normalizeLocaleRegistry,
  resolveLocalizedText,
} from '../campaign-locales.mjs';

test('finds populated locale references without treating empty drafts as content', () => {
  const bundle = {
    name: { en: 'Road', fr: '' },
    characters: [{ bio: { en: 'A traveller', fr: 'Voyageuse' } }],
  };
  assert.deepEqual(findLocaleReferences(bundle, 'fr'), ['$.characters[0].bio.fr']);
  assert.deepEqual(findLocaleReferences(bundle, 'de'), []);
});

test('normalizes one, two and N campaign locales without requiring English or Italian', () => {
  assert.deepEqual(localeRegistryFromLanguages(['es'], 'es'), {
    version: 1,
    locales: [{ tag: 'es', direction: 'auto' }],
    defaultLocale: 'es',
    sourceLocale: 'es',
  });
  assert.deepEqual(
    localeRegistryFromLanguages(['pt-br', 'sr-latn', 'zh-hant'], 'pt-br', 'sr-latn'),
    {
      version: 1,
      locales: [
        { tag: 'pt-BR', direction: 'auto' },
        { tag: 'sr-Latn', direction: 'auto' },
        { tag: 'zh-Hant', direction: 'auto' },
      ],
      defaultLocale: 'pt-BR',
      sourceLocale: 'sr-Latn',
    },
  );
});

test('rejects invalid registry membership, duplicates and fallback cycles with field paths', () => {
  assert.throws(
    () => localeRegistryFromLanguages(['en', 'EN'], 'en'),
    /locales\[1\].*duplicate locale en/,
  );
  assert.throws(
    () => localeRegistryFromLanguages(['fr'], 'it'),
    /defaultLocale: it is not configured/,
  );
  assert.throws(
    () =>
      normalizeLocaleRegistry({
        version: 1,
        locales: [
          { tag: 'en', fallbacks: ['fr'] },
          { tag: 'fr', fallbacks: ['en'] },
        ],
        defaultLocale: 'en',
        sourceLocale: 'fr',
      }),
    /fallback cycle detected/,
  );
});

test('resolves exact text, explicit fallbacks and true missing values', () => {
  const registry = normalizeLocaleRegistry({
    version: 1,
    locales: [{ tag: 'fr-CA', fallbacks: ['fr'] }, { tag: 'fr' }, { tag: 'de' }],
    defaultLocale: 'de',
    sourceLocale: 'fr',
  });
  assert.deepEqual(resolveLocalizedText({ fr: 'Bonjour' }, 'fr-CA', registry), {
    requestedLocale: 'fr-CA',
    resolvedLocale: 'fr',
    value: 'Bonjour',
    isFallback: true,
    isMissing: false,
  });
  assert.equal(resolveLocalizedText({ de: 'Hallo' }, 'fr-CA', registry).resolvedLocale, 'de');
  assert.equal(resolveLocalizedText({ fr: 'Bonjour' }, 'FR', registry).isFallback, false);
  assert.equal(resolveLocalizedText({}, 'fr-CA', registry).isMissing, true);
});

test('inspects legacy data without mutation and rejects disagreeing registry copies', () => {
  const legacy = {
    manifestEntry: {
      id: 'legacy',
      languages: ['es', 'de'],
      defaultLanguage: 'es',
      name: { es: 'Viaje', de: 'Reise', 'fr-CA': 'Voyage' },
    },
    campaign: { description: { es: 'Historia', de: '' } },
  };
  const before = structuredClone(legacy);
  const inspected = inspectCampaignLocales(legacy, 'legacy');
  assert.equal(inspected.origin, 'legacy-metadata');
  assert.equal(inspected.migration.required, true);
  assert.deepEqual(inspected.migration.orphanLocaleKeys, ['fr-CA']);
  assert.deepEqual(legacy, before);

  assert.throws(
    () =>
      inspectCampaignLocales({
        manifestEntry: {
          id: 'broken',
          localeRegistry: localeRegistryFromLanguages(['en'], 'en'),
        },
        campaign: { localeRegistry: localeRegistryFromLanguages(['fr'], 'fr') },
      }),
    /campaigns\.json and data\/campaign\.json disagree/,
  );
});
