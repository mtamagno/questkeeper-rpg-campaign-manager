import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import { formatSpawnFailure, resolveNpmInvocation } from '../runtime-command.mjs';

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

test('runs an npm CLI from a path containing spaces without a shell', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'QuestKeeper runtime with spaces '));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cli = join(root, 'node modules', 'npm', 'bin', 'npm-cli.js');
  const output = join(root, 'received arguments.txt');
  await mkdir(join(root, 'node modules', 'npm', 'bin'), { recursive: true });
  await writeFile(
    cli,
    `require('node:fs').writeFileSync(process.argv[2], process.argv.slice(3).join('|'));`,
  );

  const invocation = resolveNpmInvocation(['run', 'start', '--', '--port', '4200'], {
    platform: 'win32',
    nodePath: process.execPath,
    candidatePaths: [cli],
  });
  assert.equal(invocation.command, process.execPath);
  assert.equal(invocation.args[0], cli);
  assert.equal(invocation.shell, undefined);
  const child = spawn(
    invocation.command,
    [invocation.args[0], output, ...invocation.args.slice(1)],
    {
      windowsHide: true,
    },
  );
  await waitForExit(child);
  assert.equal(
    await (await import('node:fs/promises')).readFile(output, 'utf8'),
    'run|start|--|--port|4200',
  );
});

test('resolves both system and private Node layouts and reports actionable failures', () => {
  for (const nodePath of [
    'C:\\Program Files\\nodejs\\node.exe',
    'C:\\QuestKeeper Install\\.questkeeper\\runtime\\node.exe',
  ]) {
    const expectedCli = join(
      nodePath.slice(0, nodePath.lastIndexOf('\\')),
      'node_modules',
      'npm',
      'bin',
      'npm-cli.js',
    );
    const invocation = resolveNpmInvocation(['run', 'start'], {
      platform: 'win32',
      nodePath,
      candidatePaths: [expectedCli],
      pathExists: (candidate) => candidate === expectedCli,
    });
    assert.equal(invocation.command, nodePath);
    assert.equal(invocation.npmCliPath, expectedCli);
  }

  const invocation = {
    runtimePath: 'C:\\QuestKeeper Install\\node.exe',
    display: '"C:\\QuestKeeper Install\\node.exe" npm-cli.js run start',
  };
  const message = formatSpawnFailure('Companion preview', invocation, { code: 'EINVAL' });
  assert.match(message, /Runtime: C:\\QuestKeeper Install\\node\.exe/);
  assert.match(message, /Platform-safe error code: EINVAL/);
  assert.match(message, /retry/i);
  assert.doesNotMatch(message, /TOKEN|API_KEY|password/i);
});
