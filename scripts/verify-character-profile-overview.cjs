const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const campaignsRoot = path.join(projectRoot, 'src', 'campaigns');
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
const overviewRoot = path.join(
  projectRoot,
  'src',
  'app',
  'adventurers',
  'components',
  'character-profile-overview',
);
const overviewTemplate = fs.readFileSync(
  path.join(overviewRoot, 'character-profile-overview.component.html'),
  'utf8',
);
const overviewComponent = fs.readFileSync(
  path.join(overviewRoot, 'character-profile-overview.component.ts'),
  'utf8',
);
const overviewStyles = fs.readFileSync(
  path.join(overviewRoot, 'character-profile-overview.component.scss'),
  'utf8',
);
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const overviewStart = template.indexOf('id="profile-overview"');
const overviewEnd = template.indexOf('<!-- Personal lore:', overviewStart);
const overview = template.slice(overviewStart, overviewEnd);

assert(overviewStart >= 0 && overviewEnd > overviewStart, 'Profile overview boundary is missing.');
assert(
  overview.includes('<app-character-profile-overview [character]="char" />'),
  'The first tab must delegate its concise identity surface to the profile overview component.',
);
assert(
  !overview.includes('<app-accordion'),
  'The first profile view must not hide or nest its core identity inside an accordion.',
);
assert(
  overviewTemplate.includes('aria-labelledby="profile-overview-title"') &&
    overviewTemplate.includes('id="profile-overview-title"') &&
    overviewTemplate.includes('profile-overview__heading'),
  'The at-a-glance profile needs one labelled, semantic heading.',
);
assert(
  overviewTemplate.indexOf('profile-overview__quick-facts') <
    overviewTemplate.indexOf('profile-overview__grid'),
  'Quick facts must appear before the longer personality cards.',
);

for (const field of ['traits', 'ideals', 'bonds', 'flaws', 'hobbies']) {
  assert(
    overviewComponent.includes(`profile.${field}`),
    `The profile overview no longer renders authored ${field}.`,
  );
}

for (const marker of [
  '.profile-overview',
  '&__heading',
  '&__title',
  '&__intro',
  '&__grid',
  '&__item',
  '&__mark',
]) {
  assert(overviewStyles.includes(marker), `Profile overview styling is missing ${marker}.`);
}

assert(
  overviewTemplate.includes('facets().length === 0') &&
    overviewTemplate.includes('profile-overview__empty'),
  'An honest empty profile state must remain available.',
);
assert(
  overviewTemplate.includes('[attr.aria-expanded]="isExpanded(facet.id)"') &&
    overviewTemplate.includes('[attr.aria-controls]') &&
    overviewComponent.includes('toggleExpanded') &&
    overviewStyles.includes('-webkit-line-clamp: 5') &&
    !overviewComponent.includes('substring(') &&
    !overviewComponent.includes('.slice('),
  'Long copy needs an accessible lossless disclosure instead of destructive truncation.',
);

const campaigns = JSON.parse(fs.readFileSync(path.join(campaignsRoot, 'campaigns.json'), 'utf8'));
let characterCount = 0;
let compactProfileCount = 0;
let enrichedProfileCount = 0;

for (const campaign of campaigns) {
  const characterRoot = path.join(campaignsRoot, campaign.id, 'data', 'characters');
  const manifestPath = path.join(characterRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;

  for (const fileName of JSON.parse(fs.readFileSync(manifestPath, 'utf8'))) {
    const character = JSON.parse(fs.readFileSync(path.join(characterRoot, fileName), 'utf8'));
    const profile = character.publicProfile ?? {};
    characterCount += 1;

    if (!(
      profile.quickFacts?.length ||
      profile.signatureItems?.length ||
      profile.favouriteMoments?.length
    )) {
      compactProfileCount += 1;
    }
    if (
      profile.quickFacts?.length &&
      (profile.signatureItems?.length || profile.favouriteMoments?.length)
    ) {
      enrichedProfileCount += 1;
    }
  }
}

assert(characterCount > 0, 'At least one character must exercise the profile overview.');
assert(compactProfileCount > 0, 'A compact legacy profile must remain a supported fixture.');
assert(enrichedProfileCount > 0, 'An enriched profile must exercise quick facts and highlights.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(
  `At-a-glance profiles verified across ${campaigns.length} campaign(s) and ${characterCount} character(s): ${compactProfileCount} compact, ${enrichedProfileCount} enriched.`,
);
