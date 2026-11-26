import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  signal,
  type ElementRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';

import { CampaignService } from '@guild/services/campaign.service';
import { CampaignLocaleService } from '@guild/services/campaignLocale.service';
import { AudiencePreferenceService } from '@guild/services/audiencePreference.service';
import { UiTextService } from '@guild/services/uiText.service';
import { GuidedTourService } from '@guild/services/guidedTour.service';
import { PwaInstallService } from '@guild/services/pwaInstall.service';
import { JourneyMemoryService, type JourneyPage } from '@guild/services/journeyMemory.service';
import { activeElement, restoreFocus, trapTabKey } from '@guild/utils/focusTrap';
import { MyCharacterService } from '@guild/services/myCharacter.service';
import { LocalManagerBridgeService } from '@guild/services/localManagerBridge.service';

interface NavigationCommand {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly detail: string;
  readonly url: string;
  readonly keywords: string;
  readonly scope: 'current' | 'campaign' | 'global' | 'memory';
}

interface BreadcrumbItem {
  readonly label: string;
  readonly url: string;
}

const ROUTE_LABEL_KEYS: Readonly<Record<string, string>> = {
  party: 'party',
  offline: 'offline',
  relationships: 'relationships',
  npcs: 'npcs',
  campaign: 'campaign',
  quests: 'quests',
  'story-so-far': 'storySoFar',
  'table-moments': 'tableMoments',
  story: 'story',
  maps: 'maps',
  gallery: 'gallery',
  settings: 'settings',
};

function humanizeSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter): string => letter.toUpperCase());
}

