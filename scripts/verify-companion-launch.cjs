const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'questkeeper-companion-launch-'));

function freePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function stopTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // The test server has already stopped.
    }
  }
}

(async () => {
  let pid;
  try {
    const port = await freePort();
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      QUESTKEEPER_TEST_NODE_PATH: process.execPath,
      QUESTKEEPER_ROOT: root,
      QUESTKEEPER_COMPANION_PORT: String(port),
      QUESTKEEPER_LAUNCH_STATE_ROOT: stateRoot,
      QUESTKEEPER_NO_BROWSER: '1',
    };
    const executable = process.env.QUESTKEEPER_LAUNCH_EXECUTABLE || process.execPath;
    const command = process.env.QUESTKEEPER_LAUNCH_EXECUTABLE
      ? ['--launch-companion']
      : ['tools/setup-wizard/server.cjs', '--launch-companion'];
    execFileSync(executable, command, { cwd: root, env, timeout: 45_000, stdio: 'pipe' });

    const processFile = path.join(stateRoot, 'run', 'companion.json');
    const first = JSON.parse(fs.readFileSync(processFile, 'utf8'));
    pid = first.pid;
    const response = await fetch(`http://127.0.0.1:${port}`, {
      signal: AbortSignal.timeout(3_000),
    });
    const html = await response.text();
    if (!response.ok || !html.includes('QuestKeeper')) {
      throw new Error('The shortcut launcher did not start the QuestKeeper Companion.');
    }

    execFileSync(executable, command, { cwd: root, env, timeout: 10_000, stdio: 'pipe' });
    const second = JSON.parse(fs.readFileSync(processFile, 'utf8'));
    if (second.pid !== first.pid) throw new Error('A repeated launch spawned a second Companion.');

    const log = fs.readFileSync(path.join(stateRoot, 'logs', 'companion-launch.log'), 'utf8');
    if (!log.includes('Companion ready') || !log.includes('Reused the running Companion')) {
      throw new Error('The Companion launcher did not record readiness and reuse diagnostics.');
    }
    console.log(
      'Companion shortcut launch verified: readiness, browser-safe reuse and diagnostics.',
    );
  } finally {
    stopTree(pid);
    fs.rmSync(stateRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
