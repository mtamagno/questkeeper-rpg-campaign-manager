/**
 * Character detail page — shows public profile, private profile,
 * character sheet, gallery, and session diary for a player character.
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
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { DataService } from '@guild/services/data.service';
import { CampaignService } from '@guild/services/campaign.service';
import {
  DEFAULT_CHARACTER_PASSWORD,
  type Character,
  type CharacterStoryReference,
} from '@guild/models/character.model';
import { localizeText, type BilingualText } from '@guild/models/language.model';
import { RELATIONSHIP_TYPE_LABELS } from '@guild/models/relationship.model';
import { toDisplayUrl } from '@guild/services/imageUrl.service';
import { LanguageService } from '@guild/services/language.service';
import { CharacterReadingPositionService } from '@guild/services/characterReadingPosition.service';
import { BilingualTextPipe } from '@guild/components/bilingual-text/bilingual-text.pipe';
import { LanguageToggleComponent } from '@guild/components/language-toggle/language-toggle.component';
import { DiceLoaderComponent } from '@guild/components/dice-loader/dice-loader.component';
import { ImageGalleryComponent } from '@guild/components/image-gallery/image-gallery.component';
import { AccordionComponent } from '@guild/components/accordion/accordion.component';
import { PrivateProfileComponent } from '../../components/private-profile/private-profile.component';
import { CharacterSheetComponent } from '../../components/character-sheet/character-sheet.component';
import { SessionDiaryComponent } from '../../components/session-diary/session-diary.component';
import { CharacterLoreChaptersComponent } from '../../components/character-lore-chapters/character-lore-chapters.component';
import { CharacterNotebookComponent } from '../../components/character-notebook/character-notebook.component';

interface ProfileBondPreview {
  readonly key: string;
  readonly entityId: string;
  readonly entityPath: 'party' | 'npcs';
  readonly name: string;
  readonly avatarUrl: string;
  readonly typeLabel: string;
  readonly description: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly sharedMemoryCount: number;
  readonly feelings: ReadonlyArray<ProfileBondFeeling>;
}

interface ProfileBondFeeling {
  readonly label: string;
  readonly intensity: number;
  readonly reason: string;
}

type CharacterDetailTabId = 'overview' | 'story' | 'sheet' | 'journal';

interface CharacterDetailTab {
  readonly id: CharacterDetailTabId;
  readonly icon: string;
  readonly label: string;
  readonly description: string;
}

/**
 * Full character detail page.
 * Loads character by route param ID and displays all sections.
 */
