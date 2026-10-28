import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isApprovedPublicationPackage,
  qualifiedCompendiumId,
  resolveCompendiumPackages,
  selectCompendiumPackagesForExport,
  validateCompendiumPackage,
} from '../compendium-packages.mjs';

function fixture(overrides = {}) {
  return {
    manifest: {
      schemaVersion: 1,
      namespace: 'questkeeper.demo',
      version: '1.0.0',
      kind: 'bundled',
      visibility: 'public',
      owner: 'QuestKeeper contributors',
      source: { name: 'Original demo rules', url: 'https://example.invalid/demo' },
      ruleset: { id: 'generic', edition: '1' },
      locales: ['en'],
      license: {
        id: 'CC-BY-4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
        attribution: 'QuestKeeper contributors',
        redistributable: true,
      },
      ...overrides,
    },
    entries: [{ id: 'steady-hand', type: 'ability', name: { en: 'Steady Hand' }, references: [] }],
  };
}

test('package validation requires explicit provenance and publication permission', () => {
  assert.deepEqual(validateCompendiumPackage(fixture()), []);
  assert.equal(isApprovedPublicationPackage(fixture()), true);
  const privatePackage = fixture({ kind: 'local', visibility: 'private' });
  assert.match(
    validateCompendiumPackage(privatePackage, { forPublication: true }).join(' '),
    /Private packages/,
  );
});

test('qualified IDs and explicit local overrides avoid namespace hijacking', () => {
  const bundled = fixture();
  const local = fixture({ namespace: 'table.alba', kind: 'local', visibility: 'private' });
  local.entries = [
    {
      id: 'steady-hand-notes',
      type: 'ability',
      overrideOf: 'questkeeper.demo:ability:steady-hand',
      name: { en: 'Steady Hand (table notes)' },
    },
  ];
  const result = resolveCompendiumPackages([local, bundled]);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.entries[0].name.en, 'Steady Hand (table notes)');
  assert.equal(
    qualifiedCompendiumId('table.alba', 'ability', 'steady-hand'),
    'table.alba:ability:steady-hand',
  );
});

test('ordinary exports omit private and non-redistributable packages', () => {
  const privatePackage = fixture({
    namespace: 'table.private',
    kind: 'local',
    visibility: 'private',
  });
  const restricted = fixture({
    namespace: 'vendor.readonly',
    license: {
      id: 'Custom',
      url: 'https://example.invalid',
      attribution: 'Vendor',
      redistributable: false,
    },
  });
  assert.deepEqual(
    selectCompendiumPackagesForExport([fixture(), privatePackage, restricted]).map(
      (pkg) => pkg.manifest.namespace,
    ),
    ['questkeeper.demo'],
  );
});
