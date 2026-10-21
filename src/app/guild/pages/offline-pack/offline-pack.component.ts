import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { DataService } from '@guild/services/data.service';
import { CampaignService } from '@guild/services/campaign.service';
import { LanguageService } from '@guild/services/language.service';
import { OfflinePackService } from '@guild/services/offlinePack.service';

type PreparationState = 'idle' | 'preparing' | 'ready' | 'error' | 'removed';

/** Creates and reads an explicit public-only game-night offline pack. */
@Component({
  selector: 'app-offline-pack',
  standalone: true,
  imports: [BilingualTextPipe, DiceLoaderComponent, LanguageToggleComponent],
  templateUrl: './offline-pack.component.html',
  styleUrl: './offline-pack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflinePackComponent {
  private readonly data = inject(DataService);
  private readonly campaigns = inject(CampaignService);
  private readonly language = inject(LanguageService);
  private readonly offline = inject(OfflinePackService);
  private initializedCampaignId: string | undefined;

  readonly lang = this.language.currentLanguage;
  readonly campaignId = this.campaigns.activeCampaignId;
  readonly characters = this.data.characters;
  readonly isLoading = this.data.isLoading;
  readonly isOnline = this.offline.isOnline;
  readonly selectedCharacterIds = signal<ReadonlySet<string>>(new Set());
  readonly preparationState = signal<PreparationState>('idle');
  readonly cachedImageCount = signal(0);

  readonly pack = computed(() => this.offline.packFor(this.campaignId()));
  readonly recentSessions = computed(() =>
    [...this.data.sortedSessions()].sort((a, b) => b.sessionNumber - a.sessionNumber).slice(0, 3),
  );
  readonly canPrepare = computed(
    () =>
      this.isOnline() &&
      !this.isLoading() &&
      (this.selectedCharacterIds().size > 0 || this.recentSessions().length > 0) &&
      this.preparationState() !== 'preparing',
  );

  private readonly initializeSelection = effect((): void => {
    const campaignId = this.campaignId();
    const characters = this.characters();
    if (
      campaignId === undefined ||
      characters.length === 0 ||
      this.initializedCampaignId === campaignId
    ) {
      return;
    }
    const savedIds = new Set(this.offline.packFor(campaignId)?.characters.map(({ id }) => id));
    this.selectedCharacterIds.set(
      savedIds.size > 0 ? savedIds : new Set(characters.map(({ id }) => id)),
    );
    this.initializedCampaignId = campaignId;
  });

  toggleCharacter(characterId: string): void {
    this.selectedCharacterIds.update((current): ReadonlySet<string> => {
      const next = new Set(current);
      if (next.has(characterId)) {
        next.delete(characterId);
      } else {
        next.add(characterId);
      }
      return next;
    });
    this.preparationState.set('idle');
  }

  isSelected(characterId: string): boolean {
    return this.selectedCharacterIds().has(characterId);
  }

  async prepare(): Promise<void> {
    const campaignId = this.campaignId();
    if (campaignId === undefined || !this.canPrepare()) {
      return;
    }
    this.preparationState.set('preparing');
    const result = await this.offline.prepare({
      campaignId,
      campaign: this.data.campaign(),
      characters: this.characters(),
      sessions: this.data.sortedSessions(),
      selectedCharacterIds: this.selectedCharacterIds(),
    });
    this.cachedImageCount.set(result.cachedImageCount);
    this.preparationState.set(result.ok ? 'ready' : 'error');
  }

  remove(): void {
    const campaignId = this.campaignId();
    if (campaignId === undefined) {
      return;
    }
    const confirmed = window.confirm(
      this.lang() === 'it'
        ? 'Rimuovere da questo dispositivo il pacchetto offline della campagna?'
        : 'Remove this campaign offline pack from this device?',
    );
    if (!confirmed) {
      return;
    }
    this.preparationState.set(this.offline.remove(campaignId) ? 'removed' : 'error');
  }

  formatPreparedAt(value: string): string {
    const locale = this.lang() === 'it' ? 'it-IT' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value),
    );
  }

  onImageError(event: Event): void {
    if (event.target instanceof HTMLImageElement) {
      event.target.hidden = true;
    }
  }
}
