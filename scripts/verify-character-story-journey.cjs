const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const detail = read(
  'src',
  'app',
  'adventurers',
  'pages',
  'character-detail',
  'character-detail.component.html',
);
const detailComponent = read(
  'src',
  'app',
  'adventurers',
  'pages',
  'character-detail',
  'character-detail.component.ts',
);
const overview = read(
  'src',
  'app',
  'adventurers',
  'components',
  'character-story-overview',
  'character-story-overview.component.html',
);
const overviewComponent = read(
  'src',
  'app',
  'adventurers',
  'components',
  'character-story-overview',
  'character-story-overview.component.ts',
);
const lore = read(
  'src',
  'app',
  'adventurers',
  'components',
  'character-lore-chapters',
  'character-lore-chapters.component.html',
);
const bonds = read(
  'src',
  'app',
  'adventurers',
  'components',
  'character-bonds-carousel',
  'character-bonds-carousel.component.html',
);
const bondsComponent = read(
  'src',
  'app',
  'adventurers',
  'components',
  'character-bonds-carousel',
  'character-bonds-carousel.component.ts',
);
const quotes = read(
  'src',
  'app',
  'adventurers',
  'components',
  'character-quotes',
  'character-quotes.component.html',
);
const quotesComponent = read(
  'src',
  'app',
  'adventurers',
  'components',
  'character-quotes',
  'character-quotes.component.ts',
);
const accordionComponent = read(
  'src',
  'app',
  'guild',
  'components',
  'accordion',
  'accordion.component.ts',
);

assert(
  detail.includes('<app-character-story-overview'),
  'Story needs one visible, semantic navigation surface.',
);
for (const fragment of ['personal-chapters', 'profile-bonds', 'quotes', 'profile-memories'])
  assert(overviewComponent.includes(`id: '${fragment}'`), `Story overview is missing ${fragment}.`);
assert(
  !overview.includes('privateProfile') && !overviewComponent.includes('privateProfile'),
  'Story discovery must never read protected profile data.',
);
assert(
  overview.includes('story-overview__card--empty'),
  'Empty story destinations need an honest non-link state.',
);
assert(
  lore.includes('[fragment]="\'lore-chapter-\' + chapter.id"') &&
    lore.includes('[id]="\'lore-chapter-\' + chapter.id"'),
  'Lore chapters need a matching index and stable targets.',
);
assert(
  detailComponent.includes("fragment?.startsWith('lore-chapter-')") &&
    detailComponent.includes('const character = this.character();'),
  'Direct chapter links must reveal the Story tab and its accordion.',
);
assert(
  accordionComponent.includes('effect(() =>') && accordionComponent.includes('this.startOpen()'),
  'Accordions must react when an in-page story landmark becomes active after initial render.',
);
assert(
  bondsComponent.includes('readonly initialLimit = 6') &&
    bondsComponent.includes('.slice(0, this.initialLimit)'),
  'Dense relationship sets need a six-card first read.',
);
assert(
  bonds.includes('<details class="bonds-carousel__feelings">') &&
    bonds.includes('[attr.aria-expanded]="showAll()"'),
  'Plural feelings and the complete relationship list need accessible disclosure.',
);
assert(
  bonds.includes('Open the complete map') && bonds.includes('Apri la mappa completa'),
  'The complete relationship map must remain reachable.',
);
assert(
  quotesComponent.includes('readonly initialLimit = 3') &&
    quotesComponent.includes('.slice(0, this.initialLimit)'),
  'Dense quote collections need a three-quote first read.',
);
assert(
  quotes.includes('[attr.aria-expanded]="showAll()"'),
  'All quotes must remain available through an announced disclosure.',
);
const quotesIndex = detail.indexOf('id="quotes"');
const historyIndex = detail.indexOf('id="profile-memories"');
const journalIndex = detail.indexOf('<app-character-journal');
assert(
  quotesIndex >= 0 && quotesIndex < historyIndex && historyIndex < journalIndex,
  'Known history and sources must conclude Story before the separate Journal workspace.',
);
assert(
  detail.includes('character-detail__history-links') &&
    detail.includes('Ultima memoria registrata'),
  'Known history must retain its source links and latest public memory.',
);

const campaigns = JSON.parse(read('src', 'campaigns', 'campaigns.json'));
let characters = 0;
let compact = 0;
let dense = 0;
let empty = 0;
for (const campaign of campaigns) {
  const charactersRoot = path.join(root, 'src', 'campaigns', campaign.id, 'data', 'characters');
  const manifestPath = path.join(charactersRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;
  for (const file of JSON.parse(fs.readFileSync(manifestPath, 'utf8'))) {
    const character = JSON.parse(fs.readFileSync(path.join(charactersRoot, file), 'utf8'));
    characters += 1;
    if ((character.loreChapters?.length ?? 0) === 0 || (character.quotes?.length ?? 0) <= 3)
      compact += 1;
    if ((character.quotes?.length ?? 0) > 3) dense += 1;
    const profile = character.publicProfile ?? {};
    if (
      !(character.loreChapters?.length || character.quotes?.length) &&
      /not yet recorded|non ancora registrat/i.test(
        `${profile.backstory?.en ?? ''} ${profile.backstory?.it ?? ''} ${profile.knownHistory?.en ?? ''} ${profile.knownHistory?.it ?? ''}`,
      )
    )
      empty += 1;
  }
}
assert(characters > 0 && compact > 0, 'At least one compact story fixture must remain supported.');
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log(
  `Story journeys verified across ${campaigns.length} campaign(s) and ${characters} characters: ${compact} compact, ${dense} dense and ${empty} empty fixtures.`,
);
