/** Task-oriented journal workspace for a character's notebook, gallery and session memories. */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  type CharacterNotebook,
  type DiaryEntry,
  type ImageRef,
} from '@guild/models/character.model';
import { CampaignService } from '@guild/services/campaign.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { CharacterReadingPositionService } from '@guild/services/characterReadingPosition.service';
import { UiTextService } from '@guild/services/uiText.service';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { ImageGalleryComponent } from '@guild/components/image-gallery/image-gallery.component';
import { CharacterNotebookComponent } from '../character-notebook/character-notebook.component';
import { SessionDiaryComponent } from '../session-diary/session-diary.component';

export type CharacterJournalWorkspace = 'index' | 'notebook' | 'gallery' | 'diary';

interface CharacterJournalDestination {
  readonly id: CharacterJournalWorkspace;
  readonly icon: string;
  readonly label: string;
  readonly description: string;
  readonly count?: number;
}

@Component({
  selector: 'app-character-journal',
  standalone: true,
  imports: [
    BilingualTextPipe,
    CharacterNotebookComponent,
    ImageGalleryComponent,
    SessionDiaryComponent,
  ],
  templateUrl: './character-journal.component.html',
  styleUrl: './character-journal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterJournalComponent {
  readonly uiText = inject(UiTextService);
  private readonly campaignService = inject(CampaignService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly readingPosition = inject(CharacterReadingPositionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routeFragment = toSignal(this.route.fragment, { initialValue: null });

  readonly characterId = input.required<string>();
  readonly characterName = input.required<string>();
  readonly notebook = input<CharacterNotebook>();
  readonly gallery = input.required<ReadonlyArray<ImageRef>>();
  readonly diary = input.required<ReadonlyArray<DiaryEntry>>();

  readonly activeWorkspace = signal<CharacterJournalWorkspace>('index');
  readonly visitedWorkspaces = signal<ReadonlySet<CharacterJournalWorkspace>>(new Set(['index']));

  readonly latestDiaryEntry: Signal<DiaryEntry | undefined> = computed(() => {
    const entries = this.diary();
    return entries.length > 0 ? entries[entries.length - 1] : undefined;
  });

  readonly hasNotebookReadingPosition = computed(() =>
    this.readingPosition.hasNotebookPosition(
      this.campaignService.activeCampaignId(),
      this.characterId(),
    ),
  );

  readonly destinations: Signal<ReadonlyArray<CharacterJournalDestination>> = computed(() => {
    const destinations: CharacterJournalDestination[] = [
      {
        id: 'index',
        icon: '✦',
        label: this.uiText.text('characterJournal.destinations.index.label'),
        description: this.uiText.text('characterJournal.destinations.index.description'),
      },
    ];

    const notebook = this.notebook();
    if (notebook !== undefined) {
      destinations.push({
        id: 'notebook',
        icon: '📓',
        label: this.uiText.text('characterJournal.destinations.notebook.label'),
        description: this.uiText.text('characterJournal.destinations.notebook.description'),
        count: notebook.pages.length,
      });
    }
    if (this.gallery().length > 0) {
      destinations.push({
        id: 'gallery',
        icon: '🖼️',
        label: this.uiText.text('characterJournal.destinations.gallery.label'),
        description: this.uiText.text('characterJournal.destinations.gallery.description'),
        count: this.gallery().length,
      });
    }
    if (this.diary().length > 0) {
      destinations.push({
        id: 'diary',
        icon: '📜',
        label: this.uiText.text('characterJournal.destinations.diary.label'),
        description: this.uiText.text('characterJournal.destinations.diary.description'),
        count: this.diary().length,
      });
    }
    return destinations;
  });

  private readonly syncFragment = effect(() => {
    const requested = this.workspaceForFragment(this.routeFragment());
    if (requested !== undefined && this.hasWorkspace(requested)) {
      this.activateWorkspace(requested);
    }
  });

  selectWorkspace(workspace: CharacterJournalWorkspace, focusTab = false): void {
    if (!this.hasWorkspace(workspace)) return;
    this.activateWorkspace(workspace);

    const fragment = workspace === 'index' ? 'character-journal' : workspace;
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { tab: 'journal' },
        queryParamsHandling: 'merge',
        fragment,
        replaceUrl: true,
      })
      .then(() => {
        if (!focusTab) return;
        document.getElementById(this.tabId(workspace))?.focus();
      });
  }

  onTabKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    const options = this.destinations();
    const currentIndex = Math.max(
      0,
      options.findIndex((destination) => destination.id === this.activeWorkspace()),
    );
    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + options.length) % options.length;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % options.length;
    this.selectWorkspace(options[nextIndex].id, true);
  }

  hasVisited(workspace: CharacterJournalWorkspace): boolean {
    return this.visitedWorkspaces().has(workspace);
  }

  tabId(workspace: CharacterJournalWorkspace): string {
    return `character-journal-tab-${workspace}-${this.characterId()}`;
  }

  panelId(workspace: CharacterJournalWorkspace): string {
    return `character-journal-panel-${workspace}-${this.characterId()}`;
  }

  diaryExcerpt(entry: DiaryEntry, maxLength = 170): string {
    const text = this.campaignLocale.resolve(entry.content).trim();
    if (text.length <= maxLength) return text;
    const boundary = text.lastIndexOf(' ', maxLength);
    return `${text.slice(0, boundary > maxLength / 2 ? boundary : maxLength).trim()}…`;
  }

  private activateWorkspace(workspace: CharacterJournalWorkspace): void {
    this.activeWorkspace.set(workspace);
    this.visitedWorkspaces.update((visited) => new Set([...visited, workspace]));
  }

  private hasWorkspace(workspace: CharacterJournalWorkspace): boolean {
    return this.destinations().some((destination) => destination.id === workspace);
  }

  private workspaceForFragment(fragment: string | null): CharacterJournalWorkspace | undefined {
    if (fragment === 'character-journal') return 'index';
    if (fragment === 'notebook' || fragment === 'gallery' || fragment === 'diary') return fragment;
    return undefined;
  }
}
