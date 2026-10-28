const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const STORAGE_VERSION = 1;
const CAMPAIGN_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readJsonSync(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

function defaultRoots(platform, env, homeDir) {
  if (platform === 'win32') {
    const local = path.resolve(env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'));
    const roaming = path.resolve(env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'));
    return {
      dataRoot: path.join(local, 'QuestKeeper', 'data'),
      configRoot: path.join(roaming, 'QuestKeeper', 'config'),
      stateRoot: path.join(local, 'QuestKeeper', 'state'),
      cacheRoot: path.join(local, 'QuestKeeper', 'cache'),
    };
  }
  if (platform === 'darwin') {
    return {
      dataRoot: path.join(homeDir, 'Library', 'Application Support', 'QuestKeeper', 'data'),
      configRoot: path.join(homeDir, 'Library', 'Application Support', 'QuestKeeper', 'config'),
      stateRoot: path.join(homeDir, 'Library', 'Logs', 'QuestKeeper'),
      cacheRoot: path.join(homeDir, 'Library', 'Caches', 'QuestKeeper'),
    };
  }
  return {
    dataRoot: path.join(env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share'), 'questkeeper'),
    configRoot: path.join(env.XDG_CONFIG_HOME || path.join(homeDir, '.config'), 'questkeeper'),
    stateRoot: path.join(
      env.XDG_STATE_HOME || path.join(homeDir, '.local', 'state'),
      'questkeeper',
    ),
    cacheRoot: path.join(env.XDG_CACHE_HOME || path.join(homeDir, '.cache'), 'questkeeper'),
  };
}

function resolveStoragePaths(projectRoot, options = {}) {
  const applicationRoot = path.resolve(projectRoot);
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const homeDir = path.resolve(options.homeDir || os.homedir());
  const selectionFile = path.join(applicationRoot, '.questkeeper', 'storage-selection.json');
  const selection = readJsonSync(selectionFile) || {};
  const portableRequested =
    options.mode === 'portable' ||
    env.QUESTKEEPER_STORAGE_MODE === 'portable' ||
    selection.mode === 'portable' ||
    fs.existsSync(path.join(applicationRoot, '.questkeeper', 'portable-mode'));
  const installed =
    fs.existsSync(path.join(applicationRoot, '.questkeeper', 'runtime-selection.json')) ||
    selection.mode === 'user' ||
    selection.mode === 'portable';
  const mode =
    options.mode ||
    env.QUESTKEEPER_STORAGE_MODE ||
    (portableRequested
      ? 'portable'
      : selection.mode === 'user'
        ? 'user'
        : installed && env.NODE_ENV !== 'test'
          ? 'user'
          : 'legacy');
  if (!['legacy', 'user', 'portable'].includes(mode)) {
    throw new Error(`Unsupported QuestKeeper storage mode: ${mode}.`);
  }

  let roots;
  if (mode === 'legacy') {
    roots = {
      dataRoot: path.join(applicationRoot, 'src'),
      configRoot: path.join(applicationRoot, '.campaign-manager'),
      stateRoot: path.join(applicationRoot, '.questkeeper'),
      cacheRoot: path.join(applicationRoot, '.questkeeper', 'cache'),
    };
  } else if (mode === 'portable') {
    const portableRoot = path.join(applicationRoot, '.questkeeper', 'user-data');
    roots = {
      dataRoot: portableRoot,
      configRoot: path.join(portableRoot, 'config'),
      stateRoot: path.join(portableRoot, 'state'),
      cacheRoot: path.join(portableRoot, 'cache'),
    };
  } else {
    const defaults = defaultRoots(platform, env, homeDir);
    roots = {
      dataRoot: path.resolve(
        options.dataRoot || env.QUESTKEEPER_DATA_HOME || selection.dataRoot || defaults.dataRoot,
      ),
      configRoot: path.resolve(
        options.configRoot ||
          env.QUESTKEEPER_CONFIG_HOME ||
          selection.configRoot ||
          defaults.configRoot,
      ),
      stateRoot: path.resolve(
        options.stateRoot ||
          env.QUESTKEEPER_STATE_HOME ||
          selection.stateRoot ||
          defaults.stateRoot,
      ),
      cacheRoot: path.resolve(
        options.cacheRoot ||
          env.QUESTKEEPER_CACHE_HOME ||
          selection.cacheRoot ||
          defaults.cacheRoot,
      ),
    };
  }

  const legacyCampaignsRoot = path.join(applicationRoot, 'src', 'campaigns');
  const legacyManagerRoot = path.join(applicationRoot, '.campaign-manager');
  const legacyTranscriptsRoot = path.join(applicationRoot, 'discord-transcriber', 'transcripts');
  return {
    version: STORAGE_VERSION,
    mode,
    applicationRoot,
    runtimeRoot: path.join(applicationRoot, '.questkeeper', 'runtime'),
    selectionFile,
    dataRoot: roots.dataRoot,
    campaignsRoot: mode === 'legacy' ? legacyCampaignsRoot : path.join(roots.dataRoot, 'campaigns'),
    compendiaRoot:
      mode === 'legacy'
        ? path.join(legacyManagerRoot, 'compendia')
        : path.join(roots.dataRoot, 'compendia'),
    backupsRoot: path.join(roots.dataRoot, 'backups'),
    transcriptsRoot:
      mode === 'legacy' ? legacyTranscriptsRoot : path.join(roots.dataRoot, 'transcripts'),
    configRoot: roots.configRoot,
    aiConfigFile: path.join(roots.configRoot, 'ai-config.json'),
    publishingConfigFile: path.join(roots.configRoot, 'publishing.json'),
    scribeEnvFile:
      mode === 'legacy'
        ? path.join(applicationRoot, 'discord-transcriber', '.env')
        : path.join(roots.configRoot, 'discord-scribe.env'),
    ownershipFile: path.join(roots.configRoot, 'storage-ownership.json'),
    stateRoot: roots.stateRoot,
    logsRoot: path.join(roots.stateRoot, 'logs'),
    trashRoot:
      mode === 'legacy'
        ? path.join(legacyManagerRoot, 'trash')
        : path.join(roots.stateRoot, 'trash'),
    cacheRoot: roots.cacheRoot,
    buildMirrorRoot: legacyCampaignsRoot,
    legacyCampaignsRoot,
    legacyManagerRoot,
    legacyTranscriptsRoot,
  };
}

async function exists(target) {
  try {
    await fsp.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(file, value, mode) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    ...(mode ? { mode } : {}),
  });
  await fsp.rename(temporary, file);
}

async function directorySize(root) {
  if (!(await exists(root))) return 0;
  let total = 0;
  const entries = await fsp.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Storage migration refuses symbolic link: ${target}`);
    total += entry.isDirectory() ? await directorySize(target) : (await fsp.stat(target)).size;
  }
  return total;
}

async function validateCampaignTree(root) {
  const manifestFile = path.join(root, 'campaigns.json');
  const manifest = JSON.parse(await fsp.readFile(manifestFile, 'utf8'));
  if (!Array.isArray(manifest)) throw new Error('Campaign manifest must contain a list.');
  const ids = new Set();
  for (const entry of manifest) {
    if (!CAMPAIGN_ID.test(entry?.id || ''))
      throw new Error('Campaign manifest contains an invalid ID.');
    if (ids.has(entry.id)) throw new Error(`Campaign manifest repeats ID "${entry.id}".`);
    ids.add(entry.id);
    await fsp.stat(path.join(root, entry.id, 'data', 'campaign.json'));
  }
  return { campaigns: manifest.length, ids: [...ids] };
}

async function availableBytes(target) {
  let current = path.resolve(target);
  while (!(await exists(current))) {
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
  try {
    const info = await fsp.statfs(current);
    return Number(info.bavail) * Number(info.bsize);
  } catch {
    return undefined;
  }
}

async function previewStorageMigration(projectRoot, options = {}) {
  const paths = resolveStoragePaths(projectRoot, options);
  const sourceExists = await exists(paths.legacyCampaignsRoot);
  const destinationExists = await exists(paths.campaignsRoot);
  const source = sourceExists
    ? await validateCampaignTree(paths.legacyCampaignsRoot)
    : { campaigns: 0, ids: [] };
  let destination;
  let destinationError;
  if (destinationExists && paths.campaignsRoot !== paths.legacyCampaignsRoot) {
    try {
      destination = await validateCampaignTree(paths.campaignsRoot);
    } catch (error) {
      destinationError = error.message;
    }
  }
  const collisions = source.ids.filter((id) => destination?.ids.includes(id));
  const sourceBytes = sourceExists ? await directorySize(paths.legacyCampaignsRoot) : 0;
  const freeBytes = await availableBytes(paths.dataRoot);
  return {
    mode: paths.mode,
    source: paths.legacyCampaignsRoot,
    destination: paths.campaignsRoot,
    sourceCampaigns: source.campaigns,
    sourceBytes,
    availableBytes: freeBytes,
    collisions,
    destinationExists,
    destinationValid: destinationExists ? Boolean(destination) : false,
    destinationError,
    required:
      paths.mode !== 'legacy' &&
      sourceExists &&
      paths.campaignsRoot !== paths.legacyCampaignsRoot &&
      !destinationExists,
    canMigrate:
      !destinationError &&
      collisions.length === 0 &&
      (freeBytes === undefined || freeBytes >= Math.max(sourceBytes * 2, sourceBytes + 16_777_216)),
  };
}

async function copyIfMissing(source, destination, options = {}) {
  if (!(await exists(source)) || (await exists(destination))) return false;
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await fsp.cp(source, destination, { recursive: true, errorOnExist: true });
  if (options.mode) await fsp.chmod(destination, options.mode);
  return true;
}

async function migrateAncillaryData(paths) {
  if (paths.mode === 'legacy') return;
  await Promise.all([
    copyIfMissing(path.join(paths.legacyManagerRoot, 'ai-config.json'), paths.aiConfigFile, {
      mode: 0o600,
    }),
    copyIfMissing(
      path.join(paths.legacyManagerRoot, 'publishing.json'),
      paths.publishingConfigFile,
      {
        mode: 0o600,
      },
    ),
    copyIfMissing(
      path.join(paths.applicationRoot, 'discord-transcriber', '.env'),
      paths.scribeEnvFile,
      { mode: 0o600 },
    ),
  ]);
  if (await exists(paths.legacyTranscriptsRoot)) {
    await fsp.mkdir(paths.transcriptsRoot, { recursive: true });
    const entries = await fsp.readdir(paths.legacyTranscriptsRoot);
    for (const entry of entries) {
      await copyIfMissing(
        path.join(paths.legacyTranscriptsRoot, entry),
        path.join(paths.transcriptsRoot, entry),
      );
    }
  }
}

async function recordOwnership(paths, migration) {
  const record = {
    version: STORAGE_VERSION,
    mode: paths.mode,
    preparedAt: new Date().toISOString(),
    dataRoot: paths.dataRoot,
    configRoot: paths.configRoot,
    stateRoot: paths.stateRoot,
    cacheRoot: paths.cacheRoot,
    originalCampaignsRoot: migration?.rollbackRoot,
  };
  await writeJsonAtomic(paths.ownershipFile, record, 0o600);
  await writeJsonAtomic(
    paths.selectionFile,
    {
      version: STORAGE_VERSION,
      mode: paths.mode,
      ...(paths.mode === 'user'
        ? {
            dataRoot: paths.dataRoot,
            configRoot: paths.configRoot,
            stateRoot: paths.stateRoot,
            cacheRoot: paths.cacheRoot,
          }
        : {}),
    },
    0o600,
  );
}

async function prepareStorage(projectRoot, options = {}) {
  const paths = resolveStoragePaths(projectRoot, options);
  if (paths.mode === 'legacy') return { paths, migration: { migrated: false, legacy: true } };
  await Promise.all([
    fsp.mkdir(paths.dataRoot, { recursive: true }),
    fsp.mkdir(paths.configRoot, { recursive: true }),
    fsp.mkdir(paths.stateRoot, { recursive: true }),
    fsp.mkdir(paths.cacheRoot, { recursive: true }),
    fsp.mkdir(paths.backupsRoot, { recursive: true }),
    fsp.mkdir(paths.compendiaRoot, { recursive: true }),
    fsp.mkdir(paths.transcriptsRoot, { recursive: true }),
    fsp.mkdir(paths.logsRoot, { recursive: true }),
    fsp.mkdir(paths.trashRoot, { recursive: true }),
  ]);

  const preview = await previewStorageMigration(projectRoot, { ...options, mode: paths.mode });
  let migration = { migrated: false, preview };
  if (preview.destinationExists) {
    if (!preview.destinationValid) {
      throw new Error(`Campaign destination is not valid: ${preview.destinationError}`);
    }
  } else if (preview.required) {
    if (!preview.canMigrate) {
      throw new Error(
        preview.collisions.length
          ? `Campaign migration found ID collisions: ${preview.collisions.join(', ')}.`
          : 'Campaign migration does not have enough free space for a recoverable copy.',
      );
    }
    const staging = path.join(paths.dataRoot, `.campaigns-migrating-${process.pid}-${Date.now()}`);
    try {
      await fsp.cp(paths.legacyCampaignsRoot, staging, { recursive: true, errorOnExist: true });
      if (options.simulateFailureAt === 'after-copy')
        throw new Error('Simulated migration interruption.');
      const validated = await validateCampaignTree(staging);
      await fsp.rename(staging, paths.campaignsRoot);
      if (options.simulateFailureAt === 'after-rename')
        throw new Error('Simulated migration interruption.');
      migration = { migrated: true, preview, validated };
    } catch (error) {
      await fsp.rm(staging, { recursive: true, force: true });
      throw error;
    }
  } else {
    await fsp.mkdir(paths.campaignsRoot, { recursive: true });
    await writeJsonAtomic(path.join(paths.campaignsRoot, 'campaigns.json'), []);
  }

  if (
    paths.campaignsRoot !== paths.legacyCampaignsRoot &&
    (await exists(paths.legacyCampaignsRoot))
  ) {
    const rollbackRoot = path.join(paths.backupsRoot, 'pre-storage-migration');
    if (!(await exists(rollbackRoot))) {
      const rollbackStaging = `${rollbackRoot}.${process.pid}.${Date.now()}.tmp`;
      await fsp.cp(paths.legacyCampaignsRoot, rollbackStaging, {
        recursive: true,
        errorOnExist: true,
      });
      await validateCampaignTree(rollbackStaging);
      await fsp.rename(rollbackStaging, rollbackRoot);
    }
    migration.rollbackRoot = rollbackRoot;
  }

  await migrateAncillaryData(paths);
  await recordOwnership(paths, migration);
  return { paths, migration };
}

async function materializeCampaigns(projectRoot, options = {}) {
  const paths = resolveStoragePaths(projectRoot, options);
  if (paths.campaignsRoot === paths.buildMirrorRoot) return { changed: false, paths };
  await validateCampaignTree(paths.campaignsRoot);
  const staging = path.join(
    path.dirname(paths.buildMirrorRoot),
    `.campaigns-build-${process.pid}-${Date.now()}`,
  );
  const previous = path.join(paths.applicationRoot, '.questkeeper', 'previous-build-campaigns');
  await fsp.cp(paths.campaignsRoot, staging, { recursive: true, errorOnExist: true });
  await validateCampaignTree(staging);
  await fsp.rm(previous, { recursive: true, force: true });
  if (await exists(paths.buildMirrorRoot)) {
    await fsp.mkdir(path.dirname(previous), { recursive: true });
    await fsp.rename(paths.buildMirrorRoot, previous);
  }
  try {
    await fsp.rename(staging, paths.buildMirrorRoot);
  } catch (error) {
    if (await exists(previous)) await fsp.rename(previous, paths.buildMirrorRoot);
    throw error;
  }
  return { changed: true, paths };
}

async function createCampaignBackup(projectRoot, options = {}) {
  const paths = resolveStoragePaths(projectRoot, options);
  await validateCampaignTree(paths.campaignsRoot);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = path.join(paths.backupsRoot, stamp);
  await fsp.mkdir(destination, { recursive: true });
  await fsp.cp(paths.campaignsRoot, path.join(destination, 'campaigns'), {
    recursive: true,
    errorOnExist: true,
  });
  const includesLocalCompendia = await exists(paths.compendiaRoot);
  if (includesLocalCompendia) {
    await fsp.cp(paths.compendiaRoot, path.join(destination, 'compendia'), {
      recursive: true,
      errorOnExist: true,
    });
  }
  await writeJsonAtomic(path.join(destination, 'backup.json'), {
    version: STORAGE_VERSION,
    createdAt: new Date().toISOString(),
    source: paths.campaignsRoot,
    includesLocalCompendia,
    privacy:
      'Local recovery backup. It may contain private user-owned compendia and is not a sharing export.',
  });
  return { destination, createdAt: stamp };
}

function publicStorageSummary(paths) {
  return {
    mode: paths.mode,
    application: paths.applicationRoot,
    runtime: paths.runtimeRoot,
    campaigns: paths.campaignsRoot,
    compendia: paths.compendiaRoot,
    configuration: paths.configRoot,
    transcripts: paths.transcriptsRoot,
    backups: paths.backupsRoot,
    logs: paths.logsRoot,
    cache: paths.cacheRoot,
  };
}

module.exports = {
  STORAGE_VERSION,
  createCampaignBackup,
  materializeCampaigns,
  prepareStorage,
  previewStorageMigration,
  publicStorageSummary,
  resolveStoragePaths,
  validateCampaignTree,
};
