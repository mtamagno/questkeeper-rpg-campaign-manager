import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  inferRulesetId,
  normalizeGameSystem,
  resolveRulesetProfile,
  rulesetDisplayLabel,
} from '../ruleset-profiles.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('ruleset profiles expose materially different terminology', () => {
  assert.equal(resolveRulesetProfile('dnd-2014').fields[0].labels.en, 'Race');
  assert.equal(resolveRulesetProfile('dnd-2024').fields[0].labels.en, 'Species');
  assert.equal(resolveRulesetProfile('pf2e-remaster').fields[0].labels.en, 'Ancestry');
  assert.equal(resolveRulesetProfile('coc7e').fields[0].labels.en, 'Occupation');
  assert.equal(resolveRulesetProfile('generic').fields[1].labels.en, 'Role / archetype');
});

test('legacy editions infer a profile without destructive migration', () => {
  assert.equal(inferRulesetId('D&D 5e (2024)'), 'dnd-2024');
  assert.equal(inferRulesetId('Call of Cthulhu 7e'), 'coc7e');
  assert.deepEqual(normalizeGameSystem(undefined, 'Unknown homebrew'), {
    id: 'generic',
    edition: 'Unknown homebrew',
    customLabels: {},
  });
});

test('public ruleset labels are canonical, localized and never expose internal IDs', async () => {
  assert.equal(
    rulesetDisplayLabel({ id: 'dnd-2024' }, '', 'en'),
    'Dungeons & Dragons · 5th Edition (2024)',
  );
  assert.equal(
    rulesetDisplayLabel({ id: 'dnd-2024' }, '', 'it'),
    'Dungeons & Dragons · 5a Edizione (2024)',
  );
  assert.equal(rulesetDisplayLabel({ id: 'generic', edition: 'Cairn 2e' }), 'Cairn 2e');
  assert.equal(rulesetDisplayLabel({ id: 'unknown-internal' }), 'Custom RPG');
  assert.equal(rulesetDisplayLabel(undefined, 'Unknown homebrew'), 'Unknown homebrew');

  const [selector, homepage, model, manager] = await Promise.all([
    readFile(
      join(
        root,
        '..',
        '..',
        'src/app/guild/pages/campaign-selector/campaign-selector.component.html',
      ),
      'utf8',
    ),
    readFile(
      join(root, '..', '..', 'src/app/guild/pages/homepage/homepage.component.html'),
      'utf8',
    ),
    readFile(join(root, '..', '..', 'src/app/guild/models/rulesetProfile.model.ts'), 'utf8'),
    readFile(join(root, 'public', 'app.js'), 'utf8'),
  ]);
  assert.match(selector, /campaignRuleset\(campaign\)/);
  assert.match(homepage, /rulesetIdentity\(\)/);
  assert.match(model, /rulesetDisplayIdentity/);
  assert.match(manager, /rulesetPublicLabel/);
});

test('only redistributable suggestions carry explicit provenance', () => {
  const catalog = resolveRulesetProfile('dnd-2024').fields.flatMap(
    (definition) => definition.options,
  );
  assert.ok(catalog.length > 0);
  for (const entry of catalog) {
    assert.equal(entry.provenance.license, 'CC-BY-4.0');
    assert.match(entry.provenance.url, /^https:\/\//);
  }
  assert.equal(resolveRulesetProfile('coc7e').fields[0].options.length, 0);
});

test('ruleset identity controls preserve known, custom and imported values', async () => {
  const [app, styles] = await Promise.all([
    readFile(join(root, 'public', 'app.js'), 'utf8'),
    readFile(join(root, 'public', 'styles.css'), 'utf8'),
  ]);
  assert.match(app, /rulesetIdentityField/);
  assert.match(app, /list="\$\{listId\}"/);
  assert.match(app, /Custom or imported value · preserved exactly/);
  assert.match(app, /definition\.storageKey/);
  assert.match(styles, /\.ruleset-combobox__state\.is-custom/);
});
