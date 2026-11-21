const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const catalogDirectory = path.join(root, 'src', 'app', 'guild', 'i18n');
const catalogFile = path.join(catalogDirectory, 'ui.json');
const deploymentOverridesFile = path.join(catalogDirectory, 'ui-overrides.json');

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

function verifyPartialOverrides(owner, locales) {
  if (locales === null || typeof locales !== 'object' || Array.isArray(locales)) {
    fail(`${owner} overrides must be an object keyed by interface locale`);
    return;
  }
  for (const [locale, tree] of Object.entries(locales)) {
    if (!localeTags.has(locale)) {
      fail(`${owner} overrides reference unsupported interface locale ${locale}`);
      continue;
    }
    const reference = flatten(registry.locales[locale].texts);
    for (const [key, value] of flatten(tree)) {
      const referenceValue = reference.get(key);
      if (referenceValue === undefined) {
        fail(`${owner}.${locale} overrides unknown key ${key}`);
      } else if (placeholders(value).join('|') !== placeholders(referenceValue).join('|')) {
        fail(`${owner}.${locale}.${key} does not preserve placeholders`);
      }
    }
  }
}

const deploymentOverrides = JSON.parse(fs.readFileSync(deploymentOverridesFile, 'utf8'));
if (deploymentOverrides.meta?.version !== 1) {
  fail('ui-overrides.json must declare override registry version 1');
}
verifyPartialOverrides('deployment', deploymentOverrides.locales);

const campaignManifest = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'campaigns', 'campaigns.json'), 'utf8'),
);
for (const campaign of campaignManifest) {
  if (campaign.interfaceTextOverrides !== undefined) {
    verifyPartialOverrides(`campaign:${campaign.id}`, campaign.interfaceTextOverrides);
  }
}

for (const obsolete of ['ui.en.json', 'ui.it.json']) {
  if (fs.existsSync(path.join(catalogDirectory, obsolete))) {
    fail(`${obsolete} is obsolete; all locales belong in ui.json`);
  }
}

const migratedSurfaces = [
  'src/app/app.html',
  'src/app/app.ts',
  'src/app/guild/components/language-toggle/language-toggle.component.ts',
  'src/app/guild/components/sidebar/sidebar.component.html',
  'src/app/guild/components/sidebar/sidebar.component.ts',
  'src/app/guild/pages/campaign-selector/campaign-selector.component.html',
  'src/app/guild/pages/campaign-selector/campaign-selector.component.ts',
  'src/app/bestiary/pages/npc-list/npc-list.component.html',
  'src/app/bestiary/pages/npc-list/npc-list.component.ts',
  'src/app/bestiary/pages/npc-detail/npc-detail.component.html',
  'src/app/bestiary/pages/npc-detail/npc-detail.component.ts',
  'src/app/chronicle/pages/campaign-overview/campaign-overview.component.html',
  'src/app/chronicle/pages/campaign-overview/campaign-overview.component.ts',
  'src/app/chronicle/pages/story-so-far/story-so-far.component.html',
  'src/app/chronicle/pages/story-so-far/story-so-far.component.ts',
  'src/app/chronicle/pages/story-chapter/story-chapter.component.html',
  'src/app/chronicle/pages/story-chapter/story-chapter.component.ts',
  'src/app/chronicle/pages/table-moments/table-moments.component.html',
  'src/app/chronicle/pages/table-moments/table-moments.component.ts',
  'src/app/chronicle/components/session-summary/session-summary.component.html',
  'src/app/chronicle/components/session-summary/session-summary.component.ts',
  'src/app/chronicle/components/game-night-brief/game-night-brief.component.html',
  'src/app/chronicle/components/game-night-brief/game-night-brief.component.ts',
  'src/app/adventurers/pages/party-relationships/party-relationships.component.html',
  'src/app/adventurers/pages/party-relationships/party-relationships.component.ts',
  'src/app/bestiary/pages/npc-relationships/npc-relationships.component.html',
  'src/app/bestiary/pages/npc-relationships/npc-relationships.component.ts',
  'src/app/guild/components/relationship-graph/relationship-graph.component.html',
  'src/app/guild/components/relationship-graph/relationship-graph.component.ts',
  'src/app/guild/pages/relationship-detail/relationship-detail.component.html',
  'src/app/guild/pages/relationship-detail/relationship-detail.component.ts',
  'src/app/cartography/pages/maps-overview/maps-overview.component.html',
  'src/app/cartography/pages/maps-overview/maps-overview.component.ts',
  'src/app/cartography/pages/map-detail/map-detail.component.html',
  'src/app/cartography/pages/map-detail/map-detail.component.ts',
  'src/app/cartography/components/map-card/map-card.component.html',
  'src/app/cartography/components/map-card/map-card.component.ts',
  'src/app/guild/pages/gallery/gallery.component.html',
  'src/app/guild/pages/gallery/gallery.component.ts',
  'src/app/guild/components/image-gallery/image-gallery.component.html',
  'src/app/guild/components/image-gallery/image-gallery.component.ts',
  'src/app/guild/components/image-lightbox/image-lightbox.component.html',
  'src/app/guild/components/image-lightbox/image-lightbox.component.ts',
  'src/app/adventurers/pages/party-list/party-list.component.html',
  'src/app/adventurers/pages/party-list/party-list.component.ts',
  'src/app/adventurers/pages/character-detail/character-detail.component.html',
  'src/app/adventurers/pages/character-detail/character-detail.component.ts',
  'src/app/adventurers/components/character-profile-overview/character-profile-overview.component.html',
  'src/app/adventurers/components/character-profile-overview/character-profile-overview.component.ts',
  'src/app/adventurers/components/character-story-overview/character-story-overview.component.html',
  'src/app/adventurers/components/character-story-overview/character-story-overview.component.ts',
  'src/app/adventurers/components/character-lore-chapters/character-lore-chapters.component.html',
  'src/app/adventurers/components/character-lore-chapters/character-lore-chapters.component.ts',
  'src/app/adventurers/components/character-bonds-carousel/character-bonds-carousel.component.html',
  'src/app/adventurers/components/character-bonds-carousel/character-bonds-carousel.component.ts',
  'src/app/adventurers/components/character-quotes/character-quotes.component.html',
  'src/app/adventurers/components/character-quotes/character-quotes.component.ts',
  'src/app/adventurers/components/private-profile/private-profile.component.html',
  'src/app/adventurers/components/private-profile/private-profile.component.ts',
  'src/app/adventurers/components/character-notebook/character-notebook.component.html',
  'src/app/adventurers/components/character-notebook/character-notebook.component.ts',
  'src/app/adventurers/components/character-sheet/character-sheet.component.html',
  'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.html',
  'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.ts',
  'src/app/adventurers/components/character-sheet-history/character-sheet-history.component.html',
  'src/app/adventurers/components/character-sheet-history/character-sheet-history.component.ts',
  'src/app/adventurers/components/character-rule-library/character-rule-library.component.html',
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
  if (
    relative.endsWith('.html') &&
    /(?:^|\s)(?:aria-label|placeholder|title)="(?!\s*\{\{)[^"]*[A-Za-zÀ-ÿ][^"]*"/m.test(
      source,
    )
  ) {
    fail(`${relative} contains a literal user-facing attribute outside ui.json`);
  }
}

