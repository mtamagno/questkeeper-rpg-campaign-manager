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
    characters: await loadManifest('characters'),
    npcs: await loadManifest('npcs'),
    sessions: await loadManifest('sessions'),
    maps: await json(join(data, 'maps.json'), []),
  };
  const quests = await loadManifest('quests');
  validateQuestCollection(quests, bundle);
  count += quests.length;
}
console.log(`Quest contract verified across ${campaigns.length} campaign(s) and ${count} quest(s).`);

