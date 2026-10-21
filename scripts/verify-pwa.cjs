const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));

async function main() {
  const manifest = readJson('public/manifest.webmanifest');
  assert.equal(manifest.start_url, './', 'PWA start_url must remain hosting-path agnostic');
  assert.equal(manifest.scope, './', 'PWA scope must remain hosting-path agnostic');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.short_name, 'QuestKeeper');

  const expectedIcons = new Map([
    ['icons/questkeeper-192.png', 192],
    ['icons/questkeeper-512.png', 512],
    ['icons/questkeeper-maskable-192.png', 192],
    ['icons/questkeeper-maskable-512.png', 512],
  ]);
  assert.deepEqual(
    new Set(manifest.icons.map(({ src }) => src)),
    new Set(expectedIcons.keys()),
    'Manifest icon contract changed',
  );

  for (const [relativePath, expectedSize] of expectedIcons) {
    const metadata = await sharp(path.join(root, 'public', relativePath)).metadata();
    assert.equal(metadata.width, expectedSize, `${relativePath} has the wrong width`);
    assert.equal(metadata.height, expectedSize, `${relativePath} has the wrong height`);
  }

  const angular = readJson('angular.json');
  const project = Object.values(angular.projects)[0];
  assert.equal(
    project.architect.build.configurations.production.serviceWorker,
    'ngsw-config.json',
    'Production builds must emit the service worker',
  );

  const workerConfig = readJson('ngsw-config.json');
  assert.equal(workerConfig.index, '/index.html');
  assert.equal(
    workerConfig.dataGroups,
    undefined,
    'Task one must not claim campaign content is available offline yet',
  );
  const workerFiles = JSON.stringify(workerConfig.assetGroups);
  assert.ok(workerFiles.includes('manifest.webmanifest'));
  assert.ok(!workerFiles.includes('/campaigns/'), 'Campaign caching belongs to task two');

  const index = read('src/index.html');
  assert.match(index, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(index, /rel="apple-touch-icon" href="icons\/questkeeper-192\.png"/);

  const appConfig = read('src/app/app.config.ts');
  assert.match(appConfig, /provideServiceWorker\('ngsw-worker\.js'/);
  assert.match(appConfig, /enabled: !isDevMode\(\)/);

  const installService = read('src/app/guild/services/pwaInstall.service.ts');
  assert.match(installService, /beforeinstallprompt/);
  assert.match(installService, /appinstalled/);
  assert.match(installService, /display-mode: standalone/);

  const commandBar = read(
    'src/app/guild/components/site-command-bar/site-command-bar.component.html',
  );
  assert.match(commandBar, /@if \(canInstall\(\)\)/);
  assert.match(commandBar, /installCompanion\(\)/);
  assert.match(commandBar, /Installa/);
  assert.match(commandBar, /Install/);

  const distRoot = path.join(root, 'dist');
  if (fs.existsSync(distRoot)) {
    const browserDirectories = fs
      .readdirSync(distRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(distRoot, entry.name, 'browser'))
      .filter((candidate) => fs.existsSync(candidate));

    for (const browserDirectory of browserDirectories) {
      for (const output of [
        'manifest.webmanifest',
        'ngsw-worker.js',
        'ngsw.json',
        'icons/questkeeper-192.png',
        'icons/questkeeper-512.png',
      ]) {
        assert.ok(
          fs.existsSync(path.join(browserDirectory, output)),
          `Production output is missing ${output}`,
        );
      }
    }
  }

  console.log('QuestKeeper PWA installability contract verified.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
