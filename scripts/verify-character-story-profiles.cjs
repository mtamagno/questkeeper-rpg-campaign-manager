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
const relationshipModel = fs.readFileSync(
  path.join(projectRoot, 'src', 'app', 'guild', 'models', 'relationship.model.ts'),
  'utf8',
);
const characterModel = fs.readFileSync(
  path.join(projectRoot, 'src', 'app', 'guild', 'models', 'character.model.ts'),
  'utf8',
);
const managerApp = fs.readFileSync(
  path.join(projectRoot, 'tools', 'campaign-manager', 'public', 'app.js'),
  'utf8',
);
const aiService = fs.readFileSync(
  path.join(projectRoot, 'tools', 'campaign-manager', 'ai-service.mjs'),
  'utf8',
);
const failures = [];
let characterCount = 0;
let feelingCount = 0;
let npcToNpcCount = 0;
let quickFactCount = 0;
let signatureItemCount = 0;
let favouriteMomentCount = 0;

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const marker of [
  'profile-overview',
  'personal-chapters',
  'profile-bonds',
  'character-detail__bond-carousel',
  'profile-highlights',
  'character-detail__quick-facts',
  'profile-memories',
  'character-detail__history-links',
  'id="diary"',
]) {
  assert(template.includes(marker), `Character story profile is missing ${marker}.`);
}

const storyStart = template.indexOf('<!-- Public profile:');
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
  template.includes('@for (bond of profileBonds(); track bond.key)') &&
    component.includes('scrollBondCarousel') &&
    template.includes(
      "[title]=\"lang() === 'it' ? 'Legami in viaggio' : 'Bonds along the road'\"",
    ) &&
    template.includes('bond.feelings'),
  'Relationships need one closable card carousel with directional feelings.',
);
assert(
  relationshipModel.includes('RelationshipPerspective') &&
    relationshipModel.includes('ReadonlyArray<RelationshipFeeling>'),
  'Relationship data must keep one bond type with a plural directional feeling model.',
);
assert(
  characterModel.includes('CharacterQuickFact') &&
    characterModel.includes('CharacterSignatureItem') &&
    characterModel.includes('CharacterFavouriteMoment'),
  'Character model needs optional quick-fact, signature-item and favourite-moment contracts.',
);
assert(
  managerApp.includes('storyHighlightsEditor') &&
    managerApp.includes('buildStoryHighlights') &&
    aiService.includes('Favourite moments are subjective'),
  'Manager and AI import need one reviewable, evidence-aware story-highlight authoring path.',
);
assert(
  !template.includes('href="#') && template.includes('fragment="profile-bonds"'),
  'In-profile references must preserve the active Angular campaign route.',
);

const overviewIndex = template.indexOf('id="profile-overview"');
const chaptersIndex = template.indexOf('id="personal-chapters"');
const bondsIndex = template.indexOf('id="profile-bonds"');
const highlightsIndex = template.indexOf('id="profile-highlights"');
const memoriesIndex = template.indexOf('id="profile-memories"');
const diaryIndex = template.indexOf('id="diary"');
assert(
  overviewIndex < chaptersIndex &&
    chaptersIndex < bondsIndex &&
    bondsIndex < highlightsIndex &&
    highlightsIndex < memoriesIndex &&
    memoriesIndex < diaryIndex,
  'Profile hierarchy must remain glance, chapters, bond carousel, known story and diary.',
);

