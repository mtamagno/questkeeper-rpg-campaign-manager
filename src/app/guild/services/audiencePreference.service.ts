/**
 * Remembers which first-visit path is useful on this device.
 * The choice is orientation only: it never changes content permissions.
 */

import { Injectable, type Signal } from '@angular/core';

import { persistedSignal } from '@guild/utils/persistedSignal';

export type QuestKeeperAudience = 'player' | 'gm';

type StoredAudience = QuestKeeperAudience | null;

function isStoredAudience(value: unknown): value is StoredAudience {
  return value === null || value === 'player' || value === 'gm';
}

@Injectable({ providedIn: 'root' })
export class AudiencePreferenceService {
  private readonly selectedAudience = persistedSignal<StoredAudience>(
    'first-visit-audience',
    null,
    isStoredAudience,
  );

  /** The remembered path, or `null` before the visitor makes a choice. */
  readonly audience: Signal<StoredAudience> = this.selectedAudience.asReadonly();

  select(audience: QuestKeeperAudience): void {
    this.selectedAudience.set(audience);
  }

  reset(): void {
    this.selectedAudience.set(null);
  }
}
