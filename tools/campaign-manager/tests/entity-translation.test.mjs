import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  applyTranslationDraft,
  buildTranslationPlan,
  mergeAppliedRecords,
  readTranslationWorkspace,
  writeTranslationWorkspace,
} from '../entity-translation.mjs';

const campaign = {
  characters: [
    {
      id: 'aria',
      name: { en: 'Aria', it: 'Aria' },
      portraitImageUrl: 'images/characters/aria.webp',
      publicProfile: {
        backstory: { en: 'Keeps **time**.\n\n![watch](images/watch.webp)', it: '' },
        quote: { en: 'Never late.', it: 'Mai in ritardo.' },
      },
    },
  ],
  npcs: [{ id: 'guide', name: { en: 'The Guide', it: 'La Guida' }, role: { en: 'Guide', it: '' } }],
  sessions: [
    {
      id: 'session-1',
      title: { en: 'The Road', it: '' },
      image: { path: 'images/road.webp', caption: { en: 'A long road', it: '' } },
    },
  ],
  maps: [],
  partyRelationships: [
    { sourceId: 'aria', targetId: 'guide', description: { en: 'Careful trust', it: '' } },
  ],
  npcRelationships: [],
};

test('plans exact entity scopes while protecting identity and media paths', () => {
  const all = buildTranslationPlan({ campaign, sourceLanguage: 'en', targetLanguage: 'it' });
  assert.ok(all.items.some((item) => item.path === 'publicProfile.backstory'));
  assert.ok(all.items.some((item) => item.path === 'image.caption'));
  assert.ok(all.items.some((item) => item.entityType === 'party-relationships'));
  assert.ok(!all.items.some((item) => item.path === 'name'));
  assert.ok(!all.items.some((item) => item.path.includes('path')));
  assert.match(
    all.items.find((item) => item.path === 'publicProfile.backstory').source,
    /images\/watch\.webp/,
  );

  const oneField = buildTranslationPlan({
    campaign,
    sourceLanguage: 'en',
    targetLanguage: 'it',
    entityTypes: ['characters'],
    entityIds: ['aria'],
    fieldPaths: ['publicProfile.backstory'],
  });
  assert.equal(oneField.items.length, 1);
  assert.equal(oneField.items[0].status, 'missing');
  assert.equal(oneField.items[0].selected, true);
});

test('tracks missing, stale and current targets and defaults only work that needs review', () => {
  const first = buildTranslationPlan({ campaign, sourceLanguage: 'en', targetLanguage: 'it' });
  const quote = first.items.find((item) => item.path === 'publicProfile.quote');
  assert.equal(quote.status, 'stale');
  const applied = mergeAppliedRecords(
    {},
    {
      applied: [{ key: quote.key, sourceHash: quote.sourceHash, targetHash: quote.targetHash }],
    },
  );
  const next = buildTranslationPlan({
    campaign,
    sourceLanguage: 'en',
    targetLanguage: 'it',
    applied,
  });
  const current = next.items.find((item) => item.key === quote.key);
  assert.equal(current.status, 'current');
  assert.equal(current.selected, false);
});

test('requires review and overwrite consent and applies atomically to a clone', () => {
  const plan = buildTranslationPlan({
    campaign,
    sourceLanguage: 'en',
    targetLanguage: 'it',
    entityTypes: ['characters'],
  });
  const items = plan.items.map((item) => ({
    ...item,
    selected: true,
    draft: `IT: ${item.source}`,
  }));
  assert.throws(
    () => applyTranslationDraft(campaign, { ...plan, items, status: 'draft' }),
    /Review/,
  );
  assert.throws(
    () => applyTranslationDraft(campaign, { ...plan, items, status: 'reviewed' }),
    /Overwrite consent/,
  );
  const result = applyTranslationDraft(
    campaign,
    { ...plan, items, status: 'reviewed' },
    { overwrite: true },
  );
  assert.equal(result.report.completed, true);
  assert.equal(campaign.characters[0].publicProfile.backstory.it, '');
  assert.match(result.campaign.characters[0].publicProfile.backstory.it, /^IT:/);
  assert.equal(result.campaign.characters[0].portraitImageUrl, 'images/characters/aria.webp');
});

test('rejects a draft when its source changed after planning', () => {
  const plan = buildTranslationPlan({
    campaign,
    sourceLanguage: 'en',
    targetLanguage: 'it',
    entityTypes: ['npcs'],
  });
  const changed = structuredClone(campaign);
  changed.npcs[0].role.en = 'Unknown guide';
  const draft = {
    ...plan,
    status: 'reviewed',
    items: plan.items.map((item) => ({ ...item, draft: 'Guida' })),
  };
  assert.throws(() => applyTranslationDraft(changed, draft), /Source changed/);
});

test('persists and resumes an interrupted review workspace', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'questkeeper-translations-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const plan = buildTranslationPlan({ campaign, sourceLanguage: 'en', targetLanguage: 'it' });
  await writeTranslationWorkspace(root, 'lantern-road', {
    applied: {},
    draft: {
      ...plan,
      status: 'draft',
      items: plan.items.map((item) => ({ ...item, draft: 'Bozza' })),
    },
  });
  const resumed = await readTranslationWorkspace(root, 'lantern-road');
  assert.equal(resumed.draft.status, 'draft');
  assert.equal(resumed.draft.items[0].draft, 'Bozza');
});
