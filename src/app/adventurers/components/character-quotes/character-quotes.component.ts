import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { type CharacterQuote } from '@guild/models/character.model';
import { LanguageService } from '@guild/services/language.service';

@Component({
  selector: 'app-character-quotes',
  standalone: true,
  imports: [BilingualTextPipe],
  templateUrl: './character-quotes.component.html',
  styleUrl: './character-quotes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterQuotesComponent {
  private readonly languageService = inject(LanguageService);
  readonly quotes = input.required<ReadonlyArray<CharacterQuote>>();
  readonly lang = this.languageService.currentLanguage;
  readonly showAll = signal(false);
  readonly initialLimit = 3;
  readonly visibleQuotes = computed(() =>
    this.showAll() ? this.quotes() : this.quotes().slice(0, this.initialLimit),
  );
  readonly hasMore = computed(() => this.quotes().length > this.initialLimit);
  toggleAll(): void {
    this.showAll.update((value) => !value);
  }
}
