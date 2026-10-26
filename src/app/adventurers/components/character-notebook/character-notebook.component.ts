/** Optional password-protected illustrated notebook attached to a character. */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import {
  type CharacterNotebook,
  type CharacterNotebookPage,
  type CharacterNotebookText,
  type ImageRef,
} from '@guild/models/character.model';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { ImageLightboxComponent } from '@guild/components/image-lightbox/image-lightbox.component';
import { PasswordDialogComponent } from '@guild/components/password-dialog/password-dialog.component';
import { LanguageService } from '@guild/services/language.service';
import { PasswordService } from '@guild/services/password.service';
import { CampaignService } from '@guild/services/campaign.service';
import { CharacterReadingPositionService } from '@guild/services/characterReadingPosition.service';
import { toDisplayUrl } from '@guild/services/imageUrl.service';

type NotebookSlide =
  | {
      readonly kind: 'cover';
      readonly side: 'front' | 'back';
      readonly id: string;
      readonly image: ImageRef;
    }
  | {
      readonly kind: 'spread';
      readonly id: string;
      readonly spreadIndex: number;
      readonly page: CharacterNotebookPage;
    };

@Component({
  selector: 'app-character-notebook',
  standalone: true,
  imports: [BilingualTextPipe, ImageLightboxComponent, PasswordDialogComponent],
  templateUrl: './character-notebook.component.html',
  styleUrl: './character-notebook.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterNotebookComponent {
  private readonly passwordService = inject(PasswordService);
  private readonly languageService = inject(LanguageService);
  private readonly campaignService = inject(CampaignService);
  private readonly readingPosition = inject(CharacterReadingPositionService);
  private restoredIdentity = '';

  readonly characterId = input.required<string>();
  readonly characterName = input.required<string>();
  readonly notebook = input.required<CharacterNotebook>();
  readonly lang = this.languageService.currentLanguage;

  readonly isDialogOpen: WritableSignal<boolean> = signal(false);
  readonly hasPasswordError: WritableSignal<boolean> = signal(false);
  readonly currentSlideIndex: WritableSignal<number> = signal(0);
  readonly lightboxImage: WritableSignal<ImageRef | null> = signal(null);

  private readonly accessId: Signal<string> = computed(() => `${this.characterId()}:notebook`);

  readonly isUnlocked: Signal<boolean> = computed(() =>
    this.passwordService.isUnlocked(this.accessId())(),
  );

  readonly slides: Signal<ReadonlyArray<NotebookSlide>> = computed(() => {
    const notebook = this.notebook();
    const slides: NotebookSlide[] = [];
    if (notebook.frontCover) {
      slides.push({ kind: 'cover', side: 'front', id: 'front-cover', image: notebook.frontCover });
    }
    notebook.pages.forEach((page, spreadIndex) => {
      slides.push({ kind: 'spread', id: page.id, spreadIndex, page });
    });
    if (notebook.backCover) {
      slides.push({ kind: 'cover', side: 'back', id: 'back-cover', image: notebook.backCover });
    }
    return slides;
  });

  readonly currentSlide: Signal<NotebookSlide | undefined> = computed(
    () => this.slides()[this.currentSlideIndex()],
  );
  readonly slideIndexes: Signal<number[]> = computed(() =>
    Array.from({ length: this.slides().length }, (_, index) => index),
  );
  readonly canGoPrevious: Signal<boolean> = computed(() => this.currentSlideIndex() > 0);
  readonly canGoNext: Signal<boolean> = computed(
    () => this.currentSlideIndex() < this.slides().length - 1,
  );
  readonly lightboxImages: Signal<ReadonlyArray<ImageRef>> = computed(() => {
    const image = this.lightboxImage();
    return image ? [image] : [];
  });
  readonly sealInitial: Signal<string> = computed(
    () => this.characterName().trim().charAt(0).toLocaleUpperCase() || '✦',
  );

  private readonly restoreReadingPosition = effect(() => {
    const campaignId = this.campaignService.activeCampaignId();
    const characterId = this.characterId();
    const unlocked = this.isUnlocked();
    const slides = this.slides();
    const identity = `${campaignId ?? ''}:${characterId}`;

    if (!unlocked) {
      this.restoredIdentity = '';
      return;
    }
    if (this.restoredIdentity === identity) return;

    const remembered = this.readingPosition.get(campaignId, characterId)?.notebookSlide ?? 0;
    this.currentSlideIndex.set(Math.min(remembered, Math.max(0, slides.length - 1)));
    this.restoredIdentity = identity;
  });

  openDialog(): void {
    this.hasPasswordError.set(false);
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogOpen.set(false);
    this.hasPasswordError.set(false);
  }

  onPasswordSubmit(inputPassword: string): void {
    const success = this.passwordService.unlock(
      this.accessId(),
      inputPassword,
      this.notebook().password,
    );
    if (success) {
      this.closeDialog();
      return;
    }
    this.hasPasswordError.set(true);
  }

  lockNotebook(): void {
    this.passwordService.lock(this.accessId());
    this.currentSlideIndex.set(0);
  }

  previousSlide(): void {
    this.goToSlide(this.currentSlideIndex() - 1);
  }

  nextSlide(): void {
    this.goToSlide(this.currentSlideIndex() + 1);
  }

  goToSlide(slideIndex: number): void {
    const safeIndex = Math.max(0, Math.min(this.slides().length - 1, slideIndex));
    this.currentSlideIndex.set(safeIndex);
    this.readingPosition.rememberNotebook(
      this.campaignService.activeCampaignId(),
      this.characterId(),
      safeIndex,
    );
  }

  openLightbox(image: ImageRef): void {
    this.lightboxImage.set(image);
  }

  closeLightbox(): void {
    this.lightboxImage.set(null);
  }

  notebookText(value: CharacterNotebookText): string {
    if (typeof value === 'string') return value;
    return (
      value[this.lang()] || value.en || Object.values(value).find((entry) => entry.length > 0) || ''
    );
  }

  slideLabel(slide: NotebookSlide): string {
    if (slide.kind === 'cover') {
      if (slide.side === 'front') return this.lang() === 'it' ? 'Copertina' : 'Front cover';
      return this.lang() === 'it' ? 'Quarta di copertina' : 'Back cover';
    }
    const prefix = this.lang() === 'it' ? 'Tavola' : 'Spread';
    return `${prefix} ${slide.spreadIndex + 1} / ${this.notebook().pages.length}`;
  }

  markerLabel(slide: NotebookSlide): string {
    return `${this.lang() === 'it' ? 'Vai a: ' : 'Go to: '}${this.slideLabel(slide)}`;
  }

  onBookKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previousSlide();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextSlide();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.goToSlide(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.goToSlide(this.slides().length - 1);
    }
  }

  displayImageUrl(imageUrl: string): string {
    return toDisplayUrl(imageUrl);
  }
}
