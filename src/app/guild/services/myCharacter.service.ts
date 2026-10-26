/**
 * Remembers the player's chosen character on this device.
 *
 * Only campaign and entity IDs are persisted. Profile, sheet, journal and
 * password-protected content never enter preference storage.
 */

import { Injectable, computed, inject, type Signal } from '@angular/core';

import { type Character } from '@guild/models/character.model';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { persistedSignal } from '@guild/utils/persistedSignal';

interface MyCharacterState {
  readonly version: 1;
  readonly selections: Readonly<Record<string, string>>;
}

function isMyCharacterState(value: unknown): value is MyCharacterState {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate['version'] !== 1) return false;
  const selections = candidate['selections'];
  return (
    selections !== null &&
    typeof selections === 'object' &&
    Object.entries(selections).every(
      ([campaignId, characterId]): boolean =>
        campaignId.trim().length > 0 &&
        typeof characterId === 'string' &&
        characterId.trim().length > 0,
    )
  );
}

@Injectable({ providedIn: 'root' })
export class MyCharacterService {
  private readonly campaigns = inject(CampaignService);
  private readonly data = inject(DataService);
  private readonly state = persistedSignal<MyCharacterState>(
    'my-character:v1',
    { version: 1, selections: {} },
    isMyCharacterState,
  );

  /** Selected ID for the active campaign, provided it still resolves publicly. */
  readonly characterId: Signal<string | undefined> = computed((): string | undefined => {
    const campaignId = this.campaigns.activeCampaignId();
    if (campaignId === undefined) return undefined;
    const characterId = this.state().selections[campaignId];
    return characterId !== undefined &&
      this.data.characters().some((character): boolean => character.id === characterId)
      ? characterId
      : undefined;
  });

  /** Public character record resolved at read time; no record is persisted. */
  readonly character: Signal<Character | undefined> = computed((): Character | undefined => {
    const characterId = this.characterId();
    return this.data.characters().find((character): boolean => character.id === characterId);
  });

  /** One-click profile destination for the active campaign. */
  readonly route: Signal<ReadonlyArray<string> | undefined> = computed(() => {
    const campaignId = this.campaigns.activeCampaignId();
    const characterId = this.characterId();
    return campaignId === undefined || characterId === undefined
      ? undefined
      : ['/', campaignId, 'party', characterId];
  });

  select(campaignId: string, characterId: string): boolean {
    if (!this.data.characters().some((character): boolean => character.id === characterId)) {
      return false;
    }
    this.state.update((current): MyCharacterState => ({
      version: 1,
      selections: { ...current.selections, [campaignId]: characterId },
    }));
    return true;
  }

  clear(campaignId: string): void {
    this.state.update((current): MyCharacterState => {
      const selections = { ...current.selections };
      delete selections[campaignId];
      return { version: 1, selections };
    });
  }
}
