const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const campaigns = JSON.parse(fs.readFileSync(path.join(root, 'src/campaigns/campaigns.json'), 'utf8'));
const statuses = new Set(['made', 'kept', 'broken', 'released']);
const failures = [];

function read(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

function localized(value, languages, label) {
  if (!value || typeof value !== 'object') failures.push(`${label} must be localized`);
  for (const language of languages) {
    if (typeof value?.[language] !== 'string') failures.push(`${label}.${language} must be text`);
  }
}

for (const campaign of campaigns) {
  const base = `src/campaigns/${campaign.id}/data`;
  const sessions = new Set(
    read(`${base}/sessions/manifest.json`).map((file) => read(`${base}/sessions/${file}`).id),
  );
  for (const file of ['party-relationships.json', 'npc-relationships.json']) {
    const relationships = read(`${base}/${file}`);
    for (const [relationshipIndex, relationship] of relationships.entries()) {
      const owner = `${campaign.id}/${file}#${relationshipIndex + 1}`;
      for (const [index, entry] of (relationship.history ?? []).entries()) {
        if (!sessions.has(entry.sessionId)) failures.push(`${owner} history ${index + 1} has unknown session`);
        const dimensions = ['trust', 'tension', 'affection'].filter((key) => entry[key] !== undefined);
        if (dimensions.length === 0) failures.push(`${owner} history ${index + 1} has no dimensions`);
        for (const key of dimensions) {
          if (!Number.isInteger(entry[key]) || entry[key] < 0 || entry[key] > 5) {
            failures.push(`${owner} history ${index + 1}.${key} must be an integer from 0 to 5`);
          }
        }
        localized(entry.note, campaign.languages, `${owner} history ${index + 1}.note`);
      }
      const promiseStates = new Map();
      const changes = new Set();
      for (const [index, change] of (relationship.promiseHistory ?? []).entries()) {
        const label = `${owner} promise ${index + 1}`;
        if (!sessions.has(change.sessionId)) failures.push(`${label} has unknown session`);
        if (!change.promiseId) failures.push(`${label} needs a stable promiseId`);
        if (!statuses.has(change.status)) failures.push(`${label} has unsupported status ${change.status}`);
        const changeKey = `${change.promiseId}:${change.sessionId}:${change.status}`;
        if (changes.has(changeKey)) failures.push(`${label} duplicates ${changeKey}`);
        changes.add(changeKey);
        if (!promiseStates.has(change.promiseId) && change.status !== 'made') {
          failures.push(`${label} must begin with made`);
        }
        if (['kept', 'broken', 'released'].includes(promiseStates.get(change.promiseId))) {
          failures.push(`${label} changes an already resolved promise`);
        }
        promiseStates.set(change.promiseId, change.status);
        localized(change.label, campaign.languages, `${label}.label`);
        if (change.note !== undefined) localized(change.note, campaign.languages, `${label}.note`);
      }
    }
  }
}

const model = fs.readFileSync(path.join(root, 'src/app/guild/models/relationship.model.ts'), 'utf8');
const reader = fs.readFileSync(path.join(root, 'src/app/guild/pages/relationship-detail/relationship-detail.component.html'), 'utf8');
const manager = fs.readFileSync(path.join(root, 'tools/campaign-manager/public/app.js'), 'utf8');
for (const required of ['RelationshipHistoryEntry', 'RelationshipPromiseChange', 'promiseHistory']) {
  if (!model.includes(required)) failures.push(`relationship model is missing ${required}`);
}
for (const required of ['history()', 'promiseHistory()', 'dimensionValue']) {
  if (!reader.includes(required)) failures.push(`relationship reader is missing ${required}`);
}
for (const required of ['relationshipHistory__', 'relationshipPromises__', 'promiseStatuses']) {
  if (!manager.includes(required)) failures.push(`Campaign Manager is missing ${required}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Relationship history verified across ${campaigns.length} campaign(s).`);
