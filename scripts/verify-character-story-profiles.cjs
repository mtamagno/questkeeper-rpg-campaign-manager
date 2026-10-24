const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const campaignsRoot = path.join(projectRoot, 'src', 'campaigns');
const campaigns = JSON.parse(fs.readFileSync(path.join(campaignsRoot, 'campaigns.json'), 'utf8'));
const componentRoot = path.join(
  projectRoot,
  'src',
  'app',
  'adventurers',
  'pages',
  'character-detail',
);
const template = fs.readFileSync(
  path.join(componentRoot, 'character-detail.component.html'),
  'utf8',
);
const component = fs.readFileSync(
  path.join(componentRoot, 'character-detail.component.ts'),
  'utf8',
);
const failures = [];
let characterCount = 0;

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const marker of [
  'character-detail__story-profile',
  'profile-identity',
  'profile-bonds',
  'profile-memories',
  'character-detail__story-jump',
  'character-detail__bond-list',
  'character-detail__memory-paths',
]) {
  assert(template.includes(marker), `Character story profile is missing ${marker}.`);
}

const storyStart = template.indexOf('<!-- Story profile:');
const storyEnd = template.indexOf('<!-- Personal lore:');
const storySource = template.slice(storyStart, storyEnd);
assert(
  storyStart >= 0 && storyEnd > storyStart,
  'Story profile needs an explicit source boundary.',
);
assert(
  !storySource.includes('privateProfile'),
  'Story profile must not read protected character data.',
);
assert(
  !storySource.includes('char.sheet.'),
  'Story profile must not derive identity from mechanics.',
);
assert(
  component.includes('partyRelationships()') && component.includes('npcRelationships()'),
  'Bond previews must derive from both public relationship collections.',
);
assert(
  component.includes('latestDiaryEntry') && component.includes('profileExcerpt'),
  'Memory previews must stay derived, compact and linked to their source.',
);
assert(
  component.includes('visibleProfileBonds') && component.includes('.slice(0, 4)'),
  'Bond previews must stay bounded while the relationship map remains complete.',
);
assert(
  !storySource.includes('href="#') && storySource.includes('fragment="profile-identity"'),
  'In-profile navigation must preserve the active Angular campaign route.',
);

for (const campaign of campaigns) {
  const campaignRoot = path.join(campaignsRoot, campaign.id);
  const characterRoot = path.join(campaignRoot, 'data', 'characters');
  const manifestPath = path.join(characterRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const fileName of manifest) {
    const character = JSON.parse(fs.readFileSync(path.join(characterRoot, fileName), 'utf8'));
    const label = `${campaign.id}/${character.id}`;
    characterCount += 1;
    assert(character.publicProfile, `${label} needs a public profile.`);
    for (const field of ['traits', 'ideals', 'bonds', 'flaws', 'knownHistory']) {
      const value = character.publicProfile?.[field];
      assert(
        value && typeof value.en === 'string' && typeof value.it === 'string',
        `${label} needs localized publicProfile.${field} copy.`,
      );
    }
    assert(Array.isArray(character.diary), `${label} diary must remain a public array.`);
    assert(Array.isArray(character.quotes), `${label} quotes must remain a public array.`);
  }
}

assert(characterCount > 0, 'At least one campaign character must exercise the story profile.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(
  `Character story profiles verified across ${campaigns.length} campaign(s) and ${characterCount} character(s).`,
);
