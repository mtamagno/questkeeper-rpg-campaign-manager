import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SFX } from '@guild/constants/sfx.constant';
import { localizeText } from '@guild/models/language.model';
import { AudioService } from '@guild/services/audio.service';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { LanguageService } from '@guild/services/language.service';
import { MyCharacterService } from '@guild/services/myCharacter.service';
import { UserPreferencesService } from '@guild/services/userPreferences.service';

/** Central destination for device-local global and campaign preferences. */
@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent {
  private readonly preferences = inject(UserPreferencesService);
  private readonly audio = inject(AudioService);
  private readonly campaigns = inject(CampaignService);
  private readonly data = inject(DataService);
  private readonly language = inject(LanguageService);
  private readonly myCharacter = inject(MyCharacterService);

  readonly isItalian = this.language.isItalian;
  readonly activeCampaignId = this.campaigns.activeCampaignId;
  readonly campaignEntries = this.campaigns.manifest;
  readonly characters = this.data.characters;
  readonly isLoading = this.data.isLoading;
  readonly audioMuted = this.preferences.audioMuted;
  readonly audioVolume = this.preferences.audioVolume;
  readonly volumePercent = computed((): number => Math.round(this.audioVolume() * 100));
  readonly myCharacterId = this.myCharacter.characterId;
  readonly myCharacterRecord = this.myCharacter.character;
  readonly myCharacterRoute = this.myCharacter.route;

  readonly activeCampaignName = computed((): string | undefined => {
    const campaignId = this.activeCampaignId();
    const campaign = this.campaignEntries().find((entry) => entry.id === campaignId);
    return campaign === undefined
      ? undefined
      : localizeText(campaign.name, this.language.currentLanguage());
  });

  campaignName(campaignId: string): string {
    const campaign = this.campaignEntries().find((entry) => entry.id === campaignId);
    return campaign === undefined
      ? campaignId
      : localizeText(campaign.name, this.language.currentLanguage());
  }

  setMuted(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const wasMuted = this.preferences.audioMuted();
    this.preferences.setMuted(target.checked);
    if (wasMuted && !target.checked) {
      this.audio.play(SFX.CLICK_SOFT, { ignoreThrottle: true });
    }
  }

  setVolume(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.preferences.setVolume(Number.parseFloat(target.value));
  }

  previewVolume(): void {
    if (!this.preferences.audioMuted()) {
      this.audio.play(SFX.CLICK_SOFT, { ignoreThrottle: true });
    }
  }

  selectCharacter(event: Event): void {
    const campaignId = this.activeCampaignId();
    const target = event.target;
    if (campaignId === undefined || !(target instanceof HTMLSelectElement)) return;
    if (target.value === '') {
      this.myCharacter.clear(campaignId);
    } else {
      this.myCharacter.select(campaignId, target.value);
    }
  }
}
