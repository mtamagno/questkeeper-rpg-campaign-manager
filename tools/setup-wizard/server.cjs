const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const HOST = '127.0.0.1';
const PORT = Number.parseInt(process.env.QUESTKEEPER_SETUP_PORT || '0', 10);
const TOKEN = crypto.randomBytes(24).toString('hex');
const args = new Set(process.argv.slice(2));
const runtimeHome = '.questkeeper/runtime';
const companionPort = Number.parseInt(process.env.QUESTKEEPER_COMPANION_PORT || '4200', 10);
const contentTypes = {
  'index.html': 'text/html; charset=utf-8',
  'setup.css': 'text/css; charset=utf-8',
  'setup.js': 'text/javascript; charset=utf-8',
};

let sea;
let setupServer;
let shutdownScheduled = false;
try {
  sea = require('node:sea');
} catch {
  sea = { isSea: () => false };
}

function isSea() {
  return Boolean(sea.isSea?.());
}

function projectRoot() {
  if (process.env.QUESTKEEPER_ROOT) return path.resolve(process.env.QUESTKEEPER_ROOT);
  if (!isSea()) return path.resolve(__dirname, '..', '..');
  const executableDirectory = path.dirname(process.execPath);
  if (
    process.platform === 'darwin' &&
    path.basename(executableDirectory) === 'MacOS' &&
    path.basename(path.resolve(executableDirectory, '..', '..')).endsWith('.app')
  ) {
    return path.resolve(executableDirectory, '..', '..', '..');
  }
  return executableDirectory;
}

const root = projectRoot();
const state = {
  phase: 'idle',
  message: 'Ready.',
  logs: [],
  error: null,
  finishedAt: null,
};

function log(message) {
  state.message = message;
  state.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  if (state.logs.length > 160) state.logs.splice(0, state.logs.length - 160);
}

function asset(name) {
  if (isSea()) return sea.getAsset(`setup/${name}`, 'utf8');
  return fs.readFileSync(path.join(__dirname, 'public', name), 'utf8');
}

function portableNodePath() {
  return path.join(root, runtimeHome, process.platform === 'win32' ? 'node.exe' : 'bin/node');
}

function launcherNodePath() {
  if (process.env.NODE_ENV === 'test' && process.env.QUESTKEEPER_TEST_NODE_PATH) {
    return path.resolve(process.env.QUESTKEEPER_TEST_NODE_PATH);
  }
  return portableNodePath();
}

function runtimeStatus() {
  const nodePath = portableNodePath();
  if (!fs.existsSync(nodePath)) return { ready: false, version: null };
  const result = spawnSync(nodePath, ['--version'], { encoding: 'utf8', windowsHide: true });
  const version = result.status === 0 ? result.stdout.trim() : null;
  return { ready: Boolean(version?.startsWith('v24.')), version };
}

function setupStatus() {
  return {
    platform: process.platform,
    architecture: process.arch,
    root,
    runtime: runtimeStatus(),
    dependenciesReady: fs.existsSync(path.join(root, 'node_modules', '.package-lock.json')),
    state,
  };
}

function supportedArchive(version) {
  const architecture = process.arch === 'arm64' ? 'arm64' : 'x64';
  if (process.platform === 'win32') {
    return {
      file: `node-${version}-win-${architecture}.zip`,
      folder: `node-${version}-win-${architecture}`,
    };
  }
  if (process.platform === 'darwin') {
    return {
      file: `node-${version}-darwin-${architecture}.tar.gz`,
      folder: `node-${version}-darwin-${architecture}`,
    };
  }
  if (process.platform === 'linux') {
    return {
      file: `node-${version}-linux-${architecture}.tar.xz`,
      folder: `node-${version}-linux-${architecture}`,
    };
  }
  throw new Error(`Unsupported platform: ${process.platform}.`);
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Download failed (${response.status}) for ${url}`);
  return response.text();
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Download failed (${response.status}) for ${url}`);
  const temporary = `${destination}.part`;
  fs.writeFileSync(temporary, Buffer.from(await response.arrayBuffer()));
  fs.renameSync(temporary, destination);
}

function assertInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe setup path: ${candidate}`);
  }
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  }
  return result.stdout?.trim();
}

function runAsync(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: root,
      windowsHide: true,
      ...options,
    });
    const output = [];
    child.stdout?.on('data', (chunk) => output.push(chunk));
    child.stderr?.on('data', (chunk) => output.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      const message = Buffer.concat(output).toString('utf8').trim();
      if (code === 0) resolve(message);
      else reject(new Error(message || `${command} exited with code ${code}.`));
    });
  });
}

async function installPortableNode() {
  const existing = runtimeStatus();
  if (existing.ready) {
    log(`Portable Node.js ${existing.version} is already ready.`);
    return portableNodePath();
  }

  log('Finding the latest supported Node.js 24 release…');
  const releases = JSON.parse(await fetchText('https://nodejs.org/dist/index.json'));
  const release = releases.find((item) => /^v24\./.test(item.version));
  if (!release) throw new Error('The official Node.js index returned no Node.js 24 release.');
  const archive = supportedArchive(release.version);
  const baseUrl = `https://nodejs.org/dist/${release.version}`;
  const work = path.join(root, '.questkeeper', 'downloads', `node-${Date.now()}`);
  const archivePath = path.join(work, archive.file);
  const extractedPath = path.join(work, archive.folder);
  const runtimePath = path.join(root, runtimeHome);
  for (const target of [work, runtimePath]) assertInside(root, target);
  fs.mkdirSync(work, { recursive: true });

  try {
    log(`Downloading ${archive.file} from nodejs.org…`);
    await download(`${baseUrl}/${archive.file}`, archivePath);
    log('Verifying the official SHA-256 checksum…');
    const checksums = await fetchText(`${baseUrl}/SHASUMS256.txt`);
    const checksumLine = checksums
      .split(/\r?\n/)
      .find((line) => line.trim().endsWith(`  ${archive.file}`));
    if (!checksumLine) throw new Error(`No official checksum was found for ${archive.file}.`);
    const expected = checksumLine.trim().split(/\s+/)[0].toLowerCase();
    const actual = crypto.createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
    if (actual !== expected) throw new Error('The Node.js archive failed SHA-256 verification.');

    log('Extracting the private QuestKeeper runtime…');
    if (process.platform === 'win32') {
      await runAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-Command',
          'Expand-Archive -LiteralPath $env:QUESTKEEPER_NODE_ARCHIVE -DestinationPath $env:QUESTKEEPER_NODE_DESTINATION -Force',
        ],
        {
          env: {
            ...process.env,
            QUESTKEEPER_NODE_ARCHIVE: archivePath,
            QUESTKEEPER_NODE_DESTINATION: work,
          },
        },
      );
    } else {
      await runAsync('tar', ['-xf', archivePath, '-C', work]);
    }
    if (!fs.existsSync(extractedPath))
      throw new Error('The Node.js archive did not extract as expected.');
    fs.rmSync(runtimePath, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(runtimePath), { recursive: true });
    fs.renameSync(extractedPath, runtimePath);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }

  const ready = runtimeStatus();
  if (!ready.ready) throw new Error('The portable Node.js 24 runtime could not be prepared.');
  log(`Portable Node.js ${ready.version} is ready.`);
  return portableNodePath();
}

function npmCliPath() {
  return process.platform === 'win32'
    ? path.join(root, runtimeHome, 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : path.join(root, runtimeHome, 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
}

function runDetached(command, commandArgs) {
  const child = spawn(command, commandArgs, {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.on('error', () => {});
  child.unref();
}

function launchStatePath(...parts) {
  const stateRoot = process.env.QUESTKEEPER_LAUNCH_STATE_ROOT
    ? path.resolve(process.env.QUESTKEEPER_LAUNCH_STATE_ROOT)
    : path.join(root, '.questkeeper');
  return path.join(stateRoot, ...parts);
}

function appendLaunchLog(message) {
  const logPath = launchStatePath('logs', 'companion-launch.log');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
  return logPath;
}

async function companionStatus(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_200) });
    if (!response.ok) return { reachable: true, questKeeper: false };
    const html = await response.text();
    return {
      reachable: true,
      questKeeper:
        html.includes('name="application-name" content="QuestKeeper"') ||
        html.includes('<app-root'),
    };
  } catch {
    return { reachable: false, questKeeper: false };
  }
}

