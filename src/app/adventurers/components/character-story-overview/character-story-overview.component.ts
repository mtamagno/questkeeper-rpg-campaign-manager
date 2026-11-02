import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type Character } from '@guild/models/character.model';
import { LanguageService } from '@guild/services/language.service';

interface StoryDestination {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly count?: number;
  readonly available: boolean;
}

@Component({
  selector: 'app-character-story-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './character-story-overview.component.html',
  styleUrl: './character-story-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterStoryOverviewComponent {
  private readonly languageService = inject(LanguageService);

  readonly character = input.required<Character>();
  readonly bondCount = input.required<number>();
  readonly lang = this.languageService.currentLanguage;

  readonly destinations = computed<ReadonlyArray<StoryDestination>>(() => {
    const character = this.character();
    const italian = this.lang() === 'it';
    const chapterCount = character.loreChapters?.length ?? 0;
    const hasOrigins = chapterCount > 0 || this.isRecorded(character.publicProfile.backstory);
    const hasKnownHistory = this.isRecorded(character.publicProfile.knownHistory);

    return [
      {
        id: 'personal-chapters',
        icon: '🧭',
        title: italian
          ? chapterCount > 0
            ? 'Capitoli personali'
            : 'Origini'
          : chapterCount > 0
            ? 'Personal chapters'
            : 'Origins',
        description: italian
          ? 'Da dove viene e quali momenti l’hanno formato.'
          : 'Where they came from and the moments that shaped them.',
        count: chapterCount || undefined,
        available: hasOrigins,
      },
      {
        id: 'profile-bonds',
        icon: '🕸️',
        title: italian ? 'Legami in viaggio' : 'Bonds along the road',
        description: italian
          ? 'Relazioni, sentimenti e memorie condivise.'
          : 'Relationships, feelings and shared memories.',
        count: this.bondCount(),
        available: this.bondCount() > 0,
      },
      {
        id: 'quotes',
        icon: '💬',
        title: italian ? 'Citazioni iconiche' : 'Iconic quotes',
        description: italian
          ? 'Le parole che hanno lasciato il segno al tavolo.'
          : 'The words that left their mark at the table.',
        count: character.quotes.length,
        available: character.quotes.length > 0,
      },
      {
        id: 'profile-memories',
        icon: '📖',
        title: italian ? 'Cosa sa il gruppo' : 'What the party knows',
        description: italian
          ? 'La storia pubblica e le fonti che la sostengono.'
          : 'The public story and the sources that support it.',
        available: hasKnownHistory,
      },
    ];
  });

  private isRecorded(value: { readonly en: string; readonly it: string }): boolean {
    const normalized = `${value.en} ${value.it}`.toLowerCase();
    return !normalized.includes('not yet recorded') && !normalized.includes('non ancora registrat');
  }
}
