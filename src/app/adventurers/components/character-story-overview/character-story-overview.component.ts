import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type Character } from '@guild/models/character.model';
import { LanguageService } from '@guild/services/language.service';
import { UiTextService } from '@guild/services/uiText.service';

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
  readonly uiText = inject(UiTextService);
  private readonly languageService = inject(LanguageService);

  readonly character = input.required<Character>();
  readonly bondCount = input.required<number>();
  readonly lang = this.languageService.currentLanguage;

  readonly destinations = computed<ReadonlyArray<StoryDestination>>(() => {
    const character = this.character();
    const chapterCount = character.loreChapters?.length ?? 0;
    const hasOrigins = chapterCount > 0 || this.isRecorded(character.publicProfile.backstory);
    const hasKnownHistory = this.isRecorded(character.publicProfile.knownHistory);

    return [
      {
        id: 'personal-chapters',
        icon: '🧭',
        title: this.uiText.text(
          chapterCount > 0 ? 'characterUi.story.personalChapters' : 'characterUi.story.origins',
        ),
        description: this.uiText.text('characterUi.story.originsDescription'),
        count: chapterCount || undefined,
        available: hasOrigins,
      },
      {
        id: 'profile-bonds',
        icon: '🕸️',
        title: this.uiText.text('characterUi.story.bonds'),
        description: this.uiText.text('characterUi.story.bondsDescription'),
        count: this.bondCount(),
        available: this.bondCount() > 0,
      },
      {
        id: 'quotes',
        icon: '💬',
        title: this.uiText.text('characterUi.story.quotes'),
        description: this.uiText.text('characterUi.story.quotesDescription'),
        count: character.quotes.length,
        available: character.quotes.length > 0,
      },
      {
        id: 'profile-memories',
        icon: '📖',
        title: this.uiText.text('characterUi.story.partyKnowledge'),
        description: this.uiText.text('characterUi.story.partyKnowledgeDescription'),
        available: hasKnownHistory,
      },
    ];
  });

  private isRecorded(value: { readonly en: string; readonly it: string }): boolean {
    const normalized = `${value.en} ${value.it}`.toLowerCase();
    return !normalized.includes('not yet recorded') && !normalized.includes('non ancora registrat');
  }
}