function stopDetachedProcess(pid) {
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
      // The failed process has already exited.
    }
  }
}

async function waitForCompanion(child, url) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const status = await companionStatus(url);
    if (status.questKeeper) return;
    if (status.reachable) throw new Error(`Port ${companionPort} is used by another application.`);
    if (child.launchError) throw child.launchError;
    if (child.exitCode !== null) {
      throw new Error(`The Companion process exited with code ${child.exitCode}.`);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error('The Companion did not become ready within 90 seconds.');
}

async function launchCompanion() {
  const url = `http://${HOST}:${companionPort}`;
  const existing = await companionStatus(url);
  if (existing.questKeeper) {
    appendLaunchLog(`Reused the running Companion at ${url}.`);
    openBrowser(url);
    return { reused: true, url };
  }
  if (existing.reachable) throw new Error(`Port ${companionPort} is used by another application.`);

  const nodePath = launcherNodePath();
  const angularCli = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
  if (!fs.existsSync(nodePath)) throw new Error('Run setup before opening QuestKeeper.');
  if (!fs.existsSync(angularCli)) throw new Error('QuestKeeper dependencies are not ready.');

  const logPath = appendLaunchLog(`Starting the Companion at ${url}.`);
  const logFile = fs.openSync(logPath, 'a');
  const child = spawn(
    nodePath,
    [angularCli, 'serve', '--host', HOST, '--port', String(companionPort)],
    {
      cwd: root,
      detached: true,
      stdio: ['ignore', logFile, logFile],
      windowsHide: true,
      env: { ...process.env, BROWSER: 'none' },
    },
  );
  child.once('error', (error) => (child.launchError = error));
  const processFile = launchStatePath('run', 'companion.json');
  fs.mkdirSync(path.dirname(processFile), { recursive: true });
  fs.writeFileSync(
    processFile,
    JSON.stringify({ pid: child.pid, port: companionPort, startedAt: new Date().toISOString() }),
  );
  try {
    await waitForCompanion(child, url);
    appendLaunchLog(`Companion ready at ${url} (PID ${child.pid}).`);
    child.unref();
    openBrowser(url);
    return { reused: false, url, pid: child.pid };
  } catch (error) {
    stopDetachedProcess(child.pid);
    fs.rmSync(processFile, { force: true });
    appendLaunchLog(`Companion launch failed: ${error.message}`);
    throw new Error(`${error.message} Details: ${logPath}`);
  } finally {
    fs.closeSync(logFile);
  }
}

async function launch(kind) {
  if (kind === 'manager') {
    const nodePath = launcherNodePath();
    if (!fs.existsSync(nodePath)) throw new Error('Run setup before opening QuestKeeper.');
    runDetached(nodePath, [path.join(root, 'tools', 'campaign-manager', 'server.mjs'), '--open']);
  } else if (kind === 'companion') {
    await launchCompanion();
  } else {
    throw new Error('Unknown launcher.');
  }
}

function selfLaunchArguments(kind) {
  if (isSea()) return { target: process.execPath, arguments: `--launch-${kind}` };
  return {
    target: process.execPath,
    arguments: `"${path.join(__dirname, 'server.cjs')}" --launch-${kind}`,
  };
}

