/**
 * Individual diary entry component — shows a single session diary record.
 */

import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { type DiaryEntry } from '@guild/models/character.model';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { UiTextService } from '@guild/services/uiText.service';

interface DiaryReference {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly route: string[];
}

/**
 * Renders a single diary entry with date, title, and content.
 * Used as a child of SessionDiaryComponent.
 */
@Component({
  selector: 'app-diary-entry',
  standalone: true,
  imports: [BilingualTextPipe, RouterLink],
  templateUrl: './diary-entry.component.html',
  styleUrl: './diary-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaryEntryComponent {
  private readonly campaign = inject(CampaignService);
  private readonly data = inject(DataService);
  readonly uiText = inject(UiTextService);

  /** The diary entry data to display. */
  readonly entry = input.required<DiaryEntry>();

  references(): ReadonlyArray<DiaryReference> {
    const campaignId = this.campaign.activeCampaignId();
    if (!campaignId) return [];
    const entry = this.entry();
    const references: DiaryReference[] = [];
    const session = this.data.sessions().find((candidate) => candidate.id === entry.sessionId);
    if (session) {
      references.push({
        id: `session:${session.id}`,
        icon: '📖',
        label: this.uiText.localized(session.title),
        route: ['/', campaignId, 'campaign', 'story', session.id],
      });
    }
    for (const id of entry.relatedCharacterIds ?? []) {
      const character = this.data.characters().find((candidate) => candidate.id === id);
      if (character) {
        references.push({
          id: `character:${id}`,
          icon: '⚔️',
          label: character.name,
          route: ['/', campaignId, 'party', id],
        });
      }
    }
    for (const id of entry.relatedNpcIds ?? []) {
      const npc = this.data.npcs().find((candidate) => candidate.id === id);
      if (npc) {
        references.push({
          id: `npc:${id}`,
          icon: '🧙',
          label: npc.name,
          route: ['/', campaignId, 'npcs', id],
        });
      }
    }
    for (const id of entry.relatedMapIds ?? []) {
      const map = this.data.maps().find((candidate) => candidate.id === id);
      if (map) {
        references.push({
          id: `map:${id}`,
          icon: '🗺️',
          label: this.uiText.localized(map.name),
          route: ['/', campaignId, 'maps', id],
        });
      }
    }
    return references;
  }
}
