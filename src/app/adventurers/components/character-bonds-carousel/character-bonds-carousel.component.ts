import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  type ElementRef,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '@guild/services/language.service';

export interface ProfileBondFeeling {
  readonly label: string;
  readonly intensity: number;
  readonly reason: string;
}

export interface ProfileBondPreview {
  readonly key: string;
  readonly entityId: string;
  readonly entityPath: 'party' | 'npcs';
  readonly name: string;
  readonly avatarUrl: string;
  readonly typeLabel: string;
  readonly description: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly sharedMemoryCount: number;
  readonly feelings: ReadonlyArray<ProfileBondFeeling>;
}

@Component({
  selector: 'app-character-bonds-carousel',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './character-bonds-carousel.component.html',
  styleUrl: './character-bonds-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterBondsCarouselComponent {
  private readonly languageService = inject(LanguageService);
  private readonly bondCarousel = viewChild<ElementRef<HTMLUListElement>>('bondCarousel');

  readonly bonds = input.required<ReadonlyArray<ProfileBondPreview>>();
  readonly campaignId = input.required<string>();
  readonly lang = this.languageService.currentLanguage;
  readonly showAll = signal(false);
  readonly feelingScale = [1, 2, 3, 4, 5] as const;
  readonly initialLimit = 6;
  readonly visibleBonds = computed(() =>
    this.showAll() ? this.bonds() : this.bonds().slice(0, this.initialLimit),
  );
  readonly hiddenCount = computed(() => Math.max(0, this.bonds().length - this.initialLimit));

  toggleAll(): void {
    const wasShowingAll = this.showAll();
    this.showAll.set(!wasShowingAll);
    if (wasShowingAll) this.bondCarousel()?.nativeElement.scrollTo({ left: 0 });
  }

  scroll(direction: -1 | 1): void {
    const carousel = this.bondCarousel()?.nativeElement;
    if (carousel === undefined) return;
    const firstCard = carousel.querySelector<HTMLElement>('.bonds-carousel__card');
    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
    const step =
      firstCard === null ? Math.max(carousel.clientWidth * 0.82, 280) : firstCard.offsetWidth + gap;
    const maxScroll = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
    carousel.scrollLeft = Math.min(maxScroll, Math.max(0, carousel.scrollLeft + direction * step));
  }
}
