/**
 * Homepage component — the landing page of the active campaign.
 * Displays a random group hero image, campaign title, a random character quote,
 * and quick navigation links to key sections.
 */

import { Component, ChangeDetectionStrategy, inject, computed, type Signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DataService } from '@guild/services/data.service';
import { CampaignService } from '@guild/services/campaign.service';
import { LanguageService } from '@guild/services/language.service';
import { type Character, type CharacterQuote } from '@guild/models/character.model';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { SfxHoverDirective } from '@guild/directives/sfxHover.directive';
import { localizeText } from '@guild/models/language.model';
import { JourneyMemoryService, type JourneyPage } from '@guild/services/journeyMemory.service';
import { type Session } from '@guild/models/session.model';

/** Resolved quote with its speaker's name for display. */
interface DisplayQuote {
  readonly text: string;
  readonly context: string;
  readonly characterName: string;
}

/** Public, evidence-linked context a player can scan before the session starts. */
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

/**
 * Picks a random element from a readonly array.
 * @param items - The array to pick from.
 * @returns A random element, or undefined if the array is empty.
 */
function pickRandom<T>(items: ReadonlyArray<T>): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Landing page for the active campaign.
 * Shows a random group photo, campaign title, random character quote,
 * and navigation links.
 */
@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [RouterLink, LanguageToggleComponent, SfxHoverDirective],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomepageComponent {
  private readonly dataService = inject(DataService);
  private readonly campaignService = inject(CampaignService);
  private readonly languageService = inject(LanguageService);
  private readonly journeyMemory = inject(JourneyMemoryService);

  /** Current language for localized interface labels. */
  readonly lang = this.languageService.currentLanguage;

  /** Active campaign ID for building route links. */
  readonly campaignId: Signal<string | undefined> = this.campaignService.activeCampaignId;

  /** Random hero image URL from campaign data — updates when campaign loads. */
  readonly heroImageUrl: Signal<string | undefined> = computed(() => {
    const campaign = this.dataService.campaign();
    if (campaign === undefined || campaign.heroImages.length === 0) {
      return undefined;
    }
    return pickRandom(campaign.heroImages);
  });

  /** Whether data is still loading. */
  readonly isLoading: Signal<boolean> = this.dataService.isLoading;

  /** Lightweight campaign pulse shown on the landing page. */
  readonly partyCount: Signal<number> = computed(() => this.dataService.characters().length);
  readonly npcCount: Signal<number> = computed(() => this.dataService.npcs().length);
  readonly sessionCount: Signal<number> = computed(() => this.dataService.sessions().length);
  readonly mapCount: Signal<number> = computed(() => this.dataService.maps().length);

  readonly continuePage = this.journeyMemory.continuePage;
  readonly favoritePages = computed((): ReadonlyArray<JourneyPage> =>
    this.journeyMemory.favoritePages().slice(0, 4),
  );
  readonly recentPages = computed((): ReadonlyArray<JourneyPage> => {
    const favoriteUrls = new Set(this.favoritePages().map((page) => page.url));
    return this.journeyMemory
      .recentPages()
      .filter((page): boolean => !favoriteUrls.has(page.url))
      .slice(0, 4);
  });

  /** Most recent session, used by catch-up links and the game-night brief. */
  readonly latestSession: Signal<Session | undefined> = computed(() => {
    const sessions = this.dataService.sortedSessions();
    return sessions.length > 0 ? sessions[sessions.length - 1] : undefined;
  });
  readonly latestSessionId: Signal<string | undefined> = computed(() => this.latestSession()?.id);

  /**
   * Derives a concise player brief from public campaign records only.
   * It links every statement back to the chapter, map, character or full recap.
   */
  readonly gameNightBrief: Signal<GameNightBrief | undefined> = computed(() => {
    const session = this.latestSession();
    const campaign = this.dataService.campaign();
    if (session === undefined || campaign === undefined) {
      return undefined;
    }

    const lang = this.languageService.currentLanguage();
    const spotlight =
      this.dataService.characters().find((character) => character.diary.length > 0) ??
      this.dataService.characters()[0];
    const latestEvent = session.keyEvents.at(-1)?.description ?? session.summary;

    return {
      latestSessionId: session.id,
      latestSessionTitle: localizeText(session.title, lang),
      latestEvent: localizeText(latestEvent, lang),
      currentLocation: localizeText(session.location, lang),
      storySoFar: localizeText(campaign.storySoFar, lang),
      characterId: spotlight?.id,
      characterName: spotlight?.name,
      characterThread:
        spotlight === undefined ? undefined : localizeText(spotlight.publicProfile.bonds, lang),
    };
  });

  /** Campaign title from the data service. */
  readonly campaignTitle: Signal<string> = computed(() => {
    const campaign = this.dataService.campaign();
    if (campaign === undefined) {
      return '';
    }
    return localizeText(campaign.name, this.languageService.currentLanguage());
  });

  /** Campaign subtitle/tagline. */
  readonly campaignSubtitle: Signal<string> = computed(() => {
    const campaign = this.dataService.campaign();
    if (campaign === undefined) {
      return '';
    }
    return localizeText(campaign.description, this.languageService.currentLanguage());
  });

  /** A random character quote — picked once on load. */
  readonly randomQuote: Signal<DisplayQuote | undefined> = computed(() => {
    const characters = this.dataService.characters();
    const lang = this.languageService.currentLanguage();

    const charactersWithQuotes = characters.filter((c: Character) => c.quotes.length > 0);

    const character = pickRandom(charactersWithQuotes);
    if (character === undefined) {
      return undefined;
    }

    const quote: CharacterQuote | undefined = pickRandom(character.quotes);
    if (quote === undefined) {
      return undefined;
    }

    return {
      text: localizeText(quote.text, lang),
      context: localizeText(quote.context, lang),
      characterName: character.name,
    };
  });
}
