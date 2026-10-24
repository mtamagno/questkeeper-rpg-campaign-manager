import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { type BilingualText } from '@guild/models/language.model';
import { type Session, type TableMoment } from '@guild/models/session.model';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { LanguageService } from '@guild/services/language.service';

/** One session containing at least one approved out-of-character memory. */
export interface TableMomentGroup {
  readonly sessionId: string;
  readonly sessionNumber: number;
  readonly date: string;
  readonly title: BilingualText;
  readonly moments: ReadonlyArray<TableMoment>;
}

/** Keeps table memories separate from canon and presents the newest session first. */
export function selectTableMomentGroups(
  sessions: ReadonlyArray<Session>,
): ReadonlyArray<TableMomentGroup> {
  return sessions
    .filter((session): boolean => (session.tableMoments?.length ?? 0) > 0)
    .map((session): TableMomentGroup => ({
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      date: session.date,
      title: session.title,
      moments: session.tableMoments ?? [],
    }))
    .reverse();
}

@Component({
  selector: 'app-table-moments',
  standalone: true,
  imports: [RouterLink, BilingualTextPipe, DiceLoaderComponent, LanguageToggleComponent],
  templateUrl: './table-moments.component.html',
  styleUrl: './table-moments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableMomentsComponent {
  private readonly data = inject(DataService);
  private readonly campaigns = inject(CampaignService);
  private readonly language = inject(LanguageService);

  readonly lang = this.language.currentLanguage;
  readonly campaignId = this.campaigns.activeCampaignId;
  readonly isLoading = this.data.isLoading;
  readonly groups: Signal<ReadonlyArray<TableMomentGroup>> = computed(() =>
    selectTableMomentGroups(this.data.sortedSessions()),
  );

  readonly subtitle: BilingualText = {
    en: 'The jokes, comments, and little disasters that happened around the story—not inside it.',
    it: 'Le battute, i commenti e i piccoli disastri successi attorno alla storia, non dentro di essa.',
  };

  sessionLabel(group: TableMomentGroup): string {
    if (group.sessionNumber === 0) return this.lang() === 'it' ? 'Sessione Zero' : 'Session Zero';
    return `${this.lang() === 'it' ? 'Sessione' : 'Session'} ${group.sessionNumber}`;
  }
}
