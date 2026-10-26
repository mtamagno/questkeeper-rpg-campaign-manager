import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

test('normal campaign authoring hides technical identity inputs', () => {
  assert.match(app, /state\.advancedMode\s*\? field\('id', 'Campaign ID override'/);
  assert.match(app, /Leave blank to generate it from the campaign name/);
  assert.match(app, /Stable after creation/);
  assert.match(app, /id: creating \? form\.get\('id'\)/);
});

test('custom edition is shown only for generic rulesets', () => {
  assert.match(app, /function customEditionField/);
  assert.match(app, /data-custom-edition/);
  assert.match(app, /event\.target\.value !== 'generic'/);
  assert.doesNotMatch(app, /field\('edition', 'System \/ edition'/);
});
