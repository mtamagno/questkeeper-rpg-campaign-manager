import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { type Character } from '@guild/models/character.model';
import { type BilingualText } from '@guild/models/language.model';
import { LanguageService } from '@guild/services/language.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { UiTextService } from '@guild/services/uiText.service';

type ProfileFacetId = 'traits' | 'ideals' | 'bonds' | 'flaws' | 'hobbies';

interface ProfileFacet {
  readonly id: ProfileFacetId;
  readonly icon: string;
  readonly label: string;
  readonly value: BilingualText;
  readonly wide: boolean;
}

const COLLAPSED_COPY_LIMIT = 260;

/** A concise, lossless public identity view for the first character tab. */
@Component({
  selector: 'app-character-profile-overview',
  standalone: true,
  imports: [BilingualTextPipe],
  templateUrl: './character-profile-overview.component.html',
  styleUrl: './character-profile-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterProfileOverviewComponent {
  readonly uiText = inject(UiTextService);
  private readonly languageService = inject(LanguageService);
  private readonly campaignLocale = inject(CampaignLocaleService);

  readonly character = input.required<Character>();
  readonly lang = this.languageService.currentLanguage;
  private readonly expandedFields = signal<ReadonlySet<ProfileFacetId>>(new Set());

  /** Only authored facets are shown; placeholder copy remains an honest empty state. */
  readonly facets = computed<ReadonlyArray<ProfileFacet>>(() => {
    const profile = this.character().publicProfile;
    const candidates: ReadonlyArray<ProfileFacet | undefined> = [
      this.isRecorded(profile.traits)
        ? {
            id: 'traits',
            icon: '✦',
            label: this.uiText.text('characterUi.profile.facets.traits'),
            value: profile.traits,
            wide: false,
          }
        : undefined,
      this.isRecorded(profile.ideals)
        ? {
            id: 'ideals',
            icon: '◇',
            label: this.uiText.text('characterUi.profile.facets.ideals'),
            value: profile.ideals,
            wide: false,
          }
        : undefined,
      this.isRecorded(profile.bonds)
        ? {
            id: 'bonds',
            icon: '∞',
            label: this.uiText.text('characterUi.profile.facets.bonds'),
            value: profile.bonds,
            wide: false,
          }
        : undefined,
      this.isRecorded(profile.flaws)
        ? {
            id: 'flaws',
            icon: '◈',
            label: this.uiText.text('characterUi.profile.facets.flaws'),
            value: profile.flaws,
            wide: false,
          }
        : undefined,
      profile.hobbies !== undefined && this.isRecorded(profile.hobbies)
        ? {
            id: 'hobbies',
            icon: '♬',
            label: this.uiText.text('characterUi.profile.facets.hobbies'),
            value: profile.hobbies,
            wide: true,
          }
        : undefined,
    ];

    return candidates.filter((facet): facet is ProfileFacet => facet !== undefined);
  });

  isLong(value: BilingualText): boolean {
    return this.campaignLocale.resolve(value).trim().length > COLLAPSED_COPY_LIMIT;
  }

  isExpanded(fieldId: ProfileFacetId): boolean {
    return this.expandedFields().has(fieldId);
  }

  toggleExpanded(fieldId: ProfileFacetId): void {
    this.expandedFields.update((current) => {
      const next = new Set(current);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  private isRecorded(value: BilingualText): boolean {
    const normalized = `${value.en} ${value.it}`.toLowerCase();
    return !normalized.includes('not yet recorded') && !normalized.includes('non ancora registrat');
  }
}
