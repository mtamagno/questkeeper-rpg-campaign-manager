const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const campaignsRoot = path.join(projectRoot, 'src', 'campaigns');
const campaigns = JSON.parse(fs.readFileSync(path.join(campaignsRoot, 'campaigns.json'), 'utf8'));
const allowedKinds = new Set(['letter', 'sketch', 'handout', 'memento']);
const failures = [];
let keepsakeCount = 0;

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function localized(value) {
  return (
    value && typeof value === 'object' && Object.values(value).some((copy) => String(copy).trim())
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

for (const campaign of campaigns) {
  const campaignRoot = path.join(campaignsRoot, campaign.id);
  const characterRoot = path.join(campaignRoot, 'data', 'characters');
  const sessionRoot = path.join(campaignRoot, 'data', 'sessions');
  const characterManifest = path.join(characterRoot, 'manifest.json');
  if (!fs.existsSync(characterManifest)) continue;
  const sessionIds = new Set(
    fs.existsSync(path.join(sessionRoot, 'manifest.json'))
      ? readJson(path.join(sessionRoot, 'manifest.json')).map(
          (file) => readJson(path.join(sessionRoot, file)).id,
        )
      : [],
  );
  for (const file of readJson(characterManifest)) {
    const character = readJson(path.join(characterRoot, file));
    const keepsakes = character.keepsakes ?? [];
    assert(Array.isArray(keepsakes), `${campaign.id}/${character.id} keepsakes must be an array.`);
    const ids = new Set();
    const sourceIds = {
      chapter: new Set((character.loreChapters ?? []).map((entry) => entry.id)),
      notebook: new Set(
        (character.notebook?.pages ?? [])
          .filter((entry) => entry.secrecy === 'party' || entry.secrecy === 'public')
          .map((entry) => entry.id),
      ),
      diary: new Set((character.diary ?? []).map((entry) => entry.sessionId)),
      quote: new Set((character.quotes ?? []).map((entry) => entry.sessionId)),
      chronicle: sessionIds,
    };
    for (const keepsake of keepsakes) {
      keepsakeCount += 1;
      const label = `${campaign.id}/${character.id}/${keepsake.id ?? 'missing-id'}`;
      assert(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(keepsake.id),
        `${label} needs a stable lowercase ID.`,
      );
      assert(!ids.has(keepsake.id), `${label} duplicates a keepsake ID.`);
      ids.add(keepsake.id);
      assert(allowedKinds.has(keepsake.kind), `${label} uses unsupported kind ${keepsake.kind}.`);
      assert(
        localized(keepsake.title) && localized(keepsake.description),
        `${label} needs localized title and description.`,
      );
      assert(
        keepsake.image?.url && keepsake.image?.alt?.trim(),
        `${label} needs an image and alt text.`,
      );
      if (keepsake.image?.url) {
        assert(
          fs.existsSync(path.join(campaignRoot, ...keepsake.image.url.split('/'))),
          `${label} points to missing image ${keepsake.image.url}.`,
        );
      }
      assert(
        keepsake.source?.id && localized(keepsake.source?.label),
        `${label} needs a stable labelled source.`,
      );
      assert(
        sourceIds[keepsake.source?.kind]?.has(keepsake.source?.id),
        `${label} references unknown or private ${keepsake.source?.kind} source ${keepsake.source?.id}.`,
      );
      if (keepsake.sessionId)
        assert(
          sessionIds.has(keepsake.sessionId),
          `${label} references unknown session ${keepsake.sessionId}.`,
        );
    }
  }
}

const journal = fs.readFileSync(
  path.join(
    projectRoot,
    'src/app/adventurers/components/character-journal/character-journal.component.ts',
  ),
  'utf8',
);
const keepsakeComponent = fs.readFileSync(
  path.join(
    projectRoot,
    'src/app/adventurers/components/character-keepsakes/character-keepsakes.component.ts',
  ),
  'utf8',
);
const keepsakeTemplate = fs.readFileSync(
  path.join(
    projectRoot,
    'src/app/adventurers/components/character-keepsakes/character-keepsakes.component.html',
  ),
  'utf8',
);
const manager = fs.readFileSync(
  path.join(projectRoot, 'tools/campaign-manager/public/app.js'),
  'utf8',
);
for (const token of ['visibleKeepsakes', "page?.secrecy === 'party'", "page?.secrecy === 'public'"])
  assert(journal.includes(token), `Journal is missing privacy token ${token}.`);
for (const token of ['ImageLightboxComponent', 'printArchive', 'questkeeper-print-keepsakes'])
  assert(keepsakeComponent.includes(token), `Keepsake reader is missing ${token}.`);
assert(
  keepsakeTemplate.includes('<app-image-lightbox'),
  'Keepsakes must use the accessible shared lightbox.',
);
for (const token of [
  'keepsakesEditor',
  'buildKeepsakes',
  'Public keepsakes cannot reveal private notebook pages',
])
  assert(manager.includes(token), `Manager is missing keepsake contract ${token}.`);
if (campaigns.some((campaign) => campaign.id === 'example-campaign'))
  assert(keepsakeCount > 0, 'The public example campaign must exercise the keepsake contract.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log(
  `Character keepsake contract verified across ${campaigns.length} campaign(s) and ${keepsakeCount} keepsake(s).`,
);
