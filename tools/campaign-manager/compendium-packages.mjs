const NAMESPACE_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const ENTRY_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const APPROVED_LICENSES = new Set(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'OGL-1.0a', 'MIT']);

export const COMPENDIUM_PACKAGE_SCHEMA_VERSION = 1;

export function qualifiedCompendiumId(namespace, type, id) {
  return `${namespace}:${type}:${id}`;
}

export function validateCompendiumPackage(pkg, { forPublication = false } = {}) {
  const errors = [];
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) return ['Package must be an object.'];
  const manifest = pkg.manifest;
  if (!manifest || typeof manifest !== 'object') return ['Package manifest is required.'];
  if (manifest.schemaVersion !== COMPENDIUM_PACKAGE_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${COMPENDIUM_PACKAGE_SCHEMA_VERSION}.`);
  }
  if (!NAMESPACE_PATTERN.test(String(manifest.namespace ?? ''))) {
    errors.push('namespace must be a stable lowercase dotted identifier.');
  }
  if (!VERSION_PATTERN.test(String(manifest.version ?? ''))) {
    errors.push('version must use semantic versioning.');
  }
  if (!manifest.owner || !manifest.source?.name) errors.push('owner and source.name are required.');
  if (
    !manifest.source?.url ||
    !manifest.source?.upstreamVersion ||
    !manifest.source?.reviewedOn ||
    !manifest.source?.updatePolicy
  ) {
    errors.push(
      'source.url, source.upstreamVersion, source.reviewedOn and source.updatePolicy are required.',
    );
  }
  if (!manifest.ruleset?.id || !manifest.ruleset?.edition) {
    errors.push('ruleset.id and ruleset.edition are required.');
  }
  if (!Array.isArray(manifest.locales) || manifest.locales.length === 0) {
    errors.push('At least one locale is required.');
  }
  const license = manifest.license;
  if (!license?.id || !license?.url || !license?.attribution) {
    errors.push('license.id, license.url and license.attribution are required.');
  }
  if (typeof license?.redistributable !== 'boolean') {
    errors.push('license.redistributable must be explicit.');
  }
  if (!Array.isArray(license?.permittedTransformations)) {
    errors.push('license.permittedTransformations must be explicit.');
  }
  if (!['bundled', 'local'].includes(manifest.kind)) errors.push('kind must be bundled or local.');
  if (!['public', 'private'].includes(manifest.visibility)) {
    errors.push('visibility must be public or private.');
  }
  if (forPublication) {
    if (manifest.visibility !== 'public') errors.push('Private packages cannot be published.');
    if (!license?.redistributable) errors.push('The package is not declared redistributable.');
    if (!APPROVED_LICENSES.has(String(license?.id ?? ''))) {
      errors.push('The declared license is not in the reviewed publication allow-list.');
    }
  }

  const seen = new Set();
  for (const [index, entry] of (Array.isArray(pkg.entries) ? pkg.entries : []).entries()) {
    const prefix = `entries[${index}]`;
    if (!ENTRY_ID_PATTERN.test(String(entry?.id ?? ''))) errors.push(`${prefix}.id is invalid.`);
    if (!ENTRY_ID_PATTERN.test(String(entry?.type ?? '')))
      errors.push(`${prefix}.type is invalid.`);
    const qualified = qualifiedCompendiumId(
      manifest.namespace ?? '',
      entry?.type ?? '',
      entry?.id ?? '',
    );
    if (seen.has(qualified)) errors.push(`${qualified} is duplicated.`);
    seen.add(qualified);
    if (!entry?.name || typeof entry.name !== 'object' || Object.keys(entry.name).length === 0) {
      errors.push(`${prefix}.name must contain localized text.`);
    }
    if (!Array.isArray(entry?.citations) || entry.citations.length === 0) {
      errors.push(`${prefix}.citations must identify the reviewed upstream source.`);
    }
    for (const reference of entry?.references ?? []) {
      if (!String(reference).includes(':')) errors.push(`${prefix} has an unqualified reference.`);
    }
    if (entry?.overrideOf && manifest.kind !== 'local') {
      errors.push(`${prefix}.overrideOf is allowed only in a local package.`);
    }
  }
  if (!Array.isArray(pkg.entries)) errors.push('entries must be an array.');
  return errors;
}

export function resolveCompendiumPackages(packages) {
  const ordered = [...packages].sort(
    (a, b) => Number(a.manifest.kind === 'local') - Number(b.manifest.kind === 'local'),
  );
  const resolved = new Map();
  const conflicts = [];
  for (const pkg of ordered) {
    for (const entry of pkg.entries ?? []) {
      const ownId = qualifiedCompendiumId(pkg.manifest.namespace, entry.type, entry.id);
      const targetId = entry.overrideOf || ownId;
      if (resolved.has(targetId) && !entry.overrideOf) {
        conflicts.push({
          id: targetId,
          package: pkg.manifest.namespace,
          reason: 'duplicate-without-explicit-override',
        });
        continue;
      }
      resolved.set(targetId, { ...entry, qualifiedId: targetId, package: pkg.manifest });
    }
  }
  return { entries: [...resolved.values()], conflicts };
}

export function selectCompendiumPackagesForExport(packages, { includePrivate = false } = {}) {
  return packages.filter((pkg) => {
    if (includePrivate) return true;
    return pkg.manifest.visibility === 'public' && pkg.manifest.license?.redistributable === true;
  });
}

export function isApprovedPublicationPackage(pkg) {
  return validateCompendiumPackage(pkg, { forPublication: true }).length === 0;
}
