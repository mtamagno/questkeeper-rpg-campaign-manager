import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  type Quest,
  type QuestImportance,
  type QuestReference,
  type QuestState,
  orderedQuestUpdates,
  projectQuest,
} from '@guild/models/quest.model';
import { DataService } from '@guild/services/data.service';
import { CampaignService } from '@guild/services/campaign.service';
import { toDisplayUrl } from '@guild/services/imageUrl.service';
import { UiTextService } from '@guild/services/uiText.service';

@Component({
  selector: 'app-quest-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quest-list.component.html',
  styleUrl: './quest-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestListComponent {
  readonly quests = input.required<ReadonlyArray<Quest>>();
  readonly emptyTextKey = input('questLog.emptyDescription');
  readonly variant = input<'campaign' | 'personal'>('campaign');
  readonly uiText = inject(UiTextService);
  private readonly data = inject(DataService);
  private readonly campaigns = inject(CampaignService);

  readonly projections = computed(() =>
    this.quests().flatMap((quest) => {
      const projection = projectQuest(quest);
      return projection === undefined ? [] : [projection];
    }),
  );

  text(value: Readonly<Record<string, string | undefined>>): string {
    return this.uiText.localized(value);
  }

  stateLabel(state: QuestState): string {
    return this.uiText.text(`questLog.states.${state}`);
  }

  importanceLabel(importance: QuestImportance): string {
    return this.uiText.text(`questLog.importance.${importance}`);
  }

  displayImageUrl(url: string): string {
    return toDisplayUrl(url);
  }

  updates(quest: Quest) {
    return orderedQuestUpdates(quest);
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
}
