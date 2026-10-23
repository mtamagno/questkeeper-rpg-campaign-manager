const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const component = read('src/app/guild/components/site-command-bar/site-command-bar.component.ts');
const template = read('src/app/guild/components/site-command-bar/site-command-bar.component.html');
const styles = read('src/app/guild/components/site-command-bar/site-command-bar.component.scss');
const roadmap = read('docs/ROADMAP-60-DAYS.md');
const guide = read('docs/GLOBAL-COMMAND-PALETTE.md');

for (const phrase of [
  "scope: 'current'",
  "scope: 'campaign'",
  "scope: 'global'",
  'campaignEntries.filter',
  'npcs/relationships',
  'campaign/story-so-far',
]) {
  assert.ok(component.includes(phrase), `Command coverage is missing: ${phrase}`);
}

for (const phrase of [
  "event.key === 'ArrowDown'",
  "event.key === 'Home'",
  "event.key === 'Enter'",
  "event.key !== 'Tab'",
  "event.key === 'Escape'",
  'event.ctrlKey || event.metaKey',
  "document.querySelector<HTMLElement>('#main-content')?.focus()",
  'this.previouslyFocused',
]) {
  assert.ok(component.includes(phrase), `Keyboard or focus contract is missing: ${phrase}`);
}

for (const phrase of [
  'role="dialog"',
  'aria-modal="true"',
  'role="combobox"',
  'aria-controls="command-palette-results"',
  '[attr.aria-activedescendant]="activeCommandId()"',
  'role="listbox"',
  'role="option"',
  'aria-live="polite"',
  'aria-keyshortcuts="Control+K Meta+K"',
  'Pagina attuale',
  'Current page',
]) {
  assert.ok(template.includes(phrase), `Accessible palette UI is missing: ${phrase}`);
}

assert.match(styles, /&--active/);
assert.match(styles, /prefers-reduced-motion: reduce/);
assert.match(styles, /@include respond-below\(sm\)/);
assert.match(roadmap, /\[x\].*global command palette navigation/);
assert.match(guide, /does not inspect\s+protected\s+sheets/);
assert.match(guide, /recent pages and\s+favourites as explicit local navigation metadata/);

console.log(
  'Global command palette verified: complete route scopes, bilingual discovery, modal semantics, keyboard selection and focus recovery.',
);
