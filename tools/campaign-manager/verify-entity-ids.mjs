import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { assertCampaignEntityIds, ENTITY_TYPES } from './entity-identity.mjs';

const projectRoot = resolve(process.argv[2] ?? process.cwd());
const campaignsRoot = join(projectRoot, 'src', 'campaigns');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function loadCampaign(campaignId) {
  const dataRoot = join(campaignsRoot, campaignId, 'data');
  const collections = {};
  for (const type of ENTITY_TYPES) {
    if (type === 'maps') {
      const source = join(dataRoot, 'maps.json');
      collections.maps = (await readJson(source)).map((entity) => ({
        ...entity,
        __source: source,
      }));
      continue;
    }
    const folder = join(dataRoot, type);
    const manifest = await readJson(join(folder, 'manifest.json'));
    collections[type] = await Promise.all(
      manifest.map(async (fileName) => {
        const source = join(folder, fileName);
        const entity = await readJson(source);
        if (`${entity.id}.json` !== fileName) {
          throw new Error(`${campaignId}: ${source} must match its entity ID "${entity.id}".`);
        }
        return { ...entity, __source: source };
      }),
    );
  }
  return collections;
}

const manifest = await readJson(join(campaignsRoot, 'campaigns.json'));
for (const campaign of manifest) {
  try {
    assertCampaignEntityIds(await loadCampaign(campaign.id));
  } catch (error) {
    throw new Error(`${campaign.id}: ${error.message}`);
  }
}

console.log(
  `Campaign entity IDs verified across characters, NPCs, sessions and maps for ${manifest.length} campaign(s).`,
);
