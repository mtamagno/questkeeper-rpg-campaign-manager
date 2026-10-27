const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(file, 'utf8');
const component = read(
  'src/app/adventurers/components/character-rule-library/character-rule-library.component.ts',
);
const template = read(
  'src/app/adventurers/components/character-rule-library/character-rule-library.component.html',
);
const styles = read(
  'src/app/adventurers/components/character-rule-library/character-rule-library.component.scss',
);
const sheetTemplate = read(
  'src/app/adventurers/components/character-sheet/character-sheet.component.html',
);
const navigation = read(
  'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.html',
);

assert.match(component, /readonly entries/);
assert.match(component, /readonly filteredEntries/);
assert.match(component, /readonly query/);
assert.match(component, /readonly filter/);
assert.match(component, /spellCards/);
assert.match(template, /type="search"/);
assert.match(template, /setFilter\('feature'\)/);
assert.match(template, /setFilter\('spell'\)/);
assert.match(template, /Local compendium/);
assert.match(template, /Entry recorded on the character sheet/);
assert.match(template, /aria-live="polite"/);
assert.match(styles, /&__tools/);
assert.match(styles, /min-height: 44px/);
assert.match(navigation, /Library/);
assert.match(sheetTemplate, /app-character-rule-library/);

const campaignsRoot = path.join('src', 'campaigns');
const campaigns = JSON.parse(read(path.join(campaignsRoot, 'campaigns.json')));
let characters = 0;
let entries = 0;
for (const campaign of campaigns) {
  const charactersRoot = path.join(campaignsRoot, campaign.id, 'data', 'characters');
  const manifest = JSON.parse(read(path.join(charactersRoot, 'manifest.json')));
  for (const fileName of manifest) {
    const character = JSON.parse(read(path.join(charactersRoot, fileName)));
    const features = character.sheet?.features ?? [];
    const spells = character.sheet?.spells ?? [];
    assert.ok(Array.isArray(features), `${campaign.id}/${fileName} features must be an array.`);
    assert.ok(Array.isArray(spells), `${campaign.id}/${fileName} spells must be an array.`);
    for (const entry of [...features, ...spells]) {
      assert.equal(typeof entry, 'string', `${campaign.id}/${fileName} has a non-text rule entry.`);
      assert.ok(entry.trim().length > 0, `${campaign.id}/${fileName} has an empty rule entry.`);
    }
    entries += features.length + spells.length;
    characters += 1;
  }
}

console.log(
  `Character rule library verified across ${campaigns.length} campaign(s), ${characters} character(s), and ${entries} sheet entries.`,
);
