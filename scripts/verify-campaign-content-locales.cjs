const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const service = read('src/app/guild/services/campaignLocale.service.ts');
for (const contract of [
  'questkeeper:campaign-content-locale:v1:',
  'defaultLocale',
  "searchParams.get('lang')",
  'resolveLocalizedText',
  "setAttribute('dir'",
]) {
  assert.ok(service.includes(contract), `Campaign locale service is missing ${contract}`);
}
assert.doesNotMatch(service, /\?\s*'it'\s*:\s*'en'/);
assert.match(service, /campaignLocaleRegistryFromManifest/);

const languageModel = read('src/app/guild/models/language.model.ts');
assert.match(languageModel, /campaignLocaleRegistryFromManifest/);
assert.match(languageModel, /entry\?\.localeRegistry/);
assert.match(languageModel, /entry\?\.name, entry\?\.description, entry\?\.status/);
assert.match(languageModel, /sourceLocale/);

const pipe = read('src/app/guild/components/bilingual-text/bilingual-text.pipe.ts');
assert.match(pipe, /CampaignLocaleService/);
assert.match(pipe, /campaignLocale\.resolve/);

const selector = read('src/app/guild/components/language-toggle/language-toggle.component.ts');
assert.match(selector, /campaignLocale\.locales/);
assert.match(selector, /campaignLocale\.setLocale/);
assert.doesNotMatch(selector, /=== 'en' \? 'it' : 'en'/);

const settings = read('src/app/guild/pages/user-settings/user-settings.component.html');
assert.match(settings, /Interface language/);
assert.match(settings, /Campaign content language is selected inside each campaign/);

const pdf = read('src/app/adventurers/services/campaignCharacterSheetPdf.service.ts');
assert.match(pdf, /CampaignPdfLanguage = string/);
assert.match(pdf, /localeRegistry/);
assert.match(pdf, /localizeText\(text, language, registry\)/);

const offline = read('src/app/guild/services/offlinePack.service.ts');
assert.match(offline, /offline-packs:v2/);
assert.match(offline, /contentLocale/);
assert.match(offline, /localeRegistry/);

async function verifyLegacyManifestFallback() {
  const model = await import(
    pathToFileURL(path.join(root, 'src/app/guild/models/language.model.ts')).href
  );
  const inferred = model.campaignLocaleRegistryFromManifest({
    name: { en: 'Legacy campaign', it: 'Campagna legacy' },
    description: { en: 'English', it: 'Italiano' },
  });
  assert.deepEqual(
    inferred.locales.map(({ tag }) => tag),
    ['en', 'it'],
  );
  assert.equal(inferred.defaultLocale, 'en');

  const declared = model.campaignLocaleRegistryFromManifest({
    languages: ['de'],
    defaultLanguage: 'de',
    name: { en: 'Ignored inference', it: 'Inferenza ignorata' },
  });
  assert.deepEqual(
    declared.locales.map(({ tag }) => tag),
    ['de'],
  );
  assert.equal(declared.defaultLocale, 'de');

  const explicitRegistry = {
    version: 1,
    locales: [{ tag: 'fr', direction: 'ltr' }],
    defaultLocale: 'fr',
    sourceLocale: 'fr',
  };
  assert.equal(
    model.campaignLocaleRegistryFromManifest({
      localeRegistry: explicitRegistry,
      name: { en: 'Ignored' },
    }),
    explicitRegistry,
  );
}

verifyLegacyManifestFallback()
  .then(() =>
    console.log(
      'Campaign content locales verified: legacy discovery, per-campaign preference, registry fallback, dynamic selector, PDF and offline v2.',
    ),
  )
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
