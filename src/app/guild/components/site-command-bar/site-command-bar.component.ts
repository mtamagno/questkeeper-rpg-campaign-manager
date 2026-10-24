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
import { AudiencePreferenceService } from '@guild/services/audiencePreference.service';
import { LanguageService } from '@guild/services/language.service';
import { GuidedTourService } from '@guild/services/guidedTour.service';
import { localizeText } from '@guild/models/language.model';
import { PwaInstallService } from '@guild/services/pwaInstall.service';
import { JourneyMemoryService, type JourneyPage } from '@guild/services/journeyMemory.service';
import { activeElement, restoreFocus, trapTabKey } from '@guild/utils/focusTrap';

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

const ROUTE_LABELS: Readonly<Record<string, { readonly it: string; readonly en: string }>> = {
  party: { it: 'Compagnia', en: 'Party' },
  offline: { it: 'Offline', en: 'Offline' },
  relationships: { it: 'Relazioni', en: 'Relationships' },
  npcs: { it: 'PNG', en: 'NPCs' },
  campaign: { it: 'Campagna', en: 'Campaign' },
  'story-so-far': { it: 'La storia fin qui', en: 'Story so far' },
  story: { it: 'Cronache', en: 'Chronicles' },
  maps: { it: 'Luoghi', en: 'Places' },
  gallery: { it: 'Galleria', en: 'Gallery' },
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
  private readonly audiencePreference = inject(AudiencePreferenceService);
  private readonly language = inject(LanguageService);
  private readonly guidedTour = inject(GuidedTourService);
  private readonly pwaInstall = inject(PwaInstallService);
  private readonly journeyMemory = inject(JourneyMemoryService);
  private readonly currentUrl = signal(this.router.url);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly paletteDialog = viewChild<ElementRef<HTMLElement>>('paletteDialog');
  private previouslyFocused: HTMLElement | null = null;

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly isItalian = this.language.isItalian;
  readonly activeCampaignId = this.campaigns.activeCampaignId;
  readonly tourStatus = this.guidedTour.status;
  readonly canInstall = this.pwaInstall.canInstall;
  readonly continuePage = this.journeyMemory.continuePage;
  readonly canRememberCurrent = this.journeyMemory.canRememberCurrent;
  readonly isCurrentFavorite = this.journeyMemory.isCurrentFavorite;

  readonly tourActionLabel = computed((): string => {
    const it = this.isItalian();
    if (this.audiencePreference.audience() === null) {
      return it ? 'Scegli un percorso per iniziare il tour' : 'Choose a path to begin the tour';
    }
    if (this.tourStatus() === 'active') {
      return it ? 'Torna al tour in corso' : 'Return to active tour';
    }
    if (this.tourStatus() === 'paused') {
      return it ? 'Riprendi il tour guidato' : 'Resume guided tour';
    }
    if (this.tourStatus() === 'completed') {
      return it ? 'Ricomincia il tour guidato' : 'Restart guided tour';
    }
    return it ? 'Apri il tour guidato' : 'Open guided tour';
  });

  readonly tourButtonLabel = computed((): string => {
    if (this.tourStatus() === 'active') {
      return this.isItalian() ? 'Tour attivo' : 'Tour active';
    }
    if (this.tourStatus() === 'paused') {
      return this.isItalian() ? 'Riprendi' : 'Resume';
    }
    if (this.tourStatus() === 'completed') {
      return this.isItalian() ? 'Rifai tour' : 'Restart tour';
    }
    return 'Tour';
  });

  readonly activeCampaignName = computed((): string | undefined => {
    const campaignId = this.activeCampaignId();
    const lang = this.language.currentLanguage();
    return localizeText(this.campaigns.manifest().find(({ id }) => id === campaignId)?.name, lang);
  });

  readonly breadcrumbs = computed((): ReadonlyArray<BreadcrumbItem> => {
    const lang = this.language.currentLanguage();
    const cleanUrl = this.currentUrl().split(/[?#]/)[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const items: Array<BreadcrumbItem> = [
      { label: lang === 'it' ? 'Campagne' : 'Campaigns', url: '/' },
    ];
    let path = '';

    segments.forEach((segment, index): void => {
      path += `/${segment}`;
      const campaign =
        index === 0 ? this.campaigns.manifest().find(({ id }) => id === segment) : undefined;
      const mapped = ROUTE_LABELS[segment];
      items.push({
        label:
          (campaign === undefined ? undefined : localizeText(campaign.name, lang)) ||
          mapped?.[lang === 'it' ? 'it' : 'en'] ||
          humanizeSegment(segment),
        url: path,
      });
    });
    return items;
  });

  readonly commands = computed((): ReadonlyArray<NavigationCommand> => {
    const it = this.isItalian();
    const activeId = this.activeCampaignId();
    const activeName = this.activeCampaignName();
    const global: Array<NavigationCommand> = [
      {
        id: 'global-campaigns',
        icon: '\u2302',
        title: it ? 'Tutte le campagne' : 'All campaigns',
        detail: it ? 'Torna al registro delle avventure' : 'Return to the adventure ledger',
        url: '/',
        keywords: 'home campaigns campagne registro',
        scope: 'global',
      },
    ];
    const lang = this.language.currentLanguage();
    const campaignEntries = this.campaigns.manifest().map((campaign): NavigationCommand => ({
      id: `campaign-${campaign.id}`,
      icon: '\u2691',
      title: localizeText(campaign.name, lang),
      detail: localizeText(campaign.status, lang) || (it ? 'Campagna' : 'Campaign'),
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
        detail: it ? 'Pagina preferita' : 'Favorite page',
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
        detail: it ? 'Aperta di recente' : 'Recently opened',
        url: page.url,
        keywords: `recent recente continue continua reading lettura ${page.title}`,
        scope: 'memory',
      }));
    const campaignCommands: Array<NavigationCommand> = [
      {
        id: 'current-overview',
        icon: '\u2605',
        title: activeName,
        detail: it ? 'Panoramica della campagna' : 'Campaign overview',
        url: prefix,
        keywords: 'home overview panoramica',
        scope: 'current',
      },
      {
        id: 'current-party',
        icon: '\u2694',
        title: it ? 'La compagnia' : 'The party',
        detail: it ? 'Eroi, profili e diari' : 'Heroes, profiles and journals',
        url: `${prefix}/party`,
        keywords: 'party compagnia characters personaggi heroes eroi',
        scope: 'current',
      },
      {
        id: 'current-offline',
        icon: '\u21e9',
        title: it ? 'Kit offline' : 'Offline pack',
        detail: it ? 'Profili pubblici e recap recenti' : 'Public profiles and recent recaps',
        url: `${prefix}/offline`,
        keywords: 'offline download save pack kit recap profile profili salva',
        scope: 'current',
      },
      {
        id: 'current-party-relationships',
        icon: '\u26af',
        title: it ? 'Legami del gruppo' : 'Party bonds',
        detail: it ? 'Affinit\u00e0 e tensioni' : 'Affinities and tensions',
        url: `${prefix}/party/relationships`,
        keywords: 'party relationships bonds relazioni legami',
        scope: 'current',
      },
      {
        id: 'current-npcs',
        icon: '\u265f',
        title: it ? 'Volti conosciuti' : 'Known figures',
        detail: it ? 'Alleati, nemici e PNG' : 'Allies, enemies and NPCs',
        url: `${prefix}/npcs`,
        keywords: 'npc png allies enemies alleati nemici',
        scope: 'current',
      },
      {
        id: 'current-npc-relationships',
        icon: '\u21ad',
        title: it ? 'Relazioni dei PNG' : 'NPC relationships',
        detail: it ? 'Connessioni tra i volti conosciuti' : 'Connections between known figures',
        url: `${prefix}/npcs/relationships`,
        keywords: 'npc png relationships relazioni connections connessioni',
        scope: 'current',
      },
      {
        id: 'current-chronicles',
        icon: '\u270e',
        title: it ? 'Cronache delle sessioni' : 'Session chronicles',
        detail: it ? 'Briefing ed eventi chiave' : 'Briefing and key events',
        url: `${prefix}/campaign`,
        keywords: 'campaign briefing sessioni sessions events eventi chronicle cronache',
        scope: 'current',
      },
      {
        id: 'current-story-so-far',
        icon: '\u2637',
        title: it ? 'La storia fin qui' : 'The story so far',
        detail: it ? "Riprendi il filo dell'avventura" : 'Catch up with the adventure',
        url: `${prefix}/campaign/story-so-far`,
        keywords: 'story storia recap catch up riassunto fin qui',
        scope: 'current',
      },
      {
        id: 'current-maps',
        icon: '\u2316',
        title: it ? 'Luoghi esplorati' : 'Explored places',
        detail: it ? 'Mappe e destinazioni' : 'Maps and destinations',
        url: `${prefix}/maps`,
        keywords: 'maps mappe places luoghi locations',
        scope: 'current',
      },
      {
        id: 'current-gallery',
        icon: '\u25c7',
        title: it ? 'Galleria' : 'Gallery',
        detail: it ? 'Immagini e ricordi' : 'Images and memories',
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
    if (this.isItalian()) {
      return count === 1 ? '1 destinazione' : `${count} destinazioni`;
    }
    return count === 1 ? '1 destination' : `${count} destinations`;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event): void => this.currentUrl.set(event.urlAfterRedirects));
  }

  open(): void {
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

  toggleCurrentFavorite(): void {
    this.journeyMemory.toggleCurrentFavorite();
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
    const it = this.isItalian();
    if (command.scope === 'memory') {
      return it ? 'Il tuo percorso' : 'Your trail';
    }
    if (command.scope === 'current') {
      return it ? 'In questa campagna' : 'In this campaign';
    }
    if (command.scope === 'campaign') {
      return it ? 'Campagna' : 'Campaign';
    }
    return 'QuestKeeper';
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

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    } else if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close();
    }
  }
}
