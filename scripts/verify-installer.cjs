const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { embedRuntimeSelection } = require('./lib/create-sea-entry.cjs');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const wizard = read('tools/setup-wizard/server.cjs');
const interfaceHtml = read('tools/setup-wizard/public/index.html');
const interfaceScript = read('tools/setup-wizard/public/setup.js');
const builder = read('scripts/build-setup-binary.cjs');
const workflow = read('.github/workflows/release.yml');
const installationGuide = read('docs/INSTALLATION-GUIDE.md');
const packageManifest = JSON.parse(read('package.json'));
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
      interfaceHtml.includes('launch-manager') &&
      interfaceHtml.includes('runtime-private') &&
      interfaceHtml.includes('runtime-system') &&
      interfaceHtml.includes('system-runtime'),
  ],
  [
    'a bilingual setup shutdown control',
    interfaceHtml.includes('close-setup') &&
      interfaceScript.includes("closeSetup: 'Close setup'") &&
      interfaceScript.includes("closeSetup: 'Chiudi setup'") &&
      interfaceScript.includes("api('shutdown'") &&
      wizard.includes("requestUrl.pathname === '/api/shutdown'") &&
      wizard.includes('setupServer.close'),
  ],
  [
    'official Node.js 26 discovery and verification',
    wizard.includes('https://nodejs.org/dist/index.json') &&
      wizard.includes('/^v26\\./') &&
      wizard.includes('SHASUMS256.txt') &&
      wizard.includes("createHash('sha256')"),
  ],
  [
    'one enforced Node.js 26 runtime contract',
    packageManifest.engines?.node === '>=26 <27' &&
      read('.nvmrc').trim() === '26' &&
      interfaceScript.includes('Node.js 26') &&
      setupShell.includes('NODE_MAJOR') &&
      setupShell.includes('!= "26"'),
  ],
  [
    'an application-owned portable runtime',
    wizard.includes("const runtimeHome = '.questkeeper/runtime'") &&
      !wizard.includes('msiexec.exe'),
  ],
  [
    'validated selectable runtime persistence and fallback',
    wizard.includes("runtimePreference === 'system'") &&
      wizard.includes('runtime-selection.json') &&
      wizard.includes('validateCandidate(selection.nodePath)') &&
      wizard.includes('Falling back to a private verified runtime'),
  ],
  ['locked dependency installation', wizard.includes("[runtime.npmCliPath, 'ci']")],
  [
    'desktop launchers on every platform',
    wizard.includes('createWindowsShortcut') &&
      wizard.includes('createLinuxShortcut') &&
      wizard.includes('createMacShortcut'),
  ],
  [
    'space-safe Windows shortcut values',
    wizard.includes('QUESTKEEPER_SHORTCUT_PATH') &&
      wizard.includes('QUESTKEEPER_SHORTCUT_WORKING_DIRECTORY') &&
      !wizard.includes('CreateShortcut($args[0])'),
  ],
  [
    'Node.js SEA construction and smoke test',
    builder.includes('--experimental-sea-config') &&
      builder.includes('NODE_SEA_BLOB') &&
      builder.includes('createSeaEntry()') &&
      builder.includes('runtime-selection.cjs') &&
      builder.includes('seaEntryPath') &&
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

for (const newline of ['\n', '\r\n']) {
  const fixture = [
    'const {',
    '  discoverNodePaths,',
    '  npmCliCandidates,',
    '  validateRuntimeCandidate,',
    "} = require('./runtime-selection.cjs');",
    "console.log('setup');",
  ].join(newline);
  const embedded = embedRuntimeSelection(fixture, 'module.exports = { ok: true };');
  if (
    embedded.includes("require('./runtime-selection.cjs')") ||
    !embedded.includes('__questkeeperRuntimeSelection')
  ) {
    failures.push(`SEA entry bundling failed for ${newline === '\n' ? 'LF' : 'CRLF'} input.`);
  }
}

try {
  execFileSync(process.execPath, ['--test', 'tools/setup-wizard/runtime-selection.test.cjs'], {
    cwd: root,
    encoding: 'utf8',
  });
} catch (error) {
  failures.push(`Runtime selection unit tests failed: ${error.message}`);
}

try {
  const output = execFileSync(process.execPath, ['tools/setup-wizard/server.cjs', '--self-test'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (!JSON.parse(output).ok) failures.push('Setup wizard source self-test did not pass.');
} catch (error) {
  failures.push(`Setup wizard source self-test failed: ${error.message}`);
}

try {
  execFileSync(process.execPath, ['scripts/verify-setup-shutdown.cjs'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
  });
} catch (error) {
  failures.push(`Setup shutdown integration test failed: ${error.message}`);
}

try {
  execFileSync(process.execPath, ['scripts/verify-companion-launch.cjs'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
  });
} catch (error) {
  failures.push(`Companion shortcut launch integration test failed: ${error.message}`);
}

if (process.platform === 'win32') {
  const shortcutTestRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'QuestKeeper Shortcut Test With Spaces '),
  );
  const shortcutDesktop = path.join(shortcutTestRoot, 'Desktop Folder With Spaces');
  try {
    fs.mkdirSync(shortcutDesktop, { recursive: true });
    const output = execFileSync(
      process.execPath,
      ['tools/setup-wizard/server.cjs', '--self-test-shortcuts'],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, QUESTKEEPER_DESKTOP: shortcutDesktop },
      },
    );
    const result = JSON.parse(output);
    if (!result.ok || result.shortcuts.length !== 2) {
      failures.push('Windows shortcut integration test did not create both launchers.');
    }
    if (
      result.launchers?.length !== 2 ||
      !result.launchers[0].arguments.includes('--launch-manager') ||
      !result.launchers[1].arguments.includes('--launch-companion') ||
      result.launchers[0].arguments === result.launchers[1].arguments
    ) {
      failures.push('Windows shortcuts did not preserve distinct Manager and Companion modes.');
    }
    for (const shortcut of result.shortcuts) {
      if (!fs.existsSync(shortcut)) {
        failures.push(`Windows shortcut integration test did not create ${shortcut}.`);
      }
    }
  } catch (error) {
    failures.push(`Windows shortcut integration test failed: ${error.message}`);
  } finally {
    fs.rmSync(shortcutTestRoot, { recursive: true, force: true });
  }

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
  'Cross-platform installer verified: bilingual loopback UI, validated system/private Node.js 26 selection, native SEA builds, desktop launchers and clean process shutdown.',
);
