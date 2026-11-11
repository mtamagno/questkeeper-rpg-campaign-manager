/**
 * Campaign overview page — chronological list of session summaries.
 * Styled as an ancient chronicle of the adventurers' journey.
 */

import { Component, ChangeDetectionStrategy, inject, computed, type Signal } from '@angular/core';

import { DataService } from '@guild/services/data.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { UiTextService } from '@guild/services/uiText.service';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { AccordionComponent } from '@guild/components/accordion/accordion.component';
import { type Session } from '@guild/models/session.model';
import { SessionSummaryComponent } from '../../components/session-summary/session-summary.component';
import { GameNightBriefComponent } from '../../components/game-night-brief/game-night-brief.component';

/**
 * Displays all campaign sessions in chronological order.
 * Each session is rendered as a chronicle entry.
 */
@Component({
  selector: 'app-campaign-overview',
  standalone: true,
  imports: [
    SessionSummaryComponent,
    LanguageToggleComponent,
    AccordionComponent,
    GameNightBriefComponent,
  ],
  templateUrl: './campaign-overview.component.html',
  styleUrl: './campaign-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignOverviewComponent {
  private readonly dataService = inject(DataService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  readonly uiText = inject(UiTextService);

  /** Whether data is still loading. */
  readonly isLoading: Signal<boolean> = this.dataService.isLoading;

  /** Sessions sorted by session number (ascending). */
  readonly sessions: Signal<ReadonlyArray<Session>> = this.dataService.sortedSessions;

  /** Index of the last session (to auto-open its accordion). */
  readonly lastSessionIndex: Signal<number> = computed(() =>
    Math.max(0, this.sessions().length - 1),
  );

  /** Localized timeline title; session zero is the pre-campaign prologue. */
  entryTitle(session: Session): string {
    const title = this.campaignLocale.resolve(session.title);
    if (session.sessionNumber === 0) {
      return this.uiText.text('chronicle.common.prologueTitle', { title });
    }
    return this.uiText.text('chronicle.common.sessionTitle', {
      number: session.sessionNumber,
      title,
    });
  }
}