function quoteShell(value) {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

function createWindowsShortcut(name, kind) {
  const command = selfLaunchArguments(kind);
  const desktop = process.env.QUESTKEEPER_DESKTOP || path.join(os.homedir(), 'Desktop');
  const shortcut = path.join(desktop, `${name}.lnk`);
  fs.mkdirSync(desktop, { recursive: true });
  run(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      '$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:QUESTKEEPER_SHORTCUT_PATH);$s.TargetPath=$env:QUESTKEEPER_SHORTCUT_TARGET;$s.Arguments=$env:QUESTKEEPER_SHORTCUT_ARGUMENTS;$s.WorkingDirectory=$env:QUESTKEEPER_SHORTCUT_WORKING_DIRECTORY;$s.Save()',
    ],
    {
      env: {
        ...process.env,
        QUESTKEEPER_SHORTCUT_PATH: shortcut,
        QUESTKEEPER_SHORTCUT_TARGET: command.target,
        QUESTKEEPER_SHORTCUT_ARGUMENTS: command.arguments,
        QUESTKEEPER_SHORTCUT_WORKING_DIRECTORY: root,
      },
    },
  );
  return shortcut;
}

function createLinuxShortcut(name, kind) {
  const command = selfLaunchArguments(kind);
  const fileName = `questkeeper-${kind}.desktop`;
  const contents = `[Desktop Entry]\nType=Application\nName=${name}\nComment=Open QuestKeeper ${kind}\nExec=${quoteShell(command.target)} ${command.arguments}\nPath=${root}\nTerminal=false\nCategories=Game;Utility;\n`;
  const destinations = [path.join(os.homedir(), '.local', 'share', 'applications', fileName)];
  const desktop = path.join(os.homedir(), 'Desktop');
  if (fs.existsSync(desktop)) destinations.push(path.join(desktop, fileName));
  for (const destination of destinations) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents, { mode: 0o755 });
    fs.chmodSync(destination, 0o755);
  }
}

function createMacShortcut(name, kind) {
  const command = selfLaunchArguments(kind);
  const desktop = path.join(os.homedir(), 'Desktop');
  const bundle = path.join(desktop, `${name}.app`);
  const executable = path.join(bundle, 'Contents', 'MacOS', 'launch');
  const plist = path.join(bundle, 'Contents', 'Info.plist');
  fs.mkdirSync(path.dirname(executable), { recursive: true });
  fs.writeFileSync(
    executable,
    `#!/bin/sh\ncd ${quoteShell(root)}\nexec ${quoteShell(command.target)} ${command.arguments}\n`,
    { mode: 0o755 },
  );
  fs.writeFileSync(
    plist,
    `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>CFBundleName</key><string>${name}</string><key>CFBundleExecutable</key><string>launch</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>\n`,
  );
}

function createShortcut(name, kind) {
  if (process.platform === 'win32') return createWindowsShortcut(name, kind);
  if (process.platform === 'darwin') return createMacShortcut(name, kind);
  return createLinuxShortcut(name, kind);
}

async function install(options) {
  state.phase = 'running';
  state.error = null;
  state.finishedAt = null;
  state.logs = [];
  try {
    const nodePath = await installPortableNode();
    if (options.dependencies !== false) {
      log('Installing QuestKeeper locked dependencies…');
      await runAsync(nodePath, [npmCliPath(), 'ci'], {
        env: {
          ...process.env,
          PATH: `${path.dirname(nodePath)}${path.delimiter}${process.env.PATH || ''}`,
        },
      });
      log('Locked dependencies are ready.');
    }
    if (options.managerShortcut) {
      log('Creating the Campaign Manager shortcut…');
      createShortcut('QuestKeeper Campaign Manager', 'manager');
    }
    if (options.companionShortcut) {
      log('Creating the Companion shortcut…');
      createShortcut('QuestKeeper Companion', 'companion');
    }
    state.phase = 'complete';
    log('QuestKeeper is ready. Your adventure can begin.');
    state.finishedAt = new Date().toISOString();
    if (options.launchManager) await launch('manager');
  } catch (error) {
    state.phase = 'failed';
    state.error = error instanceof Error ? error.message : String(error);
    log(`Setup stopped: ${state.error}`);
    state.finishedAt = new Date().toISOString();
  }
}

