const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
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

const htmlFiles = execFileSync('git', ['ls-files', 'src/app/**/*.html'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
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
  `Accessibility verified across ${htmlFiles.length} templates: landmarks, route focus, live announcements, native controls, modal focus and high-contrast affordances.`,
);
