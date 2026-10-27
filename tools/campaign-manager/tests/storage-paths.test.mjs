import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';

import storagePaths from '../../storage-paths.cjs';

const {
  createCampaignBackup,
  materializeCampaigns,
  prepareStorage,
  previewStorageMigration,
  resolveStoragePaths,
} = storagePaths;

async function fixture(t, name = 'questkeeper-storage-') {
  const root = await mkdtemp(join(tmpdir(), name));
  const campaigns = join(root, 'src', 'campaigns');
  await mkdir(join(campaigns, 'old-road', 'data'), { recursive: true });
  await mkdir(join(campaigns, 'old-road', 'images', 'group'), { recursive: true });
  await writeFile(
    join(campaigns, 'campaigns.json'),
    `${JSON.stringify([{ id: 'old-road', name: { en: 'The Old Road' } }], null, 2)}\n`,
  );
  await writeFile(
    join(campaigns, 'old-road', 'data', 'campaign.json'),
    `${JSON.stringify({ name: { en: 'The Old Road' }, stableId: 'never-change' }, null, 2)}\n`,
  );
  await writeFile(join(campaigns, 'old-road', 'images', 'group', 'map.txt'), 'original asset');
  await mkdir(join(root, '.campaign-manager'), { recursive: true });
  await writeFile(join(root, '.campaign-manager', 'ai-config.json'), '{"secret":"kept"}\n');
  await mkdir(join(root, 'discord-transcriber', 'transcripts'), { recursive: true });
  await writeFile(join(root, 'discord-transcriber', '.env'), 'DISCORD_TOKEN=private\n');
  await writeFile(
    join(root, 'discord-transcriber', 'transcripts', 'session.md'),
    '# Existing transcript\n',
  );
  t.after(async () => {
    const rel = relative(tmpdir(), root);
    assert.match(rel, /^questkeeper-storage-/);
    await rm(root, { recursive: true, force: true });
  });
  return root;
}

function userOptions(root, platform = process.platform) {
  return {
    mode: 'user',
    platform,
    homeDir: join(root, 'home'),
    env: {},
    dataRoot: join(root, 'owned', 'data'),
    configRoot: join(root, 'owned', 'config'),
    stateRoot: join(root, 'owned', 'state'),
    cacheRoot: join(root, 'owned', 'cache'),
  };
}

test('resolves user and portable roots without mixing replaceable runtime files', () => {
  const root = join(tmpdir(), 'questkeeper-storage-contract');
  for (const [platform, home, expected] of [
    ['win32', join(root, 'windows-home'), ['AppData', 'Local', 'QuestKeeper', 'data']],
    ['darwin', join(root, 'mac-home'), ['Library', 'Application Support', 'QuestKeeper', 'data']],
    ['linux', join(root, 'linux-home'), ['.local', 'share', 'questkeeper']],
  ]) {
    const paths = resolveStoragePaths(root, { mode: 'user', platform, homeDir: home, env: {} });
    assert.ok(expected.every((segment) => paths.dataRoot.includes(segment)));
    assert.notEqual(paths.campaignsRoot, paths.runtimeRoot);
    assert.notEqual(paths.configRoot, paths.applicationRoot);
    assert.ok(paths.transcriptsRoot.startsWith(paths.dataRoot));
    assert.ok(paths.backupsRoot.startsWith(paths.dataRoot));
  }

  const portable = resolveStoragePaths(root, { mode: 'portable', env: {} });
  assert.equal(portable.mode, 'portable');
  assert.ok(portable.campaignsRoot.startsWith(join(root, '.questkeeper', 'user-data')));
  assert.ok(portable.configRoot.startsWith(join(root, '.questkeeper', 'user-data')));
  assert.notEqual(portable.runtimeRoot, portable.dataRoot);
});

