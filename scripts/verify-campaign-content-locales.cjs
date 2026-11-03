const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const service = read('src/app/guild/services/campaignLocale.service.ts');
for (const contract of [
  'questkeeper:campaign-content-locale:v1:',
  'localeRegistry',
  'defaultLocale',
  'sourceLocale',
  "searchParams.get('lang')",
  'resolveLocalizedText',
  "setAttribute('dir'",
]) {
  assert.ok(service.includes(contract), `Campaign locale service is missing ${contract}`);
}
assert.doesNotMatch(service, /\?\s*'it'\s*:\s*'en'/);

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

console.log(
  'Campaign content locales verified: per-campaign preference, registry fallback, dynamic selector, PDF and offline v2.',
);
