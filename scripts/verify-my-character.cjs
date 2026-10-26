const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

function read(path) {
  return readFileSync(path, 'utf8');
}

const service = read('src/app/guild/services/myCharacter.service.ts');
const party = read('src/app/adventurers/pages/party-list/party-list.component.html');
const sidebar = read('src/app/guild/components/sidebar/sidebar.component.html');
const commandBar = read('src/app/guild/components/site-command-bar/site-command-bar.component.html');
const manager = read('tools/campaign-manager/public/app.js');
const i18n = read('tools/campaign-manager/public/i18n.js');

assert.match(service, /'my-character:v1'/, 'selection needs versioned local persistence');
assert.match(service, /campaignId.*characterId/s, 'selection must be scoped per campaign');
assert.match(
  service,
  /interface MyCharacterState\s*{\s*readonly version: 1;\s*readonly selections:/,
  'preference payload must contain only versioned ID selections',
);
assert.match(party, /aria-pressed/, 'party chooser needs an accessible selected state');
assert.match(party, /toggleMyCharacter/, 'party chooser needs a visible reset/change action');
assert.match(sidebar, /myCharacterRoute/, 'sidebar needs the one-action profile route');
assert.match(commandBar, /myCharacterRoute/, 'persistent command bar needs the one-action route');
assert.match(manager, /questkeeper-manager-my-characters:v1/, 'Manager selection must persist');
assert.match(manager, /myCharacterCompanionUrl/, 'Manager must deep-link to the selected profile');
assert.match(manager, /encodeURIComponent\(state\.selectedId\)/, 'Manager deep link must be safe');
assert.match(i18n, /Apri il mio personaggio/, 'Manager shortcut needs Italian copy');

console.log('My Character quick-return contract verified.');
