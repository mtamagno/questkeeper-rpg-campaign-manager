/**
 * Fullscreen image lightbox component.
 * Displays a single image with prev/next navigation and keyboard support.
 */

import {
  Component,
  ChangeDetectionStrategy,
  effect,
  input,
  output,
  computed,
  signal,
  type Signal,
  HostListener,
  type AfterViewInit,
  type ElementRef,
  inject,
  type OnDestroy,
  viewChild,
} from '@angular/core';

import { type ImageRef } from '@guild/models/character.model';
import { LanguageService } from '@guild/services/language.service';
import { activeElement, restoreFocus, trapTabKey } from '@guild/utils/focusTrap';

/**
 * Fullscreen overlay lightbox for viewing images at full resolution.
 * Supports keyboard navigation (arrow keys, Escape) and prev/next buttons.
 *
 * @example
 * ```html
 * <app-image-lightbox
 *   [images]="gallery"
 *   [currentIndex]="selectedIdx"
 *   (indexChange)="onNavigate($event)"
 *   (lightboxClose)="onClose()" />
 * ```
 */
@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [],
  templateUrl: './image-lightbox.component.html',
  styleUrl: './image-lightbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageLightboxComponent implements AfterViewInit, OnDestroy {
  private readonly language = inject(LanguageService);
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('lightboxDialog');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly previouslyFocused = activeElement();
  private requestVersion = 0;
  readonly isItalian = this.language.isItalian;
  /** All images in the gallery. */
  readonly images = input.required<ReadonlyArray<ImageRef>>();

  /** Index of the currently displayed image. */
  readonly currentIndex = input.required<number>();

  /** Emitted when navigating to a different image. */
  readonly indexChange = output<number>();

  /** Emitted when the lightbox should close. */
  readonly lightboxClose = output<void>();

  /** The currently displayed image. */
  readonly currentImage: Signal<ImageRef | undefined> = computed(() => {
    const imgs = this.images();
    const idx = this.currentIndex();
    return imgs[idx];
  });

  readonly loadRequest = signal<{ readonly version: number; readonly image: ImageRef } | undefined>(
    undefined,
  );
  readonly loadState = signal<'loading' | 'loaded' | 'error'>('loading');

  private readonly watchSelection = effect(() => {
    const image = this.currentImage();
    if (image === undefined) {
      this.loadRequest.set(undefined);
      return;
    }
    this.requestVersion += 1;
    this.loadState.set('loading');
    this.loadRequest.set({ version: this.requestVersion, image });
  });

  readonly loadingMessage = computed(() => {
    const position = this.positionLabel();
    if (this.loadState() === 'loaded') {
      return this.isItalian() ? `Immagine ${position} caricata` : `Image ${position} loaded`;
    }
    if (this.loadState() === 'error') {
      return this.isItalian()
        ? `Impossibile caricare l'immagine ${position}`
        : `Could not load image ${position}`;
    }
    return this.isItalian() ? `Caricamento immagine ${position}` : `Loading image ${position}`;
  });

  /** Whether there is a previous image to navigate to. */
  readonly hasPrevious: Signal<boolean> = computed(() => this.currentIndex() > 0);

  /** Whether there is a next image to navigate to. */
  readonly hasNext: Signal<boolean> = computed(
    () => this.currentIndex() < this.images().length - 1,
  );

  /** Display string showing current position (e.g. "2 / 5"). */
  readonly positionLabel: Signal<string> = computed(
    () => `${this.currentIndex() + 1} / ${this.images().length}`,
  );

  ngAfterViewInit(): void {
    setTimeout((): void => this.closeButton().nativeElement.focus());
  }

  ngOnDestroy(): void {
    restoreFocus(this.previouslyFocused);
  }

  onImageLoad(version: number): void {
    if (this.loadRequest()?.version !== version) return;
    this.loadState.set('loaded');
  }

  onImageError(version: number): void {
    if (this.loadRequest()?.version !== version) return;
    this.loadState.set('error');
  }

  retryImage(): void {
    const image = this.currentImage();
    if (image === undefined) return;
    this.requestVersion += 1;
    this.loadState.set('loading');
    this.loadRequest.set({ version: this.requestVersion, image });
  }

  safeFileName(image: ImageRef): string {
    try {
      const path = new URL(image.url, window.location.href).pathname;
      return decodeURIComponent(path.split('/').filter(Boolean).at(-1) ?? 'image').slice(0, 80);
    } catch {
      return 'image';
    }
  }

  /** Navigates to the previous image. */
  goToPrevious(): void {
    if (this.hasPrevious()) {
      this.indexChange.emit(this.currentIndex() - 1);
    }
  }

  /** Navigates to the next image. */
  goToNext(): void {
    if (this.hasNext()) {
      this.indexChange.emit(this.currentIndex() + 1);
    }
  }

  /**
   * Handles backdrop clicks — closes lightbox when clicking outside the image.
   * @param event - The click DOM event.
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.lightboxClose.emit();
    }
  }

  /**
   * Keyboard navigation handler.
   * @param event - The keyboard event.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      trapTabKey(this.dialog().nativeElement, event);
      return;
    }
    switch (event.key) {
      case 'Escape':
        this.lightboxClose.emit();
        break;
      case 'ArrowLeft':
        this.goToPrevious();
        break;
      case 'ArrowRight':
        this.goToNext();
        break;
    }
  }
}
