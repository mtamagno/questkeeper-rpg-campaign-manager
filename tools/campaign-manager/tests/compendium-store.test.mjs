import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  exportLocalCompendiumPackage,
  listCompendiumPackages,
  localCompendiaRoot,
  previewCompendiumImport,
  saveLocalCompendiumPackage,
} from '../compendium-store.mjs';

function fixture(namespace = 'table.alba') {
  const sourceUrl = `questkeeper://local/${namespace}`;
  return {
    manifest: {
      schemaVersion: 1,
      namespace,
      version: '1.0.0',
      kind: 'local',
      visibility: 'private',
      owner: 'Alba table',
      source: {
        name: 'Alba table notes',
        url: sourceUrl,
        upstreamVersion: '1.0.0',
        reviewedOn: '2026-10-28',
        updatePolicy: 'Manual review only.',
      },
      ruleset: { id: 'generic', edition: 'House rules' },
      locales: ['en'],
      license: {
        id: 'All-Rights-Reserved',
        url: sourceUrl,
        attribution: 'Alba table',
        redistributable: false,
        permittedTransformations: [],
      },
    },
    entries: [
      {
        id: 'steady-hand',
        type: 'ability',
        name: { en: 'Steady Hand' },
        summary: { en: 'A private table ability.' },
        references: [],
        citations: [{ label: 'Alba table notes', url: sourceUrl }],
      },
    ],
  };
}

test('persists private local packages outside replaceable application content', async () => {
  const root = await mkdtemp(join(tmpdir(), 'questkeeper-compendia-'));
  const pkg = fixture();
  await saveLocalCompendiumPackage(root, pkg);
  const stored = JSON.parse(
    await readFile(join(localCompendiaRoot(root), 'table.alba.json'), 'utf8'),
  );
  assert.equal(stored.manifest.namespace, 'table.alba');
  const catalog = await listCompendiumPackages(root, 'steady');
  assert.equal(catalog.packages.length, 1);
  assert.equal(catalog.entries[0].qualifiedId, 'table.alba:ability:steady-hand');
});

test('previews overwrite, counts and invalid qualified links before writing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'questkeeper-compendia-preview-'));
  const pkg = fixture();
  await saveLocalCompendiumPackage(root, pkg);
  const incoming = fixture();
  incoming.manifest.version = '1.1.0';
  incoming.entries.push({
    id: 'broken-link',
    type: 'item',
    name: { en: 'Broken link' },
    references: ['missing.rules:item:not-installed'],
    citations: [{ label: 'Alba table notes', url: 'questkeeper://local/table.alba' }],
  });
  const preview = await previewCompendiumImport(root, incoming);
  assert.equal(preview.overwriteRequired, true);
  assert.deepEqual(preview.counts, { ability: 1, item: 1 });
  assert.equal(preview.invalidLinks[0].reason, 'missing-target');
  await assert.rejects(
    () => saveLocalCompendiumPackage(root, incoming, { overwriteConfirmed: true }),
    /invalid compendium reference/,
  );
});

test('requires explicit private export and explicit overwrite confirmation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'questkeeper-compendia-export-'));
  const pkg = fixture();
  await saveLocalCompendiumPackage(root, pkg);
  await assert.rejects(
    () => exportLocalCompendiumPackage(root, 'table.alba'),
    /explicit inclusion/,
  );
  const exported = await exportLocalCompendiumPackage(root, 'table.alba', {
    includePrivate: true,
  });
  assert.match(exported.warning, /private user-owned/);
  await assert.rejects(() => saveLocalCompendiumPackage(root, pkg), /explicitly confirm/);
  await saveLocalCompendiumPackage(root, pkg, { overwriteConfirmed: true });
});

test('cannot hijack a bundled namespace', async () => {
  const root = await mkdtemp(join(tmpdir(), 'questkeeper-compendia-namespace-'));
  const bundledRoot = join(root, 'compendia', 'sources');
  const bundled = fixture('vendor.safe');
  bundled.manifest.kind = 'bundled';
  await mkdir(bundledRoot, { recursive: true });
  await writeFile(join(bundledRoot, 'safe.json'), JSON.stringify(bundled));
  const local = fixture('vendor.safe');
  const preview = await previewCompendiumImport(root, local);
  assert.match(preview.errors.join(' '), /cannot reuse a bundled package namespace/);
});
