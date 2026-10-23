const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { discoverNodePaths, validateRuntimeCandidate } = require('./runtime-selection.cjs');

function fixture({
  version = 'v26.12.1',
  architecture = 'x64',
  npm = '11.6.2',
  broken = false,
} = {}) {
  const nodePath = path.resolve('C:/Program Files/Node JS/node.exe');
  const npmPath = path.resolve('C:/Program Files/Node JS/node_modules/npm/bin/npm-cli.js');
  return {
    nodePath,
    npmPath,
    options: {
      expectedArchitecture: 'x64',
      platform: 'win32',
      exists: (value) => [nodePath, npmPath].includes(path.resolve(value)),
      realpath: (value) => path.resolve(value),
      npmCandidates: [npmPath],
      run: (_command, args) => {
        if (broken) return { status: 1, stdout: '', stderr: 'broken' };
        if (args[0] === '--version') return { status: 0, stdout: `${version}\n` };
        if (args[0] === '-p') return { status: 0, stdout: `${architecture}\n` };
        return { status: 0, stdout: `${npm}\n` };
      },
    },
  };
}

test('validates Node 26, architecture, npm and paths containing spaces', () => {
  const { nodePath, npmPath, options } = fixture();
  assert.deepEqual(validateRuntimeCandidate(nodePath, options), {
    ready: true,
    nodePath,
    npmCliPath: npmPath,
    version: 'v26.12.1',
    architecture: 'x64',
    npmVersion: '11.6.2',
  });
});

test('rejects wrong majors, mismatched architecture, broken binaries and missing npm', () => {
  assert.match(
    validateRuntimeCandidate(fixture().nodePath, fixture({ version: 'v24.22.1' }).options).reason,
    /Node\.js 26/,
  );
  assert.match(
    validateRuntimeCandidate(fixture().nodePath, fixture({ architecture: 'arm64' }).options).reason,
    /does not match/,
  );
  assert.equal(
    validateRuntimeCandidate(fixture().nodePath, fixture({ broken: true }).options).ready,
    false,
  );
  const missing = fixture();
  missing.options.exists = (value) => path.resolve(value) === missing.nodePath;
  assert.match(validateRuntimeCandidate(missing.nodePath, missing.options).reason, /npm/);
});

test('deduplicates PATH and source-runtime candidates while excluding the private runtime', () => {
  const system = path.resolve('C:/Node/node.exe');
  const portable = path.resolve('C:/QuestKeeper/.questkeeper/runtime/node.exe');
  const result = discoverNodePaths({
    platform: 'win32',
    processPath: system,
    portablePath: portable,
    run: () => ({ status: 0, stdout: `${system}\n${system}\n${portable}\n` }),
  });
  assert.deepEqual(result, [system]);
});
