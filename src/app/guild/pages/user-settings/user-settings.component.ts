import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SFX } from '@guild/constants/sfx.constant';
import { AudioService } from '@guild/services/audio.service';
import { CampaignService } from '@guild/services/campaign.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import {
  CharacterRulePreferencesService,
  characterRuleEntryId,
  type CharacterRulePreference,
} from '@guild/services/characterRulePreferences.service';
import { DataService } from '@guild/services/data.service';
import { DeviceStorageStatusService } from '@guild/services/deviceStorageStatus.service';
import { LanguageService } from '@guild/services/language.service';
import { MyCharacterService } from '@guild/services/myCharacter.service';
import { UiTextService } from '@guild/services/uiText.service';
import { UserPreferencesService } from '@guild/services/userPreferences.service';

type SettingsSection = 'interface' | 'audio' | 'campaign' | 'character';
type SaveFeedback = 'ready' | 'saved' | 'session' | 'invalid';

const SETTINGS_SECTIONS: ReadonlyArray<{
  readonly id: SettingsSection;
  readonly icon: string;
}> = [
  { id: 'interface', icon: '◇' },
  { id: 'audio', icon: '♫' },
  { id: 'campaign', icon: '⚑' },
  { id: 'character', icon: '✦' },
];

function settingsSection(value: string | null): SettingsSection | undefined {
  return SETTINGS_SECTIONS.some(({ id }) => id === value) ? (value as SettingsSection) : undefined;
}

