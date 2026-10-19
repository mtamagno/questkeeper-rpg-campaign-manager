import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AudiencePreferenceService } from '@guild/services/audiencePreference.service';
import { CampaignService } from '@guild/services/campaign.service';
import { GUIDED_TOUR_STEP_COUNT, GuidedTourService } from '@guild/services/guidedTour.service';
import { LanguageService } from '@guild/services/language.service';

interface TourCopy {
  readonly kicker: string;
  readonly title: string;
  readonly description: string;
  readonly hint: string;
}

function cleanUrl(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  return path.length === 0 ? '/' : path;
}

/** Persistent, route-aware walkthrough of the player-facing Companion. */
@Component({
  selector: 'app-guided-tour',
  standalone: true,
  templateUrl: './guided-tour.component.html',
  styleUrl: './guided-tour.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidedTourComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly campaigns = inject(CampaignService);
  private readonly audiencePreference = inject(AudiencePreferenceService);
  private readonly language = inject(LanguageService);

  readonly tour = inject(GuidedTourService);
  readonly currentUrl = signal(cleanUrl(this.router.url));
  readonly isItalian = this.language.isItalian;
  readonly totalSteps = GUIDED_TOUR_STEP_COUNT;

  readonly stepNumber = computed((): number => this.tour.state().step + 1);
  readonly progress = computed((): number => (this.stepNumber() / this.totalSteps) * 100);

  readonly expectedUrl = computed((): string | undefined => {
    const { campaignId, step } = this.tour.state();
    if (step === 0) {
      return '/';
    }
    if (campaignId === undefined) {
      return undefined;
    }
    const prefix = `/${campaignId}`;
    return [prefix, `${prefix}/party`, `${prefix}/campaign/story-so-far`, `${prefix}/maps`][
      step - 1
    ];
  });

  readonly isAtExpectedStop = computed((): boolean => {
    const expected = this.expectedUrl();
    return expected !== undefined && this.currentUrl() === expected;
  });

  readonly copy = computed((): TourCopy => {
    const it = this.isItalian();
    const audience = this.audiencePreference.audience();
    const { campaignId, step } = this.tour.state();

    if (step === 0) {
      if (audience === 'gm') {
        return it
          ? {
              kicker: 'Tour per Game Master',
              title: 'Guarda ciò che vedrà il tuo party',
              description:
                'In due minuti visiteremo il percorso dei giocatori, dalla campagna ai ricordi che li riportano al tavolo.',
              hint: 'Il tour mostra soltanto contenuti pubblici e non modifica alcun file.',
            }
          : {
              kicker: 'Game Master tour',
              title: 'See what your party will experience',
              description:
                'In two minutes, we will follow the player journey from campaign choice to the memories that bring everyone back to the table.',
              hint: 'The tour only reads public pages and never edits campaign files.',
            };
      }
      return it
        ? {
            kicker: 'Tour per giocatori',
            title: 'Ritrova la tua avventura in due minuti',
            description:
              'Segui il percorso più breve dalla campagna al personaggio, poi riprendi storia e luoghi senza perderti nel menu.',
            hint: 'Puoi sospendere il tour e riprenderlo su questo dispositivo.',
          }
        : {
            kicker: 'Player tour',
            title: 'Find your adventure in two minutes',
            description:
              'Follow the shortest path from campaign to character, then recover the story and places without getting lost in navigation.',
            hint: 'You can pause and resume the tour on this device.',
          };
    }

    if (step === 1 && campaignId === undefined) {
      return it
        ? {
            kicker: 'Tappa 2 · Scegli',
            title: 'Apri una cronaca dal registro',
            description:
              'Scegli liberamente una campagna qui sotto. Il normale avviso spoiler rimane attivo e il tour continuerà solo dopo la tua conferma.',
            hint: 'Il tour non concede accesso e non salta il consenso spoiler.',
          }
        : {
            kicker: 'Stop 2 · Choose',
            title: 'Open a chronicle from the ledger',
            description:
              'Choose any campaign below. The normal spoiler warning remains in place, and the tour continues only after you confirm.',
            hint: 'The tour grants no access and never bypasses spoiler consent.',
          };
    }

    const stops: ReadonlyArray<{ readonly en: TourCopy; readonly it: TourCopy }> = [
      {
        en: {
          kicker: 'Stop 2 · Orient',
          title: 'Read the campaign at a glance',
          description:
            'The campaign home brings the title, current pulse and fastest player actions together before game night.',
          hint: 'The side navigation stays available, but the useful next action comes first.',
        },
        it: {
          kicker: 'Tappa 2 · Orientati',
          title: "Leggi la campagna a colpo d'occhio",
          description:
            'La pagina iniziale riunisce titolo, stato e azioni più utili prima della sessione.',
          hint: 'Il menu resta disponibile, ma la prossima azione utile viene prima.',
        },
      },
      {
        en: {
          kicker: 'Stop 3 · Remember who you are',
          title: 'Meet the party',
          description:
            'Character profiles preserve identity, bonds, personal history and level-by-level growth beyond the rules sheet.',
          hint: 'Protected details remain separate from the public profile.',
        },
        it: {
          kicker: 'Tappa 3 · Ricorda chi sei',
          title: 'Incontra la compagnia',
          description:
            'I profili conservano identità, legami, storia personale ed evoluzione oltre alla semplice scheda.',
          hint: 'I dettagli protetti restano separati dal profilo pubblico.',
        },
      },
      {
        en: {
          kicker: 'Stop 4 · Catch up',
          title: 'Return to the story',
          description:
            'Story so far connects session chapters into one readable memory when the table has been away for a while.',
          hint: 'Complete chapters remain available when a short recap is not enough.',
        },
        it: {
          kicker: 'Tappa 4 · Riprendi il filo',
          title: 'Torna nella storia',
          description:
            'La storia fin qui collega i capitoli delle sessioni in un unico ricordo leggibile dopo una pausa.',
          hint: 'I capitoli completi restano disponibili quando il riassunto non basta.',
        },
      },
      {
        en: {
          kicker: 'Stop 5 · Explore',
          title: 'Put every place back on the map',
          description:
            'Maps and discovered locations reconnect names, journeys and session memories. You now know the shortest route through the Companion.',
          hint:
            audience === 'gm'
              ? 'Return to the campaign ledger whenever you are ready to open the Manager demo.'
              : 'Finish the tour and keep exploring freely.',
        },
        it: {
          kicker: 'Tappa 5 · Esplora',
          title: 'Rimetti ogni luogo sulla mappa',
          description:
            'Mappe e luoghi scoperti ricollegano nomi, viaggi e ricordi. Ora conosci il percorso più breve nel Companion.',
          hint:
            audience === 'gm'
              ? 'Torna al registro quando vuoi aprire la demo del Manager.'
              : 'Concludi il tour e continua a esplorare liberamente.',
        },
      },
    ];
    const stop = stops[Math.max(0, step - 1)];
    return it ? stop.it : stop.en;
  });

  readonly primaryLabel = computed((): string => {
    const it = this.isItalian();
    const { campaignId, step } = this.tour.state();
    if (step === 0) {
      return it ? 'Inizia il tour' : 'Begin tour';
    }
    if (step === 1 && campaignId === undefined) {
      return it ? 'Mostra le campagne' : 'Show campaigns';
    }
    if (!this.isAtExpectedStop()) {
      return it ? 'Torna a questa tappa' : 'Return to this stop';
    }
    if (step === this.totalSteps - 1) {
      return it ? 'Concludi il tour' : 'Finish tour';
    }
    return it ? 'Prossima tappa' : 'Next stop';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event): void => this.currentUrl.set(cleanUrl(event.urlAfterRedirects)));

    effect((): void => {
      const campaignId = this.campaigns.activeCampaignId();
      if (campaignId !== undefined) {
        this.tour.attachCampaign(campaignId);
      }
    });
  }

  async primaryAction(): Promise<void> {
    const { campaignId, step } = this.tour.state();
    if (step === 0) {
      this.tour.advance();
      await this.goTo('/');
      this.scrollToCampaigns();
      return;
    }
    if (step === 1 && campaignId === undefined) {
      await this.goTo('/');
      this.scrollToCampaigns();
      return;
    }
    if (!this.isAtExpectedStop()) {
      const expected = this.expectedUrl();
      if (expected !== undefined) {
        await this.goTo(expected);
      }
      return;
    }
    if (step === this.totalSteps - 1) {
      this.tour.complete();
      return;
    }
    this.tour.advance();
    const nextUrl = this.expectedUrl();
    if (nextUrl !== undefined) {
      await this.goTo(nextUrl);
    }
  }

  async previous(): Promise<void> {
    this.tour.back();
    const previousUrl = this.expectedUrl() ?? '/';
    await this.goTo(previousUrl);
  }

  @HostListener('document:keydown.escape')
  pauseOnEscape(): void {
    if (this.tour.isActive()) {
      this.tour.pause();
    }
  }

  private async goTo(url: string): Promise<void> {
    if (this.currentUrl() !== url) {
      await this.router.navigateByUrl(url);
    }
  }

  private scrollToCampaigns(): void {
    setTimeout((): void => {
      document.querySelector('#campaigns')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
