const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogDir = path.join(root, 'src', 'app', 'guild', 'i18n');
const catalogFiles = {
  en: path.join(catalogDir, 'ui.en.json'),
  it: path.join(catalogDir, 'ui.it.json'),
};

function fail(message) {
  console.error(`UI text catalog verification failed: ${message}`);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function flatten(value, prefix = '', output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') output.set(pathKey, child);
    else if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, pathKey, output);
    } else fail(`catalog leaf ${pathKey} must be a string`);
  }
  return output;
}

function placeholders(value) {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)]
    .map((match) => match[1])
    .sort();
}

const catalogs = Object.fromEntries(
  Object.entries(catalogFiles).map(([locale, file]) => [locale, readJson(file)]),
);
const reference = flatten(catalogs.en.texts);

for (const [locale, catalog] of Object.entries(catalogs)) {
  if (catalog.meta?.version !== 1) fail(`${locale} must declare catalog version 1`);
  if (catalog.meta?.locale !== locale) fail(`${locale} metadata locale does not match its file`);
  if (catalog.meta?.fallbackLocale !== 'en') fail(`${locale} must explicitly fall back to en`);

  const entries = flatten(catalog.texts);
  const missing = [...reference.keys()].filter((key) => !entries.has(key));
  const extra = [...entries.keys()].filter((key) => !reference.has(key));
  if (missing.length > 0) fail(`${locale} is missing keys: ${missing.join(', ')}`);
  if (extra.length > 0) fail(`${locale} has unknown keys: ${extra.join(', ')}`);

  for (const [key, referenceValue] of reference) {
    const value = entries.get(key);
    if (value === undefined) continue;
    if (placeholders(value).join('|') !== placeholders(referenceValue).join('|')) {
      fail(`${locale}.${key} does not preserve placeholders`);
    }
  }
}

const migratedSurfaces = [
  'src/app/guild/components/language-toggle/language-toggle.component.ts',
  'src/app/guild/components/sidebar/sidebar.component.html',
  'src/app/guild/components/sidebar/sidebar.component.ts',
  'src/app/guild/pages/campaign-selector/campaign-selector.component.html',
  'src/app/guild/pages/campaign-selector/campaign-selector.component.ts',
];

for (const relative of migratedSurfaces) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  if (/isItalian\(\)\s*\?|lang\(\)\s*===\s*['"]it['"]/.test(source)) {
    fail(`${relative} reintroduced embedded bilingual interface copy`);
  }
}

const service = fs.readFileSync(
  path.join(root, 'src/app/guild/services/uiText.service.ts'),
  'utf8',
);
for (const required of ['ui.en.json', 'ui.it.json', 'Missing UI text catalog key', 'interpolate']) {
  if (!service.includes(required)) fail(`UI text resolver is missing ${required}`);
}

if (process.exitCode !== 1) {
  console.log(`UI text catalogs verified (${reference.size} keys across en and it).`);
}
