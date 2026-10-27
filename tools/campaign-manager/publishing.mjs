import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import storagePaths from '../storage-paths.cjs';

const { resolveStoragePaths } = storagePaths;

const DEFAULT_CONFIG = Object.freeze({
  protocol: 'ftps',
  host: '',
  port: 21,
  username: '',
  password: '',
  remotePath: '/',
});

function configPath(projectRoot) {
  return resolveStoragePaths(projectRoot).publishingConfigFile;
}

function normalizeHost(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw.includes('://') ? raw : `ftp://${raw}`).hostname;
  } catch {
    throw new Error('Enter a valid FTP or FTPS host name.');
  }
}

export function normalizePublishingConfig(input = {}, previous = DEFAULT_CONFIG) {
  const protocol = input.protocol === 'ftp' ? 'ftp' : 'ftps';
  const requestedPassword = String(input.password ?? '').trim();
  const remotePath = `/${String(input.remotePath || '/')}`.replace(/\/{2,}/g, '/');
  return {
    protocol,
    host: normalizeHost(input.host),
    port: Math.min(65535, Math.max(1, Number(input.port) || 21)),
    username: String(input.username || '')
      .trim()
      .slice(0, 180),
    password: requestedPassword || String(previous.password || ''),
    remotePath,
  };
}

export async function readPublishingConfig(projectRoot) {
  try {
    const value = JSON.parse(await readFile(configPath(projectRoot), 'utf8'));
    return normalizePublishingConfig(value);
  } catch (error) {
    if (error?.code === 'ENOENT') return structuredClone(DEFAULT_CONFIG);
    throw error;
  }
}

export async function writePublishingConfig(projectRoot, input) {
  const path = configPath(projectRoot);
  const previous = await readPublishingConfig(projectRoot);
  const config = normalizePublishingConfig(input, previous);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return config;
}

export function publicPublishingConfig(config) {
  return { ...config, password: undefined, passwordConfigured: Boolean(config.password) };
}

async function ftpClient(config, onLog = () => {}) {
  if (!config.host || !config.username || !config.password)
    throw new Error('FTP host, username and password are required.');
  const { Client } = await import('basic-ftp');
  const client = new Client(30_000);
  client.ftp.verbose = false;
  client.ftp.log = (message) => onLog(`${message}\n`);
  await client.access({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    secure: config.protocol === 'ftps',
  });
  return client;
}

export async function testPublishingConnection(config) {
  const client = await ftpClient(config);
  try {
    const directory = await client.pwd();
    return `Connection accepted. Server directory: ${directory}`;
  } finally {
    client.close();
  }
}

export async function uploadBuild(config, buildDirectory, onLog = () => {}) {
  const client = await ftpClient(config, onLog);
  try {
    onLog(`Uploading the verified site to ${config.remotePath}…\n`);
    await client.uploadFromDir(buildDirectory, config.remotePath);
    onLog('Upload complete. Existing unrelated remote files were left untouched.\n');
  } finally {
    client.close();
  }
}
