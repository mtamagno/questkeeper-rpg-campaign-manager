import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  normalizeCampaignNarrativeMood,
  normalizeSessionNarrativeMood,
  resolveNarrativeMood,
} from '../narrative-moods.mjs';

const sessions = [
  { id: 'session-1', sessionNumber: 1 },
  { id: 'session-2', sessionNumber: 2 },
  { id: 'session-3', sessionNumber: 3 },
];

test('normalizes a campaign mood with explicit published milestones', () => {
  assert.deepEqual(
    normalizeCampaignNarrativeMood({
      default: 'light',
      phases: [
        {
          id: 'through-the-gate',
          label: ' Through the gate ',
          startsAtSessionId: 'session-2',
          mood: 'dark',
        },
      ],
    }),
    {
      default: 'light',
      phases: [
        {
          id: 'through-the-gate',
          label: 'Through the gate',
          startsAtSessionId: 'session-2',
          mood: 'dark',
        },
      ],
    },
  );
});

test('rejects invalid moods and duplicate phase IDs', () => {
  assert.throws(
    () => normalizeCampaignNarrativeMood({ default: 'ominous' }),
    /must be default, light or dark/,
  );
  assert.throws(
    () =>
      normalizeCampaignNarrativeMood({
        phases: [
          { id: 'gate', startsAtSessionId: 'session-1', mood: 'dark' },
          { id: 'gate', startsAtSessionId: 'session-2', mood: 'light' },
        ],
      }),
    /duplicated/,
  );
});

test('inherits campaign, published phase, session and block scopes in order', () => {
  const campaign = {
    narrativeMood: {
      default: 'light',
      phases: [{ id: 'gate', startsAtSessionId: 'session-2', mood: 'dark' }],
    },
  };
  assert.equal(resolveNarrativeMood(campaign, sessions, sessions[0]), 'light');
  assert.equal(resolveNarrativeMood(campaign, sessions, sessions[1]), 'dark');
  assert.equal(
    resolveNarrativeMood(
      campaign,
      sessions,
      { ...sessions[2], mood: 'light', blockMoods: { summary: 'dark' } },
      'summary',
    ),
    'dark',
  );
});

test('never activates a phase whose public milestone is absent', () => {
  const campaign = {
    narrativeMood: {
      default: 'light',
      phases: [{ id: 'secret', startsAtSessionId: 'unpublished-session', mood: 'dark' }],
    },
  };
  assert.equal(resolveNarrativeMood(campaign, sessions, sessions[2]), 'light');
});

test('campaign-wide surfaces follow the latest published phase without inheriting a session override', () => {
  const campaign = {
    narrativeMood: {
      default: 'light',
      phases: [{ id: 'gate', startsAtSessionId: 'session-2', mood: 'dark' }],
    },
  };
  const published = [sessions[0], { ...sessions[1], mood: 'light' }];
  assert.equal(resolveNarrativeMood(campaign, published), 'dark');
});

test('removes default session overrides while preserving reviewed non-default blocks', () => {
  assert.deepEqual(
    normalizeSessionNarrativeMood({
      id: 'session-1',
      mood: 'default',
      blockMoods: { summary: 'light', storySoFar: 'default', prose: 'default' },
    }),
    { id: 'session-1', blockMoods: { summary: 'light' } },
  );
});
