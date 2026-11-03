const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const journalRoot = 'src/app/adventurers/components/character-journal';
const component = read(`${journalRoot}/character-journal.component.ts`);
const template = read(`${journalRoot}/character-journal.component.html`);
const styles = read(`${journalRoot}/character-journal.component.scss`);
const detailTemplate = read(
  'src/app/adventurers/pages/character-detail/character-detail.component.html',
);
const diaryComponent = read(
  'src/app/adventurers/components/session-diary/session-diary.component.ts',
);

for (const workspace of ['index', 'notebook', 'gallery', 'diary']) {
  assert.match(component, new RegExp(`'${workspace}'`), `${workspace} workspace is missing.`);
  assert.match(
    template,
    new RegExp(`'${workspace}'`),
    `${workspace} template destination is missing.`,
  );
}

for (const accessibilityContract of [
  'role="tablist"',
  'role="tab"',
  'role="tabpanel"',
  'aria-selected',
  'aria-controls',
  'aria-labelledby',
  'onTabKeydown',
]) {
  assert.ok(
    template.includes(accessibilityContract) || component.includes(accessibilityContract),
    `Journal navigation is missing ${accessibilityContract}.`,
  );
}

assert.match(component, /visitedWorkspaces\.update/);
assert.match(component, /workspaceForFragment/);
assert.match(component, /hasNotebookReadingPosition/);
assert.match(template, /hasVisited\('notebook'\)/);
assert.match(template, /hasVisited\('gallery'\)/);
assert.match(template, /hasVisited\('diary'\)/);
assert.match(template, /id="notebook"/);
assert.match(template, /id="gallery"/);
assert.match(template, /id="diary"/);
assert.match(template, /app-character-notebook/);
assert.match(template, /app-image-gallery/);
assert.match(template, /app-session-diary/);
assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);

assert.match(detailTemplate, /id="character-journal"/);
assert.match(detailTemplate, /app-character-journal/);
assert.doesNotMatch(detailTemplate, /<app-character-notebook/);
assert.doesNotMatch(detailTemplate, /<app-image-gallery/);
assert.doesNotMatch(detailTemplate, /<app-session-diary/);
assert.match(diaryComponent, /readonly title = input<string>\('Session Diary'\)/);

const campaignsRoot = path.join(projectRoot, 'src', 'campaigns');
const campaigns = JSON.parse(fs.readFileSync(path.join(campaignsRoot, 'campaigns.json'), 'utf8'));
let characterCount = 0;
let notebookCount = 0;
let galleryCount = 0;
let diaryCount = 0;
let emptyJournalCount = 0;

for (const campaign of campaigns) {
  const charactersRoot = path.join(campaignsRoot, campaign.id, 'data', 'characters');
  const manifestPath = path.join(charactersRoot, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const fileName of manifest) {
    const character = JSON.parse(fs.readFileSync(path.join(charactersRoot, fileName), 'utf8'));
    characterCount += 1;
    if (character.notebook) notebookCount += 1;
    if ((character.gallery ?? []).length > 0) galleryCount += 1;
    if ((character.diary ?? []).length > 0) diaryCount += 1;
    if (
      !character.notebook &&
      !(character.gallery ?? []).length &&
      !(character.diary ?? []).length
    ) {
      emptyJournalCount += 1;
    }
  }
}

assert.ok(characterCount > 0, 'At least one character fixture is required.');
assert.ok(notebookCount > 0, 'At least one character must exercise the notebook destination.');
assert.ok(diaryCount > 0, 'At least one character must exercise the session destination.');
assert.match(template, /Nessuna memoria pubblicata/);

console.log(
  `Character journal contract verified across ${characterCount} characters: ${notebookCount} notebooks, ${galleryCount} galleries, ${diaryCount} diaries and ${emptyJournalCount} empty archives.`,
);
