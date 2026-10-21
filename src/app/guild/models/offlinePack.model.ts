import { type CharacterPublicProfile } from '@guild/models/character.model';
import { type BilingualText } from '@guild/models/language.model';

/** Public-only character identity saved for game-night reading. */
export interface OfflineCharacterSnapshot {
  readonly id: string;
  readonly name: string;
  readonly playerName?: string;
  readonly profileImageUrl: string;
  readonly race: string;
  readonly classType: string;
  readonly subclass?: string;
  readonly level: number;
  readonly publicProfile: CharacterPublicProfile;
}

/** Concise public recap saved without the longer illustrated chapter. */
export interface OfflineRecapSnapshot {
  readonly id: string;
  readonly sessionNumber: number;
  readonly date: string;
  readonly title: BilingualText;
  readonly location: BilingualText;
  readonly summary: BilingualText;
  readonly storySoFar?: BilingualText;
  readonly keyEvents: ReadonlyArray<BilingualText>;
}

/** One campaign's explicit, removable offline reading pack. */
export interface OfflineCampaignPack {
  readonly version: 1;
  readonly campaignId: string;
  readonly campaignName: BilingualText;
  readonly preparedAt: string;
  readonly characters: ReadonlyArray<OfflineCharacterSnapshot>;
  readonly recaps: ReadonlyArray<OfflineRecapSnapshot>;
}

export interface OfflinePreparationResult {
  readonly ok: boolean;
  readonly cachedImageCount: number;
  readonly characterCount: number;
  readonly recapCount: number;
  readonly reason?: 'offline' | 'empty' | 'storage';
}
