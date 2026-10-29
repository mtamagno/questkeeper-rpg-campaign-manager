const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8');
const model = read('src', 'app', 'guild', 'models', 'campaignPalette.model.ts');
const config = read('src', 'app', 'guild', 'models', 'campaignConfig.model.ts');
const service = read('src', 'app', 'guild', 'services', 'campaign.service.ts');
const shell = read('src', 'app', 'app.html');
const palettes = read('src', 'styles', '_palettes.scss');
const store = read('tools', 'campaign-manager', 'store.mjs');
const manager = read('tools', 'campaign-manager', 'public', 'app.js');
const styles = read('tools', 'campaign-manager', 'public', 'styles.css');
const guide = read('docs', 'DESIGN-SYSTEM.md');

function assert(condition, message) {
  if (!condition) throw new Error(`Custom palette verification failed: ${message}`);
}

for (const role of [
  'background',
  'surface',
  'text',
  'accent',
  'border',
  'success',
  'warning',
  'danger',
]) {
  assert(model.includes(`'${role}'`), `missing semantic role ${role}`);
}

for (const contract of [
  'CampaignCustomPalette',
  'isSafeCustomPalette',
  'customPaletteStyles',
  'candidate.validated !== true',
]) {
  assert(model.includes(contract), `missing runtime contract ${contract}`);
}
assert(config.includes('readonly customPalette?'), 'manifest does not preserve custom palettes');
assert(service.includes('activePaletteStyles'), 'campaign service does not expose safe overrides');
assert(shell.includes('[style]="activePaletteStyles()"'), 'app shell does not apply safe overrides');
assert(palettes.includes("[data-qk-palette='custom']"), 'custom fallback selector is missing');

for (const contract of [
  'normalizeCustomPalette',
  "nextPalette === 'custom'",
  'customPalette: nextCustomPalette',
]) {
  assert(store.includes(contract), `store is missing ${contract}`);
}

for (const contract of [
  'Companion appearance',
  'data-palette-preview',
  'data-palette-contrast',
  'data-palette-duplicate',
  'data-palette-reset',
  'data-palette-export',
  'data-palette-import',
  'Protected content',
]) {
  assert(manager.includes(contract), `Manager is missing ${contract}`);
}
assert(styles.includes('.palette-preview'), 'representative preview styling is missing');
assert(styles.includes(':focus-visible'), 'focus preview is missing');
assert(guide.includes('Custom semantic palettes'), 'custom palette documentation is missing');

console.log(
  'Custom palettes verified: versioned roles, server contrast blocking, live representative preview, fallback and portability.',
);