function json(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

function authorised(requestUrl) {
  return requestUrl.searchParams.get('token') === TOKEN;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_768) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function openBrowser(url) {
  if (process.env.QUESTKEEPER_NO_BROWSER === '1') return;
  if (process.platform === 'win32') runDetached('cmd.exe', ['/d', '/s', '/c', 'start', '', url]);
  else if (process.platform === 'darwin') runDetached('open', [url]);
  else runDetached('xdg-open', [url]);
}

function scheduleShutdown() {
  if (shutdownScheduled) return;
  shutdownScheduled = true;
  const forcedExit = setTimeout(() => process.exit(0), 1_500);
  forcedExit.unref();
  const gracefulExit = setTimeout(() => {
    if (!setupServer) process.exit(0);
    setupServer.close(() => {
      clearTimeout(forcedExit);
      process.exit(0);
    });
  }, 100);
  gracefulExit.unref();
}

async function route(request, response) {
  const requestUrl = new URL(request.url, `http://${HOST}`);
  if (requestUrl.pathname.startsWith('/api/') && !authorised(requestUrl)) {
    return json(response, 403, { error: 'Invalid setup token.' });
  }
  if (request.method === 'GET' && requestUrl.pathname === '/api/status') {
    return json(response, 200, setupStatus());
  }
  if (request.method === 'POST' && requestUrl.pathname === '/api/install') {
    if (state.phase === 'running')
      return json(response, 409, { error: 'Setup is already running.' });
    const options = await readJson(request);
    void install(options);
    return json(response, 202, { accepted: true });
  }
  if (request.method === 'POST' && requestUrl.pathname === '/api/launch') {
    const { kind } = await readJson(request);
    await launch(kind);
    return json(response, 200, { launched: kind });
  }
  if (request.method === 'POST' && requestUrl.pathname === '/api/shutdown') {
    if (state.phase === 'running') {
      return json(response, 409, { error: 'Wait for the current setup step to finish.' });
    }
    json(response, 200, { closing: true });
    scheduleShutdown();
    return;
  }
  const name = requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname.slice(1);
  if (request.method === 'GET' && Object.hasOwn(contentTypes, name)) {
    response.writeHead(200, {
      'Content-Type': contentTypes[name],
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    return response.end(asset(name));
  }
  response.writeHead(404);
  response.end('Not found');
}

async function main() {
  if (args.has('--self-test-shortcuts')) {
    if (process.platform !== 'win32') {
      console.log(JSON.stringify({ ok: true, skipped: true, platform: process.platform }));
      return;
    }
    const launchers = [selfLaunchArguments('manager'), selfLaunchArguments('companion')];
    const shortcuts = [
      createShortcut('QuestKeeper Campaign Manager', 'manager'),
      createShortcut('QuestKeeper Companion', 'companion'),
    ];
    const ok = shortcuts.every((shortcut) => fs.existsSync(shortcut));
    console.log(JSON.stringify({ ok, shortcuts, launchers }));
    process.exit(ok ? 0 : 1);
  }
  if (args.has('--self-test')) {
    for (const name of Object.keys(contentTypes)) asset(name);
    const packageFile = path.join(root, 'package.json');
    console.log(
      JSON.stringify({
        ok: fs.existsSync(packageFile),
        sea: isSea(),
        platform: process.platform,
        root,
      }),
    );
    process.exit(fs.existsSync(packageFile) ? 0 : 1);
  }
  if (args.has('--launch-manager') || args.has('--launch-companion')) {
    try {
      await launch(args.has('--launch-manager') ? 'manager' : 'companion');
      return;
    } catch (error) {
      state.phase = 'failed';
      state.error = error.message;
      log(`Launch stopped: ${error.message}`);
      // A failed launcher falls through to the visible guided wizard.
    }
  }
  if (!fs.existsSync(path.join(root, 'package.json'))) {
    throw new Error('QuestKeeper-Setup must remain in the extracted QuestKeeper folder.');
  }
  setupServer = http.createServer((request, response) => {
    route(request, response).catch((error) => json(response, 500, { error: error.message }));
  });
  setupServer.listen(PORT, HOST, () => {
    const address = setupServer.address();
    const url = `http://${HOST}:${address.port}/?token=${TOKEN}`;
    console.log(`QuestKeeper Setup: ${url}`);
    openBrowser(url);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
