const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const campaigns = JSON.parse(fs.readFileSync(path.join(root, 'src/campaigns/campaigns.json'), 'utf8'));
const failures = [];
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

function checkLocalized(value, languages, label) {
  for (const language of languages) {
    if (typeof value?.[language] !== 'string' || !value[language].trim()) {
      failures.push(`${label}.${language} must be non-empty text`);
    }
  }
}

for (const campaign of campaigns) {
  const base = `src/campaigns/${campaign.id}/data`;
  const characterIds = new Set(read(`${base}/characters/manifest.json`).map((file) => read(`${base}/characters/${file}`).id));
  const sessionIds = new Set(read(`${base}/sessions/manifest.json`).map((file) => read(`${base}/sessions/${file}`).id));
  const memoryIds = new Set();
  for (const relationship of read(`${base}/party-relationships.json`)) {
    for (const memory of relationship.sharedMemories ?? []) {
      const label = `${campaign.id}/memory:${memory.id || '(missing)'}`;
      if (!memory.id || memoryIds.has(memory.id)) failures.push(`${label} needs a campaign-unique ID`);
      memoryIds.add(memory.id);
      if (!sessionIds.has(memory.sessionId)) failures.push(`${label} references unknown session ${memory.sessionId}`);
      if (!Array.isArray(memory.participantIds) || memory.participantIds.length < 2) failures.push(`${label} needs at least two participants`);
      if (!memory.participantIds?.includes(relationship.sourceId) || !memory.participantIds?.includes(relationship.targetId)) failures.push(`${label} must include both relationship participants`);
      if (memory.participantIds?.some((id) => !characterIds.has(id))) failures.push(`${label} references a non-character participant`);
      checkLocalized(memory.title, campaign.languages, `${label}.title`);
      checkLocalized(memory.sharedFacts, campaign.languages, `${label}.sharedFacts`);
      const viewpointIds = new Set();
      for (const viewpoint of memory.viewpoints ?? []) {
        if (!memory.participantIds.includes(viewpoint.entityId)) failures.push(`${label} viewpoint belongs to a non-participant`);
        if (viewpointIds.has(viewpoint.entityId)) failures.push(`${label} duplicates viewpoint ${viewpoint.entityId}`);
        viewpointIds.add(viewpoint.entityId);
        checkLocalized(viewpoint.account, campaign.languages, `${label}.viewpoint:${viewpoint.entityId}`);
      }
      for (const [differenceIndex, difference] of (memory.differences ?? []).entries()) {
        const differenceLabel = `${label}.difference:${differenceIndex + 1}`;
        checkLocalized(difference.topic, campaign.languages, `${differenceLabel}.topic`);
        if (!Array.isArray(difference.accounts) || difference.accounts.length < 2) failures.push(`${differenceLabel} needs at least two attributed accounts`);
        const accountIds = new Set();
        for (const account of difference.accounts ?? []) {
          if (!memory.participantIds.includes(account.entityId)) failures.push(`${differenceLabel} account belongs to a non-participant`);
          if (accountIds.has(account.entityId)) failures.push(`${differenceLabel} duplicates account ${account.entityId}`);
          accountIds.add(account.entityId);
          checkLocalized(account.account, campaign.languages, `${differenceLabel}.account:${account.entityId}`);
        }
      }
    }
  }
}

const routes = fs.readFileSync(path.join(root, 'src/app/app.routes.ts'), 'utf8');
const reader = fs.readFileSync(path.join(root, 'src/app/guild/pages/shared-memory-detail/shared-memory-detail.component.html'), 'utf8');
const data = fs.readFileSync(path.join(root, 'src/app/guild/services/data.service.ts'), 'utf8');
const manager = fs.readFileSync(path.join(root, 'tools/campaign-manager/public/app.js'), 'utf8');
for (const required of ['memories/:memoryId', 'SharedMemoryDetailComponent']) if (!routes.includes(required)) failures.push(`routes missing ${required}`);
for (const required of ['sharedFacts', 'viewpoints()', 'differences()', 'relationshipRoute()']) if (!reader.includes(required)) failures.push(`shared memory reader missing ${required}`);
for (const required of ['getSharedMemoryById', 'getSharedMemoriesForEntity']) if (!data.includes(required)) failures.push(`data service missing ${required}`);
for (const required of ['relationshipMemories__', 'relationshipMemoryViewpoints__', 'relationshipMemoryDifferences__']) if (!manager.includes(required)) failures.push(`Campaign Manager missing ${required}`);

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Shared memories verified across ${campaigns.length} campaign(s).`);
