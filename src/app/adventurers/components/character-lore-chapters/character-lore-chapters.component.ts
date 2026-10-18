/** Illustrated, public chapters that turn a character background into a readable story. */

import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { type CharacterLoreChapter } from '@guild/models/character.model';
import { LanguageService } from '@guild/services/language.service';
import { toDisplayUrl } from '@guild/services/imageUrl.service';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';

@Component({
  selector: 'app-character-lore-chapters',
  standalone: true,
  imports: [BilingualTextPipe],
  templateUrl: './character-lore-chapters.component.html',
  styleUrl: './character-lore-chapters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterLoreChaptersComponent {
  private readonly languageService = inject(LanguageService);

  readonly chapters = input.required<ReadonlyArray<CharacterLoreChapter>>();
  readonly characterName = input.required<string>();
  readonly lang = this.languageService.currentLanguage;

  displayImageUrl(chapter: CharacterLoreChapter): string | undefined {
    return chapter.image === undefined ? undefined : toDisplayUrl(chapter.image.url);
  }

  onImageError(event: Event, originalUrl: string): void {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.dataset['fallbackApplied'] !== 'true') {
      image.dataset['fallbackApplied'] = 'true';
      image.src = originalUrl;
    }
  }
}
