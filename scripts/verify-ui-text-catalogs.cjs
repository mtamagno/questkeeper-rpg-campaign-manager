const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogDirectory = path.join(root, 'src', 'app', 'guild', 'i18n');
const catalogFile = path.join(catalogDirectory, 'ui.json');

function fail(message) {
  console.error(`UI text catalog verification failed: ${message}`);
  process.exitCode = 1;
}

function flatten(value, prefix = '', output = new Map()) {
  for (const [key, child] of Object.entries(value ?? {})) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') output.set(pathKey, child);
    else if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, pathKey, output);
    } else fail(`catalog leaf ${pathKey} must be a string`);
  }
  return output;
}

function placeholders(value) {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();
}

const registry = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
if (registry.meta?.version !== 2) fail('ui.json must declare catalog registry version 2');
if (typeof registry.meta?.defaultLocale !== 'string') fail('ui.json needs meta.defaultLocale');
if (registry.locales === null || typeof registry.locales !== 'object') {
  fail('ui.json needs a locales object');
}

const localeEntries = Object.entries(registry.locales ?? {});
const localeTags = new Set(localeEntries.map(([locale]) => locale));
if (localeEntries.length === 0) fail('ui.json must declare at least one locale');
if (!localeTags.has(registry.meta?.defaultLocale)) {
  fail(`default locale ${registry.meta?.defaultLocale} is not declared`);
}

const defaultTexts = flatten(registry.locales?.[registry.meta?.defaultLocale]?.texts);
for (const [locale, catalog] of localeEntries) {
  let canonical;
  try {
    canonical = Intl.getCanonicalLocales(locale)[0];
  } catch {
    fail(`${locale} is not a valid BCP-47 locale`);
  }
  if (canonical !== locale) fail(`${locale} must use its canonical BCP-47 spelling (${canonical})`);
  if (typeof catalog.label !== 'string' || catalog.label.trim() === '') {
    fail(`${locale} needs a native label`);
  }
  if (!['ltr', 'rtl', 'auto'].includes(catalog.direction)) {
    fail(`${locale} direction must be ltr, rtl or auto`);
  }
  if (!Array.isArray(catalog.fallbacks)) fail(`${locale} fallbacks must be an array`);
  for (const fallback of catalog.fallbacks ?? []) {
    if (!localeTags.has(fallback)) fail(`${locale} references unknown fallback ${fallback}`);
    if (fallback === locale) fail(`${locale} cannot fall back to itself`);
  }

  const entries = flatten(catalog.texts);
  const missing = [...defaultTexts.keys()].filter((key) => !entries.has(key));
  const extra = [...entries.keys()].filter((key) => !defaultTexts.has(key));
  if (missing.length > 0) fail(`${locale} is missing keys: ${missing.join(', ')}`);
  if (extra.length > 0) fail(`${locale} has unknown keys: ${extra.join(', ')}`);
  for (const [key, referenceValue] of defaultTexts) {
    const value = entries.get(key);
    if (
      value !== undefined &&
      placeholders(value).join('|') !== placeholders(referenceValue).join('|')
    ) {
      fail(`${locale}.${key} does not preserve placeholders`);
    }
  }
}

function verifyFallbackChain(locale, pathToLocale = []) {
  if (pathToLocale.includes(locale)) fail(`fallback cycle: ${[...pathToLocale, locale].join(' -> ')}`);
  for (const fallback of registry.locales?.[locale]?.fallbacks ?? []) {
    verifyFallbackChain(fallback, [...pathToLocale, locale]);
  }
}
for (const locale of localeTags) verifyFallbackChain(locale);

for (const obsolete of ['ui.en.json', 'ui.it.json']) {
  if (fs.existsSync(path.join(catalogDirectory, obsolete))) {
    fail(`${obsolete} is obsolete; all locales belong in ui.json`);
  }
}

const migratedSurfaces = [
  'src/app/guild/components/language-toggle/language-toggle.component.ts',
  'src/app/guild/components/sidebar/sidebar.component.html',
  'src/app/guild/components/sidebar/sidebar.component.ts',
  'src/app/guild/pages/campaign-selector/campaign-selector.component.html',
  'src/app/guild/pages/campaign-selector/campaign-selector.component.ts',
];
for (const productionSurface of [
  'src/app/chronicle/pages/table-rules/table-rules.component.html',
  'src/app/chronicle/pages/table-rules/table-rules.component.ts',
]) {
  if (fs.existsSync(path.join(root, productionSurface))) migratedSurfaces.push(productionSurface);
}
for (const relative of migratedSurfaces) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  if (/isItalian\(\)\s*\?|lang\(\)\s*===\s*['"]it['"]/.test(source)) {
    fail(`${relative} reintroduced embedded bilingual interface copy`);
  }
}

const service = fs.readFileSync(path.join(root, 'src/app/guild/services/uiText.service.ts'), 'utf8');
for (const required of ['UI_TEXT_CATALOG', 'Missing UI text catalog key', 'interpolate']) {
  if (!service.includes(required)) fail(`UI text resolver is missing ${required}`);
}
const catalogHelper = fs.readFileSync(path.join(catalogDirectory, 'uiCatalog.ts'), 'utf8');
for (const required of ['ui.json', 'INTERFACE_LOCALES', 'resolveInterfaceLocale']) {
  if (!catalogHelper.includes(required)) fail(`UI catalog helper is missing ${required}`);
}
const languageService = fs.readFileSync(
  path.join(root, 'src/app/guild/services/language.service.ts'),
  'utf8',
);
if (!languageService.includes('availableLanguages = INTERFACE_LOCALES')) {
  fail('LanguageService must derive its available languages from ui.json');
}
if (/\[['"]en['"],\s*['"]it['"]\]/.test(languageService)) {
  fail('LanguageService reintroduced a fixed two-language list');
}

if (process.exitCode !== 1) {
  console.log(
    `UI text registry verified (${defaultTexts.size} keys across ${localeEntries.length} data-defined locales).`,
  );
}
