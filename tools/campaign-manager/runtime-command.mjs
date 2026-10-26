import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

function quoteDisplay(value) {
  const text = String(value);
  return /\s|"/.test(text) ? `"${text.replaceAll('"', '\\"')}"` : text;
}

/**
 * Resolves npm through the active Node runtime instead of spawning a Windows
 * `.cmd` shim directly. Arguments remain an array and `shell` is never enabled.
 */
export function resolveNpmInvocation(
  npmArguments,
  {
    platform = process.platform,
    nodePath = process.execPath,
    environment = process.env,
    pathExists = existsSync,
    candidatePaths,
  } = {},
) {
  const candidates = candidatePaths ?? [
    environment.QUESTKEEPER_NPM_CLI_PATH,
    environment.npm_execpath,
    join(dirname(nodePath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(dirname(dirname(nodePath)), 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  const npmCliPath = candidates.find(
    (candidate) =>
      typeof candidate === 'string' &&
      candidate.toLowerCase().endsWith('npm-cli.js') &&
      pathExists(candidate),
  );

  if (npmCliPath) {
    const args = [npmCliPath, ...npmArguments];
    return {
      command: nodePath,
      args,
      runtimePath: nodePath,
      npmCliPath,
      display: [nodePath, ...args].map(quoteDisplay).join(' '),
    };
  }

  if (platform !== 'win32') {
    return {
      command: 'npm',
      args: [...npmArguments],
      runtimePath: nodePath,
      npmCliPath: 'npm',
      display: ['npm', ...npmArguments].map(quoteDisplay).join(' '),
    };
  }

  const error = new Error(
    `QuestKeeper could not find npm-cli.js for the active Node runtime at ${nodePath}. Run Setup again, choose a verified runtime and retry.`,
  );
  error.code = 'QUESTKEEPER_NPM_CLI_NOT_FOUND';
  throw error;
}

export function formatSpawnFailure(kind, invocation, error) {
  const code = typeof error?.code === 'string' ? error.code : 'UNKNOWN_SPAWN_ERROR';
  const runtimePath = invocation.runtimePath ?? invocation.command ?? 'unknown runtime';
  const display =
    invocation.display ??
    [invocation.command, ...(invocation.args ?? [])].filter(Boolean).map(quoteDisplay).join(' ');
  return [
    `Could not start ${kind}.`,
    `Runtime: ${runtimePath}.`,
    `Command: ${display}.`,
    `Platform-safe error code: ${code}.`,
    'Check the selected runtime in QuestKeeper Setup, then retry. No duplicate process was kept.',
  ].join(' ');
}
