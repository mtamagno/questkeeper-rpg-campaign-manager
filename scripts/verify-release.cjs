const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const packageLock = JSON.parse(read('package-lock.json'));
const workflow = read('.github/workflows/release.yml');
const setupFiles = ['setup.bat', 'setup.ps1', 'setup.sh'].map(read);
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

for (const marker of ['npm run verify', 'git archive', 'sha256sum', 'gh release create']) {
  if (!workflow.includes(marker)) failures.push(`Release workflow is missing: ${marker}.`);
}

if (setupFiles.some((source) => !source.includes('npm ci'))) {
  failures.push('Every primary platform setup script must install locked dependencies.');
}

const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);

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
  `Release contract verified for v${packageJson.version}: codename, companion, notes, archives, checksums, setup bootstrap and tracked-file privacy guard.`,
);
