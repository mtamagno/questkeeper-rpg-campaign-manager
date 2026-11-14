const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const npcListMarkup = read('src/app/bestiary/pages/npc-list/npc-list.component.html');
const npcListCode = read('src/app/bestiary/pages/npc-list/npc-list.component.ts');
const npcDetailMarkup = read('src/app/bestiary/pages/npc-detail/npc-detail.component.html');
const relationshipMarkup = read(
  'src/app/guild/components/relationship-graph/relationship-graph.component.html',
);
const relationshipCode = read(
  'src/app/guild/components/relationship-graph/relationship-graph.component.ts',
);
const storySoFar = read('src/app/chronicle/pages/story-so-far/story-so-far.component.html');
const storyChapter = read('src/app/chronicle/pages/story-chapter/story-chapter.component.html');
const sessionSummary = read(
  'src/app/chronicle/components/session-summary/session-summary.component.html',
);
const sessionSummaryStyles = read(
  'src/app/chronicle/components/session-summary/session-summary.component.scss',
);
const tableMoments = read('src/app/chronicle/pages/table-moments/table-moments.component.html');
const tableMomentsCode = read('src/app/chronicle/pages/table-moments/table-moments.component.ts');
const catalog = JSON.parse(read('src/app/guild/i18n/ui.json'));
const baselineCompendium = read(
  'src/app/arcana/pages/baseline-compendium/baseline-compendium.component.html',
);

assert.match(npcListMarkup, /type="search"/);
assert.match(npcListMarkup, /npcList\.discovery\.clear/);
assert.match(npcListMarkup, /npcList\.discovery\.emptyTitle/);
assert.match(npcListMarkup, /role="status"/);
assert.match(npcListCode, /normalizeSearchValue/);
assert.match(npcListCode, /readonly filteredNpcs = computed/);
assert.match(npcDetailMarkup, /npcDetail\.relationships\.title/);
assert.match(npcDetailMarkup, /npcDetail\.relationships\.openNetwork/);

assert.match(relationshipMarkup, /<svg[\s\S]*role="group"/);
assert.match(relationshipMarkup, /<details class="relationship-graph__linear">/);
assert.match(relationshipMarkup, /relationshipGraph\.listSummary/);
assert.match(relationshipMarkup, /handleRelationshipClick\(relationship\)/);
assert.match(relationshipCode, /relationshipParticipants/);

for (const [name, markup] of [
  ['story-so-far', storySoFar],
  ['story chapter', storyChapter],
  ['session summary', sessionSummary],
  ['table moments', tableMoments],
]) {
  assert.match(markup, /uiText\.text\('chronicle\./, `${name} must use the shared UI catalog.`);
}
assert.match(sessionSummary, /entryLabel\(\)/);
assert.match(
  sessionSummaryStyles,
  /&__events-title[\s\S]*?color: var\(--narrative-accent/,
  'Key-event headings must follow the active narrative theme.',
);
assert.match(
  sessionSummaryStyles,
  /&__events-list[\s\S]*?li \{[\s\S]*?color: var\(--narrative-text/,
  'Key-event copy must remain readable on light and dark narrative surfaces.',
);
assert.match(tableMomentsCode, /chronicle\.tableMoments\.carouselLabel/);
assert.match(baselineCompendium, /uiText\.text\('compendium\.title'/);
assert.match(baselineCompendium, /class="baseline__index"/);
assert.match(baselineCompendium, /\[id\]="'rule-' \+ entry\.id"/);
assert.doesNotMatch(baselineCompendium, /isItalian\(\)\s*\?/);

const requiredPaths = [
  'npcList.discovery.label',
  'npcList.discovery.emptyTitle',
  'npcDetail.relationships.title',
  'relationshipGraph.listSummary',
  'relationshipDetail.feelingsTitle',
  'chronicle.overview.title',
  'chronicle.storySoFar.title',
  'chronicle.chapter.notFound',
  'chronicle.common.prologue',
  'chronicle.tableMoments.carouselLabel',
  'compendium.title',
  'compendium.indexLabel',
  'compendium.searchLabel',
  'compendium.empty',
];

const atPath = (value, dottedPath) =>
  dottedPath.split('.').reduce((current, segment) => current?.[segment], value);
const localeEntries = Object.entries(catalog.locales ?? {});
assert.ok(localeEntries.length > 0, 'The UI catalog needs at least one locale.');
for (const [locale, definition] of localeEntries) {
  for (const requiredPath of requiredPaths) {
    const value = atPath(definition.texts, requiredPath);
    assert.equal(
      typeof value,
      'string',
      `UI locale ${locale} is missing the quality-contract key ${requiredPath}.`,
    );
    assert.ok(value.trim().length > 0, `UI locale ${locale} has an empty ${requiredPath} value.`);
  }
}

console.log(
  `Quality-fortnight contract verified for NPC discovery, non-visual relationship navigation, chronicle hierarchy, baseline reference navigation and ${localeEntries.length} UI locale(s).`,
);
