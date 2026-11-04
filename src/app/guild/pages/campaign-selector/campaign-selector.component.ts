/**
 * Campaign selector landing page.
 * Displays all available campaigns as clickable cards.
 * Shows a spoiler warning modal before entering any campaign.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  HostListener,
  signal,
  type Signal,
  type WritableSignal,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';

import { CampaignService } from '@guild/services/campaign.service';
import { LanguageService } from '@guild/services/language.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { SpoilerConsentService } from '@guild/services/spoilerConsent.service';
import {
  AudiencePreferenceService,
  type QuestKeeperAudience,
} from '@guild/services/audiencePreference.service';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { SfxHoverDirective } from '@guild/directives/sfxHover.directive';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { type CampaignManifestEntry } from '@guild/models/campaignConfig.model';
import { resolveCampaignPalette, type CampaignPalette } from '@guild/models/campaignPalette.model';
import { GuidedTourService } from '@guild/services/guidedTour.service';
import { UiTextService } from '@guild/services/uiText.service';
import { rulesetDisplayIdentity } from '@guild/models/rulesetProfile.model';

/**
 * Root landing page that lists all available campaigns.
 * The first click opens a spoiler warning modal. Once accepted, later visits
 * enter the campaign directly without showing the warning again.
 */
@Component({
  selector: 'app-campaign-selector',
  standalone: true,
  imports: [LanguageToggleComponent, SfxHoverDirective, DiceLoaderComponent],
  templateUrl: './campaign-selector.component.html',
  styleUrl: './campaign-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignSelectorComponent {
  private readonly campaignService = inject(CampaignService);
  private readonly languageService = inject(LanguageService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly consentService = inject(SpoilerConsentService);
  private readonly audiencePreference = inject(AudiencePreferenceService);
  private readonly router = inject(Router);
  private readonly guidedTour = inject(GuidedTourService);
  readonly uiText = inject(UiTextService);

  /** Public interactive destination used by the first-visit GM journey. */
  readonly managerDemoUrl = 'manager-demo/index.html';

  /** All available campaigns from the manifest. */
  readonly campaigns: Signal<ReadonlyArray<CampaignManifestEntry>> = this.campaignService.manifest;

  /** Whether the manifest has been loaded. */
  readonly isLoaded: Signal<boolean> = this.campaignService.manifestLoaded;

  /** Current language code for bilingual display. */
  readonly lang = this.languageService.currentLanguage;

  /** Locally remembered orientation path; never grants access or permissions. */
  readonly audience = this.audiencePreference.audience;
  readonly tourStatus = this.guidedTour.status;

  readonly audienceLabel: Signal<string> = computed(() => {
    const selected = this.audience();
    return this.uiText.text(
      selected === 'gm' ? 'campaignSelector.gmPath' : 'campaignSelector.playerPath',
    );
  });

  readonly audienceDescription: Signal<string> = computed(() => {
    const selected = this.audience();
    return this.uiText.text(
      selected === 'gm' ? 'campaignSelector.gmDescription' : 'campaignSelector.playerDescription',
    );
  });

  /** The campaign the user clicked — drives the warning modal. */
  readonly pendingCampaign: WritableSignal<CampaignManifestEntry | undefined> = signal(undefined);

  /** Page title based on current language. */
  readonly pageTitle: Signal<string> = computed(() => this.uiText.text('campaignSelector.title'));

  /** Subtitle based on current language. */
  readonly pageSubtitle: Signal<string> = computed(() =>
    this.uiText.text('campaignSelector.subtitle'),
  );

  /** At-a-glance lifecycle totals for the campaign ledger. */
  readonly activeCampaignCount: Signal<number> = computed(
    () =>
      this.campaigns().filter(
        (campaign) => campaign.status?.en.toLocaleLowerCase().includes('progress') === true,
      ).length,
  );

  readonly completedCampaignCount: Signal<number> = computed(
    () =>
      this.campaigns().filter(
        (campaign) => campaign.status?.en.toLocaleLowerCase().includes('completed') === true,
      ).length,
  );

  /** Resolves legacy manifests to the backward-compatible heroic palette. */
  campaignPalette(campaign: CampaignManifestEntry): CampaignPalette {
    return resolveCampaignPalette(campaign.palette);
  }

  /** Canonical public label shared with the campaign home and Manager. */
  campaignRuleset(campaign: CampaignManifestEntry): string {
    return rulesetDisplayIdentity(campaign.gameSystem, campaign.edition, this.lang()).label;
  }

  campaignName(campaign: CampaignManifestEntry): string {
    return this.campaignLocale.resolveForCampaign(campaign, campaign.name);
  }

  campaignDescription(campaign: CampaignManifestEntry): string {
    return this.campaignLocale.resolveForCampaign(campaign, campaign.description);
  }

  campaignStatus(campaign: CampaignManifestEntry): string {
    return this.campaignLocale.resolveForCampaign(campaign, campaign.status);
  }

  /** Remembers an orientation path on this device without changing access. */
  selectAudience(audience: QuestKeeperAudience): void {
    this.audiencePreference.select(audience);
  }

  /** Makes the two first-visit paths visible again. */
  resetAudience(): void {
    this.audiencePreference.reset();
    this.guidedTour.reset();
  }

  /** Opens a fresh or remembered walkthrough without changing campaign access. */
  openTour(): void {
    this.guidedTour.open();
  }

  /** Warning modal message based on current language and selected campaign. */
  readonly warningMessage: Signal<string> = computed(() => {
    const campaign = this.pendingCampaign();
    if (campaign === undefined) {
      return '';
    }
    const name = this.campaignLocale.resolveForCampaign(campaign, campaign.name);
    return this.uiText.text('campaignSelector.warningMessage', { name });
  });

  /**
   * Opens the spoiler warning only when consent has not already been stored.
   * Returning users enter the campaign immediately.
   * @param campaign - The campaign the user wants to enter.
   */
  selectCampaign(campaign: CampaignManifestEntry): void {
    if (this.consentService.hasConsent(campaign.id)) {
      this.navigateToCampaign(campaign.id);
      return;
    }
    this.pendingCampaign.set(campaign);
  }

  /** Confirms entry: stores consent cookie then navigates to the selected campaign. */
  confirmEntry(): void {
    const campaign = this.pendingCampaign();
    if (campaign === undefined) {
      return;
    }
    this.consentService.grantConsent(campaign.id);
    this.pendingCampaign.set(undefined);
    this.navigateToCampaign(campaign.id);
  }

  /** Dismisses the warning modal without navigating. */
  cancelEntry(): void {
    this.pendingCampaign.set(undefined);
  }

  /** Dismisses the warning only when the backdrop itself is activated. */
  onWarningBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cancelEntry();
    }
  }

  /** Closes the warning without changing consent when Escape is pressed. */
  @HostListener('document:keydown.escape')
  closeWarningOnEscape(): void {
    this.cancelEntry();
  }

  /** Navigates to a campaign after the consent decision has been resolved. */
  private navigateToCampaign(campaignId: string): void {
    void this.router.navigate(['/', campaignId]);
  }
}
