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
const failures = [];
let notebookCount = 0;

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
  const manifestPath = path.join(characterRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
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
assert(
  notebookCount > 0,
  'At least one existing campaign must exercise the optional notebook contract.',
);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log(
  `Character notebook contract verified across ${campaigns.length} campaign(s) and ${notebookCount} notebook(s).`,
);
