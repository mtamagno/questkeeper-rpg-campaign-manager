const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');
const service = read('src/app/guild/services/characterReadingPosition.service.ts');
const sheet = read('src/app/adventurers/components/character-sheet/character-sheet.component.ts');
const navigation = read(
  'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.ts',
);
const notebook = read(
  'src/app/adventurers/components/character-notebook/character-notebook.component.ts',
);
const journal = read(
  'src/app/adventurers/components/character-journal/character-journal.component.ts',
);
const detailTemplate = read(
  'src/app/adventurers/pages/character-detail/character-detail.component.html',
);
const detailComponent = read(
  'src/app/adventurers/pages/character-detail/character-detail.component.ts',
);

assert.match(service, /questkeeper:character-reading-position:v1/);
assert.match(service, /SAFE_SHEET_ANCHORS/);
assert.match(service, /'progression'/);
assert.doesNotMatch(service, /password|privateProfile|reflection|title/i);
assert.match(sheet, /activeWorkspace/);
assert.match(sheet, /visitedWorkspaces/);
assert.match(sheet, /workspaceForAnchor/);
assert.match(sheet, /anchor === 'abilities' \|\| anchor === 'training'/);
assert.match(sheet, /rememberSheet/);
assert.doesNotMatch(sheet, /HostListener|rememberVisibleSection/);
assert.match(navigation, /CHARACTER_SHEET_WORKSPACES/);
assert.match(notebook, /rememberNotebook/);
assert.match(notebook, /notebookSlide/);
assert.match(journal, /hasNotebookReadingPosition/);
assert.match(detailTemplate, /app-character-journal/);
assert.match(detailTemplate, /hasSheetReadingPosition\(char\.id\)/);
assert.match(detailComponent, /startsWith\('character-sheet-'\)/);

console.log('Character reading-position contract verified.');
