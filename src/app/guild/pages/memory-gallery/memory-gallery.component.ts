import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { type SharedRelationshipMemory } from '@guild/models/relationship.model';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { JourneyMemoryService } from '@guild/services/journeyMemory.service';
import { UiTextService } from '@guild/services/uiText.service';

@Component({
  selector: 'app-memory-gallery',
  standalone: true,
  imports: [RouterLink, BilingualTextPipe, LanguageToggleComponent],
  templateUrl: './memory-gallery.component.html',
  styleUrl: './memory-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryGalleryComponent {
  private readonly data = inject(DataService);
  private readonly campaign = inject(CampaignService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly journeyMemory = inject(JourneyMemoryService);
  readonly uiText = inject(UiTextService);

  readonly campaignId = this.campaign.activeCampaignId;
  readonly selectedParticipant = signal('all');
  readonly selectedSession = signal('all');
  readonly favouritesOnly = signal(false);

  readonly participants = computed(() => {
    const ids = new Set(this.data.sharedMemories().flatMap((memory) => memory.participantIds));
    return this.data.characters().filter((character) => ids.has(character.id));
  });

  readonly sessions = computed(() => {
    const ids = new Set(this.data.sharedMemories().map((memory) => memory.sessionId));
    return [...this.data.sortedSessions()].filter((session) => ids.has(session.id)).reverse();
  });

  readonly filteredMemories = computed(() => {
    const participant = this.selectedParticipant();
    const session = this.selectedSession();
    const sessionOrder = new Map(
      this.data.sortedSessions().map((item, index) => [item.id, index] as const),
    );
    return [...this.data.sharedMemories()]
      .filter((memory) => participant === 'all' || memory.participantIds.includes(participant))
      .filter((memory) => session === 'all' || memory.sessionId === session)
      .filter((memory) => !this.favouritesOnly() || this.isFavourite(memory))
      .sort(
        (left, right) =>
          (sessionOrder.get(right.sessionId) ?? -1) - (sessionOrder.get(left.sessionId) ?? -1),
      );
  });

  readonly favouriteCount = computed(() => {
    this.journeyMemory.favoritePages();
    return this.data.sharedMemories().filter((memory) => this.isFavourite(memory)).length;
  });

  readonly hasActiveFilters = computed(
    () =>
      this.selectedParticipant() !== 'all' ||
      this.selectedSession() !== 'all' ||
      this.favouritesOnly(),
  );

  memoryUrl(memory: SharedRelationshipMemory): string {
    return `/${this.campaignId() ?? ''}/memories/${memory.id}`;
  }

  isFavourite(memory: SharedRelationshipMemory): boolean {
    return this.journeyMemory.isFavoriteUrl(this.memoryUrl(memory));
  }

  toggleFavourite(memory: SharedRelationshipMemory): void {
    const campaignId = this.campaignId();
    if (campaignId === undefined) return;
    this.journeyMemory.toggleFavorite({
      campaignId,
      url: this.memoryUrl(memory),
      title: this.campaignLocale.resolve(memory.title),
      visitedAt: Date.now(),
    });
  }

  participantNames(memory: SharedRelationshipMemory): string {
    return memory.participantIds
      .flatMap((id) => {
        const character = this.data.getCharacterById(id)();
        return character ? [character.name] : [];
      })
      .join(' · ');
  }

  sessionLabel(sessionId: string): string {
    const session = this.data.sessions().find((item) => item.id === sessionId);
    return session
      ? this.uiText.text('memoryGallery.sessionLabel', {
          number: session.sessionNumber,
          title: this.campaignLocale.resolve(session.title),
        })
      : sessionId;
  }

  setParticipant(event: Event): void {
    this.selectedParticipant.set((event.target as HTMLSelectElement).value);
  }

  setSession(event: Event): void {
    this.selectedSession.set((event.target as HTMLSelectElement).value);
  }

  resetFilters(): void {
    this.selectedParticipant.set('all');
    this.selectedSession.set('all');
    this.favouritesOnly.set(false);
  }
}
