const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const componentRoot = path.join('src', 'app', 'guild', 'pages', 'homepage');
const source = {
  ts: fs.readFileSync(path.join(root, componentRoot, 'homepage.component.ts'), 'utf8'),
  html: fs.readFileSync(path.join(root, componentRoot, 'homepage.component.html'), 'utf8'),
  scss: fs.readFileSync(path.join(root, componentRoot, 'homepage.component.scss'), 'utf8'),
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Game-night brief verification failed: ${message}`);
  }
}

for (const contract of [
  'readonly gameNightBrief',
  'sortedSessions()',
  'session.keyEvents.at(-1)',
  'campaign.storySoFar',
  'spotlight.publicProfile.bonds',
]) {
  assert(source.ts.includes(contract), `missing derived-data contract: ${contract}`);
}

for (const contract of [
  'aria-labelledby="game-night-brief-title"',
  '<ol class="homepage__brief-steps">',
  "'campaign', 'story', brief.latestSessionId",
  "'/', cId, 'maps'",
  "'/', cId, 'party', brief.characterId",
  "'campaign', 'story-so-far'",
  'Before the session',
  'Brief prima della sessione',
]) {
  assert(source.html.includes(contract), `missing accessible journey contract: ${contract}`);
}

assert(
  /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/.test(source.scss),
  'desktop brief must expose four scannable steps',
);
assert(
  /respond-below\(lg\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/.test(source.scss),
  'tablet brief must collapse to two columns',
);
assert(
  /respond-below\(sm\)[\s\S]*?grid-template-columns:\s*1fr/.test(source.scss),
  'phone brief must collapse to one column',
);

console.log('Game-night brief verified: public evidence links, bilingual copy and 4/2/1 layout.');

