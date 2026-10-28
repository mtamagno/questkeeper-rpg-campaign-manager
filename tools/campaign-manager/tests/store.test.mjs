import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import test from 'node:test';

import { normalizeCampaignLanguages, normalizeLanguageTag } from '../language-catalog.mjs';

import {
  createCampaign,
  deleteCampaign,
  deleteEntity,
  exportCampaign,
  getCampaign,
  getState,
  importCampaign,
  saveEntity,
  updateCampaign,
} from '../store.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'campaign-companion-manager-'));
  const campaigns = join(root, 'src', 'campaigns');
  await mkdir(campaigns, { recursive: true });
  await writeFile(join(campaigns, 'campaigns.json'), '[]\n', 'utf8');
  t.after(async () => {
    const rel = relative(tmpdir(), root);
    assert.match(rel, /^campaign-companion-manager-/);
    await rm(root, { recursive: true, force: true });
  });
  return root;
}

const campaignInput = {
  id: 'sentiero-delle-lanterne',
  name: { it: 'Il Sentiero delle Lanterne', en: 'The Lantern Road' },
  description: { it: 'Una prova.', en: 'A test.' },
  dungeonMaster: 'Mara',
  partyName: 'Le Lucciole',
  edition: 'Open fantasy rules',
  startDate: '2026-10-14',
};

test('creates a complete campaign and reports its counts', async (t) => {
  const root = await fixture(t);
  const campaign = await createCampaign(root, campaignInput);
  assert.equal(campaign.manifestEntry.id, campaignInput.id);
  assert.equal(campaign.manifestEntry.palette, 'heroic');
  assert.deepEqual((await getState(root)).campaigns[0].counts, {
    characters: 0,
    npcs: 0,
    sessions: 0,
    maps: 0,
  });
});

test('generates stable collision-safe campaign IDs from localized names', async (t) => {
  const root = await fixture(t);
  const first = await createCampaign(root, {
    ...campaignInput,
    id: undefined,
    languages: ['es'],
    defaultLanguage: 'es',
    name: { es: 'Crónicas del Mar' },
  });
  const duplicate = await createCampaign(root, {
    ...campaignInput,
    id: undefined,
    languages: ['es'],
    defaultLanguage: 'es',
    name: { es: 'Crónicas del Mar' },
  });
  const unicode = await createCampaign(root, {
    ...campaignInput,
    id: undefined,
    languages: ['ja'],
    defaultLanguage: 'ja',
    name: { ja: '海の年代記' },
  });

  assert.equal(first.manifestEntry.id, 'cronicas-del-mar');
  assert.equal(duplicate.manifestEntry.id, 'cronicas-del-mar-2');
  assert.match(unicode.manifestEntry.id, /^campaign-[a-z0-9]+$/);
});

test('normalizes known rulesets while preserving custom editions', async (t) => {
  const root = await fixture(t);
  const known = await createCampaign(root, {
    ...campaignInput,
    id: 'known-system',
    gameSystem: { id: 'dnd-2024', edition: 'duplicated text' },
  });
  const legacy = await createCampaign(root, {
    ...campaignInput,
    id: 'legacy-system',
    edition: 'D&D 5e 2014',
  });
  const custom = await createCampaign(root, {
    ...campaignInput,
    id: 'custom-system',
    gameSystem: { id: 'generic', edition: 'Moonlit d12' },
  });

  assert.equal(known.campaign.gameSystem.edition, '5E fantasy (2024)');
  assert.equal(known.campaign.edition, '5E fantasy (2024)');
  assert.equal(legacy.campaign.gameSystem.id, 'dnd-2014');
  assert.equal(legacy.campaign.edition, '5E fantasy (2014)');
  assert.equal(custom.campaign.gameSystem.id, 'generic');
  assert.equal(custom.campaign.edition, 'Moonlit d12');
});

test('stores curated campaign palettes and rejects unknown themes', async (t) => {
  const root = await fixture(t);
  const campaign = await createCampaign(root, { ...campaignInput, palette: 'gothic' });
  assert.equal(campaign.manifestEntry.palette, 'gothic');

  const updated = await updateCampaign(root, campaignInput.id, { palette: 'neutral' });
  assert.equal(updated.manifestEntry.palette, 'neutral');

  await assert.rejects(
    updateCampaign(root, campaignInput.id, { palette: 'neon' }),
    /heroic, gothic or neutral/,
  );
});

