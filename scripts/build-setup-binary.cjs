const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.resolve(
  process.env.QUESTKEEPER_SETUP_OUT || path.join(root, 'dist', 'setup'),
);
const executableName = process.platform === 'win32' ? 'QuestKeeper-Setup.exe' : 'questkeeper-setup';
const executablePath = path.join(outputDirectory, executableName);
const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'questkeeper-sea-'));
const blobPath = path.join(workDirectory, 'questkeeper-setup.blob');
const configPath = path.join(workDirectory, 'sea-config.json');
const postjectPath = require.resolve('postject/dist/cli.js');

function hideWindowsConsole(executable) {
  const bytes = fs.readFileSync(executable);
  const peOffset = bytes.readUInt32LE(0x3c);
  if (bytes.toString('ascii', peOffset, peOffset + 4) !== 'PE\u0000\u0000') {
    throw new Error('The generated Windows executable has no valid PE header.');
  }
  bytes.writeUInt16LE(2, peOffset + 24 + 68); // IMAGE_SUBSYSTEM_WINDOWS_GUI
  fs.writeFileSync(executable, bytes);
}

if (Number.parseInt(process.versions.node.split('.')[0], 10) !== 24) {
  throw new Error(`Setup binaries must be built with Node.js 24; found ${process.version}.`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  configPath,
  JSON.stringify(
    {
      main: path.join(root, 'tools', 'setup-wizard', 'server.cjs'),
      output: blobPath,
      disableExperimentalSEAWarning: true,
      useSnapshot: false,
      useCodeCache: false,
      execArgvExtension: 'none',
      assets: {
        'setup/index.html': path.join(root, 'tools', 'setup-wizard', 'public', 'index.html'),
        'setup/setup.css': path.join(root, 'tools', 'setup-wizard', 'public', 'setup.css'),
        'setup/setup.js': path.join(root, 'tools', 'setup-wizard', 'public', 'setup.js'),
      },
    },
    null,
    2,
  ),
);

try {
  execFileSync(process.execPath, ['--experimental-sea-config', configPath], {
    cwd: root,
    stdio: 'inherit',
  });
  fs.copyFileSync(process.execPath, executablePath);
  if (process.platform === 'darwin') {
    try {
      execFileSync('codesign', ['--remove-signature', executablePath], { stdio: 'ignore' });
    } catch {
      // A source Node binary may not carry a removable signature.
    }
  }
  const postjectArgs = [
    postjectPath,
    executablePath,
    'NODE_SEA_BLOB',
    blobPath,
    '--sentinel-fuse',
    'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
    '--overwrite',
  ];
  if (process.platform === 'darwin') postjectArgs.push('--macho-segment-name', 'NODE_SEA');
  execFileSync(process.execPath, postjectArgs, { cwd: root, stdio: 'inherit' });
  if (process.platform === 'darwin') {
    execFileSync('codesign', ['--sign', '-', executablePath], { stdio: 'inherit' });
  }
  if (process.platform !== 'win32') fs.chmodSync(executablePath, 0o755);
  execFileSync(executablePath, ['--self-test'], {
    cwd: root,
    env: { ...process.env, QUESTKEEPER_ROOT: root },
    stdio: 'inherit',
  });
  if (process.platform === 'win32') hideWindowsConsole(executablePath);
  console.log(`QuestKeeper setup binary created at ${executablePath}`);
} finally {
  fs.rmSync(workDirectory, { recursive: true, force: true });
}
