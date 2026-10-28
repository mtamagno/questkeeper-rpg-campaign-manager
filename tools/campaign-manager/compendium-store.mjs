import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import storagePaths from '../storage-paths.cjs';
import {
  qualifiedCompendiumId,
  resolveCompendiumPackages,
  validateCompendiumPackage,
} from './compendium-packages.mjs';

const { resolveStoragePaths } = storagePaths;
const NAMESPACE_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;

function packageFileName(namespace) {
  if (!NAMESPACE_PATTERN.test(String(namespace ?? ''))) {
    throw new Error('Compendium namespace must be stable lowercase dotted text.');
  }
  return `${namespace}.json`;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJsonAtomic(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, file);
}

export function localCompendiaRoot(projectRoot) {
  return resolveStoragePaths(projectRoot).compendiaRoot;
}

async function readPackageFolder(folder) {
  let files;
  try {
    files = await readdir(folder, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const packages = [];
  for (const entry of files) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const pkg = await readJson(join(folder, entry.name));
    packages.push(
      pkg.manifest && pkg.entries ? pkg : { manifest: pkg.manifest, entries: pkg.entries },
    );
  }
  return packages;
}

export async function readLocalCompendiumPackages(projectRoot) {
  return readPackageFolder(localCompendiaRoot(projectRoot));
}

export async function readBundledCompendiumPackages(projectRoot) {
  return readPackageFolder(resolve(projectRoot, 'compendia', 'sources'));
}

function normalizedImport(input) {
  if (input?.format === 'questkeeper-compendium-package') return input.package;
  return input?.package ?? input;
}

function entryIds(packages) {
  return new Set(
    packages.flatMap((pkg) =>
      (pkg.entries ?? []).map((entry) =>
        qualifiedCompendiumId(pkg.manifest.namespace, entry.type, entry.id),
      ),
    ),
  );
}

function referenceProblems(packages, candidate) {
  const all = [
    ...packages.filter((pkg) => pkg.manifest.namespace !== candidate.manifest.namespace),
    candidate,
  ];
  const ids = entryIds(all);
  const problems = [];
  for (const entry of candidate.entries ?? []) {
    const owner = qualifiedCompendiumId(candidate.manifest.namespace, entry.type, entry.id);
    for (const reference of [
      ...(entry.references ?? []),
      ...(entry.overrideOf ? [entry.overrideOf] : []),
    ]) {
      if (!/^[a-z][a-z0-9.-]*:[a-z0-9._-]+:[a-z0-9._-]+$/.test(String(reference))) {
        problems.push({ entry: owner, reference, reason: 'malformed-qualified-reference' });
      } else if (!ids.has(reference)) {
        problems.push({ entry: owner, reference, reason: 'missing-target' });
      }
    }
  }
  return problems;
}

function packageSummary(pkg) {
  return {
    namespace: pkg.manifest.namespace,
    version: pkg.manifest.version,
    owner: pkg.manifest.owner,
    source: pkg.manifest.source,
    ruleset: pkg.manifest.ruleset,
    locales: pkg.manifest.locales,
    visibility: pkg.manifest.visibility,
    redistributable: pkg.manifest.license.redistributable,
    license: pkg.manifest.license.id,
    entries: pkg.entries.length,
  };
}

export async function previewCompendiumImport(projectRoot, input) {
  const candidate = normalizedImport(input);
  const errors = validateCompendiumPackage(candidate);
  if (candidate?.manifest?.kind !== 'local')
    errors.push('Imported user packages must use kind "local".');
  const [localPackages, bundledPackages] = await Promise.all([
    readLocalCompendiumPackages(projectRoot),
    readBundledCompendiumPackages(projectRoot),
  ]);
  const existing = localPackages.find(
    (pkg) => pkg.manifest.namespace === candidate?.manifest?.namespace,
  );
  if (bundledPackages.some((pkg) => pkg.manifest.namespace === candidate?.manifest?.namespace)) {
    errors.push('A local package cannot reuse a bundled package namespace.');
  }
  const available = [...bundledPackages, ...localPackages];
  const invalidLinks = candidate?.manifest ? referenceProblems(available, candidate) : [];
  const withoutExisting = available.filter(
    (pkg) => pkg.manifest.namespace !== candidate?.manifest?.namespace,
  );
  const resolved = candidate?.manifest
    ? resolveCompendiumPackages([...withoutExisting, candidate])
    : { conflicts: [] };
  const counts = Object.fromEntries(
    Object.entries(
      (candidate?.entries ?? []).reduce((result, entry) => {
        result[entry.type] = (result[entry.type] ?? 0) + 1;
        return result;
      }, {}),
    ).sort(([left], [right]) => left.localeCompare(right)),
  );
  return {
    valid: errors.length === 0 && invalidLinks.length === 0 && resolved.conflicts.length === 0,
    errors,
    invalidLinks,
    conflicts: resolved.conflicts,
    overwriteRequired: Boolean(existing),
    installedVersion: existing?.manifest.version,
    incomingVersion: candidate?.manifest?.version,
    namespace: candidate?.manifest?.namespace,
    entries: candidate?.entries?.length ?? 0,
    counts,
    package: candidate,
  };
}

export async function saveLocalCompendiumPackage(
  projectRoot,
  input,
  { overwriteConfirmed = false, previousNamespace } = {},
) {
  const candidate = normalizedImport(input);
  if (previousNamespace && previousNamespace !== candidate?.manifest?.namespace) {
    throw new Error(
      'A saved compendium namespace cannot be renamed. Create a new package instead.',
    );
  }
  const preview = await previewCompendiumImport(projectRoot, candidate);
  if (preview.errors.length) throw new Error(preview.errors.join(' '));
  if (preview.invalidLinks.length) {
    throw new Error(
      `Resolve ${preview.invalidLinks.length} invalid compendium reference(s) first.`,
    );
  }
  if (preview.conflicts.length) {
    throw new Error(`Resolve ${preview.conflicts.length} compendium conflict(s) first.`);
  }
  if (preview.overwriteRequired && !overwriteConfirmed) {
    throw new Error('This namespace already exists. Preview and explicitly confirm the overwrite.');
  }
  const file = join(localCompendiaRoot(projectRoot), packageFileName(candidate.manifest.namespace));
  await writeJsonAtomic(file, candidate);
  return { summary: packageSummary(candidate), package: candidate };
}

export async function getLocalCompendiumPackage(projectRoot, namespace) {
  const pkg = await readJson(join(localCompendiaRoot(projectRoot), packageFileName(namespace)));
  const errors = validateCompendiumPackage(pkg);
  return { package: pkg, errors };
}

export async function listCompendiumPackages(projectRoot, query = '') {
  const [localPackages, bundledPackages] = await Promise.all([
    readLocalCompendiumPackages(projectRoot),
    readBundledCompendiumPackages(projectRoot),
  ]);
  const resolved = resolveCompendiumPackages([...bundledPackages, ...localPackages]);
  const needle = String(query).trim().toLocaleLowerCase();
  const entries = resolved.entries
    .filter((entry) => {
      const names = Object.values(entry.name ?? {}).join(' ');
      return `${entry.qualifiedId} ${names} ${entry.type}`.toLocaleLowerCase().includes(needle);
    })
    .map((entry) => ({
      qualifiedId: entry.qualifiedId,
      type: entry.type,
      name: entry.name,
      summary: entry.summary ?? entry.description ?? {},
      package: entry.package.namespace,
      source: entry.package.source.name,
    }));
  return {
    packages: localPackages.map(packageSummary),
    entries,
    conflicts: resolved.conflicts,
    privacyNotice:
      'Local packages stay on this device and are excluded from sharing exports by default.',
  };
}

export async function exportLocalCompendiumPackage(
  projectRoot,
  namespace,
  { includePrivate = false } = {},
) {
  const { package: pkg, errors } = await getLocalCompendiumPackage(projectRoot, namespace);
  if (errors.length) throw new Error(`Cannot export an invalid package: ${errors.join(' ')}`);
  if (pkg.manifest.visibility === 'private' && !includePrivate) {
    throw new Error(
      'Private packages require explicit inclusion before they can leave this device.',
    );
  }
  return {
    format: 'questkeeper-compendium-package',
    version: 1,
    exportedAt: new Date().toISOString(),
    warning:
      pkg.manifest.visibility === 'private'
        ? 'This export contains private user-owned compendium material. Share it only when you have permission.'
        : undefined,
    package: pkg,
  };
}
