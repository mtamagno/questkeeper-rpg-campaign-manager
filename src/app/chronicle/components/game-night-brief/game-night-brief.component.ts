import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SfxHoverDirective } from '@guild/directives/sfxHover.directive';
import { localizeText } from '@guild/models/language.model';
import { type Session } from '@guild/models/session.model';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { LanguageService } from '@guild/services/language.service';

interface GameNightBrief {
  readonly latestSessionId: string;
  readonly latestSessionTitle: string;
  readonly latestEvent: string;
  readonly currentLocation: string;
  readonly storySoFar: string;
  readonly characterId: string | undefined;
  readonly characterName: string | undefined;
  readonly characterThread: string | undefined;
}

/** Evidence-linked context shown before the chronological session archive. */
@Component({
  selector: 'app-game-night-brief',
  standalone: true,
  imports: [RouterLink, SfxHoverDirective],
  templateUrl: './game-night-brief.component.html',
  styleUrl: './game-night-brief.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameNightBriefComponent {
  private readonly dataService = inject(DataService);
  private readonly campaignService = inject(CampaignService);
  private readonly languageService = inject(LanguageService);

  readonly lang = this.languageService.currentLanguage;
  readonly campaignId = this.campaignService.activeCampaignId;

  private readonly latestSession: Signal<Session | undefined> = computed(() => {
    const sessions = this.dataService.sortedSessions();
    return sessions.length > 0 ? sessions[sessions.length - 1] : undefined;
  });

  /** Derives the brief from public campaign records; it never reads protected fields. */
  readonly brief: Signal<GameNightBrief | undefined> = computed(() => {
    const session = this.latestSession();
    const campaign = this.dataService.campaign();
    if (session === undefined || campaign === undefined) {
      return undefined;
    }

    const language = this.lang();
    const spotlight =
      this.dataService.characters().find((character) => character.diary.length > 0) ??
      this.dataService.characters()[0];
    const latestEvent = session.keyEvents.at(-1)?.description ?? session.summary;

    return {
      latestSessionId: session.id,
      latestSessionTitle: localizeText(session.title, language),
      latestEvent: localizeText(latestEvent, language),
      currentLocation: localizeText(session.location, language),
      storySoFar: localizeText(campaign.storySoFar, language),
      characterId: spotlight?.id,
      characterName: spotlight?.name,
      characterThread:
        spotlight === undefined ? undefined : localizeText(spotlight.publicProfile.bonds, language),
    };
  });
}
