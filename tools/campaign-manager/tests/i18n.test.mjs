import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const managerRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('loads the persistent bilingual interface before the manager application', async () => {
  const [index, catalog] = await Promise.all([
    readFile(join(managerRoot, 'public', 'index.html'), 'utf8'),
    readFile(join(managerRoot, 'public', 'i18n.js'), 'utf8'),
  ]);
  assert.ok(index.indexOf('i18n.js') < index.indexOf('app.js'));
  assert.match(index, /id="ui-language"/);
  assert.match(catalog, /questkeeper-manager-language/);
  assert.match(catalog, /Configurazione guidata/);
  assert.match(catalog, /Estrai bozza modificabile/);
  assert.match(catalog, /Crea e pubblica ora/);
});
