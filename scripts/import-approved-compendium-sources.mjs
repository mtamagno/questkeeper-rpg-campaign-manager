import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { format } from 'prettier';

import { validateCompendiumPackage } from '../tools/campaign-manager/compendium-packages.mjs';

const root = resolve(import.meta.dirname, '..');
const source = JSON.parse(
  await readFile(resolve(root, 'compendia/sources/srd-5.2.1-core.json'), 'utf8'),
);
const matrix = JSON.parse(
  await readFile(resolve(root, 'tools/campaign-manager/compendium-source-matrix.json'), 'utf8'),
);
const reviewed = matrix.sources.find((candidate) => candidate.id === source.sourceId);
if (reviewed?.status !== 'approved') {
  throw new Error(`${source.sourceId} is not approved for redistribution.`);
}
const pkg = { manifest: source.manifest, entries: source.entries };
const errors = validateCompendiumPackage(pkg, { forPublication: true });
if (errors.length > 0) throw new Error(`Baseline compendium rejected:\n- ${errors.join('\n- ')}`);
for (const entry of pkg.entries) {
  if (entry.citations.some((citation) => citation.url !== reviewed.sourceUrl)) {
    throw new Error(`${entry.id} cites an unreviewed source URL.`);
  }
}
const output = resolve(root, 'src/app/arcana/data/baseline-compendium.json');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, await format(JSON.stringify(pkg), { parser: 'json' }), 'utf8');
console.log(`Prepared ${pkg.entries.length} reviewed baseline compendium entries.`);
