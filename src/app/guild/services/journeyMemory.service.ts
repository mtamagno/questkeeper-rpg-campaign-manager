import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

const STORAGE_KEY = 'campaign-companion:journey-memory:v1';
const MAX_RECENT_PAGES = 12;
const MAX_FAVORITE_PAGES = 12;

export interface JourneyPage {
  readonly campaignId: string;
  readonly url: string;
  readonly title: string;
  readonly visitedAt: number;
}

interface JourneyMemoryState {
  readonly version: 1;
  readonly recent: ReadonlyArray<JourneyPage>;
  readonly favorites: ReadonlyArray<JourneyPage>;
}

function normalizeUrl(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  return path.length === 0 ? '/' : path;
}

function campaignIdFromUrl(url: string): string | undefined {
  return normalizeUrl(url).split('/').filter(Boolean)[0];
}

function isReadableCampaignPage(url: string): boolean {
  return normalizeUrl(url).split('/').filter(Boolean).length >= 2;
}

function isJourneyPage(value: unknown): value is JourneyPage {
  if (value === null || typeof value !== 'object') return false;
  const page = value as Record<string, unknown>;
  return (
    typeof page['campaignId'] === 'string' &&
    typeof page['url'] === 'string' &&
    page['url'].startsWith('/') &&
    typeof page['title'] === 'string' &&
    page['title'].trim().length > 0 &&
    typeof page['visitedAt'] === 'number' &&
    Number.isFinite(page['visitedAt'])
  );
}

function readState(): JourneyMemoryState {
  const fallback: JourneyMemoryState = { version: 1, recent: [], favorites: [] };
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed['version'] !== 1) return fallback;
    const recent = Array.isArray(parsed['recent']) ? parsed['recent'].filter(isJourneyPage) : [];
    const favorites = Array.isArray(parsed['favorites'])
      ? parsed['favorites'].filter(isJourneyPage)
      : [];
    return {
      version: 1,
      recent: recent.slice(0, MAX_RECENT_PAGES),
      favorites: favorites.slice(0, MAX_FAVORITE_PAGES),
    };
  } catch {
    return fallback;
  }
}

function pageTitle(url: string): string {
  const heading = document.querySelector<HTMLElement>('#main-content h1');
  const visibleTitle = heading?.textContent?.replace(/\s+/g, ' ').trim();
  if (visibleTitle !== undefined && visibleTitle.length > 0) return visibleTitle.slice(0, 120);
  const segment = normalizeUrl(url).split('/').filter(Boolean).at(-1) ?? 'QuestKeeper';
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter): string => letter.toUpperCase())
    .slice(0, 120);
}

@Injectable({ providedIn: 'root' })
export class JourneyMemoryService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly state = signal<JourneyMemoryState>(readState());
  private readonly currentUrl = signal(normalizeUrl(this.router.url));
  private initialized = false;

  readonly activeCampaignId = computed((): string | undefined =>
    campaignIdFromUrl(this.currentUrl()),
  );
  readonly canRememberCurrent = computed((): boolean => isReadableCampaignPage(this.currentUrl()));
  readonly recentPages = computed((): ReadonlyArray<JourneyPage> => {
    const campaignId = this.activeCampaignId();
    return campaignId === undefined
      ? []
      : this.state().recent.filter((page): boolean => page.campaignId === campaignId);
  });
  readonly favoritePages = computed((): ReadonlyArray<JourneyPage> => {
    const campaignId = this.activeCampaignId();
    return campaignId === undefined
      ? []
      : this.state().favorites.filter((page): boolean => page.campaignId === campaignId);
  });
  readonly continuePage = computed((): JourneyPage | undefined => this.recentPages()[0]);
  readonly isCurrentFavorite = computed((): boolean => {
    const url = this.currentUrl();
    return this.state().favorites.some((page): boolean => page.url === url);
  });

  constructor() {
    effect((): void => {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      } catch {
        // Storage can be unavailable in private mode; in-memory navigation still works.
      }
    });
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event): void => {
        const url = normalizeUrl(event.urlAfterRedirects);
        this.currentUrl.set(url);
        if (isReadableCampaignPage(url)) {
          setTimeout((): void => this.remember(url));
        }
      });
    const initialUrl = normalizeUrl(this.router.url);
    if (isReadableCampaignPage(initialUrl)) {
      setTimeout((): void => this.remember(initialUrl));
    }
  }

  toggleCurrentFavorite(): void {
    const url = this.currentUrl();
    const campaignId = campaignIdFromUrl(url);
    if (campaignId === undefined || !isReadableCampaignPage(url)) return;
    this.state.update((current): JourneyMemoryState => {
      if (current.favorites.some((page): boolean => page.url === url)) {
        return {
          ...current,
          favorites: current.favorites.filter((page): boolean => page.url !== url),
        };
      }
      const known = current.recent.find((page): boolean => page.url === url);
      const page: JourneyPage = known ?? {
        campaignId,
        url,
        title: pageTitle(url),
        visitedAt: Date.now(),
      };
      return {
        ...current,
        favorites: [page, ...current.favorites].slice(0, MAX_FAVORITE_PAGES),
      };
    });
  }

  clearRecent(): void {
    const campaignId = this.activeCampaignId();
    if (campaignId === undefined) return;
    this.state.update((current): JourneyMemoryState => ({
      ...current,
      recent: current.recent.filter((page): boolean => page.campaignId !== campaignId),
    }));
  }

  private remember(url: string): void {
    const campaignId = campaignIdFromUrl(url);
    if (campaignId === undefined) return;
    const page: JourneyPage = { campaignId, url, title: pageTitle(url), visitedAt: Date.now() };
    this.state.update((current): JourneyMemoryState => ({
      version: 1,
      recent: [page, ...current.recent.filter((item): boolean => item.url !== url)].slice(
        0,
        MAX_RECENT_PAGES,
      ),
      favorites: current.favorites.map((item): JourneyPage =>
        item.url === url ? { ...item, title: page.title, visitedAt: page.visitedAt } : item,
      ),
    }));
  }
}
