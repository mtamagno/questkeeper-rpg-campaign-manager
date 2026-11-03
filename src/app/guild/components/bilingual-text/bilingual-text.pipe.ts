/**
 * Pipe that extracts the correct language string from a BilingualText object.
 * Reacts to the current language signal from LanguageService.
 */

import { Pipe, inject, type PipeTransform } from '@angular/core';

import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { type LocalizedText } from '@guild/models/language.model';

/**
 * Transforms a BilingualText into the active language string.
 *
 * @example
 * ```html
 * {{ character.publicProfile.backstory | bilingual }}
 * ```
 */
@Pipe({
  name: 'bilingual',
  standalone: true,
  pure: false,
})
export class BilingualTextPipe implements PipeTransform {
  private readonly campaignLocale = inject(CampaignLocaleService);

  /**
   * Extracts the string for the currently active language.
   * @param value - The bilingual text object.
   * @returns The string in the active language.
   */
  transform(value: LocalizedText): string {
    return this.campaignLocale.resolve(value);
  }
}
