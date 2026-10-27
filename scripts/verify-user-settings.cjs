const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const read = (path) => readFileSync(path, 'utf8');
const routes = read('src/app/app.routes.ts');
const sidebar = read('src/app/guild/components/sidebar/sidebar.component.html');
const page = read('src/app/guild/pages/user-settings/user-settings.component.html');
const code = read('src/app/guild/pages/user-settings/user-settings.component.ts');
const styles = read('src/app/guild/pages/user-settings/user-settings.component.scss');
const party = read('src/app/adventurers/pages/party-list/party-list.component.html');
const commands = read('src/app/guild/components/site-command-bar/site-command-bar.component.ts');

assert.match(routes, /path: 'settings'/);
assert.ok((routes.match(/user-settings\.component/g) ?? []).length >= 2);
assert.match(sidebar, /Impostazioni utente/);
assert.doesNotMatch(sidebar, /app-audio-toggle|sidebar__my-character/);
assert.match(page, /id="global-settings"/);
assert.match(page, /id="campaign-settings"/);
assert.match(page, /id="sound-muted"/);
assert.match(page, /id="sound-volume"/);
assert.match(page, /id="my-character"/);
assert.match(code, /UserPreferencesService/);
assert.match(code, /MyCharacterService/);
assert.match(code, /selectCharacter/);
assert.doesNotMatch(party, /toggleMyCharacter/);
assert.match(commands, /global-settings/);
assert.match(styles, /@media \(max-width: 38rem\)/);
assert.match(styles, /min-height: 2\.75rem/);

console.log('Central user settings contract verified: global, campaign-scoped and responsive.');
