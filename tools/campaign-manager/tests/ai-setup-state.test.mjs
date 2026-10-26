import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  normalizeAiConfig,
  readAiConfig,
  writeAiConfig,
  writeAiSetupState,
} from '../ai-config.mjs';

const managerRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(managerRoot, 'public');

test('normalizes legacy, draft and completed AI setup states', () => {
  assert.equal(normalizeAiConfig({}).setupState, 'unseen');
  assert.equal(normalizeAiConfig({ setupComplete: true }).setupState, 'complete');
  assert.equal(normalizeAiConfig({ setupState: 'manual' }).setupComplete, false);
  assert.equal(normalizeAiConfig({ setupState: 'draft' }).setupState, 'draft');
  assert.equal(normalizeAiConfig({ setupState: 'unknown' }).setupState, 'unseen');
});

test('persists defer, manual, partial, complete and reset choices across reads', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'questkeeper-ai-setup-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  await writeAiSetupState(root, 'deferred');
  assert.equal((await readAiConfig(root)).setupState, 'deferred');

  await writeAiSetupState(root, 'manual');
  const manual = await readAiConfig(root);
  assert.equal(manual.setupState, 'manual');
  assert.ok(Object.values(manual.roles).every((role) => role.provider === 'off'));

  const previous = await readAiConfig(root);
  await writeAiConfig(root, {
    ...previous,
    setupState: 'draft',
    providers: { ...previous.providers, xai: { apiKey: 'local-secret' } },
  });
  const draft = await readAiConfig(root);
  assert.equal(draft.setupState, 'draft');
  assert.equal(draft.setupComplete, false);
  assert.equal(draft.providers.xai.apiKey, 'local-secret');

  await writeAiSetupState(root, 'complete');
  assert.equal((await readAiConfig(root)).setupComplete, true);

  await writeAiSetupState(root, 'unseen');
  const reset = await readAiConfig(root);
  assert.equal(reset.setupState, 'unseen');
  assert.equal(reset.providers.xai.apiKey, 'local-secret');
});

test('first-run navigation is explicit, bilingual and never reasserted by background refreshes', async () => {
  const [app, index, i18n] = await Promise.all([
    readFile(join(publicRoot, 'app.js'), 'utf8'),
    readFile(join(publicRoot, 'index.html'), 'utf8'),
    readFile(join(publicRoot, 'i18n.js'), 'utf8'),
  ]);
  assert.match(app, /allowFirstRunPrompt && !state\.firstRunEvaluated/);
  assert.match(app, /loadState\(\{ selectFirst: true, allowFirstRunPrompt: true \}\)/);
  assert.doesNotMatch(app, /if \(!result\.ai\?\.config\?\.setupComplete\) state\.aiMode = true/);
  for (const choice of ['configure', 'manual', 'deferred', 'reset']) {
    assert.match(app, new RegExp(`data-ai-onboarding=["']${choice}["']`));
  }
  assert.match(app, /data-ai-save="draft"/);
  assert.match(index, /id="ai-setup-state"/);
  assert.match(i18n, /Usa la modalità manuale/);
  assert.match(i18n, /Ricordamelo più tardi/);
});