@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [
    BilingualTextPipe,
    LanguageToggleComponent,
    ImageGalleryComponent,
    AccordionComponent,
    PrivateProfileComponent,
    CharacterSheetComponent,
    SessionDiaryComponent,
    CharacterLoreChaptersComponent,
    CharacterNotebookComponent,
    RouterLink,
    DiceLoaderComponent,
  ],
  templateUrl: './character-detail.component.html',
  styleUrl: './character-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(DataService);
  private readonly campaignService = inject(CampaignService);
  private readonly languageService = inject(LanguageService);
  private readonly document = inject(DOCUMENT);
  private readonly readingPosition = inject(CharacterReadingPositionService);

  /** Current display language for page chrome and section labels. */
  readonly lang = this.languageService.currentLanguage;

  /** Password used until a character defines a personal one in campaign data. */
  readonly defaultCharacterPassword = DEFAULT_CHARACTER_PASSWORD;

  /** Active campaign ID for building route links. */
  readonly campaignId: Signal<string | undefined> = this.campaignService.activeCampaignId;

  hasSheetReadingPosition(characterId: string): boolean {
    return this.readingPosition.hasSheetPosition(this.campaignId(), characterId);
  }

  hasNotebookReadingPosition(characterId: string): boolean {
    return this.readingPosition.hasNotebookPosition(this.campaignId(), characterId);
  }

  /** Character ID from route params. */
  private readonly characterId: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? undefined)),
  );

  /** Shareable view selected from the URL without turning preferences into page actions. */
  private readonly requestedTab: Signal<string | undefined> = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('tab') ?? undefined)),
  );

  /** Existing story links keep working and open the tab that owns their landmark. */
  private readonly activeFragment: Signal<string | null | undefined> = toSignal(
    this.route.fragment,
  );

  /** Stable task-oriented areas keep the complete profile readable without one endless page. */
  readonly tabs: Signal<ReadonlyArray<CharacterDetailTab>> = computed(() => {
    const italian = this.lang() === 'it';
    return [
      {
        id: 'overview',
        icon: '✦',
        label: italian ? 'Profilo' : 'Profile',
        description: italian
          ? 'Identità, tratti e dettagli essenziali a colpo d’occhio.'
          : 'Identity, traits and essential details at a glance.',
      },
      {
        id: 'story',
        icon: '📖',
        label: italian ? 'Storia e legami' : 'Story & bonds',
        description: italian
          ? 'Capitoli personali, relazioni, citazioni e ciò che il gruppo conosce.'
          : 'Personal chapters, relationships, quotes and what the party knows.',
      },
      {
        id: 'sheet',
        icon: '⚔',
        label: italian ? 'Scheda' : 'Sheet',
        description: italian
          ? 'Statistiche, risorse, inventario, regole, livelli e download PDF.'
          : 'Stats, resources, inventory, rules, levels and PDF download.',
      },
      {
        id: 'journal',
        icon: '🖋',
        label: italian ? 'Diario' : 'Journal',
        description: italian
          ? 'Taccuino, immagini e memoria delle sessioni.'
          : 'Notebook, images and session memories.',
      },
    ];
  });

  readonly activeTab: Signal<CharacterDetailTabId> = computed(
    () =>
      this.tabForFragment(this.activeFragment()) ??
      this.normalizeTab(this.requestedTab()) ??
      'overview',
  );

  readonly activeTabDescription = computed(
    () => this.tabs().find((tab) => tab.id === this.activeTab())?.description ?? '',
  );

  /** Reveals legacy landmarks only after their owning tab has become visible. */
  private readonly revealActiveFragment = effect(() => {
    const fragment = this.activeFragment();
    this.activeTab();
    if (!fragment) return;

    this.document.defaultView?.requestAnimationFrame(() => {
      this.document.getElementById(fragment)?.scrollIntoView({ block: 'start' });
    });
  });

  /** The loaded character data. */
  readonly character: Signal<Character | undefined> = computed(() => {
    const id = this.characterId();
    if (id === undefined) {
      return undefined;
    }
    return this.dataService.getCharacterById(id)();
  });

  /** Whether data is still loading. */
  readonly isLoading: Signal<boolean> = this.dataService.isLoading;

  /** Whether the profile image has finished loading. */
  readonly isProfileLoaded = signal(false);

  /** Whether the portrait image has finished loading. */
  readonly isPortraitLoaded = signal(false);

  /** Resets image loading state when the character changes. */
  private readonly resetLoadState = effect(() => {
    this.character();
    this.isProfileLoaded.set(false);
    this.isPortraitLoaded.set(false);
  });

  /** Display-quality profile image URL (compressed for hero section). */
  readonly displayProfileUrl: Signal<string | undefined> = computed(() => {
    const char = this.character();
    return char?.profileImageUrl !== undefined ? toDisplayUrl(char.profileImageUrl) : undefined;
  });

  /** Display-quality portrait image URL (compressed for hero section). */
  readonly displayPortraitUrl: Signal<string | undefined> = computed(() => {
    const char = this.character();
    return char?.portraitImageUrl !== undefined ? toDisplayUrl(char.portraitImageUrl) : undefined;
  });

  /** Whether the sheet contains real playable values rather than placeholders. */
  readonly isCharacterReady: Signal<boolean> = computed(() => {
    const char = this.character();
    return (
      char !== undefined &&
      char.sheet.level > 0 &&
      char.sheet.maxHitPoints > 0 &&
      char.sheet.armorClass > 0
    );
  });

  /** Avoids rendering the same generic placeholder twice in the hero. */
  readonly hasDistinctPortrait: Signal<boolean> = computed(() => {
    const char = this.character();
    if (char === undefined) {
      return false;
    }
    return (
      Boolean(char.portraitImageUrl) &&
      char.portraitImageUrl !== char.profileImageUrl &&
      !char.portraitImageUrl.includes('placeholder-portrait')
    );
  });

  /** Public relationships involving this character, resolved to the other person. */
  readonly profileBonds: Signal<ReadonlyArray<ProfileBondPreview>> = computed(() => {
    const character = this.character();
    if (character === undefined) return [];

    const characters = new Map(
      this.dataService
        .characters()
        .map((entry) => [
          entry.id,
          { name: entry.name, avatarUrl: entry.avatar.url, entityPath: 'party' as const },
        ]),
    );
    const npcs = new Map(
      this.dataService
        .npcs()
        .map((entry) => [
          entry.id,
          { name: entry.name, avatarUrl: entry.avatar.url, entityPath: 'npcs' as const },
        ]),
    );
    const relationships = [
      ...this.dataService.partyRelationships(),
      ...this.dataService.npcRelationships(),
    ].filter(
      (relationship) =>
        relationship.sourceId === character.id || relationship.targetId === character.id,
    );
    const language = this.lang();
    const previews: ProfileBondPreview[] = [];

    for (const relationship of relationships) {
      const entityId =
        relationship.sourceId === character.id ? relationship.targetId : relationship.sourceId;
      const entity = characters.get(entityId) ?? npcs.get(entityId);
      if (entity === undefined) continue;
      previews.push({
        key: `${relationship.sourceId}:${relationship.targetId}`,
        entityId,
        entityPath: entity.entityPath,
        name: entity.name,
        avatarUrl: toDisplayUrl(entity.avatarUrl),
        typeLabel: localizeText(RELATIONSHIP_TYPE_LABELS[relationship.type], language),
        description: localizeText(relationship.description, language),
        sourceId: relationship.sourceId,
        targetId: relationship.targetId,
        sharedMemoryCount: relationship.sharedEvents?.length ?? 0,
        feelings:
          (relationship.perspectives ?? [])
            .find((perspective) => perspective.entityId === character.id)
            ?.feelings.map((feeling) => ({
              label: localizeText(feeling.label, language),
              intensity: this.normalizeFeelingIntensity(feeling.intensity),
              reason: localizeText(feeling.reason, language),
            })) ?? [],
      });
    }

    return previews;
  });

  /** Most recent public diary entry, used as the profile's current memory. */
  readonly latestDiaryEntry = computed(() => {
    const diary = this.character()?.diary ?? [];
    return diary.length > 0 ? diary[diary.length - 1] : undefined;
  });

  /** Detects the shared bilingual placeholders used by not-yet-authored profiles. */
  isRecorded(value: BilingualText): boolean {
    const normalized = `${value.en} ${value.it}`.toLowerCase();
    return !normalized.includes('not yet recorded') && !normalized.includes('non ancora registrat');
  }

  /** Whether the compact public summary contains at least one authored field. */
  hasAtAGlanceProfile(character: Character): boolean {
    return (
      this.isRecorded(character.publicProfile.traits) ||
      this.isRecorded(character.publicProfile.ideals) ||
      this.isRecorded(character.publicProfile.bonds) ||
      this.isRecorded(character.publicProfile.flaws) ||
      (character.publicProfile.hobbies !== undefined &&
        this.isRecorded(character.publicProfile.hobbies))
    );
  }

  /** Returns a compact, word-safe preview while preserving the full source elsewhere. */
  profileExcerpt(value: BilingualText, maxLength = 210): string {
    const text = localizeText(value, this.lang()).trim();
    if (text.length <= maxLength) return text;
    const boundary = text.lastIndexOf(' ', maxLength);
    return `${text.slice(0, boundary > maxLength / 2 ? boundary : maxLength).trim()}…`;
  }

  /** Keeps story-source routing derived and safe instead of accepting arbitrary authored URLs. */
  storySourceRoute(source: CharacterStoryReference): ReadonlyArray<string> {
    if (source.kind === 'chronicle') {
      return source.id
        ? ['/', this.campaignId() ?? '', 'campaign', 'story', source.id]
        : ['/', this.campaignId() ?? '', 'campaign'];
    }
    return [];
  }

  /** Maps a public story source to its existing in-profile landmark. */
  storySourceFragment(source: CharacterStoryReference): string | undefined {
    const fragments: Partial<Record<CharacterStoryReference['kind'], string>> = {
      chapter: 'personal-chapters',
      notebook: 'notebook',
      diary: 'diary',
      quote: 'quotes',
    };
    return fragments[source.kind];
  }

  /** Moves the relationship rail by one readable viewport while keeping native scrolling. */
  scrollBondCarousel(direction: -1 | 1): void {
    const carousel = this.document.getElementById('profile-bond-track');
    if (carousel === null) return;
    const firstCard = carousel.querySelector<HTMLElement>('.character-detail__bond-card');
    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
    const step =
      firstCard === null ? Math.max(carousel.clientWidth * 0.82, 280) : firstCard.offsetWidth + gap;
    const maxScroll = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
    // Assigning scrollLeft is deliberately deterministic here. Smooth scrolling
    // combined with scroll snapping can be cancelled on narrow touch viewports,
    // leaving the carousel apparently unresponsive.
    carousel.scrollLeft = Math.min(maxScroll, Math.max(0, carousel.scrollLeft + direction * step));
  }

  /** Keeps author-provided feeling ratings inside the documented five-step scale. */
  normalizeFeelingIntensity(value: number): number {
    return Math.min(5, Math.max(1, Math.round(value)));
  }

  /** Five stable steps used by the accessible feeling-strength meter. */
  readonly feelingScale = [1, 2, 3, 4, 5] as const;

  /** Formats a canonical centimetre value as metres in the selected language. */
  formatHeight(heightCm: number): string {
    const metres = (heightCm / 100).toFixed(2);
    return `${this.lang() === 'it' ? metres.replace('.', ',') : metres} m`;
  }

  isTab(tab: CharacterDetailTabId): boolean {
    return this.activeTab() === tab;
  }

  /** Updates the shareable page state while clearing landmarks owned by another tab. */
  selectTab(tab: CharacterDetailTabId, focusTab = false): void {
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { tab },
        queryParamsHandling: 'merge',
        fragment: undefined,
        replaceUrl: true,
      })
      .then(() => {
        if (!focusTab) return;
        this.document.getElementById(`character-tab-${tab}`)?.focus();
      });
  }

  /** Mirrors familiar RPG settings tabs for keyboard and switch-style navigation. */
  onTabKeydown(event: KeyboardEvent): void {
    const supportedKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!supportedKeys.includes(event.key)) return;

    event.preventDefault();
    const tabs = this.tabs();
    const currentIndex = Math.max(
      0,
      tabs.findIndex((tab) => tab.id === this.activeTab()),
    );
    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    this.selectTab(tabs[nextIndex].id, true);
  }

  private normalizeTab(value: string | undefined): CharacterDetailTabId | undefined {
    return value === 'overview' || value === 'story' || value === 'sheet' || value === 'journal'
      ? value
      : undefined;
  }

  private tabForFragment(fragment: string | null | undefined): CharacterDetailTabId | undefined {
    if (fragment === 'profile-overview' || fragment === 'profile-highlights') return 'overview';
    if (
      fragment === 'personal-chapters' ||
      fragment === 'profile-bonds' ||
      fragment === 'quotes' ||
      fragment === 'profile-memories'
    ) {
      return 'story';
    }
    if (fragment === 'private-profile' || fragment === 'character-sheet') return 'sheet';
    if (fragment === 'notebook' || fragment === 'gallery' || fragment === 'diary') return 'journal';
    return undefined;
  }

  /** Handles square profile image load errors. */
  onProfileImageError(event: Event): void {
    const img = event.target;
    if (img instanceof HTMLImageElement) {
      img.src = 'assets/images/placeholders/placeholder-portrait.svg';
    }
  }

  /** Handles 2:3 full-body portrait load errors. */
  onPortraitImageError(event: Event): void {
    const img = event.target;
    if (img instanceof HTMLImageElement) {
      img.src = 'assets/images/placeholders/placeholder-portrait.svg';
    }
  }
}
