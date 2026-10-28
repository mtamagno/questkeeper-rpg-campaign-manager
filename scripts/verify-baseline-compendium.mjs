import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { validateCompendiumPackage } from '../tools/campaign-manager/compendium-packages.mjs';

const root = resolve(import.meta.dirname, '..');
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const [matrix, pkg, routes, template] = await Promise.all([
  readJson('tools/campaign-manager/compendium-source-matrix.json'),
  readJson('src/app/arcana/data/baseline-compendium.json'),
  readFile(resolve(root, 'src/app/app.routes.ts'), 'utf8'),
  readFile(
    resolve(root, 'src/app/arcana/pages/baseline-compendium/baseline-compendium.component.html'),
    'utf8',
  ),
]);
assert.equal(validateCompendiumPackage(pkg, { forPublication: true }).length, 0);
assert.equal(pkg.entries.length, 5);
assert.equal(matrix.sources.filter((source) => source.status === 'approved').length, 1);
assert(matrix.sources.some((source) => source.status === 'excluded'));
assert(matrix.sources.some((source) => source.status === 'research-only'));
assert(routes.includes("path: 'compendium'"));
for (const marker of [
  'manifest.source.name',
  'manifest.ruleset.edition',
  'manifest.source.reviewedOn',
  'manifest.license.id',
]) {
  assert(template.includes(marker), `Baseline page is missing ${marker}.`);
}
console.log(
  'Redistributable baseline verified: source matrix, package, citations and visible provenance.',
);
