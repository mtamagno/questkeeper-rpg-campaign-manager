import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('Campaign Library is a persistent, searchable home rather than an implicit selection', async () => {
  const [html, app, styles] = await Promise.all([
    read('tools/campaign-manager/public/index.html'),
    read('tools/campaign-manager/public/app.js'),
    read('tools/campaign-manager/public/styles.css'),
  ]);

  assert.match(html, /id="show-library"/);
  assert.match(app, /libraryMode: true/);
  assert.match(app, /function showLibrary\(\)/);
  assert.match(app, /function filteredCampaigns\(\)/);
  assert.match(app, /data-library-action="open"/);
  assert.match(app, /data-library-action="edit"/);
  assert.match(app, /data-library-action="backup"/);
  assert.match(app, /loadState\(\{ allowFirstRunPrompt: true \}\)/);
  assert.doesNotMatch(app, /loadState\(\{ selectFirst: true, allowFirstRunPrompt: true \}\)/);
  assert.match(styles, /repeat\(auto-fit, minmax\(min\(100%, 330px\), 1fr\)\)/);
  assert.match(styles, /\.library-card__menu summary/);
});
