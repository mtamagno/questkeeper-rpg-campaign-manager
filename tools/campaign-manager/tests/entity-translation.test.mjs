import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  applyTranslationDraft,
  buildTranslationPlan,
  buildTranslationPlans,
  mergeAppliedRecords,
  normalizeTranslationTargets,
  readTranslationWorkspace,
  runTranslationTargetBatch,
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

test('plans one, two and N targets independently without duplicating locale work', () => {
  const multilingual = structuredClone(campaign);
  for (const entity of [
    ...multilingual.characters,
    ...multilingual.npcs,
    ...multilingual.sessions,
    ...multilingual.partyRelationships,
  ]) {
    const visit = (value) => {
      if (!value || typeof value !== 'object') return;
      if (!Array.isArray(value) && typeof value.en === 'string') {
        value.fr ??= '';
        value.de ??= '';
        return;
      }
      for (const child of Object.values(value)) visit(child);
    };
    visit(entity);
  }
  const batch = buildTranslationPlans({
    campaign: multilingual,
    availableLanguages: ['en', 'it', 'fr', 'de'],
    sourceLanguage: 'en',
    targetLanguages: ['it', 'fr', 'de', 'fr'],
  });
  assert.deepEqual(batch.targetLanguages, ['it', 'fr', 'de']);
  assert.deepEqual(Object.keys(batch.drafts), ['it', 'fr', 'de']);
  assert.ok(batch.drafts.fr.items.every((item) => item.targetLanguage === undefined));
  assert.ok(batch.drafts.fr.items.some((item) => item.status === 'missing'));
});

test('rejects self-translation and removed campaign locales without touching drafts', () => {
  assert.throws(
    () =>
      normalizeTranslationTargets({
        availableLanguages: ['en', 'fr'],
        sourceLanguage: 'en',
        targetLanguages: ['en'],
      }),
    /different/,
  );
  assert.throws(
    () =>
      normalizeTranslationTargets({
        availableLanguages: ['en', 'fr'],
        sourceLanguage: 'en',
        targetLanguages: ['de'],
      }),
    /no longer configured/,
  );
});

test('preserves successful targets and retries only partial failures', async () => {
  const attempts = [];
  const first = await runTranslationTargetBatch({
    targetLanguages: ['it', 'fr', 'de'],
    worker: async (target) => {
      attempts.push(target);
      if (target === 'fr') throw new Error('temporary provider failure');
      return { status: 'draft', value: target.toUpperCase() };
    },
  });
  assert.deepEqual(Object.keys(first.results), ['it', 'de']);
  assert.match(first.failures.fr, /temporary/);

  attempts.length = 0;
  const resumed = await runTranslationTargetBatch({
    targetLanguages: ['it', 'fr', 'de'],
    completedTargets: Object.keys(first.results),
    worker: async (target) => {
      attempts.push(target);
      return { status: 'draft', value: target.toUpperCase() };
    },
  });
  assert.deepEqual(attempts, ['fr']);
  assert.equal(resumed.results.it.status, 'preserved');
  assert.equal(resumed.results.fr.value, 'FR');
  assert.equal(resumed.results.de.status, 'preserved');
});

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
      targetLanguage: 'it',
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
  assert.ok(applied[`it:${quote.key}`]);
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