/** Persistent wayfinding and keyboard-first navigation for the entire site. */
@Component({
  selector: 'app-site-command-bar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-command-bar.component.html',
  styleUrl: './site-command-bar.component.scss',
  host: { '[class.command-palette-open]': 'isOpen()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteCommandBarComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly campaigns = inject(CampaignService);
  private readonly campaignLocale = inject(CampaignLocaleService);
  private readonly audiencePreference = inject(AudiencePreferenceService);
  readonly uiText = inject(UiTextService);
  private readonly guidedTour = inject(GuidedTourService);
  private readonly pwaInstall = inject(PwaInstallService);
  private readonly journeyMemory = inject(JourneyMemoryService);
  private readonly myCharacterService = inject(MyCharacterService);
  private readonly localManager = inject(LocalManagerBridgeService);
  private readonly currentUrl = signal(this.router.url);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly paletteDialog = viewChild<ElementRef<HTMLElement>>('paletteDialog');
  private readonly actionsShell = viewChild<ElementRef<HTMLElement>>('actionsShell');
  private readonly actionsToggle = viewChild<ElementRef<HTMLButtonElement>>('actionsToggle');
  private previouslyFocused: HTMLElement | null = null;

  readonly isOpen = signal(false);
  readonly isActionsOpen = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly activeCampaignId = this.campaigns.activeCampaignId;
  readonly tourStatus = this.guidedTour.status;
  readonly canInstall = this.pwaInstall.canInstall;
  readonly continuePage = this.journeyMemory.continuePage;
  readonly canRememberCurrent = this.journeyMemory.canRememberCurrent;
  readonly isCurrentFavorite = this.journeyMemory.isCurrentFavorite;
  readonly myCharacter = this.myCharacterService.character;
  readonly myCharacterRoute = this.myCharacterService.route;
  readonly managerUrl = this.localManager.managerUrl;

  readonly tourActionLabel = computed((): string => {
    if (this.audiencePreference.audience() === null) {
      return this.uiText.text('commandBar.tour.choose');
    }
    if (this.tourStatus() === 'active') {
      return this.uiText.text('commandBar.tour.activeAction');
    }
    if (this.tourStatus() === 'paused') {
      return this.uiText.text('commandBar.tour.resumeAction');
    }
    if (this.tourStatus() === 'completed') {
      return this.uiText.text('commandBar.tour.restartAction');
    }
    return this.uiText.text('commandBar.tour.openAction');
  });

  readonly tourButtonLabel = computed((): string => {
    if (this.tourStatus() === 'active') {
      return this.uiText.text('commandBar.tour.active');
    }
    if (this.tourStatus() === 'paused') {
      return this.uiText.text('commandBar.tour.resume');
    }
    if (this.tourStatus() === 'completed') {
      return this.uiText.text('commandBar.tour.restart');
    }
    return this.uiText.text('commandBar.tour.default');
  });

  readonly activeCampaignName = computed((): string | undefined => {
    const campaignId = this.activeCampaignId();
    const campaign = this.campaigns.manifest().find(({ id }) => id === campaignId);
    return campaign === undefined
      ? undefined
      : this.campaignLocale.resolveForCampaign(campaign, campaign.name);
  });

  readonly breadcrumbs = computed((): ReadonlyArray<BreadcrumbItem> => {
    const cleanUrl = this.currentUrl().split(/[?#]/)[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const items: Array<BreadcrumbItem> = [
      { label: this.uiText.text('commandBar.campaigns'), url: '/' },
    ];
    let path = '';

    segments.forEach((segment, index): void => {
      path += `/${segment}`;
      const campaign =
        index === 0 ? this.campaigns.manifest().find(({ id }) => id === segment) : undefined;
      const mapped = ROUTE_LABEL_KEYS[segment];
      items.push({
        label:
          (campaign === undefined
            ? undefined
            : this.campaignLocale.resolveForCampaign(campaign, campaign.name)) ||
          (mapped === undefined
            ? undefined
            : this.uiText.text(`commandBar.routeLabels.${mapped}`)) ||
          humanizeSegment(segment),
        url: path,
      });
    });
    return items;
  });

  readonly commands = computed((): ReadonlyArray<NavigationCommand> => {
    const activeId = this.activeCampaignId();
    const activeName = this.activeCampaignName();
    const commandCopy = (name: string, field: 'title' | 'detail'): string =>
      this.uiText.text(`commandBar.commands.${name}.${field}`);
    const global: Array<NavigationCommand> = [
      {
        id: 'global-settings',
        icon: '\u2699',
        title: commandCopy('settings', 'title'),
        detail: commandCopy('settings', 'detail'),
        url: activeId === undefined ? '/settings' : `/${activeId}/settings`,
        keywords: 'settings impostazioni preferences preferenze audio character personaggio',
        scope: 'global',
      },
      {
        id: 'global-campaigns',
        icon: '\u2302',
        title: commandCopy('campaigns', 'title'),
        detail: commandCopy('campaigns', 'detail'),
        url: '/',
        keywords: 'home campaigns campagne registro',
        scope: 'global',
      },
    ];
    const campaignEntries = this.campaigns.manifest().map((campaign): NavigationCommand => ({
      id: `campaign-${campaign.id}`,
      icon: '\u2691',
      title: this.campaignLocale.resolveForCampaign(campaign, campaign.name),
      detail:
        this.campaignLocale.resolveForCampaign(campaign, campaign.status) ||
        this.uiText.text('commandBar.commands.campaignFallback'),
      url: `/${campaign.id}`,
      keywords: `${campaign.id} ${Object.values(campaign.description).join(' ')}`,
      scope: 'campaign',
    }));

    if (activeId === undefined || activeName === undefined) {
      return [...campaignEntries, ...global];
    }
    const prefix = `/${activeId}`;
    const favoriteCommands = this.journeyMemory
      .favoritePages()
      .map((page: JourneyPage): NavigationCommand => ({
        id: `favorite-${page.url}`,
        icon: '\u2605',
        title: page.title,
        detail: this.uiText.text('commandBar.commands.favorite'),
        url: page.url,
        keywords: `favorite favourite preferito preferita saved ${page.title}`,
        scope: 'memory',
      }));
    const favoriteUrls = new Set(favoriteCommands.map((command) => command.url));
    const recentCommands = this.journeyMemory
      .recentPages()
      .filter((page): boolean => !favoriteUrls.has(page.url))
      .map((page: JourneyPage): NavigationCommand => ({
        id: `recent-${page.url}`,
        icon: '\u21ba',
        title: page.title,
        detail: this.uiText.text('commandBar.commands.recent'),
        url: page.url,
        keywords: `recent recente continue continua reading lettura ${page.title}`,
        scope: 'memory',
      }));
    const campaignCommands: Array<NavigationCommand> = [
      {
        id: 'current-my-character',
        icon: '\u2726',
        title:
          this.myCharacter()?.name ?? this.uiText.text('commandBar.commands.myCharacter.choose'),
        detail: this.myCharacter()
          ? this.uiText.text('commandBar.commands.myCharacter.return')
          : this.uiText.text('commandBar.commands.myCharacter.setup'),
        url: this.myCharacter()?.id
          ? `${prefix}/party/${this.myCharacter()!.id}`
          : `${prefix}/settings#campaign-settings`,
        keywords: 'my character mio personaggio profile profilo return torna player giocatore',
        scope: 'current',
      },
      {
        id: 'current-overview',
        icon: '\u2605',
        title: activeName,
        detail: this.uiText.text('commandBar.commands.overview'),
        url: prefix,
        keywords: 'home overview panoramica',
        scope: 'current',
      },
      {
        id: 'current-party',
        icon: '\u2694',
        title: commandCopy('party', 'title'),
        detail: commandCopy('party', 'detail'),
        url: `${prefix}/party`,
        keywords: 'party compagnia characters personaggi heroes eroi',
        scope: 'current',
      },
      {
        id: 'current-offline',
        icon: '\u21e9',
        title: commandCopy('offline', 'title'),
        detail: commandCopy('offline', 'detail'),
        url: `${prefix}/offline`,
        keywords: 'offline download save pack kit recap profile profili salva',
        scope: 'current',
      },
      {
        id: 'current-party-relationships',
        icon: '\u26af',
        title: commandCopy('partyBonds', 'title'),
        detail: commandCopy('partyBonds', 'detail'),
        url: `${prefix}/party/relationships`,
        keywords: 'party relationships bonds relazioni legami',
        scope: 'current',
      },
      {
        id: 'current-npcs',
        icon: '\u265f',
        title: commandCopy('npcs', 'title'),
        detail: commandCopy('npcs', 'detail'),
        url: `${prefix}/npcs`,
        keywords: 'npc png allies enemies alleati nemici',
        scope: 'current',
      },
      {
        id: 'current-npc-relationships',
        icon: '\u21ad',
        title: commandCopy('npcBonds', 'title'),
        detail: commandCopy('npcBonds', 'detail'),
        url: `${prefix}/npcs/relationships`,
        keywords: 'npc png relationships relazioni connections connessioni',
        scope: 'current',
      },
      {
        id: 'current-chronicles',
        icon: '\u270e',
        title: commandCopy('chronicles', 'title'),
        detail: commandCopy('chronicles', 'detail'),
        url: `${prefix}/campaign`,
        keywords: 'campaign briefing sessioni sessions events eventi chronicle cronache',
        scope: 'current',
      },
      {
        id: 'current-quests',
        icon: '\u2726',
        title: commandCopy('quests', 'title'),
        detail: commandCopy('quests', 'detail'),
        url: `${prefix}/campaign/quests`,
        keywords: 'quest quests missioni obiettivi objectives goals',
        scope: 'current',
      },
      {
        id: 'current-story-so-far',
        icon: '\u2637',
        title: commandCopy('story', 'title'),
        detail: commandCopy('story', 'detail'),
        url: `${prefix}/campaign/story-so-far`,
        keywords: 'story storia recap catch up riassunto fin qui',
        scope: 'current',
      },
      {
        id: 'current-table-moments',
        icon: '\ud83c\udfad',
        title: commandCopy('tableMoments', 'title'),
        detail: commandCopy('tableMoments', 'detail'),
        url: `${prefix}/campaign/table-moments`,
        keywords: 'table moments tavolo battute jokes funny ooc off character ricordi memories',
        scope: 'current',
      },
      {
        id: 'current-maps',
        icon: '\u2316',
        title: commandCopy('maps', 'title'),
        detail: commandCopy('maps', 'detail'),
        url: `${prefix}/maps`,
        keywords: 'maps mappe places luoghi locations',
        scope: 'current',
      },
      {
        id: 'current-gallery',
        icon: '\u25c7',
        title: commandCopy('gallery', 'title'),
        detail: commandCopy('gallery', 'detail'),
        url: `${prefix}/gallery`,
        keywords: 'gallery galleria images immagini',
        scope: 'current',
      },
    ];
    return [
      ...favoriteCommands,
      ...recentCommands,
      ...campaignCommands,
      ...campaignEntries.filter((command): boolean => command.url !== prefix),
      ...global,
    ];
  });

  readonly filteredCommands = computed((): ReadonlyArray<NavigationCommand> => {
    const query = this.query().trim().toLocaleLowerCase();
    if (query.length === 0) {
      return this.commands().slice(0, 14);
    }
    return this.commands()
      .filter((command): boolean =>
        `${command.title} ${command.detail} ${command.keywords}`
          .toLocaleLowerCase()
          .includes(query),
      )
      .slice(0, 18);
  });

  readonly activeCommandId = computed((): string | null => {
    const commands = this.filteredCommands();
    if (commands.length === 0) {
      return null;
    }
    return this.commandOptionId(Math.min(this.activeIndex(), commands.length - 1));
  });

  readonly resultSummary = computed((): string => {
    const count = this.filteredCommands().length;
    return this.uiText.text(
      count === 1 ? 'commandBar.palette.oneResult' : 'commandBar.palette.manyResults',
      { count },
    );
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event): void => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.closeActions();
      });
  }

  open(): void {
    this.closeActions();
    this.previouslyFocused = activeElement();
    this.query.set('');
    this.activeIndex.set(0);
    this.isOpen.set(true);
    setTimeout((): void => this.searchInput()?.nativeElement.focus());
  }

  close(shouldRestoreFocus = true): void {
    this.isOpen.set(false);
    this.query.set('');
    this.activeIndex.set(0);
    if (shouldRestoreFocus) {
      const focusTarget = this.previouslyFocused;
      restoreFocus(focusTarget);
    }
    this.previouslyFocused = null;
  }

  async openTour(): Promise<void> {
    if (this.guidedTour.isActive()) {
      this.focusTour();
      return;
    }
    if (this.audiencePreference.audience() === null) {
      await this.router.navigateByUrl('/');
      setTimeout((): void => {
        const paths = document.querySelector<HTMLElement>('#first-visit-paths');
        paths?.focus();
        paths?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    this.guidedTour.open();
  }

  async installCompanion(): Promise<void> {
    await this.pwaInstall.install();
  }

  openManager(): void {
    this.localManager.open(this.activeCampaignId());
  }

  toggleCurrentFavorite(): void {
    this.journeyMemory.toggleCurrentFavorite();
  }

  toggleActions(): void {
    this.isActionsOpen.update((isOpen): boolean => !isOpen);
  }

  /** Closes the global overflow and optionally returns focus to its trigger. */
  closeActions(restoreTriggerFocus = false): void {
    const wasOpen = this.isActionsOpen();
    this.isActionsOpen.set(false);
    if (restoreTriggerFocus && wasOpen) {
      setTimeout((): void => this.actionsToggle()?.nativeElement.focus());
    }
  }

  private focusTour(): void {
    document.querySelector<HTMLElement>('[data-guided-tour]')?.focus();
  }

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  async navigate(url: string): Promise<void> {
    if (this.normalizeUrl(url) === this.normalizeUrl(this.currentUrl())) {
      this.close();
      return;
    }
    this.close(false);
    await this.router.navigateByUrl(url);
  }

  navigateActive(): void {
    const command = this.filteredCommands()[this.activeIndex()];
    if (command !== undefined) {
      void this.navigate(command.url);
    }
  }

  moveSelection(offset: number): void {
    const count = this.filteredCommands().length;
    if (count === 0) {
      return;
    }
    this.activeIndex.update((index): number => (index + offset + count) % count);
    this.revealActiveOption();
  }

  setActiveIndex(index: number): void {
    this.activeIndex.set(index);
  }

  selectBoundary(boundary: 'first' | 'last'): void {
    const count = this.filteredCommands().length;
    if (count > 0) {
      this.activeIndex.set(boundary === 'first' ? 0 : count - 1);
      this.revealActiveOption();
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveSelection(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.selectBoundary(event.key === 'Home' ? 'first' : 'last');
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.navigateActive();
    }
  }

  onDialogKeydown(event: KeyboardEvent): void {
    const dialog = this.paletteDialog()?.nativeElement;
    if (dialog !== undefined) trapTabKey(dialog, event);
  }

  commandOptionId(index: number): string {
    return `qk-command-option-${index}`;
  }

  commandScopeLabel(command: NavigationCommand): string {
    return this.uiText.text(`commandBar.scopes.${command.scope}`);
  }

  isCurrent(command: NavigationCommand): boolean {
    return this.normalizeUrl(command.url) === this.normalizeUrl(this.currentUrl());
  }

  private normalizeUrl(url: string): string {
    const path = url.split(/[?#]/)[0].replace(/\/$/, '');
    return path.length === 0 ? '/' : path;
  }

  private revealActiveOption(): void {
    setTimeout((): void => {
      document.getElementById(this.commandOptionId(this.activeIndex()))?.scrollIntoView({
        block: 'nearest',
      });
    });
  }

  /** Closes the palette only when the backdrop itself is activated. */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  closeActionsOnOutsidePointer(event: Event): void {
    const target = event.target;
    if (
      this.isActionsOpen() &&
      target instanceof Node &&
      !this.actionsShell()?.nativeElement.contains(target)
    ) {
      this.closeActions();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    } else if (event.key === 'Escape') {
      if (this.isOpen()) {
        event.preventDefault();
        this.close();
      } else if (this.isActionsOpen()) {
        event.preventDefault();
        this.closeActions(true);
      }
    }
  }
}
