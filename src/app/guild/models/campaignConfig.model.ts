/**
 * Campaign manifest entry — metadata for the campaign selector page.
 * Each entry in `campaigns.json` maps to this interface.
 */

import { type BilingualText } from '@guild/models/language.model';
import {
  type CampaignCustomPalette,
  type CampaignPalette,
} from '@guild/models/campaignPalette.model';
import { type CampaignGameSystem } from '@guild/models/rulesetProfile.model';

/** A single campaign listed in the global campaigns manifest. */
export interface CampaignManifestEntry {
  readonly id: string;
  /** Content languages available for this campaign (for example en, es, fr-CA). */
  readonly languages?: ReadonlyArray<string>;
  /** Language selected for first-time visitors when their saved choice is unavailable. */
  readonly defaultLanguage?: string;
  /** Curated visual identity. Missing values retain the legacy heroic theme. */
  readonly palette?: CampaignPalette;
  /** Versioned semantic role overrides. Preserved even when invalid so authors can repair drafts. */
  readonly customPalette?: CampaignCustomPalette;
  readonly gameSystem?: CampaignGameSystem;
  /** Legacy authored label retained for pre-gameSystem manifests. */
  readonly edition?: string;
  readonly name: BilingualText;
  readonly description: BilingualText;
  readonly thumbnail: string;
  /** Short localized lifecycle label shown on the campaign card. */
  readonly status?: BilingualText;
}
