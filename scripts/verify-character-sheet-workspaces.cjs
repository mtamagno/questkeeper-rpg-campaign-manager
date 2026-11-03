const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');
const sheet = read('src/app/adventurers/components/character-sheet/character-sheet.component.ts');
const template = read(
  'src/app/adventurers/components/character-sheet/character-sheet.component.html',
);
const navigation = read(
  'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.ts',
);
const navigationTemplate = read(
  'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.html',
);
const detailTemplate = read(
  'src/app/adventurers/pages/character-detail/character-detail.component.html',
);

for (const workspace of ['overview', 'training', 'inventory', 'spells', 'progression']) {
  assert.match(navigation, new RegExp(`'${workspace}'`));
  assert.match(template, new RegExp(`character-sheet-panel-${workspace}`));
  assert.match(template, new RegExp(`hasVisitedWorkspace\\('${workspace}'\\)`));
}

assert.match(navigationTemplate, /role="tablist"/);
assert.match(navigationTemplate, /role="tab"/);
assert.match(navigationTemplate, /aria-controls/);
assert.match(navigationTemplate, /aria-selected/);
assert.match(template, /role="tabpanel"/);
assert.match(template, /\[hidden\]="activeWorkspace\(\) !==/);
assert.match(sheet, /visitedWorkspaces\.update/);

for (const preservedContent of [
  'currencyEntries',
  'combatResources',
  'abilityScoreEntries',
  'savingThrows',
  'skills',
  'languages',
  'inventoryItems',
  'CharacterRuleLibraryComponent',
  'CharacterSheetHistoryComponent',
  'downloadPdf',
  'lockSheet',
]) {
  assert.ok(
    sheet.includes(preservedContent) || template.includes(preservedContent),
    preservedContent,
  );
}

assert.match(template, /Nessun equipaggiamento registrato/);
assert.match(template, /Nessuna regola personale registrata/);
assert.match(template, /app-character-sheet-history/);
assert.match(template, /app-character-rule-library/);
assert.match(template, /character-sheet__pdf-button/);
assert.match(template, /character-sheet__lock-button/);
assert.match(detailTemplate, /hasSheetReadingPosition\(char\.id\) \|\| shouldOpenSheet\(\)/);

console.log('Character sheet workspace contract verified.');
