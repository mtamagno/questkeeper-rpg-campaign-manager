const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const sourceFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.(?:html|ts)$/.test(entry.name) ? [absolute] : [];
  });

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
assert.match(selector, /interfaceLanguage\.followContentLanguage/);
assert.match(selector, /interfaceLanguage\.setLanguage/);
assert.doesNotMatch(selector, /=== 'en' \? 'it' : 'en'/);

const interfaceLanguage = read('src/app/guild/services/language.service.ts');
assert.match(interfaceLanguage, /followsContentLanguage/);
assert.match(interfaceLanguage, /followContentLanguage/);
assert.match(interfaceLanguage, /base === 'en' \|\| base === 'it'/);

const campaignSelectorTs = read('src/app/guild/pages/campaign-selector/campaign-selector.component.ts');
const campaignSelectorHtml = read(
  'src/app/guild/pages/campaign-selector/campaign-selector.component.html',
);
assert.match(campaignSelectorTs, /campaignName\(campaign: CampaignManifestEntry\)/);
assert.doesNotMatch(campaignSelectorHtml, /campaign\.(?:name|description)\[lang\(\)\]/);

const tableRulesPath = path.join(
  root,
  'src/app/chronicle/pages/table-rules/table-rules.component.html',
);
if (fs.existsSync(tableRulesPath)) {
  const tableRules = fs.readFileSync(tableRulesPath, 'utf8');
  assert.match(tableRules, /\| bilingual/);
  assert.doesNotMatch(tableRules, /\[lang\(\)\]/);
  assert.doesNotMatch(tableRules, /title\.en/);
}

const directLocaleIndexing = sourceFiles(path.join(root, 'src/app')).filter((file) =>
  fs.readFileSync(file, 'utf8').includes('[lang()]'),
);
assert.deepEqual(
  directLocaleIndexing,
  [],
  `Localized maps must use the campaign resolver instead of interface-language indexing: ${directLocaleIndexing.join(', ')}`,
);

const settings = read('src/app/guild/pages/user-settings/user-settings.component.html');
assert.match(settings, /Interface language/);
assert.match(settings, /follow-content-language/);

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
