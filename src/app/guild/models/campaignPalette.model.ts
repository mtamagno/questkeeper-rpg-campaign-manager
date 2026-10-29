/** Stable visual identities available to every QuestKeeper campaign. */
export const CAMPAIGN_PALETTES = ['heroic', 'gothic', 'neutral', 'custom'] as const;

export type CampaignPalette = (typeof CAMPAIGN_PALETTES)[number];
export type CuratedCampaignPalette = Exclude<CampaignPalette, 'custom'>;

export const CUSTOM_PALETTE_ROLES = [
  'background',
  'surface',
  'text',
  'accent',
  'border',
  'success',
  'warning',
  'danger',
] as const;

export type CustomPaletteRole = (typeof CUSTOM_PALETTE_ROLES)[number];

export interface CampaignCustomPalette {
  readonly version: 1;
  readonly validated: true;
  readonly name: string;
  readonly base: CuratedCampaignPalette;
  readonly onAccent: string;
  readonly roles: Readonly<Record<CustomPaletteRole, string>>;
}

/** Product pages use a restrained palette when no campaign is active. */
export const PLATFORM_PALETTE: CampaignPalette = 'neutral';

/** Legacy campaigns keep the original gold-and-navy appearance. */
export const DEFAULT_CAMPAIGN_PALETTE: CampaignPalette = 'heroic';

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export function isCampaignPalette(value: unknown): value is CampaignPalette {
  return typeof value === 'string' && CAMPAIGN_PALETTES.includes(value as CampaignPalette);
}

export function isSafeCustomPalette(value: unknown): value is CampaignCustomPalette {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<CampaignCustomPalette>;
  if (
    candidate.version !== 1 ||
    candidate.validated !== true ||
    typeof candidate.name !== 'string' ||
    !['heroic', 'gothic', 'neutral'].includes(candidate.base ?? '') ||
    !isHexColor(candidate.onAccent) ||
    !candidate.roles
  ) {
    return false;
  }
  return CUSTOM_PALETTE_ROLES.every((role) => isHexColor(candidate.roles?.[role]));
}

export function resolveCampaignPalette(
  value: unknown,
  customPalette?: CampaignCustomPalette,
): CampaignPalette {
  if (value === 'custom') return isSafeCustomPalette(customPalette) ? 'custom' : 'heroic';
  return isCampaignPalette(value) ? value : DEFAULT_CAMPAIGN_PALETTE;
}

export function customPaletteStyles(
  palette: unknown,
): Readonly<Record<string, string>> | undefined {
  if (!isSafeCustomPalette(palette)) return undefined;
  const { roles } = palette;
  return {
    '--campaign-canvas': roles.background,
    '--campaign-surface': roles.surface,
    '--campaign-text': roles.text,
    '--campaign-border': roles.border,
    '--campaign-accent': roles.accent,
    '--campaign-on-accent': palette.onAccent,
    '--campaign-success': roles.success,
    '--campaign-warning': roles.warning,
    '--campaign-danger': roles.danger,
  };
}
