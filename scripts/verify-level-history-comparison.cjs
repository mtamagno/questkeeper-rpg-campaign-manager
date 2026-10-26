const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(file, 'utf8');
const component = read(
  'src/app/adventurers/components/character-sheet-history/character-sheet-history.component.ts',
);
const template = read(
  'src/app/adventurers/components/character-sheet-history/character-sheet-history.component.html',
);
const styles = read(
  'src/app/adventurers/components/character-sheet-history/character-sheet-history.component.scss',
);

assert.match(component, /comparisonBaseLevel/);
assert.match(component, /comparisonTargetLevel/);
assert.match(component, /comparisonRows/);
assert.match(template, /selectComparison\('before'/);
assert.match(template, /selectComparison\('after'/);
assert.match(template, /\[selected\]="snapshot\.sheet\.level === comparisonBaseLevel\(\)"/);
assert.match(template, /\[selected\]="snapshot\.sheet\.level === comparisonTargetLevel\(\)"/);
assert.match(template, /role="table"/);
assert.match(template, /role="rowheader"/);
assert.match(template, /One more chapter needed/);
assert.match(styles, /overflow-x: auto/);
assert.match(styles, /min-width: 620px/);
assert.match(styles, /&__comparison-selectors\s*{\s*grid-template-columns: minmax\(0, 1fr\);/);
assert.doesNotMatch(template, /comparison.*(?:gained|lost|changed)/i);

const campaignRoot = path.join('src', 'campaigns');
const campaignIds = JSON.parse(read(path.join(campaignRoot, 'campaigns.json'))).map(
  (campaign) => campaign.id,
);
let characters = 0;
for (const campaignId of campaignIds) {
  const characterRoot = path.join(campaignRoot, campaignId, 'data', 'characters');
  const manifest = JSON.parse(read(path.join(characterRoot, 'manifest.json')));
  for (const fileName of manifest) {
    const character = JSON.parse(read(path.join(characterRoot, fileName)));
    const levels = [
      ...(character.sheetHistory ?? []).map((entry) => entry.sheet.level),
      character.sheet.level,
    ];
    assert.equal(
      new Set(levels).size,
      levels.length,
      `${campaignId}/${fileName} repeats a sheet level.`,
    );
    characters += 1;
  }
}

console.log(
  `Level comparison verified across ${campaignIds.length} campaign(s) and ${characters} character(s).`,
);
