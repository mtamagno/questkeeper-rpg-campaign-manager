/**
 * Language selector for every locale configured by the active campaign.
 */

import { Component, ChangeDetectionStrategy, computed, inject, type Signal } from '@angular/core';

import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { LanguageService } from '@guild/services/language.service';
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

  /** The currently active language. */
  readonly currentLanguage: Signal<SupportedLanguage> = this.campaignLocale.currentLocale;
  readonly hasCampaign = computed(() => this.campaignLocale.activeCampaign() !== undefined);
  readonly label = computed(() =>
    this.interfaceLanguage.isItalian() ? 'Lingua dei contenuti' : 'Content language',
  );

  /** Languages configured by the active campaign, with sensible legacy fallbacks. */
  readonly languages = computed<ReadonlyArray<string>>(() =>
    this.campaignLocale.locales().map(({ tag }) => tag),
  );

  /** Selects any language code configured by the campaign. */
  selectLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.campaignLocale.setLocale(select.value);
  }

  /** Human-readable native language name, falling back to the code. */
  languageName(code: string): string {
    try {
      return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code.toUpperCase();
    } catch {
      return code.toUpperCase();
    }
  }
}
