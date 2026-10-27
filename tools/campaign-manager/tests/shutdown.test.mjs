import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const managerRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = join(managerRoot, '..', '..');

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
    const timeout = setTimeout(() => reject(new Error('Manager process did not exit.')), 5_000);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });
}

test('authenticated same-origin shutdown stops the local Manager process', async (t) => {
  const child = spawn(process.execPath, [join(managerRoot, 'server.mjs')], {
    cwd: projectRoot,
    env: { ...process.env, QUESTKEEPER_MANAGER_PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => {
    if (child.exitCode === null) child.kill();
  });

  const baseUrl = await waitForUrl(child);
  const index = await fetch(baseUrl).then((response) => response.text());
  const token = index.match(/name="manager-token" content="([a-f0-9]+)"/)?.[1];
  assert.ok(token, 'the local page receives a process-scoped manager token');

  const invalid = await fetch(`${baseUrl}/api/shutdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Manager-Token': 'invalid' },
    body: JSON.stringify({ confirmation: 'quit' }),
  });
  assert.equal(invalid.ok, false);
  assert.equal(child.exitCode, null);

  const crossOrigin = await fetch(`${baseUrl}/api/shutdown`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://example.invalid',
      'X-Manager-Token': token,
    },
    body: JSON.stringify({ confirmation: 'quit' }),
  });
  assert.equal(crossOrigin.ok, false);
  assert.equal(child.exitCode, null);

  const shutdown = await fetch(`${baseUrl}/api/shutdown`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl,
      'X-Manager-Token': token,
    },
    body: JSON.stringify({ confirmation: 'quit', scope: 'all' }),
  });
  assert.equal(shutdown.status, 200);
  const result = await shutdown.json();
  assert.equal(result.closing, true);
  assert.equal(result.scope, 'all');
  assert.equal(await waitForExit(child), 0);
});
