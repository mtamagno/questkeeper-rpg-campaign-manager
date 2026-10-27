import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('local service controls stay explicit, authenticated and absent from hosted Companions', async () => {
  const [html, app, styles, server, bridge, commandBar] = await Promise.all([
    read('tools/campaign-manager/public/index.html'),
    read('tools/campaign-manager/public/app.js'),
    read('tools/campaign-manager/public/styles.css'),
    read('tools/campaign-manager/server.mjs'),
    read('src/app/guild/services/localManagerBridge.service.ts'),
    read('src/app/guild/components/site-command-bar/site-command-bar.component.html'),
  ]);

  assert.match(html, /sidebar__service-actions/);
  assert.match(html, /id="service-stop-companion"/);
  assert.match(html, /id="service-quit-manager"/);
  assert.match(html, /id="service-stop-all"/);
  assert.match(app, /api\/actions\/preview-stop/);
  assert.match(app, /api\/companion-handshake/);
  assert.match(styles, /sidebar__quit:hover/);
  assert.match(styles, /service-choice--danger/);
  assert.match(server, /companionHandshakes/);
  assert.match(server, /expiresAt: Date\.now\(\) \+ 60_000/);
  assert.match(server, /Access-Control-Allow-Origin/);
  assert.match(bridge, /\['127\.0\.0\.1', 'localhost'\]/);
  assert.match(bridge, /history\.replaceState/);
  assert.match(bridge, /SESSION_KEY/);
  assert.match(commandBar, /@if \(managerUrl\(\)\)/);
});
