import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'questkeeper:npc-relationship-graph:v1';
const MAX_CAMPAIGN_SELECTIONS = 32;
const MAX_NPCS_PER_SELECTION = 500;

interface NpcGraphSelection {
  readonly campaignId: string;
  readonly npcIds: ReadonlyArray<string>;
  readonly updatedAt: number;
}

interface NpcGraphPreferencesState {
  readonly version: 1;
  readonly selections: ReadonlyArray<NpcGraphSelection>;
}

function isSafeId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 120 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)
  );
}

function normalizeSelection(value: unknown): NpcGraphSelection | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  if (!isSafeId(candidate['campaignId']) || !Array.isArray(candidate['npcIds'])) return undefined;

  const npcIds = [...new Set(candidate['npcIds'].filter((id): id is string => isSafeId(id)))].slice(
    0,
    MAX_NPCS_PER_SELECTION,
  );
  const updatedAt =
    typeof candidate['updatedAt'] === 'number' && Number.isFinite(candidate['updatedAt'])
      ? candidate['updatedAt']
      : 0;
  return { campaignId: candidate['campaignId'], npcIds, updatedAt };
}

export function normalizeNpcGraphPreferences(value: unknown): NpcGraphPreferencesState {
  if (value === null || typeof value !== 'object') return { version: 1, selections: [] };
  const candidate = value as Record<string, unknown>;
  if (candidate['version'] !== 1 || !Array.isArray(candidate['selections'])) {
    return { version: 1, selections: [] };
  }
  return {
    version: 1,
    selections: candidate['selections']
      .map(normalizeSelection)
      .filter((selection): selection is NpcGraphSelection => selection !== undefined)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CAMPAIGN_SELECTIONS),
  };
}

function readState(): NpcGraphPreferencesState {
  if (typeof localStorage === 'undefined') return { version: 1, selections: [] };
  try {
    return normalizeNpcGraphPreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return { version: 1, selections: [] };
  }
}

/** Stores only a reader's campaign-scoped graph view, never relationship data. */
@Injectable({ providedIn: 'root' })
export class NpcGraphPreferencesService {
  private readonly state = signal<NpcGraphPreferencesState>(readState());

  constructor() {
    effect(() => {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      } catch {
        // Storage failures must never make the relationship map unreadable.
      }
    });
  }

  selectionFor(campaignId: string | undefined): ReadonlyArray<string> | undefined {
    if (campaignId === undefined) return undefined;
    return this.state().selections.find((selection) => selection.campaignId === campaignId)?.npcIds;
  }

  remember(campaignId: string | undefined, npcIds: ReadonlyArray<string>): void {
    if (campaignId === undefined || !isSafeId(campaignId)) return;
    const normalizedIds = [...new Set(npcIds.filter(isSafeId))].slice(0, MAX_NPCS_PER_SELECTION);
    const next: NpcGraphSelection = { campaignId, npcIds: normalizedIds, updatedAt: Date.now() };
    this.state.update((current) => ({
      version: 1,
      selections: [
        next,
        ...current.selections.filter((selection) => selection.campaignId !== campaignId),
      ].slice(0, MAX_CAMPAIGN_SELECTIONS),
    }));
  }

  /** Returns the campaign to its live default: party plus the two latest NPCs. */
  followLatest(campaignId: string | undefined): void {
    if (campaignId === undefined) return;
    this.state.update((current) => ({
      version: 1,
      selections: current.selections.filter((selection) => selection.campaignId !== campaignId),
    }));
  }
}
