import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'questkeeper:character-reading-position:v1';
const MAX_POSITIONS = 24;

export const SAFE_SHEET_ANCHORS = [
  'overview',
  'abilities',
  'training',
  'inventory',
  'spells',
] as const;

export type SafeSheetAnchor = (typeof SAFE_SHEET_ANCHORS)[number];

export interface CharacterReadingPosition {
  readonly campaignId: string;
  readonly characterId: string;
  readonly sheetAnchor?: SafeSheetAnchor;
  readonly notebookSlide?: number;
  readonly updatedAt: number;
}

interface CharacterReadingState {
  readonly version: 1;
  readonly positions: ReadonlyArray<CharacterReadingPosition>;
}

function isSafeId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 100 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)
  );
}

function normalizePosition(value: unknown): CharacterReadingPosition | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  if (!isSafeId(candidate['campaignId']) || !isSafeId(candidate['characterId'])) return undefined;
  const sheetAnchor = SAFE_SHEET_ANCHORS.includes(candidate['sheetAnchor'] as SafeSheetAnchor)
    ? (candidate['sheetAnchor'] as SafeSheetAnchor)
    : undefined;
  const notebookSlide =
    typeof candidate['notebookSlide'] === 'number' &&
    Number.isInteger(candidate['notebookSlide']) &&
    candidate['notebookSlide'] >= 0 &&
    candidate['notebookSlide'] <= 999
      ? candidate['notebookSlide']
      : undefined;
  const updatedAt =
    typeof candidate['updatedAt'] === 'number' && Number.isFinite(candidate['updatedAt'])
      ? candidate['updatedAt']
      : 0;
  if (sheetAnchor === undefined && notebookSlide === undefined) return undefined;
  return {
    campaignId: candidate['campaignId'],
    characterId: candidate['characterId'],
    ...(sheetAnchor === undefined ? {} : { sheetAnchor }),
    ...(notebookSlide === undefined ? {} : { notebookSlide }),
    updatedAt,
  };
}

export function normalizeCharacterReadingState(value: unknown): CharacterReadingState {
  if (value === null || typeof value !== 'object') return { version: 1, positions: [] };
  const candidate = value as Record<string, unknown>;
  if (candidate['version'] !== 1 || !Array.isArray(candidate['positions'])) {
    return { version: 1, positions: [] };
  }
  const positions = candidate['positions']
    .map(normalizePosition)
    .filter((position): position is CharacterReadingPosition => position !== undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_POSITIONS);
  return { version: 1, positions };
}

function readState(): CharacterReadingState {
  if (typeof localStorage === 'undefined') return { version: 1, positions: [] };
  try {
    return normalizeCharacterReadingState(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return { version: 1, positions: [] };
  }
}

@Injectable({ providedIn: 'root' })
export class CharacterReadingPositionService {
  private readonly state = signal<CharacterReadingState>(readState());

  constructor() {
    effect(() => {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      } catch {
        // Private browsing or a full quota must never block reading.
      }
    });
  }

  get(campaignId: string | undefined, characterId: string): CharacterReadingPosition | undefined {
    if (campaignId === undefined) return undefined;
    return this.state().positions.find(
      (position) => position.campaignId === campaignId && position.characterId === characterId,
    );
  }

  hasSheetPosition(campaignId: string | undefined, characterId: string): boolean {
    return this.get(campaignId, characterId)?.sheetAnchor !== undefined;
  }

  hasNotebookPosition(campaignId: string | undefined, characterId: string): boolean {
    return this.get(campaignId, characterId)?.notebookSlide !== undefined;
  }

  rememberSheet(
    campaignId: string | undefined,
    characterId: string,
    sheetAnchor: SafeSheetAnchor,
  ): void {
    if (campaignId === undefined || !isSafeId(campaignId) || !isSafeId(characterId)) return;
    this.upsert(campaignId, characterId, { sheetAnchor });
  }

  rememberNotebook(
    campaignId: string | undefined,
    characterId: string,
    notebookSlide: number,
  ): void {
    if (
      campaignId === undefined ||
      !isSafeId(campaignId) ||
      !isSafeId(characterId) ||
      !Number.isInteger(notebookSlide) ||
      notebookSlide < 0
    ) {
      return;
    }
    this.upsert(campaignId, characterId, { notebookSlide: Math.min(notebookSlide, 999) });
  }

  clear(campaignId: string | undefined, characterId: string): void {
    if (campaignId === undefined) return;
    this.state.update((current) => ({
      version: 1,
      positions: current.positions.filter(
        (position) => position.campaignId !== campaignId || position.characterId !== characterId,
      ),
    }));
  }

  private upsert(
    campaignId: string,
    characterId: string,
    update:
      | Pick<CharacterReadingPosition, 'sheetAnchor'>
      | Pick<CharacterReadingPosition, 'notebookSlide'>,
  ): void {
    this.state.update((current) => {
      const previous = current.positions.find(
        (position) => position.campaignId === campaignId && position.characterId === characterId,
      );
      const next: CharacterReadingPosition = {
        campaignId,
        characterId,
        ...(previous?.sheetAnchor === undefined ? {} : { sheetAnchor: previous.sheetAnchor }),
        ...(previous?.notebookSlide === undefined ? {} : { notebookSlide: previous.notebookSlide }),
        ...update,
        updatedAt: Date.now(),
      };
      return {
        version: 1,
        positions: [
          next,
          ...current.positions.filter(
            (position) =>
              position.campaignId !== campaignId || position.characterId !== characterId,
          ),
        ].slice(0, MAX_POSITIONS),
      };
    });
  }
}
