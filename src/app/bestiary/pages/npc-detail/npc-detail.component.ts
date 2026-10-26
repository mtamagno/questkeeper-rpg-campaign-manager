/**
 * NPC detail page — shows profile, gallery for non-player characters.
 * Simpler than PC pages: no password protection, no character sheet.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  effect,
  type Signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { DataService } from '@guild/services/data.service';
import { CampaignService } from '@guild/services/campaign.service';
import { LanguageService } from '@guild/services/language.service';
import { type Npc } from '@guild/models/npc.model';
import { localizeText } from '@guild/models/language.model';
import {
  PARTY_PERCEPTION_LABELS,
  RELATIONSHIP_TYPE_LABELS,
} from '@guild/models/relationship.model';
import { toDisplayUrl } from '@guild/services/imageUrl.service';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { ImageGalleryComponent } from '@guild/components/image-gallery/image-gallery.component';
import { AccordionComponent } from '@guild/components/accordion/accordion.component';

interface NpcRelationshipFeelingPreview {
  readonly label: string;
  readonly intensity: number;
  readonly reason: string;
}

interface NpcRelationshipPreview {
  readonly key: string;
  readonly otherId: string;
  readonly otherPath: 'party' | 'npcs';
  readonly otherName: string;
  readonly otherAvatarUrl: string;
  readonly otherIsNpc: boolean;
  readonly typeLabel: string;
  readonly description: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly sharedMemoryCount: number;
  readonly npcFeelings: ReadonlyArray<NpcRelationshipFeelingPreview>;
  readonly otherFeelings: ReadonlyArray<NpcRelationshipFeelingPreview>;
  readonly perception?: {
    readonly label: string;
    readonly basis: string;
  };
}

/**
 * Full NPC detail page.
 * Loads NPC by route param ID and displays profile + gallery.
 */
@Component({
  selector: 'app-npc-detail',
  standalone: true,
  imports: [
    BilingualTextPipe,
    LanguageToggleComponent,
    ImageGalleryComponent,
    AccordionComponent,
    RouterLink,
    DiceLoaderComponent,
  ],
  templateUrl: './npc-detail.component.html',
  styleUrl: './npc-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NpcDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly campaignService = inject(CampaignService);
  private readonly languageService = inject(LanguageService);

  /** Current display language for relationship labels and perspective copy. */
  readonly lang = this.languageService.currentLanguage;

  /** Active campaign ID for safe relationship and entity routes. */
  readonly campaignId: Signal<string | undefined> = this.campaignService.activeCampaignId;

  /** Five-step narrative intensity scale shared by relationship cards. */
  readonly feelingScale = [1, 2, 3, 4, 5] as const;

  /** NPC ID from route params. */
  private readonly npcId: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? undefined)),
  );

  /** The loaded NPC data. */
  readonly npc: Signal<Npc | undefined> = computed(() => {
    const id = this.npcId();
    if (id === undefined) {
      return undefined;
    }
    return this.dataService.getNpcById(id)();
  });

  /**
   * Public, party-perceived relationships involving this NPC.
   * The cards derive from canonical relationship records and skip unresolved
   * participants so private or unpublished entities cannot leak through labels.
   */
  readonly relationshipCards: Signal<ReadonlyArray<NpcRelationshipPreview>> = computed(() => {
    const npc = this.npc();
    if (npc === undefined) return [];

    const characters = new Map(
      this.dataService.characters().map((entry) => [
        entry.id,
        {
          name: entry.name,
          avatarUrl: entry.avatar.url,
          path: 'party' as const,
          isNpc: false,
        },
      ]),
    );
    const npcs = new Map(
      this.dataService.npcs().map((entry) => [
        entry.id,
        {
          name: entry.name,
          avatarUrl: entry.avatar.url,
          path: 'npcs' as const,
          isNpc: true,
        },
      ]),
    );
    const language = this.lang();

    return this.dataService
      .getRelationshipsForEntity(npc.id)()
      .flatMap((relationship): ReadonlyArray<NpcRelationshipPreview> => {
        const otherId =
          relationship.sourceId === npc.id ? relationship.targetId : relationship.sourceId;
        const other = characters.get(otherId) ?? npcs.get(otherId);
        if (other === undefined) return [];

        const feelingsFor = (entityId: string): ReadonlyArray<NpcRelationshipFeelingPreview> =>
          (relationship.perspectives ?? [])
            .find((perspective) => perspective.entityId === entityId)
            ?.feelings.map((feeling) => ({
              label: localizeText(feeling.label, language),
              intensity: this.normalizeFeelingIntensity(feeling.intensity),
              reason: localizeText(feeling.reason, language),
            })) ?? [];
        const perception = relationship.partyPerception;

        return [
          {
            key: `${relationship.sourceId}:${relationship.targetId}`,
            otherId,
            otherPath: other.path,
            otherName: other.name,
            otherAvatarUrl: toDisplayUrl(other.avatarUrl),
            otherIsNpc: other.isNpc,
            typeLabel: localizeText(RELATIONSHIP_TYPE_LABELS[relationship.type], language),
            description: localizeText(relationship.description, language),
            sourceId: relationship.sourceId,
            targetId: relationship.targetId,
            sharedMemoryCount: relationship.sharedEvents?.length ?? 0,
            npcFeelings: feelingsFor(npc.id),
            otherFeelings: feelingsFor(otherId),
            perception:
              perception === undefined
                ? undefined
                : {
                    label: localizeText(PARTY_PERCEPTION_LABELS[perception.certainty], language),
                    basis: localizeText(perception.basis, language),
                  },
          },
        ];
      });
  });

  /** Whether data is still loading. */
  readonly isLoading: Signal<boolean> = this.dataService.isLoading;

  /** Whether the profile image has finished loading. */
  readonly isProfileLoaded = signal(false);

  /** Whether the portrait image has finished loading. */
  readonly isPortraitLoaded = signal(false);

  /** Resets image loading state when the NPC changes. */
  private readonly resetLoadState = effect(() => {
    this.npc();
    this.isProfileLoaded.set(false);
    this.isPortraitLoaded.set(false);
  });

  /** Display-quality profile image URL (compressed for hero section). */
  readonly displayProfileUrl: Signal<string | undefined> = computed(() => {
    const npc = this.npc();
    return npc?.profileImageUrl !== undefined ? toDisplayUrl(npc.profileImageUrl) : undefined;
  });

  /** Display-quality portrait image URL (compressed for hero section). */
  readonly displayPortraitUrl: Signal<string | undefined> = computed(() => {
    const npc = this.npc();
    return npc?.portraitImageUrl !== undefined ? toDisplayUrl(npc.portraitImageUrl) : undefined;
  });

  /** Handles profile image load error — falls back to placeholder. */
  onProfileImageError(event: Event): void {
    const img = event.target;
    if (img instanceof HTMLImageElement) {
      img.src = 'assets/images/placeholders/placeholder-portrait.svg';
    }
  }

  /** Handles full-body portrait load error — hides the frame. */
  onPortraitImageError(event: Event): void {
    const img = event.target;
    if (img instanceof HTMLImageElement) {
      const frame = img.parentElement;
      if (frame) {
        frame.style.display = 'none';
      }
    }
  }

  /** Keeps authored feeling ratings inside the documented five-step scale. */
  normalizeFeelingIntensity(value: number): number {
    return Math.min(5, Math.max(1, Math.round(value)));
  }
}
