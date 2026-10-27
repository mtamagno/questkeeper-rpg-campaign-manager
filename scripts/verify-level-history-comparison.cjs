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
assert.match(component, /comparisonCollectionChanges/);
assert.match(component, /comparisonSummary/);
assert.match(component, /changeState/);
assert.match(component, /collectionChangesFor/);
assert.match(component, /entry\.trim\(\)\.toLocaleLowerCase\(\)/);
assert.match(component, /emitted\.has\(normalized\)/);
assert.match(template, /selectComparison\('before'/);
assert.match(template, /selectComparison\('after'/);
assert.match(template, /\[selected\]="snapshot\.sheet\.level === comparisonBaseLevel\(\)"/);
assert.match(template, /\[selected\]="snapshot\.sheet\.level === comparisonTargetLevel\(\)"/);
assert.match(template, /role="table"/);
assert.match(template, /role="rowheader"/);
assert.match(template, /data-change/);
assert.match(template, /comparisonDeltaLabel/);
assert.match(template, /Evolution detected/);
assert.match(template, /Changed spells, features, skills and equipment/);
assert.match(template, /Gained/);
assert.match(template, /Lost/);
assert.match(template, /One more chapter needed/);
assert.match(styles, /overflow-x: auto/);
assert.match(styles, /min-width: 620px/);
assert.match(styles, /&__comparison-selectors\s*{\s*grid-template-columns: minmax\(0, 1fr\);/);
assert.match(styles, /&__delta/);
assert.match(styles, /&__collection-changes/);
assert.match(styles, /\[data-change='increased'\]/);
assert.match(styles, /\[data-change='decreased'\]/);

const campaignRoot = path.join('src', 'campaigns');
const campaignIds = JSON.parse(read(path.join(campaignRoot, 'campaigns.json'))).map(
  (campaign) => campaign.id,
);
let characters = 0;
let demonstrableEvolution = false;
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
    const snapshots = [...(character.sheetHistory ?? []), { sheet: character.sheet }];
    for (let index = 1; index < snapshots.length; index += 1) {
      const before = snapshots[index - 1].sheet;
      const after = snapshots[index].sheet;
      const gained = ['features', 'skills', 'equipment', 'spells'].some((key) => {
        const previous = new Set((before[key] ?? []).map((entry) => entry.toLowerCase()));
        return (after[key] ?? []).some((entry) => !previous.has(entry.toLowerCase()));
      });
      const lost = ['features', 'skills', 'equipment', 'spells'].some((key) => {
        const current = new Set((after[key] ?? []).map((entry) => entry.toLowerCase()));
        return (before[key] ?? []).some((entry) => !current.has(entry.toLowerCase()));
      });
      const statisticChanged = Object.keys(before.abilityScores).some(
        (key) => before.abilityScores[key] !== after.abilityScores[key],
      );
      demonstrableEvolution ||= gained && lost && statisticChanged;
    }
    characters += 1;
  }
}

assert.equal(
  demonstrableEvolution,
  true,
  'At least one public character must demonstrate gained, lost and changed states.',
);

console.log(
  `Level comparison verified across ${campaignIds.length} campaign(s) and ${characters} character(s).`,
);
