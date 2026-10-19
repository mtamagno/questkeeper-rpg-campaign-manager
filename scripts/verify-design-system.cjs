const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const tokens = read('src/styles/_tokens.scss');
const components = read('src/styles/_components.scss');
const main = read('src/styles/main.scss');
const passwordDialog = read(
  'src/app/guild/components/password-dialog/password-dialog.component.html',
);

const requiredTokens = [
  '--qk-color-canvas',
  '--qk-color-surface',
  '--qk-color-text',
  '--qk-color-text-secondary',
  '--qk-color-accent',
  '--qk-color-accent-text',
  '--qk-color-focus',
  '--qk-color-success',
  '--qk-color-warning',
  '--qk-color-danger',
  '--qk-space-4',
  '--qk-radius-md',
  '--qk-shadow-md',
  '--qk-control-height',
];

const requiredPrimitives = [
  '.qk-panel',
  '.qk-button',
  '.qk-badge',
  '.qk-callout',
  '.qk-heading-group',
];

const failures = [];

for (const token of requiredTokens) {
  if (!tokens.includes(token)) failures.push(`Missing semantic token: ${token}`);
}

for (const primitive of requiredPrimitives) {
  if (!components.includes(primitive)) failures.push(`Missing UI primitive: ${primitive}`);
}

if (!main.includes("@use 'tokens';") || !main.includes("@use 'components';")) {
  failures.push('The global stylesheet does not load tokens and components.');
}

if (
  !passwordDialog.includes('qk-panel') ||
  !passwordDialog.includes('qk-button--primary') ||
  !passwordDialog.includes('qk-button--secondary')
) {
  failures.push('The password dialog is not wired to the shared primitives.');
}

if (!components.includes('prefers-reduced-motion') || !tokens.includes('prefers-contrast')) {
  failures.push('Accessibility preference coverage is incomplete.');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Design system verified: ${requiredTokens.length} tokens, ${requiredPrimitives.length} primitives and one live consumer.`,
);
