import { Injectable, signal } from '@angular/core';

import { type Campaign } from '@guild/models/campaign.model';
import { type Character } from '@guild/models/character.model';
import { type Session } from '@guild/models/session.model';
import { type BilingualText } from '@guild/models/language.model';
import {
  type OfflineCampaignPack,
  type OfflineCharacterSnapshot,
  type OfflinePreparationResult,
  type OfflineRecapSnapshot,
} from '@guild/models/offlinePack.model';

const STORAGE_KEY = 'campaign-companion:offline-packs:v1';
const RECENT_RECAP_LIMIT = 3;

interface PrepareOfflinePackInput {
  readonly campaignId: string;
  readonly campaign: Campaign | undefined;
  readonly characters: ReadonlyArray<Character>;
  readonly sessions: ReadonlyArray<Session>;
  readonly selectedCharacterIds: ReadonlySet<string>;
}

function isOfflineCampaignPack(value: unknown): value is OfflineCampaignPack {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<OfflineCampaignPack>;
  return (
    candidate.version === 1 &&
    typeof candidate.campaignId === 'string' &&
    typeof candidate.preparedAt === 'string' &&
    candidate.campaignName !== undefined &&
    Array.isArray(candidate.characters) &&
    Array.isArray(candidate.recaps)
  );
}

function readStoredPacks(): Readonly<Record<string, OfflineCampaignPack>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, OfflineCampaignPack] =>
        isOfflineCampaignPack(entry[1]),
      ),
    );
  } catch {
    return {};
  }
}

function publicCharacterSnapshot(character: Character): OfflineCharacterSnapshot {
  return {
    id: character.id,
    name: character.name,
    playerName: character.playerName,
    profileImageUrl: character.profileImageUrl,
    race: character.sheet.race,
    classType: character.sheet.classType,
    subclass: character.sheet.subclass,
    level: character.sheet.level,
    publicProfile: {
      backstory: { ...character.publicProfile.backstory },
      traits: { ...character.publicProfile.traits },
      ideals: { ...character.publicProfile.ideals },
      bonds: { ...character.publicProfile.bonds },
      flaws: { ...character.publicProfile.flaws },
      knownHistory: { ...character.publicProfile.knownHistory },
      ...(character.publicProfile.hobbies === undefined
        ? {}
        : { hobbies: { ...character.publicProfile.hobbies } }),
      ...(character.publicProfile.quickFacts === undefined
        ? {}
        : {
            quickFacts: character.publicProfile.quickFacts.map((fact) => ({
              ...fact,
              label: { ...fact.label },
              value: { ...fact.value },
            })),
          }),
      ...(character.publicProfile.signatureItems === undefined
        ? {}
        : {
            signatureItems: character.publicProfile.signatureItems.map((item) => ({
              ...item,
              name: { ...item.name },
              description: { ...item.description },
              ...(item.source === undefined
                ? {}
                : { source: { ...item.source, label: { ...item.source.label } } }),
            })),
          }),
      ...(character.publicProfile.favouriteMoments === undefined
        ? {}
        : {
            favouriteMoments: character.publicProfile.favouriteMoments.map((moment) => ({
              ...moment,
              title: { ...moment.title },
              summary: { ...moment.summary },
              source: { ...moment.source, label: { ...moment.source.label } },
            })),
          }),
    },
  };
}

function recapSnapshot(session: Session): OfflineRecapSnapshot {
  return {
    id: session.id,
    sessionNumber: session.sessionNumber,
    date: session.date,
    title: { ...session.title },
    location: { ...session.location },
    summary: { ...session.summary },
    ...(session.storySoFar === undefined ? {} : { storySoFar: { ...session.storySoFar } }),
    keyEvents: session.keyEvents.map((event): BilingualText => ({ ...event.description })),
  };
}

/** Stores explicit public-only reading packs and warms safe campaign artwork. */
@Injectable({ providedIn: 'root' })
export class OfflinePackService {
  private readonly storedPacks =
    signal<Readonly<Record<string, OfflineCampaignPack>>>(readStoredPacks());

  readonly isOnline = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', (): void => this.isOnline.set(true));
    window.addEventListener('offline', (): void => this.isOnline.set(false));
  }

  packFor(campaignId: string | undefined): OfflineCampaignPack | undefined {
    return campaignId === undefined ? undefined : this.storedPacks()[campaignId];
  }

  async prepare(input: PrepareOfflinePackInput): Promise<OfflinePreparationResult> {
    if (!this.isOnline()) {
      return {
        ok: false,
        cachedImageCount: 0,
        characterCount: 0,
        recapCount: 0,
        reason: 'offline',
      };
    }

    const characters = input.characters
      .filter((character) => input.selectedCharacterIds.has(character.id))
      .map(publicCharacterSnapshot);
    const recaps = [...input.sessions]
      .sort((a, b) => b.sessionNumber - a.sessionNumber)
      .slice(0, RECENT_RECAP_LIMIT)
      .map(recapSnapshot);

    if (characters.length === 0 && recaps.length === 0) {
      return { ok: false, cachedImageCount: 0, characterCount: 0, recapCount: 0, reason: 'empty' };
    }

    const fallbackName: BilingualText = { en: input.campaignId, it: input.campaignId };
    const pack: OfflineCampaignPack = {
      version: 1,
      campaignId: input.campaignId,
      campaignName: input.campaign?.name ?? fallbackName,
      preparedAt: new Date().toISOString(),
      characters,
      recaps,
    };
    const next = { ...this.storedPacks(), [input.campaignId]: pack };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.storedPacks.set(next);
    } catch {
      return {
        ok: false,
        cachedImageCount: 0,
        characterCount: characters.length,
        recapCount: recaps.length,
        reason: 'storage',
      };
    }

    const cachedImageCount = await this.warmPublicResources(input.campaignId, characters);
    return {
      ok: true,
      cachedImageCount,
      characterCount: characters.length,
      recapCount: recaps.length,
    };
  }

  remove(campaignId: string): boolean {
    const next = { ...this.storedPacks() };
    delete next[campaignId];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.storedPacks.set(next);
      return true;
    } catch {
      return false;
    }
  }

  private async warmPublicResources(
    campaignId: string,
    characters: ReadonlyArray<OfflineCharacterSnapshot>,
  ): Promise<number> {
    if (!('serviceWorker' in navigator) || navigator.serviceWorker.controller === null) {
      return 0;
    }

    const urls = [
      'campaigns/campaigns.json',
      `campaigns/${campaignId}/data/campaign.json`,
      ...characters.map((character) => character.profileImageUrl),
    ];
    const outcomes = await Promise.allSettled(
      urls.map((url) => fetch(url, { cache: 'reload', credentials: 'same-origin' })),
    );
    return outcomes.filter((outcome) => outcome.status === 'fulfilled' && outcome.value.ok).length;
  }
}
