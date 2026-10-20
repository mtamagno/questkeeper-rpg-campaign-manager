const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const wizard = read('tools/setup-wizard/server.cjs');
const interfaceHtml = read('tools/setup-wizard/public/index.html');
const interfaceScript = read('tools/setup-wizard/public/setup.js');
const builder = read('scripts/build-setup-binary.cjs');
const workflow = read('.github/workflows/release.yml');
const installationGuide = read('docs/INSTALLATION-GUIDE.md');
const setupBatch = read('setup.bat');
const setupCommand = read('setup.command');
const setupShell = read('setup.sh');

const checks = [
  ['a loopback-only setup server', wizard.includes("const HOST = '127.0.0.1'")],
  ['a random local setup token', wizard.includes('crypto.randomBytes(24)')],
  [
    'English and Italian setup copy',
    interfaceScript.includes('Prepare your campaign workshop') &&
      interfaceScript.includes('Prepara il laboratorio della campagna'),
  ],
  [
    'visible setup choices',
    interfaceHtml.includes('manager-shortcut') &&
      interfaceHtml.includes('companion-shortcut') &&
      interfaceHtml.includes('launch-manager'),
  ],
  [
    'official Node.js 24 discovery and verification',
    wizard.includes('https://nodejs.org/dist/index.json') &&
      wizard.includes('SHASUMS256.txt') &&
      wizard.includes("createHash('sha256')"),
  ],
  [
    'an application-owned portable runtime',
    wizard.includes("const runtimeHome = '.questkeeper/runtime'") &&
      !wizard.includes('msiexec.exe'),
  ],
  ['locked dependency installation', wizard.includes("[npmCliPath(), 'ci']")],
  [
    'desktop launchers on every platform',
    wizard.includes('createWindowsShortcut') &&
      wizard.includes('createLinuxShortcut') &&
      wizard.includes('createMacShortcut'),
  ],
  [
    'Node.js SEA construction and smoke test',
    builder.includes('--experimental-sea-config') &&
      builder.includes('NODE_SEA_BLOB') &&
      builder.includes('--self-test'),
  ],
  [
    'four native release targets',
    ['windows-latest', 'ubuntu-latest', 'macos-15-intel', 'macos-15'].every((label) =>
      workflow.includes(label),
    ),
  ],
  [
    'release-first wrappers with source fallbacks',
    setupBatch.includes('QuestKeeper-Setup.exe') &&
      setupBatch.includes('setup.ps1') &&
      setupCommand.includes('QuestKeeper Setup.app') &&
      setupShell.includes('questkeeper-setup'),
  ],
  [
    'documented trust and unsigned-binary behavior',
    installationGuide.includes('SHA-256') &&
      installationGuide.includes('SmartScreen') &&
      installationGuide.includes('Gatekeeper'),
  ],
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => `Missing ${label}.`);

try {
  const output = execFileSync(process.execPath, ['tools/setup-wizard/server.cjs', '--self-test'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (!JSON.parse(output).ok) failures.push('Setup wizard source self-test did not pass.');
} catch (error) {
  failures.push(`Setup wizard source self-test failed: ${error.message}`);
}

if (process.platform === 'win32') {
  try {
    execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `$errors=$null; [System.Management.Automation.Language.Parser]::ParseFile('${path.join(root, 'setup.ps1').replaceAll("'", "''")}', [ref]$null, [ref]$errors) | Out-Null; if($errors.Count){$errors | ForEach-Object { Write-Error $_.Message }; exit 1}`,
      ],
      { stdio: 'pipe' },
    );
  } catch {
    failures.push('The legacy Windows setup.ps1 fallback did not pass its syntax parser.');
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  'Cross-platform installer verified: bilingual loopback UI, checksum-verified private Node.js 24 runtime, native SEA builds and desktop launchers.',
);
