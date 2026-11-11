const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
let failed = false;

function source(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function requireTokens(relative, tokens) {
  const text = source(relative);
  for (const token of tokens) {
    if (!text.includes(token)) {
      console.error(`Map and gallery quality verification failed: ${relative} needs ${token}`);
      failed = true;
    }
  }
}

function rejectTokens(relative, expressions) {
  const text = source(relative);
  for (const expression of expressions) {
    if (expression.test(text)) {
      console.error(`Map and gallery quality verification failed: ${relative} matches ${expression}`);
      failed = true;
    }
  }
}

requireTokens('src/app/cartography/pages/maps-overview/maps-overview.component.ts', [
  'visibleMaps',
  'normalizeSearchValue',
  'clearFilters',
  'UiTextService',
]);
requireTokens('src/app/cartography/pages/maps-overview/maps-overview.component.html', [
  'type="search"',
  'aria-live="polite"',
  'aria-pressed',
  '<app-map-card',
]);
requireTokens('src/app/cartography/pages/map-detail/map-detail.component.ts', [
  'previousLocation',
  'nextLocation',
  'UiTextService',
]);
requireTokens('src/app/cartography/pages/map-detail/map-detail.component.html', [
  'map-detail__breadcrumbs',
  'map-detail__pager',
  '<app-image-gallery',
]);
requireTokens('src/app/guild/pages/gallery/gallery.component.html', [
  '<app-accordion',
  'sectionItemCount(section)',
  '<button',
  '<app-image-lightbox',
]);
requireTokens('src/app/guild/components/image-lightbox/image-lightbox.component.ts', [
  'trapTabKey',
  'restoreFocus',
  'loadState',
  'UiTextService',
]);
requireTokens('src/app/guild/components/image-lightbox/image-lightbox.component.html', [
  'role="dialog"',
  'aria-modal="true"',
  'aria-live="polite"',
  'retryImage()',
]);
for (const relative of [
  'src/app/cartography/pages/maps-overview/maps-overview.component.ts',
  'src/app/cartography/pages/maps-overview/maps-overview.component.html',
  'src/app/cartography/pages/map-detail/map-detail.component.ts',
  'src/app/cartography/pages/map-detail/map-detail.component.html',
  'src/app/cartography/components/map-card/map-card.component.html',
  'src/app/guild/pages/gallery/gallery.component.ts',
  'src/app/guild/pages/gallery/gallery.component.html',
  'src/app/guild/components/image-lightbox/image-lightbox.component.ts',
  'src/app/guild/components/image-lightbox/image-lightbox.component.html',
]) {
  rejectTokens(relative, [/lang\(\)\s*===\s*['"]it['"]/, /isItalian\(\)\s*\?/]);
}

const registry = JSON.parse(source('src/app/guild/i18n/ui.json'));
for (const [locale, catalog] of Object.entries(registry.locales ?? {})) {
  for (const key of ['mapsOverview', 'mapCard', 'mapDetail', 'gallery', 'imageGallery', 'lightbox']) {
    if (catalog.texts?.[key] === undefined) {
      console.error(`Map and gallery quality verification failed: ${locale} is missing ${key}`);
      failed = true;
    }
  }
}

const campaignRoot = path.join(root, 'src', 'campaigns');
const manifests = fs
  .readdirSync(campaignRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(campaignRoot, entry.name, 'data', 'maps.json'))
  .filter((file) => fs.existsSync(file));
for (const manifest of manifests) {
  const maps = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  for (const location of maps) {
    if (!location.id || !location.name || !location.description || !Array.isArray(location.images)) {
      console.error(`Map and gallery quality verification failed: invalid location in ${manifest}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`Map and gallery quality verified across ${manifests.length} campaign atlases.`);

