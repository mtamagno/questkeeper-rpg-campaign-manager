/**
 * Session summary component — renders a single campaign session entry.
 * Used inside the campaign overview timeline.
 */

import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  type InputSignal,
  type Signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { type Session } from '@guild/models/session.model';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { resolveNarrativeMood } from '@guild/models/narrativeMood.model';

/**
 * Displays a single session summary card with number, date, title,
 * summary text, key events, and location.
 */
@Component({
  selector: 'app-session-summary',
  standalone: true,
  imports: [BilingualTextPipe, RouterLink],
  templateUrl: './session-summary.component.html',
  styleUrl: './session-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionSummaryComponent {
  private readonly campaignService = inject(CampaignService);
  private readonly dataService = inject(DataService);

  /** Active campaign ID for building route links. */
  readonly campaignId: Signal<string | undefined> = this.campaignService.activeCampaignId;

  /** The session data to display. */
  readonly session: InputSignal<Session> = input.required<Session>();
  readonly mood = computed(() =>
    resolveNarrativeMood(
      this.dataService.campaign(),
      this.dataService.sortedSessions(),
      this.session(),
    ),
  );
  readonly summaryMood = computed(() =>
    resolveNarrativeMood(
      this.dataService.campaign(),
      this.dataService.sortedSessions(),
      this.session(),
      'summary',
    ),
  );
}
