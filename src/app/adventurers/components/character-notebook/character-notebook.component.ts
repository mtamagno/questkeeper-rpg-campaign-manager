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
  type CharacterNotebookHandwritingStyle,
  type CharacterNotebookMood,
  type CharacterNotebookNarratorStyle,
  type CharacterNotebookPage,
  type CharacterNotebookPaperStyle,
  type CharacterNotebookSecrecy,
  type CharacterNotebookText,
  type ImageRef,
} from '@guild/models/character.model';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { ImageLightboxComponent } from '@guild/components/image-lightbox/image-lightbox.component';
import { PasswordDialogComponent } from '@guild/components/password-dialog/password-dialog.component';
import { LanguageService } from '@guild/services/language.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { PasswordService } from '@guild/services/password.service';
import { CampaignService } from '@guild/services/campaign.service';
import { CharacterReadingPositionService } from '@guild/services/characterReadingPosition.service';
import { toDisplayUrl } from '@guild/services/imageUrl.service';
import { UiTextService } from '@guild/services/uiText.service';
import { DataService } from '@guild/services/data.service';

type NotebookOrder = 'authored' | 'oldest' | 'newest';
type NotebookEmotionalState = 'luminous' | 'reflective' | 'veiled' | 'tense' | 'broken';

interface IndexedNotebookPage {
  readonly page: CharacterNotebookPage;
  readonly originalIndex: number;
}

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
  readonly uiText = inject(UiTextService);
  private readonly passwordService = inject(PasswordService);
  private readonly languageService = inject(LanguageService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly campaignService = inject(CampaignService);
  private readonly readingPosition = inject(CharacterReadingPositionService);
  private readonly data = inject(DataService);
  private restoredIdentity = '';

  readonly characterId = input.required<string>();
  readonly characterName = input.required<string>();
  readonly notebook = input.required<CharacterNotebook>();
  readonly lang = this.languageService.currentLanguage;

  readonly isDialogOpen: WritableSignal<boolean> = signal(false);
  readonly hasPasswordError: WritableSignal<boolean> = signal(false);
  readonly currentSlideIndex: WritableSignal<number> = signal(0);
  readonly lightboxImage: WritableSignal<ImageRef | null> = signal(null);
  readonly selectedMood = signal<CharacterNotebookMood | 'all'>('all');
  readonly selectedSessionId = signal('all');
  readonly selectedCharacterId = signal('all');
  readonly selectedSecrecy = signal<CharacterNotebookSecrecy | 'all'>('all');
  readonly chronologyOrder = signal<NotebookOrder>('authored');

  readonly paperStyle: Signal<CharacterNotebookPaperStyle> = computed(
    () => this.notebook().presentation?.paper ?? 'classic',
  );
  readonly handwritingStyle: Signal<CharacterNotebookHandwritingStyle> = computed(
    () => this.notebook().presentation?.handwriting ?? 'measured',
  );
  readonly narratorStyle: Signal<CharacterNotebookNarratorStyle> = computed(
    () => this.notebook().presentation?.narrator ?? 'observer',
  );

  private readonly accessId: Signal<string> = computed(() => `${this.characterId()}:notebook`);

  readonly isUnlocked: Signal<boolean> = computed(() =>
    this.passwordService.isUnlocked(this.accessId())(),
  );

  readonly moodOptions = computed(() => [
    ...new Set(this.notebook().pages.map((page) => page.mood)),
  ]);
  readonly sessionOptions = computed(() => [
    ...new Set(
      this.notebook()
        .pages.map((page) => page.sessionId)
        .filter((id): id is string => Boolean(id)),
    ),
  ]);
  readonly characterOptions = computed(() => [
    ...new Set(this.notebook().pages.flatMap((page) => page.relatedCharacterIds ?? [])),
  ]);
  readonly secrecyOptions = computed(() => [
    ...new Set(this.notebook().pages.map((page) => page.secrecy ?? 'private')),
  ]);
  readonly hasActiveFilters = computed(
    () =>
      this.selectedMood() !== 'all' ||
      this.selectedSessionId() !== 'all' ||
      this.selectedCharacterId() !== 'all' ||
      this.selectedSecrecy() !== 'all',
  );
  readonly filteredPages: Signal<ReadonlyArray<IndexedNotebookPage>> = computed(() => {
    const mood = this.selectedMood();
    const sessionId = this.selectedSessionId();
    const characterId = this.selectedCharacterId();
    const secrecy = this.selectedSecrecy();
    const order = this.chronologyOrder();
    const pages = this.notebook()
      .pages.map((page, originalIndex) => ({ page, originalIndex }))
      .filter(({ page }) => mood === 'all' || page.mood === mood)
      .filter(({ page }) => sessionId === 'all' || page.sessionId === sessionId)
      .filter(
        ({ page }) =>
          characterId === 'all' || (page.relatedCharacterIds ?? []).includes(characterId),
      )
      .filter(({ page }) => secrecy === 'all' || (page.secrecy ?? 'private') === secrecy);
    if (order === 'authored') return pages;
    return [...pages].sort((left, right) => {
      const leftDate = Date.parse(left.page.recordedAt ?? '');
      const rightDate = Date.parse(right.page.recordedAt ?? '');
      if (Number.isNaN(leftDate) && Number.isNaN(rightDate)) {
        return left.originalIndex - right.originalIndex;
      }
      if (Number.isNaN(leftDate)) return 1;
      if (Number.isNaN(rightDate)) return -1;
      return order === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });
  });

  readonly slides: Signal<ReadonlyArray<NotebookSlide>> = computed(() => {
    const notebook = this.notebook();
    const slides: NotebookSlide[] = [];
    if (!this.hasActiveFilters() && notebook.frontCover) {
      slides.push({ kind: 'cover', side: 'front', id: 'front-cover', image: notebook.frontCover });
    }
    this.filteredPages().forEach(({ page, originalIndex }) => {
      slides.push({ kind: 'spread', id: page.id, spreadIndex: originalIndex, page });
    });
    if (!this.hasActiveFilters() && notebook.backCover) {
      slides.push({ kind: 'cover', side: 'back', id: 'back-cover', image: notebook.backCover });
    }
    return slides;
  });

  readonly currentSlide: Signal<NotebookSlide | undefined> = computed(
    () => this.slides()[this.currentSlideIndex()],
  );
  readonly emotionalState: Signal<NotebookEmotionalState> = computed(() => {
    const slide = this.currentSlide();
    if (!slide || slide.kind === 'cover') return 'reflective';
    return this.emotionalStateFor(slide.page.mood);
  });
  readonly tableOfContents = computed(() =>
    this.filteredPages().map(({ page, originalIndex }) => ({
      page,
      originalIndex,
      slideIndex: this.slides().findIndex((slide) => slide.id === page.id),
    })),
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

  private readonly keepCurrentSlideValid = effect(() => {
    const lastIndex = Math.max(0, this.slides().length - 1);
    if (this.currentSlideIndex() > lastIndex) this.currentSlideIndex.set(lastIndex);
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

  clearFilters(): void {
    this.selectedMood.set('all');
    this.selectedSessionId.set('all');
    this.selectedCharacterId.set('all');
    this.selectedSecrecy.set('all');
  }

  moodLabel(mood: CharacterNotebookMood): string {
    return this.uiText.text(`characterUi.notebook.moods.${mood}`);
  }

  private emotionalStateFor(mood: CharacterNotebookMood): NotebookEmotionalState {
    if (['joyful', 'hopeful', 'renewal'].includes(mood)) return 'luminous';
    if (mood === 'mysterious') return 'veiled';
    if (['wary', 'uneasy'].includes(mood)) return 'tense';
    if (['fractured', 'grief', 'guilt'].includes(mood)) return 'broken';
    return 'reflective';
  }

  secrecyLabel(secrecy: CharacterNotebookSecrecy): string {
    return this.uiText.text(`characterUi.notebook.secrecy.${secrecy}`);
  }

  sessionLabel(sessionId: string): string {
    const session = this.data.sessions().find((candidate) => candidate.id === sessionId);
    return session
      ? this.campaignLocale.resolve(session.title)
      : this.uiText.text('characterUi.notebook.sessionFallback', { id: sessionId });
  }

  characterLabel(characterId: string): string {
    return (
      this.data.characters().find((candidate) => candidate.id === characterId)?.name ?? characterId
    );
  }

  pageDate(page: CharacterNotebookPage): string {
    return page.recordedAt ?? this.uiText.text('characterUi.notebook.undated');
  }

  openLightbox(image: ImageRef): void {
    this.lightboxImage.set(image);
  }

  closeLightbox(): void {
    this.lightboxImage.set(null);
  }

  notebookText(value: CharacterNotebookText): string {
    if (typeof value === 'string') return value;
    return this.campaignLocale.resolve(value);
  }

  slideLabel(slide: NotebookSlide): string {
    if (slide.kind === 'cover') {
      if (slide.side === 'front') return this.uiText.text('characterUi.notebook.frontCover');
      return this.uiText.text('characterUi.notebook.backCover');
    }
    return this.uiText.text('characterUi.notebook.spread', {
      current: slide.spreadIndex + 1,
      total: this.notebook().pages.length,
    });
  }

  markerLabel(slide: NotebookSlide): string {
    return this.uiText.text('characterUi.notebook.goTo', { label: this.slideLabel(slide) });
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
