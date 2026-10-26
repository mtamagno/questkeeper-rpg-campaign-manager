const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');
const service = read('src/app/guild/services/characterReadingPosition.service.ts');
const sheet = read('src/app/adventurers/components/character-sheet/character-sheet.component.ts');
const notebook = read(
  'src/app/adventurers/components/character-notebook/character-notebook.component.ts',
);
const detail = read('src/app/adventurers/pages/character-detail/character-detail.component.html');

assert.match(service, /questkeeper:character-reading-position:v1/);
assert.match(service, /SAFE_SHEET_ANCHORS/);
assert.doesNotMatch(service, /password|privateProfile|reflection|title/i);
assert.match(sheet, /rememberVisibleSection/);
assert.match(sheet, /scrollToSection\(anchor, false\)/);
assert.match(notebook, /rememberNotebook/);
assert.match(notebook, /notebookSlide/);
assert.match(detail, /hasNotebookReadingPosition\(char\.id\)/);
assert.match(detail, /hasSheetReadingPosition\(char\.id\)/);

console.log('Character reading-position contract verified.');
