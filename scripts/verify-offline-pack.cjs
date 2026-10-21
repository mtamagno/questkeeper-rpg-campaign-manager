const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));

const service = read('src/app/guild/services/offlinePack.service.ts');
const snapshotSection = service.slice(
  service.indexOf('function publicCharacterSnapshot'),
  service.indexOf('function recapSnapshot'),
);
assert.match(service, /offline-packs:v1/);
assert.match(service, /RECENT_RECAP_LIMIT = 3/);
assert.match(service, /localStorage\.setItem/);
assert.match(service, /remove\(campaignId: string\)/);
assert.match(service, /navigator\.serviceWorker\.controller/);
assert.doesNotMatch(
  snapshotSection,
  /privateProfile|password|secretBackstory|dmNotes|equipment|spells/,
);
assert.match(snapshotSection, /publicProfile/);
assert.match(snapshotSection, /classType/);

const template = read('src/app/guild/pages/offline-pack/offline-pack.component.html');
for (const phrase of [
  'Prepare for offline',
  'Prepara per offline',
  'Update pack',
  'Aggiorna pacchetto',
  'Remove from device',
  'Rimuovi dal dispositivo',
  'Protected sheets, passwords, secrets, GM notes and full chapters stay excluded.',
]) {
  assert.ok(template.includes(phrase), 'Offline UI is missing: ' + phrase);
}
assert.match(template, /aria-live="polite"/);
assert.match(template, /type="checkbox"/);

const routes = read('src/app/app.routes.ts');
assert.match(routes, /path: 'offline'/);
assert.match(routes, /OfflinePackComponent/);

const commandBar = read('src/app/guild/components/site-command-bar/site-command-bar.component.ts');
assert.match(commandBar, /Offline pack/);
assert.match(commandBar, /Kit offline/);
assert.match(commandBar, /\/offline/);

const sidebar = read('src/app/guild/components/sidebar/sidebar.component.html');
assert.match(sidebar, /Offline Pack/);
assert.match(sidebar, /Kit offline/);

const workerConfig = readJson('ngsw-config.json');
const dataGroups = JSON.stringify(workerConfig.dataGroups);
assert.ok(dataGroups.includes('campaign-directory'));
assert.ok(dataGroups.includes('campaign-public-media'));
assert.ok(!dataGroups.includes('/characters/'), 'Never cache protected character source JSON');
assert.ok(!dataGroups.includes('/sessions/'), 'Recaps must use sanitized snapshots');

const campaignService = read('src/app/guild/services/campaign.service.ts');
const dataService = read('src/app/guild/services/data.service.ts');
assert.match(campaignService, /return CAMPAIGNS_MANIFEST_PATH/);
assert.match(dataService, /path\.endsWith\('\/campaign\.json'\)/);

console.log(
  'Offline pack verified: explicit public snapshots, three recent recaps, removable storage and safe media caching.',
);