for (const campaign of campaigns) {
  const campaignRoot = path.join(campaignsRoot, campaign.id);
  const npcIds = new Set();
  const sessionIds = new Set();
  const sessionRoot = path.join(campaignRoot, 'data', 'sessions');
  const sessionManifestPath = path.join(sessionRoot, 'manifest.json');
  if (fs.existsSync(sessionManifestPath)) {
    const sessionManifest = JSON.parse(fs.readFileSync(sessionManifestPath, 'utf8'));
    for (const fileName of sessionManifest) {
      const session = JSON.parse(fs.readFileSync(path.join(sessionRoot, fileName), 'utf8'));
      sessionIds.add(session.id);
    }
  }
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
    const loreIds = new Set((character.loreChapters ?? []).map((chapter) => chapter.id));
    const notebookIds = new Set((character.notebook?.pages ?? []).map((page) => page.id));
    const diaryIds = new Set(character.diary.map((entry) => entry.sessionId));
    const quoteIds = new Set(character.quotes.map((entry) => entry.sessionId));
    const highlightIds = new Set();
    const validateLocalized = (value, field) =>
      assert(
        value && typeof value.en === 'string' && typeof value.it === 'string',
        `${label} ${field} must be localized.`,
      );
    const validateId = (id, field) => {
      assert(typeof id === 'string' && id.length > 0, `${label} ${field} needs a stable ID.`);
      assert(!highlightIds.has(id), `${label} story highlight ID ${id} must be unique.`);
      highlightIds.add(id);
    };
    const validateSource = (source, field) => {
      const supported = ['chapter', 'notebook', 'diary', 'quote', 'chronicle'];
      assert(source && supported.includes(source.kind), `${label} ${field} has an invalid source.`);
      validateLocalized(source?.label, `${field}.source.label`);
      if (!source?.id) return;
      const idsByKind = {
        chapter: loreIds,
        notebook: notebookIds,
        diary: diaryIds,
        quote: quoteIds,
        chronicle: sessionIds,
      };
      assert(
        idsByKind[source.kind]?.has(source.id),
        `${label} ${field} source ${source.id} is missing.`,
      );
    };
    for (const fact of character.publicProfile.quickFacts ?? []) {
      quickFactCount += 1;
      validateId(fact.id, 'quick fact');
      validateLocalized(fact.label, `quickFacts.${fact.id}.label`);
      validateLocalized(fact.value, `quickFacts.${fact.id}.value`);
    }
    for (const item of character.publicProfile.signatureItems ?? []) {
      signatureItemCount += 1;
      validateId(item.id, 'signature item');
      validateLocalized(item.name, `signatureItems.${item.id}.name`);
      validateLocalized(item.description, `signatureItems.${item.id}.description`);
      if (item.source) validateSource(item.source, `signatureItems.${item.id}`);
    }
    for (const moment of character.publicProfile.favouriteMoments ?? []) {
      favouriteMomentCount += 1;
      validateId(moment.id, 'favourite moment');
      validateLocalized(moment.title, `favouriteMoments.${moment.id}.title`);
      validateLocalized(moment.summary, `favouriteMoments.${moment.id}.summary`);
      validateSource(moment.source, `favouriteMoments.${moment.id}`);
    }
  }

  const npcRoot = path.join(campaignRoot, 'data', 'npcs');
  const npcManifestPath = path.join(npcRoot, 'manifest.json');
  if (fs.existsSync(npcManifestPath)) {
    const npcManifest = JSON.parse(fs.readFileSync(npcManifestPath, 'utf8'));
    for (const fileName of npcManifest) {
      const npc = JSON.parse(fs.readFileSync(path.join(npcRoot, fileName), 'utf8'));
      npcIds.add(npc.id);
    }
  }

  for (const relationshipFile of ['party-relationships.json', 'npc-relationships.json']) {
    const relationshipPath = path.join(campaignRoot, 'data', relationshipFile);
    if (!fs.existsSync(relationshipPath)) continue;
    const relationships = JSON.parse(fs.readFileSync(relationshipPath, 'utf8'));
    for (const relationship of relationships) {
      const label = `${campaign.id}/${relationship.sourceId}->${relationship.targetId}`;
      assert(typeof relationship.type === 'string', `${label} needs one relationship type.`);
      if (npcIds.has(relationship.sourceId) && npcIds.has(relationship.targetId)) {
        npcToNpcCount += 1;
        assert(
          relationship.partyPerception,
          `${label} NPC-to-NPC bond needs the party's evidence boundary.`,
        );
      }
      if (relationship.partyPerception) {
        assert(
          ['observed', 'reported', 'inferred'].includes(relationship.partyPerception.certainty),
          `${label} party perception needs a supported certainty.`,
        );
        const basis = relationship.partyPerception.basis;
        assert(
          basis && typeof basis.en === 'string' && typeof basis.it === 'string',
          `${label} party perception basis must be bilingual.`,
        );
      }
      for (const perspective of relationship.perspectives ?? []) {
        assert(
          perspective.entityId === relationship.sourceId ||
            perspective.entityId === relationship.targetId,
          `${label} perspective must belong to one participant.`,
        );
        assert(Array.isArray(perspective.feelings), `${label} feelings must be an array.`);
        for (const feeling of perspective.feelings ?? []) {
          feelingCount += 1;
          assert(
            Number.isInteger(feeling.intensity) && feeling.intensity >= 1 && feeling.intensity <= 5,
            `${label} feeling intensity must be an integer from 1 to 5.`,
          );
          for (const field of ['label', 'reason']) {
            assert(
              feeling[field] &&
                typeof feeling[field].en === 'string' &&
                typeof feeling[field].it === 'string',
              `${label} feeling ${field} must be bilingual.`,
            );
          }
        }
      }
    }
  }
}

assert(characterCount > 0, 'At least one campaign character must exercise the story profile.');
assert(feelingCount > 0, 'At least one relationship must exercise plural directional feelings.');
assert(npcToNpcCount > 0, 'At least one NPC-to-NPC relationship must exercise party perception.');
assert(quickFactCount > 0, 'At least one character must exercise quick facts.');
assert(signatureItemCount > 0, 'At least one character must exercise signature items.');
assert(favouriteMomentCount > 0, 'At least one character must exercise favourite moments.');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(
  `Character story profiles verified across ${campaigns.length} campaign(s), ${characterCount} character(s), ${quickFactCount} quick facts, ${signatureItemCount} signature items, ${favouriteMomentCount} favourite moments, ${feelingCount} relationship feelings and ${npcToNpcCount} NPC-to-NPC bonds.`,
);
