const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const routes = read('src/app/app.routes.ts');
const sidebar = read('src/app/guild/components/sidebar/sidebar.component.html');
const component = read('src/app/guild/pages/memory-gallery/memory-gallery.component.ts');
const template = read('src/app/guild/pages/memory-gallery/memory-gallery.component.html');
const data = read('src/app/guild/services/data.service.ts');
const journey = read('src/app/guild/services/journeyMemory.service.ts');
const detail = read('src/app/guild/pages/shared-memory-detail/shared-memory-detail.component.html');
const catalog = JSON.parse(read('src/app/guild/i18n/ui.json'));

assert.match(routes, /path: 'memories',[\s\S]*MemoryGalleryComponent/);
assert.match(routes, /path: 'memories\/:memoryId'/);
assert.ok(sidebar.includes("['/', cId, 'memories']"));
assert.ok(sidebar.includes("uiText.text('sidebar.memoryGallery')"));
assert.ok(data.includes('readonly sharedMemories'));
assert.ok(component.includes('this.data.sharedMemories()'));
assert.ok(component.includes("selectedParticipant = signal('all')"));
assert.ok(component.includes("selectedSession = signal('all')"));
assert.ok(component.includes('favouritesOnly = signal(false)'));
assert.ok(component.includes('this.journeyMemory.toggleFavorite'));
assert.ok(journey.includes('isFavoriteUrl(url: string)'));
assert.ok(journey.includes('toggleFavorite(page: JourneyPage)'));
assert.ok(template.includes('<select'));
assert.ok(template.includes('[attr.aria-pressed]="favouritesOnly()"'));
assert.ok(template.includes('aria-live="polite"'));
assert.ok(template.includes('resetFilters()'));
assert.ok(detail.includes('(click)="toggleFavourite()"'));
assert.ok(detail.includes("['/', campaignId() ?? '', 'memories']"));

for (const locale of Object.values(catalog.locales)) {
  assert.equal(typeof locale.texts.sidebar.memoryGallery, 'string');
  for (const key of [
    'title',
    'filters',
    'person',
    'session',
    'favourites',
    'reset',
    'resultCount',
    'addFavourite',
    'removeFavourite',
    'emptyTitle',
  ]) {
    assert.equal(typeof locale.texts.memoryGallery[key], 'string', `Missing memoryGallery.${key}`);
  }
}

console.log(
  'Campaign memory gallery verified: canonical memories, local favourites, accessible filters and detail navigation.',
);
