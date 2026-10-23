const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function npmCliCandidates(nodePath, platform = process.platform) {
  const bin = path.dirname(nodePath);
  return platform === 'win32'
    ? [path.join(bin, 'node_modules', 'npm', 'bin', 'npm-cli.js')]
    : [
        path.resolve(bin, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
        path.resolve(bin, '..', 'share', 'nodejs', 'npm', 'bin', 'npm-cli.js'),
      ];
}

function validateRuntimeCandidate(
  candidate,
  {
    expectedArchitecture = process.arch,
    platform = process.platform,
    exists = fs.existsSync,
    realpath = fs.realpathSync,
    run = spawnSync,
    npmCandidates,
  } = {},
) {
  if (!candidate || !exists(candidate))
    return { ready: false, reason: 'Node executable not found.' };
  let nodePath;
  try {
    nodePath = realpath(candidate);
  } catch {
    return { ready: false, reason: 'Node executable path cannot be resolved.' };
  }
  const execute = (args) => run(nodePath, args, { encoding: 'utf8', windowsHide: true });
  const versionResult = execute(['--version']);
  const version = versionResult.status === 0 ? versionResult.stdout?.trim() : null;
  if (!/^v26\./.test(version ?? '')) {
    return { ready: false, nodePath, version, reason: 'QuestKeeper requires Node.js 26.' };
  }
  const architectureResult = execute(['-p', 'process.arch']);
  const architecture =
    architectureResult.status === 0 ? architectureResult.stdout?.trim() : undefined;
  if (architecture !== expectedArchitecture) {
    return {
      ready: false,
      nodePath,
      version,
      architecture,
      reason: `Node.js architecture ${architecture || 'unknown'} does not match ${expectedArchitecture}.`,
    };
  }
  const candidates = npmCandidates ?? npmCliCandidates(nodePath, platform);
  const npmCliPath = candidates.find((value) => exists(value));
  if (!npmCliPath) {
    return { ready: false, nodePath, version, architecture, reason: 'npm was not found.' };
  }
  const npmResult = execute([npmCliPath, '--version']);
  if (npmResult.status !== 0) {
    return { ready: false, nodePath, version, architecture, reason: 'npm validation failed.' };
  }
  return {
    ready: true,
    nodePath,
    npmCliPath,
    version,
    architecture,
    npmVersion: npmResult.stdout?.trim() || null,
  };
}

function discoverNodePaths({
  platform = process.platform,
  processPath = process.execPath,
  portablePath,
  sea = false,
  run = spawnSync,
} = {}) {
  const command = platform === 'win32' ? 'where.exe' : 'which';
  const args = platform === 'win32' ? ['node'] : ['-a', 'node'];
  const result = run(command, args, { encoding: 'utf8', windowsHide: true });
  const values =
    result.status === 0 ? result.stdout.split(/\r?\n/).map((value) => value.trim()) : [];
  if (!sea && processPath) values.unshift(processPath);
  const portable = portablePath ? path.resolve(portablePath).toLowerCase() : null;
  return [...new Set(values.filter(Boolean).map((value) => path.resolve(value)))].filter(
    (value) => value.toLowerCase() !== portable,
  );
}

module.exports = { discoverNodePaths, npmCliCandidates, validateRuntimeCandidate };
