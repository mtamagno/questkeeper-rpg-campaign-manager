const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const component = read('src/app/bestiary/pages/npc-relationships/npc-relationships.component.ts');
const template = read('src/app/bestiary/pages/npc-relationships/npc-relationships.component.html');
const graphTemplate = read(
  'src/app/guild/components/relationship-graph/relationship-graph.component.html',
);
const preferences = read('src/app/guild/services/npcGraphPreferences.service.ts');
const helper = read('src/app/bestiary/utils/npcGraphVisibility.ts');
const catalog = JSON.parse(read('src/app/guild/i18n/ui.json'));

for (const token of [
  'availableNpcs',
  'recentNpcIds',
  'selectedNpcIds',
  'visibleRelationships',
  'npcGroups',
  'this.dataService.characters()',
  'this.graphPreferences.remember',
]) {
  assert.ok(component.includes(token), `NPC graph component must include ${token}`);
}

for (const token of [
  '<details class="npc-relationships__picker">',
  'type="search"',
  'type="checkbox"',
  'followLatestNpcs()',
  'showAllNpcs()',
  'hideAllNpcs()',
  '[relationships]="visibleRelationships()"',
]) {
  assert.ok(template.includes(token), `NPC graph picker must include ${token}`);
}

assert.ok(
  graphTemplate.includes('@if (nodes().length === 0)'),
  'The graph must still render selected people when no visible edge connects them',
);
assert.ok(
  graphTemplate.includes("uiText.text('relationshipGraph.noVisibleBonds')"),
  'The visual and accessible empty-edge views need an explanation',
);

for (const token of [
  'questkeeper:npc-relationship-graph:v1',
  'campaignId',
  'npcIds',
  'followLatest',
]) {
  assert.ok(preferences.includes(token), `Graph preferences must include ${token}`);
}

for (const token of [
  'relationshipSessionIds',
  'sessionNumber',
  'latestSession',
  '.slice(-limit)',
]) {
  assert.ok(helper.includes(token), `Recent-NPC ranking must include ${token}`);
}

for (const locale of ['en', 'it']) {
  const texts = catalog.locales?.[locale]?.texts;
  assert.ok(texts?.npcRelationships?.picker?.title, `${locale} picker title is required`);
  assert.ok(texts?.npcRelationships?.picker?.help, `${locale} picker help is required`);
  assert.ok(texts?.relationshipGraph?.noVisibleBonds, `${locale} no-edge text is required`);
}

console.log('NPC relationship graph visibility contract verified.');
