/** Stable visual identities available to every QuestKeeper campaign. */
export const CAMPAIGN_PALETTES = ['heroic', 'gothic', 'neutral'] as const;

export type CampaignPalette = (typeof CAMPAIGN_PALETTES)[number];

/** Product pages use a restrained palette when no campaign is active. */
export const PLATFORM_PALETTE: CampaignPalette = 'neutral';

/** Legacy campaigns keep the original gold-and-navy appearance. */
export const DEFAULT_CAMPAIGN_PALETTE: CampaignPalette = 'heroic';

export function isCampaignPalette(value: unknown): value is CampaignPalette {
  return typeof value === 'string' && CAMPAIGN_PALETTES.includes(value as CampaignPalette);
}

export function resolveCampaignPalette(value: unknown): CampaignPalette {
  return isCampaignPalette(value) ? value : DEFAULT_CAMPAIGN_PALETTE;
}
