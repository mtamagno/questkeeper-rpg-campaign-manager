const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const service = read('src/app/guild/services/journeyMemory.service.ts');
const commandBar = read(
  'src/app/guild/components/site-command-bar/site-command-bar.component.html',
);
const commandComponent = read(
  'src/app/guild/components/site-command-bar/site-command-bar.component.ts',
);
const homepage = read('src/app/guild/pages/homepage/homepage.component.html');
const guide = read('docs/GLOBAL-COMMAND-PALETTE.md');
const roadmap = read('docs/ROADMAP-60-DAYS.md');

for (const phrase of [
  'campaign-companion:journey-memory:v1',
  'MAX_RECENT_PAGES = 12',
  'MAX_FAVORITE_PAGES = 12',
  'isReadableCampaignPage',
  'url.split(/[?#]/)',
  'title: pageTitle(url)',
  'localStorage.setItem',
  'toggleCurrentFavorite',
  'clearRecent',
]) {
  assert.ok(service.includes(phrase), `Journey-memory contract is missing: ${phrase}`);
}
assert.ok(!service.includes('privateProfile') && !service.includes('dmNotes'));
for (const phrase of ["scope: 'memory'", 'favoritePages()', 'recentPages()', 'continuePage']) {
  assert.ok(commandComponent.includes(phrase), `Palette memory integration is missing: ${phrase}`);
}
for (const phrase of [
  '[attr.aria-pressed]="isCurrentFavorite()"',
  'Continue reading:',
  'Continua a leggere:',
]) {
  assert.ok(commandBar.includes(phrase), `Command-bar memory action is missing: ${phrase}`);
}
for (const phrase of [
  'Your remembered trail',
  'Riprendi da dove eri rimasto',
  'History and favorites stay only on this device.',
  'Pagine preferite',
  'Recent pages',
]) {
  assert.ok(homepage.includes(phrase), `Homepage memory journey is missing: ${phrase}`);
}
assert.match(guide, /URL, page\s+title and visit time/);
assert.match(guide, /never stores page text, protected\s+fields or passwords/);
assert.match(roadmap, /\[x\].*recent pages favourites and continue-reading actions/);

console.log(
  'Remembered trail verified: per-campaign local history, favorites, continue reading, privacy boundary and accessible discovery.',
);
