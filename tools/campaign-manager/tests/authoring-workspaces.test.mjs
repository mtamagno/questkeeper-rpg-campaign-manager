import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('entity editors use bounded sections and keep AI optional', async () => {
  const [app, styles] = await Promise.all([read('../public/app.js'), read('../public/styles.css')]);
  assert.match(app, /enhanceDialogSectionNavigation\(\)/);
  assert.doesNotMatch(app, /if \(editor\.kind === 'campaign'\) enhance/);
  assert.match(app, /<details class="ai-compose entity-ai-import/);
  assert.match(app, /<details class="ai-compose session-ai-workspace/);
  assert.match(app, /section\('Character sheet'\)/);
  assert.match(app, /section\('Artwork and description'\)/);
  assert.match(styles, /\.optional-workspace/);
  assert.match(styles, /\.workflow-strip/);
});

test('relationship authoring persists both collections with party-knowledge boundaries', async () => {
  const [app, server] = await Promise.all([read('../public/app.js'), read('../server.mjs')]);
  assert.match(app, /Relationships · \$\{/);
  assert.match(app, /function buildRelationship/);
  assert.match(app, /Directional feelings/);
  assert.match(app, /Party knowledge boundary/);
  assert.match(app, /partyRelationships/);
  assert.match(app, /npcRelationships/);
  assert.match(server, /parts\[3\] === 'relationships'/);
  assert.match(server, /saveRelationshipSet/);
});

test('translation and compendium workspaces expose review-first workflows', async () => {
  const app = await read('../public/app.js');
  assert.match(app, /aria-label="Translation workflow"/);
  assert.match(app, /Publish only explicitly reviewed targets/);
  assert.match(app, /aria-label="Compendium workflow"/);
  assert.match(app, /Fix conflicts and invalid references before import/);
});