test('manages characters, sessions and maps without editing manifests', async (t) => {
  const root = await fixture(t);
  await createCampaign(root, campaignInput);
  await saveEntity(root, campaignInput.id, 'characters', {
    id: 'aria',
    name: 'Aria',
    heightCm: 168,
    profileImageUrl: 'images/characters/aria-profile.webp',
    portraitImageUrl: 'images/characters/aria-portrait.webp',
    publicProfile: { hobbies: { en: 'Restoring lanterns.' } },
  });
  await saveEntity(root, campaignInput.id, 'sessions', {
    id: 'sessione-uno',
    title: { it: 'Il ponte', en: 'The bridge' },
  });
  await saveEntity(root, campaignInput.id, 'maps', {
    id: 'valle',
    name: { it: 'La Valle', en: 'The Valley' },
  });

  let campaign = await getCampaign(root, campaignInput.id);
  assert.equal(campaign.characters[0].name, 'Aria');
  assert.equal(campaign.characters[0].heightCm, 168);
  assert.equal(campaign.characters[0].profileImageUrl, 'images/characters/aria-profile.webp');
  assert.equal(campaign.characters[0].portraitImageUrl, 'images/characters/aria-portrait.webp');
  assert.equal(campaign.characters[0].publicProfile.hobbies.en, 'Restoring lanterns.');
  assert.equal(campaign.sessions[0].title.it, 'Il ponte');
  assert.equal(campaign.maps[0].name.en, 'The Valley');

  await deleteEntity(root, campaignInput.id, 'characters', 'aria');
  campaign = await getCampaign(root, campaignInput.id);
  assert.equal(campaign.characters.length, 0);
  const trash = await readFile(
    join(root, 'src', 'campaigns', campaignInput.id, 'data', 'characters', 'manifest.json'),
    'utf8',
  );
  assert.deepEqual(JSON.parse(trash), []);
});

test('round-trips multilingual pronouns while legacy characters remain unchanged', async (t) => {
  const root = await fixture(t);
  await createCampaign(root, {
    ...campaignInput,
    id: 'localized-pronouns',
    languages: ['en', 'it', 'fr'],
    defaultLanguage: 'en',
  });
  await saveEntity(root, 'localized-pronouns', 'characters', {
    id: 'explicit',
    name: 'Explicit Source',
    pronouns: { en: 'they/them', it: 'loro', fr: 'iel' },
  });
  await saveEntity(root, 'localized-pronouns', 'characters', {
    id: 'legacy',
    name: 'Legacy Record',
    sex: { en: 'Woman', it: 'Donna' },
  });

  const campaign = await getCampaign(root, 'localized-pronouns');
  const explicit = campaign.characters.find((character) => character.id === 'explicit');
  const legacy = campaign.characters.find((character) => character.id === 'legacy');
  assert.deepEqual(explicit.pronouns, { en: 'they/them', it: 'loro', fr: 'iel' });
  assert.equal(Object.hasOwn(legacy, 'pronouns'), false);
  assert.deepEqual(legacy.sex, { en: 'Woman', it: 'Donna' });
});

