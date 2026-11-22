import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AudiencePreferenceService } from '@guild/services/audiencePreference.service';
import { CampaignService } from '@guild/services/campaign.service';
import { GUIDED_TOUR_STEP_COUNT, GuidedTourService } from '@guild/services/guidedTour.service';
import { UiTextService } from '@guild/services/uiText.service';

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
  readonly uiText = inject(UiTextService);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('tourPanel');

  readonly tour = inject(GuidedTourService);
  readonly currentUrl = signal(cleanUrl(this.router.url));
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
    const audience = this.audiencePreference.audience();
    const { campaignId, step } = this.tour.state();
    let prefix: string;

    if (step === 0) {
      prefix = audience === 'gm' ? 'guidedTour.gmIntro' : 'guidedTour.playerIntro';
    } else if (step === 1 && campaignId === undefined) {
      prefix = 'guidedTour.choose';
    } else {
      prefix = `guidedTour.stops.${['orient', 'party', 'story', 'maps'][Math.max(0, step - 1)]}`;
    }
    return {
      kicker: this.uiText.text(`${prefix}.kicker`),
      title: this.uiText.text(`${prefix}.title`),
      description: this.uiText.text(`${prefix}.description`),
      hint:
        prefix === 'guidedTour.stops.maps'
          ? this.uiText.text(`${prefix}.${audience === 'gm' ? 'gmHint' : 'playerHint'}`)
          : this.uiText.text(`${prefix}.hint`),
    };
  });

  readonly primaryLabel = computed((): string => {
    const { campaignId, step } = this.tour.state();
    if (step === 0) {
      return this.uiText.text('guidedTour.actions.begin');
    }
    if (step === 1 && campaignId === undefined) {
      return this.uiText.text('guidedTour.actions.showCampaigns');
    }
    if (!this.isAtExpectedStop()) {
      return this.uiText.text('guidedTour.actions.return');
    }
    if (step === this.totalSteps - 1) {
      return this.uiText.text('guidedTour.actions.finish');
    }
    return this.uiText.text('guidedTour.actions.next');
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

    effect((): void => {
      if (this.tour.isActive()) {
        setTimeout((): void => this.panel()?.nativeElement.focus());
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
      this.restoreLaunchFocus();
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

  pause(): void {
    this.tour.pause();
    this.restoreLaunchFocus();
  }

  @HostListener('document:keydown.escape')
  pauseOnEscape(): void {
    if (this.tour.isActive()) {
      this.pause();
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

  private restoreLaunchFocus(): void {
    setTimeout((): void => {
      document.querySelector<HTMLElement>('[data-tour-control]')?.focus();
    });
  }
}
