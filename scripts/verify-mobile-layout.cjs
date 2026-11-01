const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const appTemplate = read('src/app/app.html');
const appStyles = read('src/app/app.scss');
const commandTemplate = read(
  'src/app/guild/components/site-command-bar/site-command-bar.component.html',
);
const commandStyles = read(
  'src/app/guild/components/site-command-bar/site-command-bar.component.scss',
);
const sidebarStyles = read('src/app/guild/components/sidebar/sidebar.component.scss');
const homepageStyles = read('src/app/guild/pages/homepage/homepage.component.scss');
const characterStyles = read(
  'src/app/adventurers/pages/character-detail/character-detail.component.scss',
);
const accordionStyles = read('src/app/guild/components/accordion/accordion.component.scss');

assert.match(appTemplate, /app-layout--nav-open/);
assert.match(appStyles, /height:\s*100dvh/);
assert.match(appStyles, /overflow:\s*hidden/);

assert.match(commandTemplate, /command-bar__mobile-more/);
assert.match(commandTemplate, /command-bar__mobile-menu/);
for (const action of [
  'openManager',
  'toggleCurrentFavorite',
  'installCompanion',
  'openTour',
]) {
  assert.match(commandTemplate, new RegExp(action));
}
assert.match(commandStyles, /&__mobile-menu/);
assert.match(commandStyles, /width:\s*min\(19rem/);

assert.match(sidebarStyles, /width:\s*min\(88vw,\s*320px\)/);
assert.match(sidebarStyles, /z-index:\s*\$z-index-header\s*\+\s*2/);

assert.match(homepageStyles, /min-height:\s*clamp\(360px,\s*62svh,\s*430px\)/);
assert.match(homepageStyles, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);

assert.match(characterStyles, /&__tabs-shell\s*\{[\s\S]*?position:\s*static/);
assert.match(characterStyles, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
assert.match(characterStyles, /&__section\s*\{[\s\S]*?background:\s*transparent/);
assert.match(accordionStyles, /min-height:\s*48px/);

console.log('Mobile hierarchy and density checks passed.');
