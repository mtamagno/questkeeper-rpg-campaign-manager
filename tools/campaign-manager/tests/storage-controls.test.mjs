import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (path) => readFile(join(root, path), 'utf8');

test('Campaign Manager exposes storage diagnostics and recovery controls', async () => {
  const [server, app, styles, translations] = await Promise.all([
    read('tools/campaign-manager/server.mjs'),
    read('tools/campaign-manager/public/app.js'),
    read('tools/campaign-manager/public/styles.css'),
    read('tools/campaign-manager/public/i18n.js'),
  ]);

  for (const endpoint of ['/api/storage/open', '/api/storage/backup', '/api/storage/export']) {
    assert.ok(server.includes(endpoint), `Missing ${endpoint}.`);
  }
  for (const key of [
    'application',
    'runtime',
    'campaigns',
    'configuration',
    'transcripts',
    'backups',
    'logs',
    'cache',
  ]) {
    assert.ok(app.includes(`['${key}'`), `Missing ${key} diagnostic.`);
  }
  assert.ok(app.includes('data-storage-action="backup"'));
  assert.ok(app.includes('data-storage-action="export"'));
  assert.ok(app.includes('data-storage-action="copy"'));
  assert.ok(app.includes('data-storage-action="open"'));
  assert.ok(styles.includes('.storage-list'));
  assert.ok(translations.includes("'Storage & recovery': 'Archivio e recupero'"));
});

test('guided setup offers portable storage and shuts its loopback service down after success', async () => {
  const [server, html, script] = await Promise.all([
    read('tools/setup-wizard/server.cjs'),
    read('tools/setup-wizard/public/index.html'),
    read('tools/setup-wizard/public/setup.js'),
  ]);

  assert.ok(html.includes('id="portable-data"'));
  assert.ok(html.includes('id="storage-path"'));
  assert.ok(script.includes("portableData: $('portable-data').checked"));
  assert.ok(script.includes('window.setTimeout(() => closeSetup(status), 450)'));
  assert.ok(script.includes("api('shutdown'"));
  assert.ok(server.includes('state.launchedManager = true'));
  assert.ok(server.includes('storageChoices:'));
  assert.ok(server.includes("options.portableData === true ? 'portable' : 'user'"));
});
