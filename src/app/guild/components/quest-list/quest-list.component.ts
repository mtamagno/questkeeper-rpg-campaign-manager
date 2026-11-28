import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  HostListener,
  type OnDestroy,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ACTIVE_QUEST_STATES,
  type Quest,
  type QuestImportance,
  type QuestProjection,
  type QuestReference,
  type QuestState,
  orderedQuestUpdates,
  projectQuest,
} from '@guild/models/quest.model';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { toDisplayUrl } from '@guild/services/imageUrl.service';
import { UiTextService } from '@guild/services/uiText.service';
import { activeElement, restoreFocus, trapTabKey } from '@guild/utils/focusTrap';

type QuestFilter = 'active' | 'archive' | 'all';

@Component({
  selector: 'app-quest-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quest-list.component.html',
  styleUrl: './quest-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestListComponent implements OnDestroy {
  readonly quests = input.required<ReadonlyArray<Quest>>();
  readonly emptyTextKey = input('questLog.emptyDescription');
  readonly variant = input<'campaign' | 'personal'>('campaign');
  readonly emptySelectionImage = input('images/quests/quest-log-empty-party.png');
  readonly uiText = inject(UiTextService);
  private readonly data = inject(DataService);
  private readonly campaigns = inject(CampaignService);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('questDialog');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private previouslyFocused: HTMLElement | null = null;
  private previousBodyOverflow = '';

  readonly filter = signal<QuestFilter>('active');
  readonly modalOpen = signal(false);
  readonly selectedQuestId = signal<string | undefined>(undefined);

  readonly projections = computed(() =>
    this.quests().flatMap((quest) => {
      const projection = projectQuest(quest);
      return projection === undefined ? [] : [projection];
    }),
  );

  readonly counts = computed(() => {
    const all = this.projections();
    const active = all.filter((projection) =>
      ACTIVE_QUEST_STATES.has(projection.current.state),
    ).length;
    return { active, archive: all.length - active, all: all.length };
  });

  readonly visibleProjections = computed(() =>
    this.projections().filter((projection) => {
      if (this.filter() === 'all') return true;
      const active = ACTIVE_QUEST_STATES.has(projection.current.state);
      return this.filter() === 'active' ? active : !active;
    }),
  );

  readonly selectedProjection = computed<QuestProjection | undefined>(() => {
    const selectedId = this.selectedQuestId();
    if (selectedId === undefined) return undefined;
    return this.visibleProjections().find((projection) => projection.quest.id === selectedId);
  });

  ngOnDestroy(): void {
    if (this.modalOpen()) this.releaseModal();
  }

  text(value: Readonly<Record<string, string | undefined>>): string {
    return this.uiText.localized(value);
  }

  stateLabel(state: QuestState): string {
    return this.uiText.text(`questLog.states.${state}`);
  }

  importanceLabel(importance: QuestImportance): string {
    return this.uiText.text(`questLog.importance.${importance}`);
  }

  readerTitle(): string {
    return this.uiText.text(
      this.variant() === 'personal' ? 'questLog.personalTitle' : 'questLog.title',
    );
  }

  displayImageUrl(url: string): string {
    return toDisplayUrl(url);
  }

  updates(quest: Quest) {
    return orderedQuestUpdates(quest);
  }

  setFilter(filter: QuestFilter): void {
    this.filter.set(filter);
    this.selectedQuestId.set(undefined);
  }

  openReader(): void {
    this.previouslyFocused = activeElement();
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.selectedQuestId.set(undefined);
    this.modalOpen.set(true);
    setTimeout(() => this.closeButton()?.nativeElement.focus());
  }

  closeReader(): void {
    if (!this.modalOpen()) return;
    this.modalOpen.set(false);
    this.selectedQuestId.set(undefined);
    this.releaseModal();
  }

  selectQuest(id: string): void {
    this.selectedQuestId.set(id);
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) this.closeReader();
  }

  ownerNames(ids: ReadonlyArray<string>): string {
    return ids
      .map((id) => this.data.characters().find((item) => item.id === id)?.name ?? id)
      .join(', ');
  }

  referenceLabel(reference: QuestReference): string {
    if (reference.kind === 'session') {
      const session = this.data.sessions().find((item) => item.id === reference.id);
      return session ? this.text(session.title) : reference.id;
    }
    if (reference.kind === 'character') {
      return this.data.characters().find((item) => item.id === reference.id)?.name ?? reference.id;
    }
    if (reference.kind === 'npc') {
      return this.data.npcs().find((item) => item.id === reference.id)?.name ?? reference.id;
    }
    const location = this.data.maps().find((item) => item.id === reference.id);
    return location ? this.text(location.name) : reference.id;
  }

  referenceRoute(reference: QuestReference): ReadonlyArray<string> {
    const campaignId = this.campaigns.activeCampaignId() ?? '';
    if (reference.kind === 'session') return ['/', campaignId, 'campaign', 'story', reference.id];
    if (reference.kind === 'character') return ['/', campaignId, 'party', reference.id];
    if (reference.kind === 'npc') return ['/', campaignId, 'npcs', reference.id];
    return ['/', campaignId, 'maps', reference.id];
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.modalOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeReader();
      return;
    }
    if (event.key === 'Tab') {
      const dialog = this.dialog()?.nativeElement;
      if (dialog) trapTabKey(dialog, event);
    }
  }

  private releaseModal(): void {
    document.body.style.overflow = this.previousBodyOverflow;
    restoreFocus(this.previouslyFocused);
    this.previouslyFocused = null;
  }
}
