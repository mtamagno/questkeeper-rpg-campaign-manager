const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const workflow = read('.github/workflows/release.yml');
const setupBatch = read('setup.bat');
const setupWizard = read('tools/setup-wizard/server.cjs');
const setupBuilder = read('scripts/build-setup-binary.cjs');
const setupShell = read('setup.sh');
const releaseNotes = `docs/releases/v${packageJson.version}.md`;
const releaseCodex = 'RELEASES.md';
const releaseAssetDirectory = 'docs/images/releases';
const failures = [];

if (
  packageJson.version !== packageLock.version ||
  packageJson.version !== packageLock.packages?.['']?.version
) {
  failures.push('package.json and package-lock.json do not share one release version.');
}

if (!fs.existsSync(path.join(root, releaseNotes))) {
  failures.push(`Missing release notes: ${releaseNotes}.`);
}

if (!fs.existsSync(path.join(root, releaseCodex))) {
  failures.push(`Missing release identity registry: ${releaseCodex}.`);
}

const currentReleaseNotes = fs.existsSync(path.join(root, releaseNotes)) ? read(releaseNotes) : '';
const currentReleaseAssets = fs.existsSync(path.join(root, releaseAssetDirectory))
  ? fs
      .readdirSync(path.join(root, releaseAssetDirectory))
      .filter((file) => file.startsWith(`v${packageJson.version}-`))
  : [];

if (
  !new RegExp(`^# QuestKeeper ${packageJson.version} · [^\\r\\n]+`, 'm').test(currentReleaseNotes)
) {
  failures.push(`Release notes must name the v${packageJson.version} codename.`);
}

if (!currentReleaseNotes.includes('Release companion ·')) {
  failures.push(`Release notes must introduce the v${packageJson.version} release companion.`);
}

if (currentReleaseAssets.length === 0) {
  failures.push(
    `Missing companion art beginning with v${packageJson.version}- in ${releaseAssetDirectory}.`,
  );
}

if (!currentReleaseAssets.some((file) => currentReleaseNotes.includes(file))) {
  failures.push(`Release notes do not reference their v${packageJson.version} companion art.`);
}

if (
  fs.existsSync(path.join(root, releaseCodex)) &&
  !read(releaseCodex).includes(`**${packageJson.version}**`)
) {
  failures.push(`The Release Codex does not list v${packageJson.version}.`);
}

for (const marker of [
  'npm run verify',
  'npm run build:setup',
  'git archive',
  'sha256sum',
  'gh release create',
  'actions/upload-artifact@v7',
  'actions/download-artifact@v8',
]) {
  if (!workflow.includes(marker)) failures.push(`Release workflow is missing: ${marker}.`);
}

for (const target of ['windows-x64', 'linux-x64', 'macos-intel', 'macos-apple-silicon']) {
  if (!workflow.includes(target))
    failures.push(`Release workflow is missing native target: ${target}.`);
}

if (
  !setupBatch.includes('QuestKeeper-Setup.exe') ||
  !setupShell.includes('questkeeper-setup') ||
  !setupWizard.includes('SHASUMS256.txt') ||
  !setupBuilder.includes('NODE_SEA_BLOB')
) {
  failures.push('Release entries must prefer the verified cross-platform SEA setup.');
}

for (const launcher of ['launch-manager.bat', 'launch-companion.bat']) {
  if (!fs.existsSync(path.join(root, launcher))) {
    failures.push(`Missing Windows desktop launcher: ${launcher}.`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);

for (const launcher of [
  'setup.bat',
  'setup.ps1',
  'setup.command',
  'setup.sh',
  'launch-manager.bat',
  'launch-companion.bat',
  'tools/setup-wizard/server.cjs',
  'tools/setup-wizard/public/index.html',
  'tools/setup-wizard/public/setup.css',
  'tools/setup-wizard/public/setup.js',
  'scripts/build-setup-binary.cjs',
]) {
  if (!trackedFiles.includes(launcher)) {
    failures.push(`Windows setup entry is not part of the release archive: ${launcher}.`);
  }
}

const forbiddenTrackedPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)\.campaign-manager\//,
  /(^|\/)informationFTP\.txt$/i,
  /(^|\/)discord-transcriber\/\.env$/i,
  /(^|\/)discord-transcriber\/transcripts\//i,
];

for (const file of trackedFiles) {
  if (forbiddenTrackedPatterns.some((pattern) => pattern.test(file))) {
    failures.push(`Forbidden release input is tracked: ${file}.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Release contract verified for v${packageJson.version}: codename, companion, four native archives, checksums, standalone setup and tracked-file privacy guard.`,
);
