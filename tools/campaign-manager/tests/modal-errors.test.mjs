import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');

test('campaign and entity save errors stay inside the modal top layer', () => {
  assert.match(html, /id="dialog-error"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /tabindex="-1"/);
  assert.match(app, /state\.editor\.kind === 'campaign'/);
  assert.match(app, /state\.editor\.type/);
  assert.match(app, /\.catch\(\(error\) => showDialogError\(error\.message\)\)/);
  assert.doesNotMatch(app, /\.catch\(\(error\) => toast\(error\.message, true\)\)\s*\.finally/);
  assert.match(styles, /\.dialog__error/);
});

test('client validation is keyboard actionable and duplicate submits are ignored', () => {
  assert.match(html, /id="editor-form" method="dialog" novalidate/);
  assert.match(app, /editorForm\.querySelector\(':invalid'\)/);
  assert.match(app, /link\.addEventListener\('click'/);
  assert.match(app, /invalidField\.focus\(\)/);
  assert.match(app, /dialogError\.focus\(\)/);
  assert.match(app, /if \(save\.disabled\) return/);
  assert.match(app, /editorForm\.addEventListener\('input', clearDialogError\)/);
});
