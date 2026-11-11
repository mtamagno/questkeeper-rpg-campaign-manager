const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const trackedFiles = new Set(
  execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean),
);
const read = (relativePath) => {
  assert.ok(
    trackedFiles.has(relativePath.replaceAll('\\', '/')),
    `Accessibility contract references an untracked release file: ${relativePath}`,
  );
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
};
const app = read('src/app/app.ts');
const shell = read('src/app/app.html');
const sidebar = read('src/app/guild/components/sidebar/sidebar.component.html');
const command = read('src/app/guild/components/site-command-bar/site-command-bar.component.ts');
const password = read('src/app/guild/components/password-dialog/password-dialog.component.html');
const passwordCode = read('src/app/guild/components/password-dialog/password-dialog.component.ts');
const lightbox = read('src/app/guild/components/image-lightbox/image-lightbox.component.html');
const lightboxCode = read('src/app/guild/components/image-lightbox/image-lightbox.component.ts');
const focusTrap = read('src/app/guild/utils/focusTrap.ts');
const styles = read('src/styles/_accessibility.scss');
const roadmap = read('docs/ROADMAP-60-DAYS.md');
const guide = read('docs/ACCESSIBILITY.md');
const tabContracts = [
  {
    name: 'User Settings',
    markup: read('src/app/guild/pages/user-settings/user-settings.component.html'),
    behavior: read('src/app/guild/pages/user-settings/user-settings.component.ts'),
  },
  {
    name: 'Character detail',
    markup: read('src/app/adventurers/pages/character-detail/character-detail.component.html'),
    behavior: read('src/app/adventurers/pages/character-detail/character-detail.component.ts'),
  },
  {
    name: 'Character Sheet',
    markup:
      read(
        'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.html',
      ) + read('src/app/adventurers/components/character-sheet/character-sheet.component.html'),
    behavior: read(
      'src/app/adventurers/components/character-sheet-navigation/character-sheet-navigation.component.ts',
    ),
  },
  {
    name: 'Character Journal',
    markup: read(
      'src/app/adventurers/components/character-journal/character-journal.component.html',
    ),
    behavior: read(
      'src/app/adventurers/components/character-journal/character-journal.component.ts',
    ),
  },
];

for (const phrase of [
  'subscribeToAccessibleRouteChanges',
  "querySelector<HTMLElement>('h1')",
  "setAttribute('tabindex', '-1')",
  'routeAnnouncement.set',
  'document.documentElement.lang',
  'restoreMenuFocus',
]) {
  assert.ok(app.includes(phrase), `App-shell accessibility contract is missing: ${phrase}`);
}

for (const phrase of [
  'class="skip-link"',
  '<main',
  'id="main-content"',
  'aria-live="polite"',
  'aria-atomic="true"',
  'aria-controls="app-sidebar"',
  '[attr.aria-expanded]="isSidebarOpen()"',
]) {
  assert.ok(shell.includes(phrase), `Shell landmark/focus contract is missing: ${phrase}`);
}

assert.ok(!sidebar.includes('<h1'), 'Persistent sidebar must not duplicate the routed page h1.');
assert.ok(!sidebar.includes('role="button"'), 'Sidebar toggles must use native buttons.');
assert.match(sidebar, /<button\s+class="sidebar__category-title"/);
assert.ok(command.includes('trapTabKey(dialog, event)'));

for (const [name, template, code] of [
  ['password dialog', password, passwordCode],
  ['image lightbox', lightbox, lightboxCode],
]) {
  assert.ok(template.includes('aria-modal="true"'), `${name} must be modal.`);
  assert.ok(template.includes('tabindex="-1"'), `${name} needs a programmatic focus target.`);
  assert.ok(code.includes('trapTabKey'), `${name} must contain Tab focus.`);
  assert.ok(code.includes('restoreFocus'), `${name} must restore launch focus.`);
}

assert.ok(password.includes('role="alert"'));
assert.ok(password.includes('autocomplete="current-password"'));
assert.match(focusTrap, /button:not\(\[disabled\]\)/);
assert.match(styles, /prefers-contrast: more/);
assert.match(styles, /forced-colors: active/);
assert.match(styles, /var\(--qk-color-focus/);
assert.match(styles, /@media \(pointer: coarse\)/);
assert.match(styles, /min-block-size: 44px/);
assert.match(styles, /animation-duration: 0\.01ms !important/);
assert.match(styles, /transition-duration: 0\.01ms !important/);

for (const contract of tabContracts) {
  for (const phrase of [
    'role="tablist"',
    'role="tab"',
    'role="tabpanel"',
    'aria-selected',
    'aria-controls',
    'aria-labelledby',
    'tabindex',
  ]) {
    assert.ok(contract.markup.includes(phrase), `${contract.name} tabs are missing ${phrase}.`);
  }
  for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
    assert.ok(contract.behavior.includes(key), `${contract.name} tabs do not handle ${key}.`);
  }
}

const htmlFiles = [...trackedFiles]
  .filter((relative) => relative.startsWith('src/app/') && relative.endsWith('.html'))
  .map((relative) => path.join(root, relative));
for (const file of htmlFiles) {
  const relative = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  for (const openingTag of html.match(/<button\b[\s\S]*?>/g) ?? []) {
    assert.match(
      openingTag,
      /\btype="(?:button|submit|reset)"/,
      `${relative} has an implicit button type.`,
    );
  }
}

assert.match(roadmap, /\[x\].*keyboard focus and landmark overhaul/);
assert.match(guide, /Focus follows navigation, not rendering accidents/);
assert.match(guide, /360 CSS pixels/);

console.log(
  `Accessibility verified across ${htmlFiles.length} templates and ${tabContracts.length} tab systems: landmarks, route focus, keyboard tabs, coarse-pointer targets, reduced motion, live announcements, native controls, modal focus and high-contrast affordances.`,
);
