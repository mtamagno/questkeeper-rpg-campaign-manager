import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizePublishingConfig, publicPublishingConfig } from '../publishing.mjs';

test('normalizes an FTPS destination and keeps a saved password', () => {
  const previous = normalizePublishingConfig({
    protocol: 'ftps',
    host: 'ftp.example.test',
    username: 'keeper',
    password: 'secret',
    remotePath: '/public_html/DnD',
  });
  const next = normalizePublishingConfig(
    { ...previous, host: 'ftps://ftp.example.test', password: '' },
    previous,
  );
  assert.equal(next.host, 'ftp.example.test');
  assert.equal(next.password, 'secret');
  assert.equal(next.remotePath, '/public_html/DnD');
  assert.equal(publicPublishingConfig(next).passwordConfigured, true);
  assert.equal(publicPublishingConfig(next).password, undefined);
});

test('uses encrypted FTPS by default and normalizes the remote path', () => {
  const config = normalizePublishingConfig({ remotePath: 'public_html//campaign' });
  assert.equal(config.protocol, 'ftps');
  assert.equal(config.remotePath, '/public_html/campaign');
});