test('enforces one campaign-wide ID namespace under concurrent saves', async (t) => {
  const root = await fixture(t);
  await createCampaign(root, campaignInput);
  await saveEntity(root, campaignInput.id, 'characters', { id: 'test', name: 'First hero' });

  await assert.rejects(
    saveEntity(root, campaignInput.id, 'characters', { id: 'test', name: 'Second hero' }),
    /already used by a player character/,
  );
  await assert.rejects(
    saveEntity(root, campaignInput.id, 'npcs', { id: 'test', name: 'Test NPC' }),
    /already used by a player character/,
  );
  await assert.rejects(
    saveEntity(root, campaignInput.id, 'sessions', { id: 'test', title: 'Test session' }),
    /already used by a player character/,
  );
  await assert.rejects(
    saveEntity(root, campaignInput.id, 'maps', { id: 'test', name: 'Test map' }),
    /already used by a player character/,
  );

  await saveEntity(
    root,
    campaignInput.id,
    'characters',
    { id: 'test', name: 'Edited hero' },
    'test',
  );
  assert.equal((await getCampaign(root, campaignInput.id)).characters[0].name, 'Edited hero');

  const results = await Promise.allSettled([
    saveEntity(root, campaignInput.id, 'npcs', { id: 'simultaneous', name: 'NPC' }),
    saveEntity(root, campaignInput.id, 'maps', { id: 'simultaneous', name: 'Map' }),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
});

test('generates stable campaign-wide IDs when authors leave identity automatic', async (t) => {
  const root = await fixture(t);
  await createCampaign(root, campaignInput);
  const first = await saveEntity(root, campaignInput.id, 'characters', {
    name: 'Éowyn, Figlia di Éomund!',
  });
  const second = await saveEntity(root, campaignInput.id, 'npcs', {
    name: 'Éowyn, Figlia di Éomund!',
  });
  const unnamed = await saveEntity(root, campaignInput.id, 'maps', { name: { en: '' } });
  assert.equal(first.id, 'eowyn-figlia-di-eomund');
  assert.equal(second.id, 'eowyn-figlia-di-eomund-2');
  assert.equal(unnamed.id, 'map');

  const renamed = await saveEntity(
    root,
    campaignInput.id,
    'characters',
    { ...first, name: 'The White Lady' },
    first.id,
  );
  assert.equal(renamed.id, first.id);
});

test('exports, imports and recoverably deletes a campaign', async (t) => {
  const source = await fixture(t);
  const target = await fixture(t);
  await createCampaign(source, campaignInput);
  await saveEntity(source, campaignInput.id, 'npcs', { id: 'olmo', name: 'Olmo' });
  const bundle = await exportCampaign(source, campaignInput.id);
  const imported = await importCampaign(target, bundle);
  assert.equal(imported.npcs[0].name, 'Olmo');

  await assert.rejects(deleteCampaign(target, campaignInput.id, 'sbagliato'));
  await deleteCampaign(target, campaignInput.id, campaignInput.id);
  assert.equal((await getState(target)).campaigns.length, 0);
});

test('rejects a colliding import before creating partial campaign files', async (t) => {
  const source = await fixture(t);
  const target = await fixture(t);
  await createCampaign(source, campaignInput);
  const bundle = await exportCampaign(source, campaignInput.id);
  bundle.characters = [{ id: 'shared', name: 'Hero' }];
  bundle.npcs = [{ id: 'shared', name: 'NPC' }];

  await assert.rejects(importCampaign(target, bundle), /unique across characters, NPCs/);
  assert.deepEqual((await getState(target)).campaigns, []);
});

test('supports arbitrary BCP-47 campaign languages and regional codes', async (t) => {
  const root = await fixture(t);
  const campaign = await createCampaign(root, {
    ...campaignInput,
    id: 'cronicas-del-mar',
    languages: ['es', 'ja', 'pt-BR'],
    defaultLanguage: 'es',
    name: { en: 'Chronicles of the Sea', es: 'Crónicas del Mar', ja: '海の年代記' },
  });

  assert.deepEqual(campaign.manifestEntry.languages, ['es', 'ja', 'pt-BR']);
  assert.equal(campaign.manifestEntry.defaultLanguage, 'es');
  assert.equal(campaign.manifestEntry.name.ja, '海の年代記');

  const updated = await updateCampaign(root, campaign.manifestEntry.id, {
    languages: ['de', 'fr-CA'],
    defaultLanguage: 'fr-CA',
    name: { de: '', 'fr-CA': 'Chroniques de la mer' },
  });
  assert.deepEqual(updated.campaign.languages, ['de', 'fr-CA']);
  assert.equal(updated.campaign.defaultLanguage, 'fr-CA');

  await assert.rejects(
    updateCampaign(root, campaign.manifestEntry.id, { languages: ['not a language'] }),
    /valid BCP-47/,
  );
  await assert.rejects(
    updateCampaign(root, campaign.manifestEntry.id, {
      languages: ['de', 'fr-CA'],
      defaultLanguage: 'it',
    }),
    /default language must be one of the selected/,
  );
});

test('canonicalizes valid custom language tags and removes duplicates', () => {
  assert.equal(normalizeLanguageTag('EN-us'), 'en-US');
  assert.equal(normalizeLanguageTag('sr-latn'), 'sr-Latn');
  assert.deepEqual(normalizeCampaignLanguages(['pt-br', 'pt-BR', 'zh-hant']), ['pt-BR', 'zh-Hant']);
  assert.throws(() => normalizeLanguageTag('not a language'), /valid BCP-47/);
});

test('allows partial secondary-language drafts but requires the default campaign name', async (t) => {
  const root = await fixture(t);
  const campaign = await createCampaign(root, {
    id: 'partial-translations',
    languages: ['it', 'en', 'fr'],
    defaultLanguage: 'it',
    name: { it: 'Cronache', en: '', fr: '' },
    description: { it: 'Testo completo', en: '', fr: '' },
  });

  assert.deepEqual(campaign.manifestEntry.name, { it: 'Cronache', en: '', fr: '' });
  const updated = await updateCampaign(root, 'partial-translations', { palette: 'gothic' });
  assert.equal(updated.manifestEntry.palette, 'gothic');
  assert.equal(updated.manifestEntry.name.en, '');

  await assert.rejects(
    updateCampaign(root, 'partial-translations', { defaultLanguage: 'fr' }),
    /Campaign name is required in the default language \(fr\)/,
  );
});
