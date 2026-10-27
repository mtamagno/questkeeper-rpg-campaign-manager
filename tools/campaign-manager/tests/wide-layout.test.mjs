import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Manager and Companion use centered wide shells without widening prose or dialogs', async () => {
  const [manager, appShell, commandBar, selector] = await Promise.all([
    readFile('tools/campaign-manager/public/styles.css', 'utf8'),
    readFile('src/app/app.scss', 'utf8'),
    readFile('src/app/guild/components/site-command-bar/site-command-bar.component.scss', 'utf8'),
    readFile('src/app/guild/pages/campaign-selector/campaign-selector.component.scss', 'utf8'),
  ]);

  assert.match(manager, /max-width: 1920px/);
  assert.match(manager, /@media \(min-width: 1600px\)/);
  assert.match(manager, /overflow-x: hidden/);
  assert.match(manager, /max-width: 1560px/);
  assert.match(appShell, /width: min\(100%, 1920px\)/);
  assert.match(appShell, /margin-inline: auto/);
  assert.match(commandBar, /width: min\(100%, 1920px\)/);
  assert.match(selector, /max-width: 1600px/);
  assert.doesNotMatch(appShell, /display: contents/);
});