const dataOwnedLanguageBranches = new Map([
  [
    'src/app/adventurers/components/character-sheet/character-sheet.component.ts',
    { expected: 1, reason: 'the PDF renderer label schema currently ships authored en/it fields' },
  ],
  [
    'src/app/adventurers/components/character-rule-library/character-rule-library.component.ts',
    { expected: 2, reason: 'local compendium rule fields and D&D abbreviations are game data' },
  ],
]);
for (const [relative, exception] of dataOwnedLanguageBranches) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const branches = source.match(/isItalian\(\)\s*\?|const italian = this\.isItalian\(\)/g) ?? [];
  const markers = source.match(/UI-TEXT-DATA-OWNED/g) ?? [];
  if (branches.length !== exception.expected || markers.length !== exception.expected) {
    fail(
      `${relative} data-owned language exception drifted (expected ${exception.expected}: ${exception.reason})`,
    );
  }
}

const trackedTemplates = execFileSync('git', ['ls-files', 'src/app/**/*.html'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);
const reviewedLiteralText = new Map([
  ['A4', 'international paper format'],
  ['C', 'compact concentration notation'],
  ['R', 'compact ritual notation'],
  ['Ctrl K', 'keyboard token'],
  ['Esc', 'keyboard token'],
  ['City and Wild', 'proper module name'],
  ['🌲 City and Wild', 'proper module name'],
  ['u/AeronDrake', 'credited creator name'],
  ['u/Gambatte', 'credited creator name'],
  ['The Homebrewery', 'credited tool name'],
]);
const reviewedLiteralAttributes = [
  {
    relative: 'src/app/guild/pages/user-settings/user-settings.component.html',
    pattern: /^placeholder="https:\/\/[^\"]*"$/,
    reason: 'URL syntax example rather than translatable interface prose',
  },
];
for (const relative of trackedTemplates) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  for (const match of source.matchAll(
    /(?:^|\s)(?:aria-label|placeholder|title)="(?!\s*\{\{)[^"]*\p{L}[^"]*"/gmu,
  )) {
    const literal = match[0].trim();
    const reviewed = reviewedLiteralAttributes.some(
      (exception) => exception.relative === relative && exception.pattern.test(literal),
    );
    if (!reviewed) {
      fail(`${relative} contains unowned user-facing attribute copy: ${literal}`);
    }
  }
  for (const match of source.matchAll(/>([^<>{}@]+)</g)) {
    const literal = match[1].trim();
    const openingStart = source.lastIndexOf('<', match.index);
    const openingTag = source.slice(openingStart, match.index + 1);
    if (
      literal.length === 0 ||
      !/\p{L}/u.test(literal) ||
      /^(?:&[A-Za-z0-9#]+;|\s)+$/.test(literal) ||
      /\baria-hidden="true"/.test(openingTag) ||
      reviewedLiteralText.has(literal)
    ) {
      continue;
    }
    fail(`${relative} contains unowned visible copy: ${literal}`);
  }
}

const service = fs.readFileSync(path.join(root, 'src/app/guild/services/uiText.service.ts'), 'utf8');
for (const required of [
  'UI_TEXT_CATALOG',
  'Missing UI text catalog key',
  'interpolate',
  'localized',
]) {
  if (!service.includes(required)) fail(`UI text resolver is missing ${required}`);
}
const catalogHelper = fs.readFileSync(path.join(catalogDirectory, 'uiCatalog.ts'), 'utf8');
for (const required of [
  'ui.json',
  'ui-overrides.json',
  'INTERFACE_LOCALES',
  'resolveInterfaceLocale',
  'UI_TEXT_DEPLOYMENT_OVERRIDES',
]) {
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
