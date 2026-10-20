const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const setupBatch = read('setup.bat');
const setupPowerShell = read('setup.ps1');
const managerLauncher = read('launch-manager.bat');
const companionLauncher = read('launch-companion.bat');
const installationGuide = read('docs/INSTALLATION-GUIDE.md');

const checks = [
  [
    'double-click setup delegates to the graphical PowerShell bootstrap',
    setupBatch.includes('-STA -File') && setupBatch.includes('setup.ps1'),
  ],
  ['a native Windows setup interface', setupPowerShell.includes('System.Windows.Forms')],
  [
    'English and Italian setup copy',
    setupPowerShell.includes('Prepare your campaign workshop') &&
      setupPowerShell.includes('Prepara il laboratorio della campagna'),
  ],
  [
    'official Node.js 24 discovery',
    setupPowerShell.includes('https://nodejs.org/dist/index.json') &&
      setupPowerShell.includes("'^v24\\.'"),
  ],
  [
    'verified Node.js installer download',
    setupPowerShell.includes('SHASUMS256.txt') && setupPowerShell.includes('Get-FileHash'),
  ],
  [
    'explicit Windows elevation for Node installation',
    setupPowerShell.includes('-Verb RunAs') && setupPowerShell.includes('msiexec.exe'),
  ],
  ['locked dependency installation', setupPowerShell.includes('npm.FullName ci')],
  [
    'optional desktop shortcuts',
    setupPowerShell.includes('WScript.Shell') &&
      setupPowerShell.includes('QuestKeeper Campaign Manager') &&
      setupPowerShell.includes('QuestKeeper Companion'),
  ],
  [
    'dedicated launchers',
    managerLauncher.includes('campaign-manager\\server.mjs --open') &&
      companionLauncher.includes('npm.cmd start -- --open'),
  ],
  [
    'documented trust and shortcut behavior',
    installationGuide.includes('SHA-256') && installationGuide.includes('desktop shortcuts'),
  ],
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => `Missing ${label}.`);

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
    failures.push('Windows setup.ps1 did not pass the PowerShell syntax parser.');
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  'Windows installer verified: bilingual GUI, official checksum-verified Node.js 24 bootstrap, locked dependencies and optional desktop launchers.',
);
