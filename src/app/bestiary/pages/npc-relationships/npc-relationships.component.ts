/**
 * NPC relationships page — a reader-controlled view of NPC-to-party relationships.
 * The canonical relationship data stays untouched while each campaign remembers
 * which NPCs the reader wants to include in the graph.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  type Signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { CampaignService } from '@guild/services/campaign.service';
import { DataService } from '@guild/services/data.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { NpcGraphPreferencesService } from '@guild/services/npcGraphPreferences.service';
import { UiTextService } from '@guild/services/uiText.service';
import { type Npc } from '@guild/models/npc.model';
import {
  type Relationship,
  type RelationshipNode,
  NODE_TYPES,
} from '@guild/models/relationship.model';
import { getNpcDisplayName } from '@guild/utils/npcDisplay';
import { RelationshipGraphComponent } from '@guild/components/relationship-graph/relationship-graph.component';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { latestNpcIds } from '@bestiary/utils/npcGraphVisibility';

interface NpcPickerItem {
  readonly id: string;
  readonly name: string;
  readonly selected: boolean;
  readonly recent: boolean;
}

interface NpcPickerGroup {
  readonly location: string;
  readonly items: ReadonlyArray<NpcPickerItem>;
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

@Component({
  selector: 'app-npc-relationships',
  standalone: true,
  imports: [RelationshipGraphComponent, LanguageToggleComponent, DiceLoaderComponent],
  templateUrl: './npc-relationships.component.html',
  styleUrl: './npc-relationships.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NpcRelationshipsComponent {
  private readonly dataService = inject(DataService);
  private readonly campaignService = inject(CampaignService);
  private readonly router = inject(Router);
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly graphPreferences = inject(NpcGraphPreferencesService);
  readonly uiText = inject(UiTextService);

  readonly isLoading: Signal<boolean> = this.dataService.isLoading;
  readonly relationships = this.dataService.npcRelationships;
  readonly npcQuery = signal('');

  /** All non-minor NPCs known to the campaign and eligible for this map. */
  readonly availableNpcs = computed(() => this.dataService.npcs().filter((npc) => !npc.isMinor));

  /** Live default derived from the latest authored relationship evidence. */
  readonly recentNpcIds = computed(() =>
    latestNpcIds(this.availableNpcs(), this.relationships(), this.dataService.sessions()),
  );

  /** A custom view is campaign-scoped; without one, follow the latest two NPCs. */
  readonly selectedNpcIds = computed<ReadonlySet<string>>(() => {
    const availableIds = new Set(this.availableNpcs().map((npc) => npc.id));
    const remembered = this.graphPreferences.selectionFor(this.campaignService.activeCampaignId());
    return new Set((remembered ?? this.recentNpcIds()).filter((id) => availableIds.has(id)));
  });

  /** Only edges whose two endpoints are currently visible reach either graph view. */
  readonly visibleRelationships = computed(() => {
    const visibleIds = new Set([
      ...this.dataService.characters().map((character) => character.id),
      ...this.selectedNpcIds(),
    ]);
    return this.relationships().filter(
      (relationship) =>
        visibleIds.has(relationship.sourceId) && visibleIds.has(relationship.targetId),
    );
  });

  /** Searchable NPC choices grouped by their localized known location. */
  readonly npcGroups = computed<ReadonlyArray<NpcPickerGroup>>(() => {
    const query = normalizeSearchValue(this.npcQuery());
    const selectedIds = this.selectedNpcIds();
    const recentIds = new Set(this.recentNpcIds());
    const groups = new Map<string, NpcPickerItem[]>();

    for (const npc of this.availableNpcs()) {
      const name = this.npcName(npc);
      const location =
        this.campaignLocale.resolve(npc.profile.location) || this.uiText.text('common.other');
      if (query.length > 0 && !normalizeSearchValue(`${name} ${location}`).includes(query)) {
        continue;
      }
      const items = groups.get(location) ?? [];
      items.push({
        id: npc.id,
        name,
        selected: selectedIds.has(npc.id),
        recent: recentIds.has(npc.id),
      });
      groups.set(location, items);
    }

    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([location, items]) => ({
        location,
        items: items.sort((left, right) => left.name.localeCompare(right.name)),
      }));
  });

  /** The party is always present; selected NPCs are added around it. */
  readonly nodes: Signal<ReadonlyArray<RelationshipNode>> = computed(() => {
    const pcNodes: ReadonlyArray<RelationshipNode> = this.dataService
      .characters()
      .map((character): RelationshipNode => ({
        id: character.id,
        name: character.name,
        avatarUrl: character.profileImageUrl,
        nodeType: NODE_TYPES.PC,
      }));

    const npcNodes: ReadonlyArray<RelationshipNode> = this.dataService
      .npcs()
      .filter((npc) => this.selectedNpcIds().has(npc.id))
      .map((npc): RelationshipNode => ({
        id: npc.id,
        name: this.npcName(npc),
        avatarUrl: npc.profileImageUrl ?? npc.avatar.url,
        nodeType: NODE_TYPES.NPC,
      }));

    return [...pcNodes, ...npcNodes];
  });

  updateNpcQuery(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) this.npcQuery.set(target.value);
  }

  clearNpcQuery(): void {
    this.npcQuery.set('');
  }

  toggleNpc(npcId: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const next = new Set(this.selectedNpcIds());
    if (target.checked) next.add(npcId);
    else next.delete(npcId);
    this.graphPreferences.remember(this.campaignService.activeCampaignId(), [...next]);
  }

  showAllNpcs(): void {
    this.graphPreferences.remember(
      this.campaignService.activeCampaignId(),
      this.availableNpcs().map((npc) => npc.id),
    );
  }

  hideAllNpcs(): void {
    this.graphPreferences.remember(this.campaignService.activeCampaignId(), []);
  }

  followLatestNpcs(): void {
    this.graphPreferences.followLatest(this.campaignService.activeCampaignId());
  }

  navigateToRelationship(relationship: Relationship): void {
    void this.router.navigate([
      '/',
      this.campaignService.activeCampaignId(),
      'relationships',
      relationship.sourceId,
      relationship.targetId,
    ]);
  }

  navigateToCharacter(node: RelationshipNode): void {
    const basePath = node.nodeType === NODE_TYPES.PC ? 'party' : 'npcs';
    void this.router.navigate(['/', this.campaignService.activeCampaignId(), basePath, node.id]);
  }

  private npcName(npc: Npc): string {
    return getNpcDisplayName(
      npc,
      this.campaignLocale.currentLocale(),
      this.campaignLocale.registry(),
    );
  }
}
