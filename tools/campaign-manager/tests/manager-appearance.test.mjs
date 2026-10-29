import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Manager theme is applied before CSS and remains a device-local preference', async () => {
  const [index, app] = await Promise.all([read('../public/index.html'), read('../public/app.js')]);
  assert.ok(index.indexOf('questkeeper-manager-theme:v1') < index.indexOf('styles.css'));
  assert.match(index, /dataset\.managerThemePreference/);
  assert.match(app, /localStorage\.(?:setItem|removeItem)\(MANAGER_THEME_KEY/);
  assert.doesNotMatch(
    app.slice(app.indexOf('async function saveCampaign'), app.indexOf('function baseCharacter')),
    /MANAGER_THEME_KEY|managerTheme/,
  );
});

test('Manager settings distinguish authoring appearance from Companion appearance', async () => {
  const [index, styles, i18n, guide] = await Promise.all([
    read('../public/index.html'),
    read('../public/styles.css'),
    read('../public/i18n.js'),
    read('../../../docs/MANAGER-GUIDE.md'),
  ]);
  for (const value of ['system', 'light', 'dark', 'contrast']) {
    assert.match(index, new RegExp(`name="managerTheme" value="${value}"`));
  }
  assert.match(index, /Companion appearance remains\s+campaign data/);
  assert.match(styles, /data-manager-theme='light'/);
  assert.match(styles, /data-manager-theme='contrast'/);
  assert.match(styles, /button:disabled/);
  assert.match(styles, /:focus-visible/);
  assert.match(i18n, /Aspetto del Gestore/);
  assert.match(guide, /In italiano:/);
});
