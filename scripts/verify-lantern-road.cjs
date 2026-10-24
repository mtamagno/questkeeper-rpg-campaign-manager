const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const campaignRoot = path.join(root, 'src', 'campaigns', 'example-campaign');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(campaignRoot, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Lantern Road verification failed: ${message}`);
  }
}

function hasBothLanguages(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.en === 'string' &&
    value.en.trim().length > 0 &&
    typeof value.it === 'string' &&
    value.it.trim().length > 0
  );
}

const campaign = readJson(path.join('data', 'campaign.json'));
const characterManifest = readJson(path.join('data', 'characters', 'manifest.json'));
const npcManifest = readJson(path.join('data', 'npcs', 'manifest.json'));
const sessionManifest = readJson(path.join('data', 'sessions', 'manifest.json'));
const maps = readJson(path.join('data', 'maps.json'));
const characters = characterManifest.map((file) =>
  readJson(path.join('data', 'characters', file)),
);
const sessions = sessionManifest.map((file) => readJson(path.join('data', 'sessions', file)));

assert(characters.length >= 2, 'the demo needs at least two player characters');
assert(npcManifest.length >= 2, 'the demo needs at least two known NPCs');
assert(sessions.length >= 2, 'the demo needs at least two completed chapters');
assert(maps.length >= 2, 'the demo needs at least two discovered places');
assert(hasBothLanguages(campaign.storySoFar), 'campaign story-so-far must be bilingual');
assert(
  campaign.storySoFar.en.length >= 300 && campaign.storySoFar.it.length >= 300,
  'campaign story-so-far must explain current state and next choice',
);

for (const session of sessions) {
  assert(hasBothLanguages(session.title), `${session.id} needs a bilingual title`);
  assert(hasBothLanguages(session.summary), `${session.id} needs a bilingual summary`);
  assert(hasBothLanguages(session.location), `${session.id} needs a bilingual location`);
  assert(hasBothLanguages(session.prose), `${session.id} needs bilingual prose`);
  assert(
    session.prose.en.split('<hr>').length >= 3,
    `${session.id} needs at least three readable prose beats`,
  );
  assert(session.keyEvents.length >= 3, `${session.id} needs at least three key events`);
}

for (const character of characters) {
  assert(character.diary.length > 0, `${character.id} needs a public session diary entry`);
  assert(
    character.sessionKnowledge.length >= sessions.length,
    `${character.id} needs knowledge snapshots for every demo session`,
  );
  assert(character.quotes.length > 0, `${character.id} needs a memorable public quote`);
}

const searchableFixture = JSON.stringify({ campaign, characters, sessions, maps });
for (const thread of ['shadow', 'letter', 'Sable Finch']) {
  assert(searchableFixture.includes(thread), `the open thread “${thread}” must remain discoverable`);
}
assert(!/[Ã�]|â€/.test(searchableFixture), 'demo text contains likely encoding corruption');

console.log(
  `Lantern Road verified: ${characters.length} heroes, ${sessions.length} chapters, ${npcManifest.length} NPCs and ${maps.length} places.`,
);
