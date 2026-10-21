const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const tokens = read('src/styles/_tokens.scss');
const components = read('src/styles/_components.scss');
const palettes = read('src/styles/_palettes.scss');
const main = read('src/styles/main.scss');
const appTemplate = read('src/app/app.html');
const campaignService = read('src/app/guild/services/campaign.service.ts');
const serviceWorkerConfig = JSON.parse(read('ngsw-config.json'));
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
const paletteNames = ['neutral', 'heroic', 'gothic'];

function hexToRgb(value) {
  const hex = value.slice(1);
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function relativeLuminance(value) {
  const channels = hexToRgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function paletteValue(block, property) {
  return new RegExp(`${property}:\\s*(#[0-9a-fA-F]{6})`).exec(block)?.[1];
}

for (const token of requiredTokens) {
  if (!tokens.includes(token)) failures.push(`Missing semantic token: ${token}`);
}

for (const primitive of requiredPrimitives) {
  if (!components.includes(primitive)) failures.push(`Missing UI primitive: ${primitive}`);
}

if (!main.includes("@use 'tokens';") || !main.includes("@use 'components';")) {
  failures.push('The global stylesheet does not load tokens and components.');
}

if (!main.includes("@use 'palettes';")) {
  failures.push('The global stylesheet does not load campaign palettes.');
}

for (const palette of paletteNames) {
  const block = new RegExp(`\\[data-qk-palette='${palette}'\\]\\s*\\{([\\s\\S]*?)\\n\\}`).exec(
    palettes,
  )?.[1];
  if (block === undefined) {
    failures.push(`Missing campaign palette: ${palette}`);
    continue;
  }
  const surface = paletteValue(block, '--campaign-surface');
  const textColor = paletteValue(block, '--campaign-text');
  const accent = paletteValue(block, '--campaign-accent');
  const onAccent = paletteValue(block, '--campaign-on-accent');
  if ([surface, textColor, accent, onAccent].some((value) => value === undefined)) {
    failures.push(`Palette ${palette} is missing a contrast-critical color.`);
    continue;
  }
  if (contrastRatio(surface, textColor) < 4.5) {
    failures.push(`Palette ${palette} fails WCAG AA for body text on its surface.`);
  }
  if (contrastRatio(accent, onAccent) < 4.5) {
    failures.push(`Palette ${palette} fails WCAG AA for text on its accent.`);
  }
}

if (
  !appTemplate.includes('[attr.data-qk-palette]="activePalette()"') ||
  !campaignService.includes('readonly activePalette') ||
  !campaignService.includes('PLATFORM_PALETTE')
) {
  failures.push('The app shell is not wired to the manifest-driven palette contract.');
}

const campaignDirectoryGroup = serviceWorkerConfig.dataGroups?.find(
  ({ name }) => name === 'campaign-directory',
);
if (
  !campaignService.includes('return CAMPAIGNS_MANIFEST_PATH;') ||
  campaignDirectoryGroup?.cacheConfig?.strategy !== 'freshness' ||
  !campaignDirectoryGroup.urls?.includes('/campaigns/campaigns.json')
) {
  failures.push('The campaign manifest lacks the stable network-first offline contract.');
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
  `Design system verified: ${requiredTokens.length} tokens, ${requiredPrimitives.length} primitives, ${paletteNames.length} AA-checked palettes and one live consumer.`,
);
