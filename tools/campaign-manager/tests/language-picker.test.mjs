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

test('entity IDs stay optional unless advanced authoring is enabled', async () => {
  const app = await readFile(join(root, 'public', 'app.js'), 'utf8');
  assert.match(app, /questkeeper-manager-advanced/);
  assert.match(app, /Show advanced identity controls in entity forms/);
  assert.match(app, /Optional\. Leave blank to generate a unique stable ID automatically\./);
  assert.match(app, /original\.id \|\| ''/);
});

test('translation workspace requires review, consent and overwrite confirmation', async () => {
  const [app, server] = await Promise.all([
    readFile(join(root, 'public', 'app.js'), 'utf8'),
    readFile(join(root, 'server.mjs'), 'utf8'),
  ]);
  for (const contract of [
    'Translation workspace',
    'translationRemoteConsent',
    'data-translation-review',
    'data-apply-translation',
    'The target language already contains text',
    'sourceSnapshot',
    'data-translation-scope',
    'data-translation-selected',
    'data-translation-overwrite',
    'Recoverable translation draft saved',
  ]) {
    assert.match(app, new RegExp(contract));
  }
  assert.match(server, /No translation batch was published/);
  assert.match(server, /would receive exactly/);
  assert.match(server, /status: 'applied'/);
});
