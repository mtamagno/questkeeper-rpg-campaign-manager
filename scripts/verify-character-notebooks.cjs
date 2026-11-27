const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const campaignsRoot = path.join(projectRoot, 'src', 'campaigns');
const campaigns = JSON.parse(fs.readFileSync(path.join(campaignsRoot, 'campaigns.json'), 'utf8'));
const allowedMoods = new Set([
  'joyful',
  'tender',
  'calm',
  'hopeful',
  'mysterious',
  'wary',
  'uneasy',
  'fractured',
  'grief',
  'guilt',
  'memory',
  'time',
  'music',
  'renewal',
]);
const allowedSecrecy = new Set(['private', 'party', 'public']);
const allowedPaperStyles = new Set(['classic', 'weathered', 'moonlit', 'ash', 'botanical']);
const allowedHandwritingStyles = new Set([
  'measured',
  'flowing',
  'compact',
  'angular',
  'ornate',
]);
const failures = [];
let notebookCount = 0;
let enrichedPageCount = 0;
let styledNotebookCount = 0;

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertAsset(campaignRoot, asset, label) {
  if (!asset) return;
  assert(typeof asset.url === 'string' && asset.url.length > 0, `${label} has no URL.`);
  assert(typeof asset.alt === 'string' && asset.alt.trim().length > 0, `${label} has no alt text.`);
  if (asset.url) {
    assert(
      fs.existsSync(path.join(campaignRoot, ...asset.url.split('/'))),
      `${label} points to missing asset ${asset.url}.`,
    );
  }
}

for (const campaign of campaigns) {
  const campaignRoot = path.join(campaignsRoot, campaign.id);
  const characterRoot = path.join(campaignRoot, 'data', 'characters');
  const sessionRoot = path.join(campaignRoot, 'data', 'sessions');
  const manifestPath = path.join(characterRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const characterIds = new Set(
    manifest.map(
      (fileName) => JSON.parse(fs.readFileSync(path.join(characterRoot, fileName), 'utf8')).id,
    ),
  );
  const sessionManifestPath = path.join(sessionRoot, 'manifest.json');
  const sessionIds = new Set(
    fs.existsSync(sessionManifestPath)
      ? JSON.parse(fs.readFileSync(sessionManifestPath, 'utf8')).map(
          (fileName) => JSON.parse(fs.readFileSync(path.join(sessionRoot, fileName), 'utf8')).id,
        )
      : [],
  );
  for (const fileName of manifest) {
    const character = JSON.parse(fs.readFileSync(path.join(characterRoot, fileName), 'utf8'));
    if (!character.notebook) continue;
    notebookCount += 1;
    const notebook = character.notebook;
    const label = `${campaign.id}/${character.id} notebook`;
    assert(notebook.title && notebook.description, `${label} needs a title and description.`);
    assert(
      typeof notebook.password === 'string' && notebook.password.length > 0,
      `${label} needs a password.`,
    );
    assert(
      typeof notebook.styleDirectives === 'string' && notebook.styleDirectives.trim().length >= 20,
      `${label} needs character-specific style directives.`,
    );
    if (notebook.presentation !== undefined) {
      assert(
        allowedPaperStyles.has(notebook.presentation.paper),
        `${label} uses unsupported paper style ${notebook.presentation.paper}.`,
      );
      assert(
        allowedHandwritingStyles.has(notebook.presentation.handwriting),
        `${label} uses unsupported handwriting style ${notebook.presentation.handwriting}.`,
      );
      styledNotebookCount += 1;
    }
    assert(Array.isArray(notebook.pages), `${label} pages must be an array.`);
    assertAsset(campaignRoot, notebook.frontCover, `${label} front cover`);
    assertAsset(campaignRoot, notebook.backCover, `${label} back cover`);
    const ids = new Set();
    for (const page of notebook.pages || []) {
      assert(page.id && !ids.has(page.id), `${label} has a missing or duplicate page ID.`);
      ids.add(page.id);
      assert(page.title && page.era && page.reflection, `${label}/${page.id} is missing copy.`);
      assert(
        allowedMoods.has(page.mood),
        `${label}/${page.id} uses unsupported mood ${page.mood}.`,
      );
      if (page.recordedAt !== undefined) {
        assert(
          /^\d{4}-\d{2}-\d{2}$/.test(page.recordedAt) && !Number.isNaN(Date.parse(page.recordedAt)),
          `${label}/${page.id} has invalid recordedAt ${page.recordedAt}.`,
        );
      }
      if (page.sessionId !== undefined) {
        assert(
          sessionIds.has(page.sessionId),
          `${label}/${page.id} links unknown session ${page.sessionId}.`,
        );
      }
      if (page.relatedCharacterIds !== undefined) {
        assert(
          Array.isArray(page.relatedCharacterIds),
          `${label}/${page.id} character links must be an array.`,
        );
        const relatedIds = page.relatedCharacterIds || [];
        assert(
          new Set(relatedIds).size === relatedIds.length,
          `${label}/${page.id} repeats a character link.`,
        );
        relatedIds.forEach((characterId) =>
          assert(
            characterIds.has(characterId),
            `${label}/${page.id} links unknown character ${characterId}.`,
          ),
        );
      }
      if (page.secrecy !== undefined) {
        assert(
          allowedSecrecy.has(page.secrecy),
          `${label}/${page.id} uses unsupported secrecy ${page.secrecy}.`,
        );
      }
      if (page.recordedAt || page.sessionId || page.relatedCharacterIds?.length || page.secrecy) {
        enrichedPageCount += 1;
      }
      assertAsset(campaignRoot, page.image, `${label}/${page.id}`);
    }
  }
}

const componentFiles = [
  path.join(
    projectRoot,
    'src',
    'app',
    'adventurers',
    'components',
    'character-notebook',
    'character-notebook.component.ts',
  ),
  path.join(
    projectRoot,
    'src',
    'app',
    'adventurers',
    'components',
    'character-notebook',
    'character-notebook.component.html',
  ),
];
for (const fileName of componentFiles) {
  const source = fs.readFileSync(fileName, 'utf8');
  assert(!/Shyra/i.test(source), `${path.basename(fileName)} must remain character-agnostic.`);
}
const componentContract = componentFiles
  .map((fileName) => fs.readFileSync(fileName, 'utf8'))
  .join('\n');
for (const token of [
  'chronologyOrder',
  'selectedMood',
  'selectedSessionId',
  'selectedCharacterId',
  'selectedSecrecy',
  'notebook-tools__contents',
  'data-paper',
  'data-handwriting',
]) {
  assert(componentContract.includes(token), `Notebook reader is missing ${token}.`);
}
const managerSource = fs.readFileSync(
  path.join(projectRoot, 'tools', 'campaign-manager', 'public', 'app.js'),
  'utf8',
);
for (const fieldName of [
  'notebookPageRecordedAt',
  'notebookPageSessionId',
  'notebookPageCharacters',
  'notebookPageSecrecy',
  'notebookPaperStyle',
  'notebookHandwritingStyle',
]) {
  assert(managerSource.includes(fieldName), `Campaign Manager is missing ${fieldName}.`);
}
assert(
  notebookCount > 0,
  'At least one existing campaign must exercise the optional notebook contract.',
);
assert(
  enrichedPageCount > 0,
  'At least one notebook page must exercise chronology and filter metadata.',
);
assert(styledNotebookCount > 0, 'At least one notebook must exercise semantic reader styling.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log(
  `Character notebook contract verified across ${campaigns.length} campaign(s), ${notebookCount} notebook(s), ${styledNotebookCount} styled notebook(s) and ${enrichedPageCount} enriched page(s).`,
);
