export const CAMPAIGN_PALETTE_IDS = Object.freeze(['heroic', 'gothic', 'neutral', 'custom']);

export const CUSTOM_PALETTE_ROLES = Object.freeze([
  'background',
  'surface',
  'text',
  'accent',
  'border',
  'success',
  'warning',
  'danger',
]);

export const CURATED_PALETTE_ROLES = Object.freeze({
  heroic: Object.freeze({
    background: '#0A0A0F',
    surface: '#222233',
    text: '#F0EADB',
    accent: '#F4D96D',
    border: '#6E6E8B',
    success: '#73D69E',
    warning: '#F2C96D',
    danger: '#F08A8A',
  }),
  gothic: Object.freeze({
    background: '#0D0B0E',
    surface: '#211A22',
    text: '#F0E7E1',
    accent: '#E7A0AD',
    border: '#8D5A68',
    success: '#79D29C',
    warning: '#EFC36A',
    danger: '#F08C99',
  }),
  neutral: Object.freeze({
    background: '#101318',
    surface: '#1D242D',
    text: '#F0EDE6',
    accent: '#C6D9E7',
    border: '#78899A',
    success: '#75D4A0',
    warning: '#EBC66F',
    danger: '#EC9191',
  }),
});

const REQUIRED_CONTRAST_PAIRS = Object.freeze([
  ['text', 'background', 4.5],
  ['text', 'surface', 4.5],
  ['accent', 'background', 4.5],
  ['accent', 'surface', 4.5],
  ['border', 'background', 3],
  ['border', 'surface', 3],
  ['success', 'background', 4.5],
  ['warning', 'background', 4.5],
  ['danger', 'background', 4.5],
]);

export function normalizeHexColor(value, label = 'Colour') {
  const color = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(color)) {
    throw new Error(`${label} must use six-digit hexadecimal notation, for example #F0EADB.`);
  }
  return color;
}

function channelToLinear(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color) {
  const normalized = normalizeHexColor(color);
  const channels = [1, 3, 5].map((index) =>
    channelToLinear(Number.parseInt(normalized.slice(index, index + 2), 16)),
  );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(first, second) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function readableOnAccent(accent) {
  return contrastRatio('#0A0A0F', accent) >= contrastRatio('#FFFFFF', accent)
    ? '#0A0A0F'
    : '#FFFFFF';
}

export function customPaletteContrastReport(roles) {
  return REQUIRED_CONTRAST_PAIRS.map(([foreground, background, minimum]) => {
    const ratio = contrastRatio(roles[foreground], roles[background]);
    return {
      foreground,
      background,
      minimum,
      ratio,
      passes: ratio >= minimum,
    };
  });
}

export function normalizeCustomPalette(value, { requireSafe = true } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Custom palette data is required. Duplicate a preset to begin.');
  }
  const base = ['heroic', 'gothic', 'neutral'].includes(value.base) ? value.base : 'heroic';
  const roles = Object.fromEntries(
    CUSTOM_PALETTE_ROLES.map((role) => [
      role,
      normalizeHexColor(value.roles?.[role], `${role} colour`),
    ]),
  );
  const report = customPaletteContrastReport(roles);
  const failures = report.filter((entry) => !entry.passes);
  if (requireSafe && failures.length > 0) {
    const first = failures[0];
    throw new Error(
      `Custom palette contrast is unsafe: ${first.foreground} on ${first.background} is ${first.ratio.toFixed(2)}:1; use at least ${first.minimum.toFixed(1)}:1.`,
    );
  }
  return {
    version: 1,
    validated: true,
    name:
      String(value.name ?? 'Custom palette')
        .trim()
        .slice(0, 80) || 'Custom palette',
    base,
    onAccent: readableOnAccent(roles.accent),
    roles,
  };
}

export function safeCustomPalette(value) {
  try {
    return normalizeCustomPalette(value);
  } catch {
    return undefined;
  }
}