test('previews, copies, validates and adopts a 1.1.4 campaign tree without changing IDs', async (t) => {
  const root = await fixture(t);
  const options = userOptions(root);
  const preview = await previewStorageMigration(root, options);
  assert.equal(preview.required, true);
  assert.equal(preview.canMigrate, true);
  assert.deepEqual(preview.collisions, []);
  assert.equal(preview.sourceCampaigns, 1);

  const prepared = await prepareStorage(root, options);
  assert.equal(prepared.migration.migrated, true);
  const migrated = JSON.parse(
    await readFile(join(prepared.paths.campaignsRoot, 'old-road', 'data', 'campaign.json'), 'utf8'),
  );
  assert.equal(migrated.stableId, 'never-change');
  assert.equal(
    await readFile(
      join(prepared.paths.legacyCampaignsRoot, 'old-road', 'images', 'group', 'map.txt'),
      'utf8',
    ),
    'original asset',
  );
  assert.equal(
    await readFile(
      join(prepared.migration.rollbackRoot, 'old-road', 'images', 'group', 'map.txt'),
      'utf8',
    ),
    'original asset',
  );
  assert.equal(await readFile(prepared.paths.aiConfigFile, 'utf8'), '{"secret":"kept"}\n');
  assert.equal(await readFile(prepared.paths.scribeEnvFile, 'utf8'), 'DISCORD_TOKEN=private\n');
  assert.equal(
    await readFile(join(prepared.paths.transcriptsRoot, 'session.md'), 'utf8'),
    '# Existing transcript\n',
  );

  const selected = resolveStoragePaths(root);
  assert.equal(selected.mode, 'user');
  assert.equal(selected.campaignsRoot, prepared.paths.campaignsRoot);
});

test('an interrupted migration removes staging and leaves the original readable', async (t) => {
  const root = await fixture(t);
  const options = { ...userOptions(root), simulateFailureAt: 'after-copy' };
  await assert.rejects(prepareStorage(root, options), /Simulated migration interruption/);
  const paths = resolveStoragePaths(root, userOptions(root));
  assert.equal(
    JSON.parse(await readFile(join(paths.legacyCampaignsRoot, 'campaigns.json'), 'utf8'))[0].id,
    'old-road',
  );
  await assert.rejects(readFile(paths.selectionFile, 'utf8'), /ENOENT/);
  await assert.rejects(readFile(join(paths.campaignsRoot, 'campaigns.json'), 'utf8'), /ENOENT/);
});

test('an interruption after the atomic switch remains recoverable on the next run', async (t) => {
  const root = await fixture(t);
  const options = { ...userOptions(root), simulateFailureAt: 'after-rename' };
  await assert.rejects(prepareStorage(root, options), /Simulated migration interruption/);

  const paths = resolveStoragePaths(root, userOptions(root));
  assert.equal(
    JSON.parse(await readFile(join(paths.legacyCampaignsRoot, 'campaigns.json'), 'utf8'))[0].id,
    'old-road',
  );
  assert.equal(
    JSON.parse(await readFile(join(paths.campaignsRoot, 'campaigns.json'), 'utf8'))[0].id,
    'old-road',
  );
  await assert.rejects(readFile(paths.selectionFile, 'utf8'), /ENOENT/);

  const resumed = await prepareStorage(root, userOptions(root));
  assert.equal(resumed.migration.migrated, false);
  assert.equal(resolveStoragePaths(root).campaignsRoot, paths.campaignsRoot);
});

test('materializes only a replaceable build mirror and creates full local backups', async (t) => {
  const root = await fixture(t);
  const options = userOptions(root);
  const { paths } = await prepareStorage(root, options);
  const campaignFile = join(paths.campaignsRoot, 'old-road', 'data', 'campaign.json');
  const campaign = JSON.parse(await readFile(campaignFile, 'utf8'));
  campaign.name.en = 'The Safely Updated Road';
  await writeFile(campaignFile, `${JSON.stringify(campaign, null, 2)}\n`);

  const materialized = await materializeCampaigns(root);
  assert.equal(materialized.changed, true);
  const mirror = JSON.parse(
    await readFile(join(paths.buildMirrorRoot, 'old-road', 'data', 'campaign.json'), 'utf8'),
  );
  assert.equal(mirror.name.en, 'The Safely Updated Road');
  assert.equal(
    await readFile(
      join(paths.backupsRoot, 'pre-storage-migration', 'old-road', 'data', 'campaign.json'),
      'utf8',
    ).then((value) => JSON.parse(value).name.en),
    'The Old Road',
  );

  const backup = await createCampaignBackup(root);
  assert.equal(
    await readFile(
      join(backup.destination, 'campaigns', 'old-road', 'images', 'group', 'map.txt'),
      'utf8',
    ),
    'original asset',
  );
});