function sectionForFragment(fragment: string | null): SettingsSection | undefined {
  if (fragment === 'global-settings') return 'interface';
  if (fragment === 'campaign-scope-settings') return 'campaign';
  if (fragment === 'campaign-settings' || fragment === 'rule-library-settings') return 'character';
  return undefined;
}

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
  readonly campaignLocale = inject(CampaignLocaleService);
  private readonly data = inject(DataService);
  private readonly language = inject(LanguageService);
  readonly uiText = inject(UiTextService);
  private readonly myCharacter = inject(MyCharacterService);
  private readonly rulePreferences = inject(CharacterRulePreferencesService);
  private readonly storage = inject(DeviceStorageStatusService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly sections = SETTINGS_SECTIONS;
  readonly activeSection = signal<SettingsSection>('interface');
  readonly saveFeedback = signal<SaveFeedback>('ready');
  readonly interfaceLanguage = this.language.currentLanguage;
  readonly interfaceLanguages = this.language.availableLanguages;
  readonly followsContentLanguage = this.language.followsContentLanguage;
  readonly activeCampaignId = this.campaigns.activeCampaignId;
  readonly campaignEntries = this.campaigns.manifest;
  readonly manifestLoaded = this.campaigns.manifestLoaded;
  readonly characters = this.data.characters;
  readonly dataState = this.data.state;
  readonly isLoading = this.data.isLoading;
  readonly audioMuted = this.preferences.audioMuted;
  readonly audioVolume = this.preferences.audioVolume;
  readonly volumePercent = computed((): number => Math.round(this.audioVolume() * 100));
  readonly myCharacterId = this.myCharacter.characterId;
  readonly storedCharacterId = this.myCharacter.storedCharacterId;
  readonly selectionIsMissing = this.myCharacter.selectionIsMissing;
  readonly myCharacterRecord = this.myCharacter.character;
  readonly myCharacterRoute = this.myCharacter.route;
  readonly ruleReferenceMessage = signal('');
  readonly characterRules = computed(() => {
    const campaignId = this.activeCampaignId();
    const character = this.myCharacterRecord();
    if (!campaignId || !character) return [];
    const entries: Array<{
      id: string;
      kind: 'feature' | 'spell';
      name: string;
      preference: CharacterRulePreference;
    }> = [
      ...character.sheet.features.map((name) => ({
        id: characterRuleEntryId('feature', name),
        kind: 'feature' as const,
        name,
      })),
      ...(character.sheet.spells ?? []).map((name) => ({
        id: characterRuleEntryId('spell', name),
        kind: 'spell' as const,
        name,
      })),
    ].map((entry) => ({
      ...entry,
      preference: this.rulePreferences.get(campaignId, character.id, entry.id),
    }));
    return entries;
  });

  constructor() {
    const initialSection =
      settingsSection(this.route.snapshot.queryParamMap.get('section')) ??
      sectionForFragment(this.route.snapshot.fragment);
    if (initialSection !== undefined) this.activeSection.set(initialSection);

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parameters) => {
      const section = settingsSection(parameters.get('section'));
      if (section !== undefined) this.activeSection.set(section);
    });
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (settingsSection(this.route.snapshot.queryParamMap.get('section')) !== undefined) return;
      const section = sectionForFragment(fragment);
      if (section !== undefined) this.activeSection.set(section);
    });
  }

  selectSection(section: SettingsSection, focusTab = false): void {
    this.activeSection.set(section);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section },
      queryParamsHandling: 'merge',
      fragment: undefined,
      replaceUrl: true,
    });
    if (focusTab && typeof document !== 'undefined') {
      requestAnimationFrame(() => document.getElementById(`settings-tab-${section}`)?.focus());
    }
  }

  onSectionKeydown(event: KeyboardEvent, index: number): void {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % this.sections.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (index - 1 + this.sections.length) % this.sections.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = this.sections.length - 1;
    }
    if (nextIndex === undefined) return;
    event.preventDefault();
    const section = this.sections[nextIndex]?.id;
    if (section !== undefined) this.selectSection(section, true);
  }

  selectInterfaceLanguage(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.language.setLanguage(event.target.value);
      this.markSaved();
    }
  }

  selectContentLanguage(event: Event): void {
    if (event.target instanceof HTMLSelectElement) {
      this.campaignLocale.setLocale(event.target.value);
      this.language.followContentLanguage(event.target.value);
      this.markSaved();
    }
  }

  toggleLanguageSync(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.language.setFollowsContentLanguage(event.target.checked);
    if (event.target.checked && this.activeCampaignId() !== undefined) {
      this.language.followContentLanguage(this.campaignLocale.currentLocale());
    }
    this.markSaved();
  }

  readonly activeCampaignName = computed((): string | undefined => {
    const campaignId = this.activeCampaignId();
    const campaign = this.campaignEntries().find((entry) => entry.id === campaignId);
    return campaign === undefined
      ? undefined
      : this.campaignLocale.resolveForCampaign(campaign, campaign.name);
  });

  campaignName(campaignId: string): string {
    const campaign = this.campaignEntries().find((entry) => entry.id === campaignId);
    return campaign === undefined
      ? campaignId
      : this.campaignLocale.resolveForCampaign(campaign, campaign.name);
  }

  campaignLocaleLabel(locale: string): string {
    return this.language.languageLabel(locale);
  }

  setMuted(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const wasMuted = this.preferences.audioMuted();
    this.preferences.setMuted(target.checked);
    if (wasMuted && !target.checked) {
      this.audio.play(SFX.CLICK_SOFT, { ignoreThrottle: true });
    }
    this.markSaved();
  }

  setVolume(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    this.preferences.setVolume(Number.parseFloat(target.value));
    this.markSaved();
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
    this.markSaved();
  }

  clearMissingCharacter(): void {
    const campaignId = this.activeCampaignId();
    if (campaignId === undefined) return;
    this.myCharacter.clear(campaignId);
    this.markSaved();
  }

  toggleRule(entryId: string, field: 'favourite' | 'prepared'): void {
    const characterId = this.myCharacterId();
    if (!characterId) return;
    this.rulePreferences.toggle(this.activeCampaignId(), characterId, entryId, field);
    this.markSaved();
  }

  saveRuleNote(entryId: string, event: Event): void {
    const characterId = this.myCharacterId();
    if (!characterId || !(event.target instanceof HTMLTextAreaElement)) return;
    this.rulePreferences.setNote(this.activeCampaignId(), characterId, entryId, event.target.value);
    this.markSaved();
  }

  saveRuleReference(entryId: string, label: string, url: string): void {
    const characterId = this.myCharacterId();
    if (!characterId) return;
    const saved = this.rulePreferences.setReference(
      this.activeCampaignId(),
      characterId,
      entryId,
      label,
      url,
    );
    this.ruleReferenceMessage.set(
      this.uiText.text(saved ? 'settings.rules.referenceSaved' : 'settings.rules.referenceInvalid'),
    );
    if (saved) this.markSaved();
    else this.saveFeedback.set('invalid');
  }

  clearRuleReference(entryId: string): void {
    const characterId = this.myCharacterId();
    if (!characterId) return;
    this.rulePreferences.clearReference(this.activeCampaignId(), characterId, entryId);
    this.markSaved();
  }

  private markSaved(): void {
    this.saveFeedback.set(this.storage.verify() === 'persistent' ? 'saved' : 'session');
  }
}
