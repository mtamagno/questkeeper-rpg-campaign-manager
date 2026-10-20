const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');

async function verifyShutdown() {
  const packagedExecutable = process.env.QUESTKEEPER_SETUP_EXECUTABLE;
  const executable = packagedExecutable ? path.resolve(packagedExecutable) : process.execPath;
  const executableArguments = packagedExecutable ? [] : ['tools/setup-wizard/server.cjs'];
  const child = spawn(executable, executableArguments, {
    cwd: root,
    env: {
      ...process.env,
      QUESTKEEPER_NO_BROWSER: '1',
      QUESTKEEPER_SETUP_PORT: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let stdout = '';
  let stderr = '';
  let shutdownRequested = false;

  const exited = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve(code));
  });

  const shutdown = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Setup did not expose its local URL.')),
      5_000,
    );
    child.stdout.on('data', async (chunk) => {
      stdout += chunk.toString('utf8');
      const match = stdout.match(/QuestKeeper Setup: (http:\/\/[^\s]+)/);
      if (!match || shutdownRequested) return;
      shutdownRequested = true;
      try {
        const setupUrl = new URL(match[1]);
        const unauthorised = await fetch(new URL('/api/shutdown', setupUrl), { method: 'POST' });
        if (unauthorised.status !== 403) {
          throw new Error(`Unauthorised shutdown returned ${unauthorised.status}.`);
        }
        const authorisedUrl = new URL('/api/shutdown', setupUrl);
        authorisedUrl.searchParams.set('token', setupUrl.searchParams.get('token'));
        const response = await fetch(authorisedUrl, { method: 'POST' });
        const result = await response.json();
        if (!response.ok || result.closing !== true) {
          throw new Error(`Authorised shutdown returned ${response.status}.`);
        }
        clearTimeout(timeout);
        resolve();
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString('utf8');
  });

  const forceStop = setTimeout(() => child.kill(), 8_000);
  try {
    await shutdown;
    const code = await exited;
    if (code !== 0) {
      throw new Error(`Setup exited with ${code}: ${stderr || stdout}`);
    }
  } finally {
    clearTimeout(forceStop);
    if (child.exitCode === null) child.kill();
  }
}

verifyShutdown()
  .then(() => console.log('Setup shutdown verified: authorised request closes the local process.'))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
