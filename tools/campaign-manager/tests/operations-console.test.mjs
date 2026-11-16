import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('operations console separates preview recovery publishing and appearance without losing form state', async () => {
  const [app, styles, translations] = await Promise.all([
    read('../public/app.js'),
    read('../public/styles.css'),
    read('../public/i18n.js'),
  ]);

  for (const view of ['local', 'recovery', 'publishing', 'appearance']) {
    assert.match(app, new RegExp(`data-project-view-panel="${view}"`));
  }
  assert.match(app, /role="tablist"/);
  assert.match(app, /ArrowLeft/);
  assert.match(app, /ArrowRight/);
  assert.match(app, /sessionStorage\.setItem\(PROJECT_VIEW_KEY/);
  assert.match(app, /function projectFailureCard/);
  assert.match(app, /Date\.parse\(second\.updatedAt/);
  assert.match(app, /Your saved campaign data is unchanged/);
  assert.match(app, /data-action="open-service-controls"/);
  assert.match(app, /data-action="open-manager-settings"/);
  assert.match(app, /data-action="edit-campaign-appearance"/);
  assert.match(styles, /\.operations-tabs/);
  assert.match(styles, /\.operation-recovery/);
  assert.match(styles, /\.operations-panel\[hidden\]/);
  assert.match(translations, /'Local operations console'/);
  assert.match(translations, /'Recoverable failure'/);
});
