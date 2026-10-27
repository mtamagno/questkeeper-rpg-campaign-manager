import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const managerRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = join(managerRoot, '..', '..');
const companionPort = 14200;
const companionUrl = `http://127.0.0.1:${companionPort}`;

function waitForUrl(child) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Manager did not start:\n${output}`)), 8_000);
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      const match = output.match(/Campaign Manager ready at (http:\/\/127\.0\.0\.1:\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[1]);
    });
    child.stderr.on('data', (chunk) => (output += chunk.toString()));
    child.once('error', reject);
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Manager process did not exit.')), 8_000);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });
}

async function post(baseUrl, token, path, body = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl,
      'X-Manager-Token': token,
    },
    body: JSON.stringify(body),
  });
}

test(
  'Manager starts, links, health-checks and stops the Companion preview',
  { timeout: 120_000 },
  async (t) => {
    const child = spawn(process.execPath, [join(managerRoot, 'server.mjs')], {
      cwd: projectRoot,
      env: {
        ...process.env,
        QUESTKEEPER_MANAGER_PORT: '0',
        QUESTKEEPER_COMPANION_PORT: String(companionPort),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let baseUrl;
    let token;
    t.after(async () => {
      if (child.exitCode === null && baseUrl && token) {
        await post(baseUrl, token, '/api/shutdown', {
          confirmation: 'quit',
          scope: 'all',
        }).catch(() => undefined);
      }
      if (child.exitCode === null) child.kill();
    });

    baseUrl = await waitForUrl(child);
    const index = await fetch(baseUrl).then((response) => response.text());
    token = index.match(/name="manager-token" content="([a-f0-9]+)"/)?.[1];
    assert.ok(token);

    const first = await post(baseUrl, token, '/api/actions/preview').then((response) =>
      response.json(),
    );
    assert.equal(first.job.status, 'running');
    assert.match(first.job.commandDisplay, /npm-cli\.js/);
    assert.equal(typeof first.job.runtimePath, 'string');

    const repeated = await post(baseUrl, token, '/api/actions/preview').then((response) =>
      response.json(),
    );
    assert.equal(repeated.job.startedAt, first.job.startedAt, 'repeated clicks must reuse one job');

    const deadline = Date.now() + 90_000;
    let state;
    while (Date.now() < deadline) {
      state = await fetch(`${baseUrl}/api/state`).then((response) => response.json());
      if (state.companion?.action === 'open') break;
      if (state.jobs?.preview?.status === 'failed') {
        throw new Error(state.jobs.preview.logs);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    assert.equal(state?.companion?.action, 'open');
    assert.equal(state?.companion?.canStop, true);
    assert.equal((await fetch(companionUrl)).ok, true);

    const issued = await post(baseUrl, token, '/api/companion-handshake', {
      campaignId: 'example-campaign',
    }).then((response) => response.json());
    const issuedUrl = new URL(issued.url);
    assert.equal(issuedUrl.origin, new URL(companionUrl).origin);
    assert.equal(issuedUrl.pathname, '/example-campaign');
    const handshakeToken = issuedUrl.searchParams.get('qkHandshake');
    assert.ok(handshakeToken);
    const handshakeUrl = `${baseUrl}/api/companion-handshake?token=${handshakeToken}`;
    const accepted = await fetch(handshakeUrl, {
      headers: { Origin: new URL(companionUrl).origin },
    });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.headers.get('access-control-allow-origin'), new URL(companionUrl).origin);
    assert.deepEqual(await accepted.json(), {
      managerUrl: baseUrl,
      campaignId: 'example-campaign',
    });
    assert.equal(
      (
        await fetch(handshakeUrl, {
          headers: { Origin: new URL(companionUrl).origin },
        })
      ).ok,
      false,
      'handshakes are one-use',
    );

    const stopped = await post(baseUrl, token, '/api/actions/preview-stop');
    assert.equal(stopped.status, 202);
    const stopDeadline = Date.now() + 10_000;
    while (Date.now() < stopDeadline && (await fetch(companionUrl).catch(() => null))?.ok) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.equal(await fetch(companionUrl).catch(() => null), null);

    const shutdown = await post(baseUrl, token, '/api/shutdown', {
      confirmation: 'quit',
      scope: 'all',
    });
    assert.equal(shutdown.status, 200);
    assert.equal(await waitForExit(child), 0);
  },
);
