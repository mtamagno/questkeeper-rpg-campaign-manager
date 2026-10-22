import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('campaign language picker exposes searchable, custom and accessible controls', async () => {
  const [app, styles] = await Promise.all([
    readFile(join(root, 'public', 'app.js'), 'utf8'),
    readFile(join(root, 'public', 'styles.css'), 'utf8'),
  ]);
  for (const contract of [
    'data-language-search',
    'data-language-add-custom',
    'data-language-remove',
    'aria-live="polite"',
    "event.key !== 'Enter'",
    'currentCampaignLocalizedValues',
    'campaignContainsLocalizedContent(state.campaign, code)',
  ]) {
    assert.match(app, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]+\.language-picker__add/);
  assert.match(styles, /\.language-picker__selected/);
});
