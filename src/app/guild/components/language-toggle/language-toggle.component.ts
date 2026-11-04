/**
 * Language selector for every locale configured by the active campaign.
 */

import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  type Signal,
} from '@angular/core';

import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { LanguageService } from '@guild/services/language.service';
import { UiTextService } from '@guild/services/uiText.service';
import { type SupportedLanguage } from '@guild/models/language.model';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [],
  templateUrl: './language-toggle.component.html',
  styleUrl: './language-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageToggleComponent {
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly interfaceLanguage = inject(LanguageService);
  private readonly uiText = inject(UiTextService);

  readonly hasCampaign = computed(() => this.campaignLocale.activeCampaign() !== undefined);
  /** Campaign content locale when reading a campaign; interface locale everywhere else. */
  readonly currentLanguage: Signal<SupportedLanguage> = computed(() =>
    this.hasCampaign()
      ? this.campaignLocale.currentLocale()
      : this.interfaceLanguage.currentLanguage(),
  );
  readonly label = computed(() =>
    this.uiText.text(this.hasCampaign() ? 'language.contentLabel' : 'language.interfaceLabel'),
  );

  /** Languages configured by the active campaign, with sensible legacy fallbacks. */
  readonly languages = computed<ReadonlyArray<string>>(() =>
    this.hasCampaign()
      ? this.campaignLocale.locales().map(({ tag }) => tag)
      : this.interfaceLanguage.availableLanguages.map(({ tag }) => tag),
  );

  constructor() {
    effect(() => {
      if (this.hasCampaign()) {
        this.interfaceLanguage.followContentLanguage(this.campaignLocale.currentLocale());
      }
    });
  }

  /** Selects any language code configured by the campaign. */
  selectLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (this.hasCampaign()) {
      this.campaignLocale.setLocale(select.value);
      this.interfaceLanguage.followContentLanguage(select.value);
    } else {
      this.interfaceLanguage.setLanguage(select.value);
    }
  }

  /** Human-readable native language name, falling back to the code. */
  languageName(code: string): string {
    if (!this.hasCampaign()) return this.interfaceLanguage.languageLabel(code);
    try {
      return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code.toUpperCase();
    } catch {
      return code.toUpperCase();
    }
  }
}
