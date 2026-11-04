import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal, type Signal } from '@angular/core';

import { type CampaignManifestEntry } from '@guild/models/campaignConfig.model';
import {
  type CampaignLocaleRegistry,
  type LocalizedText,
  type ResolvedLocalizedText,
  resolveLocalizedText,
} from '@guild/models/language.model';
import { CampaignService } from '@guild/services/campaign.service';

const STORAGE_PREFIX = 'questkeeper:campaign-content-locale:v1:';

function legacyRegistry(entry: CampaignManifestEntry | undefined): CampaignLocaleRegistry {
  if (entry?.localeRegistry !== undefined) return entry.localeRegistry;
  const locales = entry?.languages?.length ? entry.languages : [entry?.defaultLanguage ?? 'en'];
  const defaultLocale = locales.includes(entry?.defaultLanguage ?? '')
    ? (entry?.defaultLanguage ?? locales[0])
    : locales[0];
  return {
    version: 1,
    locales: [...new Set(locales)].map((tag) => ({ tag, direction: 'auto' as const })),
    defaultLocale,
    sourceLocale: defaultLocale,
  };
}

function configured(registry: CampaignLocaleRegistry, locale: string | null): locale is string {
  return locale !== null && registry.locales.some(({ tag }) => tag === locale);
}

/** Campaign-scoped authored-content locale, independent from QuestKeeper UI language. */
@Injectable({ providedIn: 'root' })
export class CampaignLocaleService {
  private readonly campaigns = inject(CampaignService);
  private readonly document = inject(DOCUMENT);
  private readonly selectedLocale = signal<string>('en');

  readonly activeCampaign = computed(() => {
    const id = this.campaigns.activeCampaignId();
    return this.campaigns.manifest().find((entry) => entry.id === id);
  });

  readonly registry: Signal<CampaignLocaleRegistry> = computed(() =>
    legacyRegistry(this.activeCampaign()),
  );

  readonly locales = computed(() => this.registry().locales);
  readonly currentLocale = this.selectedLocale.asReadonly();
  readonly direction = computed(() => {
    const configuredDirection = this.locales().find(
      ({ tag }) => tag === this.currentLocale(),
    )?.direction;
    return configuredDirection ?? 'auto';
  });

  constructor() {
    effect(() => {
      const campaign = this.activeCampaign();
      const registry = this.registry();
      const campaignId = campaign?.id;
      const queryLocale = this.queryLocale();
      const storedLocale = campaignId === undefined ? null : this.load(campaignId);
      const next = configured(registry, queryLocale)
        ? queryLocale
        : configured(registry, storedLocale)
          ? storedLocale
          : registry.defaultLocale;
      this.selectedLocale.set(next);
      const main = this.document.querySelector('main');
      main?.setAttribute('lang', next);
      main?.setAttribute('dir', this.direction());
    });
  }

  setLocale(locale: string): void {
    const campaign = this.activeCampaign();
    if (campaign === undefined || !configured(this.registry(), locale)) return;
    this.selectedLocale.set(locale);
    this.save(campaign.id, locale);
    const view = this.document.defaultView;
    if (view !== null) {
      const url = new URL(view.location.href);
      url.searchParams.set('lang', locale);
      view.history.replaceState(view.history.state, '', url);
    }
  }

  resolve(value: LocalizedText | undefined): string {
    return this.resolveDetailed(value).value;
  }

  resolveDetailed(value: LocalizedText | undefined): ResolvedLocalizedText {
    return resolveLocalizedText(value, this.currentLocale(), this.registry());
  }

  registryForCampaign(campaign: CampaignManifestEntry): CampaignLocaleRegistry {
    return legacyRegistry(campaign);
  }

  localeForCampaign(campaign: CampaignManifestEntry): string {
    const registry = this.registryForCampaign(campaign);
    const queryLocale = this.queryLocale();
    const storedLocale = this.load(campaign.id);
    if (configured(registry, queryLocale)) return queryLocale;
    if (configured(registry, storedLocale)) return storedLocale;
    return registry.defaultLocale;
  }

  resolveForCampaign(campaign: CampaignManifestEntry, value: LocalizedText | undefined): string {
    return resolveLocalizedText(
      value,
      this.localeForCampaign(campaign),
      this.registryForCampaign(campaign),
    ).value;
  }

  private queryLocale(): string | null {
    try {
      return new URL(this.document.location.href).searchParams.get('lang');
    } catch {
      return null;
    }
  }

  private load(campaignId: string): string | null {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${campaignId}`);
    } catch {
      return null;
    }
  }

  private save(campaignId: string, locale: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${campaignId}`, locale);
    } catch {
      // Content remains readable through the campaign default when storage is unavailable.
    }
  }
}
