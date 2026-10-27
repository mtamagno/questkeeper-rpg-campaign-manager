import assert from 'node:assert/strict';
import test from 'node:test';

import { COMPANION_URL, probeCompanion, resolveCompanionControl } from '../companion-status.mjs';

test('recognizes QuestKeeper readiness instead of trusting the child process alone', async () => {
  const probe = await probeCompanion(async (url) => {
    assert.equal(url, COMPANION_URL);
    return { ok: true, text: async () => '<html><app-root></app-root></html>' };
  });
  assert.deepEqual(probe, { reachable: true, questKeeper: true });
  const external = resolveCompanionControl({ dependenciesReady: true, job: undefined, probe });
  assert.equal(external.action, 'open');
  assert.equal(external.canStop, false);
  assert.equal(
    resolveCompanionControl({
      dependenciesReady: true,
      job: { status: 'running' },
      probe,
    }).canStop,
    true,
  );
});

test('distinguishes cold start, startup, failure and port conflict states', () => {
  const offline = { reachable: false, questKeeper: false };
  assert.equal(
    resolveCompanionControl({ dependenciesReady: true, job: undefined, probe: offline }).action,
    'start',
  );
  assert.equal(
    resolveCompanionControl({
      dependenciesReady: true,
      job: { status: 'running' },
      probe: offline,
    }).action,
    'wait',
  );
  assert.equal(
    resolveCompanionControl({
      dependenciesReady: true,
      job: { status: 'failed' },
      probe: offline,
    }).action,
    'retry',
  );
  assert.match(
    resolveCompanionControl({
      dependenciesReady: true,
      job: { status: 'running' },
      probe: { reachable: true, questKeeper: false },
    }).status,
    /Port 4200/,
  );
});
