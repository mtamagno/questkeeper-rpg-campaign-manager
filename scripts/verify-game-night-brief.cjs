const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8');
const homepage = {
  ts: read('src', 'app', 'guild', 'pages', 'homepage', 'homepage.component.ts'),
  html: read('src', 'app', 'guild', 'pages', 'homepage', 'homepage.component.html'),
  scss: read('src', 'app', 'guild', 'pages', 'homepage', 'homepage.component.scss'),
};
const overview = {
  ts: read(
    'src',
    'app',
    'chronicle',
    'pages',
    'campaign-overview',
    'campaign-overview.component.ts',
  ),
  html: read(
    'src',
    'app',
    'chronicle',
    'pages',
    'campaign-overview',
    'campaign-overview.component.html',
  ),
};
const sidebar = read(
  'src',
  'app',
  'guild',
  'components',
  'sidebar',
  'sidebar.component.html',
);
const commandBar = read(
  'src',
  'app',
  'guild',
  'components',
  'site-command-bar',
  'site-command-bar.component.ts',
);
const briefRoot = ['src', 'app', 'chronicle', 'components', 'game-night-brief'];
const brief = {
  ts: read(...briefRoot, 'game-night-brief.component.ts'),
  html: read(...briefRoot, 'game-night-brief.component.html'),
  scss: read(...briefRoot, 'game-night-brief.component.scss'),
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Campaign hierarchy verification failed: ${message}`);
  }
}

for (const contract of [
  'readonly brief',
  'sortedSessions()',
  'session.keyEvents.at(-1)',
  'campaign.storySoFar',
  'spotlight.publicProfile.bonds',
]) {
  assert(brief.ts.includes(contract), `missing derived-data contract: ${contract}`);
}

for (const contract of [
  'aria-labelledby="game-night-brief-title"',
  '<ol class="game-night-brief__steps">',
  "'campaign', 'story', item.latestSessionId",
  "'/', cId, 'maps'",
  "'/', cId, 'party', item.characterId",
  "'campaign', 'story-so-far'",
  'Before the session',
  'Brief prima della sessione',
]) {
  assert(brief.html.includes(contract), `missing accessible brief contract: ${contract}`);
}

assert(
  overview.ts.includes('GameNightBriefComponent') &&
    overview.html.includes('<app-game-night-brief />'),
  'the campaign chronicle must own the game-night brief',
);
assert(
  sidebar.includes('Cronache delle sessioni') && sidebar.includes('Session Chronicles'),
  'the sidebar must expose the chronicle under the same name as its page',
);
assert(
  commandBar.includes('Briefing ed eventi chiave') &&
    commandBar.includes('Briefing and key events'),
  'the command palette must explain what the chronicle contains',
);

for (const forbidden of [
  'homepage__brief',
  'homepage__trail',
  'homepage__player-hub',
  'homepage__nav-card',
]) {
  assert(!homepage.html.includes(forbidden), `campaign home still contains ${forbidden}`);
}

for (const route of ["'party'", "'npcs'", "'campaign'", "'maps'"]) {
  assert(homepage.html.includes(route), `homepage metric is missing route ${route}`);
}
assert(
  (homepage.html.match(/class="homepage__metric"/g) ?? []).length === 4,
  'homepage must expose exactly four clickable primary metrics',
);
assert(
  !homepage.ts.includes('JourneyMemoryService'),
  'personal reading memory must stay in the global command palette',
);

assert(
  /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/.test(brief.scss),
  'desktop brief must expose four scannable steps',
);
assert(
  /respond-below\(lg\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/.test(brief.scss),
  'tablet brief must collapse to two columns',
);
assert(
  /respond-below\(sm\)[\s\S]*?grid-template-columns:\s*1fr/.test(brief.scss),
  'phone brief must collapse to one column',
);
assert(
  /&__metric[\s\S]*?&:focus-visible/.test(homepage.scss),
  'clickable metrics must expose a visible keyboard focus state',
);

console.log(
  'Campaign hierarchy verified: focused cover, four linked metrics, chronicle brief and responsive evidence cards.',
);
