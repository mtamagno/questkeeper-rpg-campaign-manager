import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { validateQuestCollection } from '../tools/campaign-manager/quest-contract.mjs';

async function json(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT' && fallback !== undefined) return fallback; throw error; }
}

const root = join(process.cwd(), 'src', 'campaigns');
const campaigns = await json(join(root, 'campaigns.json'), []);
let count = 0;
for (const campaign of campaigns) {
  const data = join(root, campaign.id, 'data');
  const loadManifest = async (name) => {
    const folder = join(data, name);
    const files = await json(join(folder, 'manifest.json'), []);
    return Promise.all(files.map((file) => json(join(folder, file))));
  };
  const bundle = {
    manifestEntry: campaign,
    characters: await loadManifest('characters'),
    npcs: await loadManifest('npcs'),
    sessions: await loadManifest('sessions'),
    maps: await json(join(data, 'maps.json'), []),
  };
  const quests = await loadManifest('quests');
  validateQuestCollection(quests, bundle);
  if (quests.length > 0) {
    await stat(join(root, campaign.id, 'images', 'quests', 'quest-log-empty-party.png'));
  }
  for (const quest of quests) {
    for (const update of quest.updates ?? []) {
      if (update.image?.url) await stat(join(root, campaign.id, update.image.url));
    }
  }
  count += quests.length;
}

const readerRoot = join(process.cwd(), 'src', 'app');
const questListMarkup = await readFile(
  join(readerRoot, 'guild', 'components', 'quest-list', 'quest-list.component.html'),
  'utf8',
);
const questListStyles = await readFile(
  join(readerRoot, 'guild', 'components', 'quest-list', 'quest-list.component.scss'),
  'utf8',
);
const questLogMarkup = await readFile(
  join(readerRoot, 'chronicle', 'pages', 'quest-log', 'quest-log.component.html'),
  'utf8',
);
const uiCatalog = JSON.parse(
  await readFile(join(readerRoot, 'guild', 'i18n', 'ui.json'), 'utf8'),
);

for (const selector of [
  'quest-launcher__open',
  'quest-reader__sidebar',
  'quest-reader__detail',
  'quest-reader__empty-selection',
  'quest-detail__objective',
  'quest-history__marker',
]) {
  if (!questListMarkup.includes(selector)) {
    throw new Error(`Quest reader is missing the ${selector} hierarchy.`);
  }
}
if (!questListMarkup.includes('aria-modal="true"')) {
  throw new Error('Quest reader must open as a modal workspace.');
}
if (!questListMarkup.includes('visibleProjections()')) {
  throw new Error('Quest reader is missing its title-only filtered sidebar.');
}
for (const locale of Object.values(uiCatalog.locales)) {
  if (!locale.texts.commandBar.routeLabels.quests) {
    throw new Error(`Quest Log breadcrumb is missing for ${locale.label}.`);
  }
}
if (/var\(--color-/.test(questListStyles)) {
  throw new Error('Quest reader uses undefined legacy color tokens.');
}
for (const token of [
  '--qk-color-surface',
  '--qk-color-surface-raised',
  '--qk-color-border-strong',
]) {
  if (!questListStyles.includes(token)) {
    throw new Error(`Quest reader is missing semantic token ${token}.`);
  }
}
console.log(`Quest contract verified across ${campaigns.length} campaign(s) and ${count} quest(s).`);

