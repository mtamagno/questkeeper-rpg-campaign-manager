import { Injectable } from '@angular/core';

import { persistedSignal } from '@guild/utils/persistedSignal';

export interface CharacterRuleReference {
  readonly label: string;
  readonly url: string;
}

export interface CharacterRulePreference {
  readonly favourite?: boolean;
  readonly prepared?: boolean;
  readonly note?: string;
  readonly reference?: CharacterRuleReference;
}

interface CharacterRulePreferenceState {
  readonly version: 1;
  readonly entries: Readonly<Record<string, CharacterRulePreference>>;
}

const MAX_NOTE_LENGTH = 2000;
const MAX_REFERENCE_LABEL_LENGTH = 120;
const MAX_REFERENCE_URL_LENGTH = 2048;
const MAX_ENTRIES = 500;

export function characterRuleEntryId(kind: 'feature' | 'spell', name: string): string {
  const normalized = name.normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/g, ' ').trim();
  return `${kind}:${encodeURIComponent(normalized)}`;
}

function safeText(value: unknown, maximum: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, maximum);
  return text || undefined;
}

export function normalizeRuleReference(value: unknown): CharacterRuleReference | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  const label = safeText(candidate['label'], MAX_REFERENCE_LABEL_LENGTH);
  const rawUrl = safeText(candidate['url'], MAX_REFERENCE_URL_LENGTH);
  if (!label || !rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    if (!['https:', 'http:'].includes(url.protocol)) return undefined;
    return { label, url: url.toString() };
  } catch {
    return undefined;
  }
}

function normalizePreference(value: unknown): CharacterRulePreference | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  const note = safeText(candidate['note'], MAX_NOTE_LENGTH);
  const reference = normalizeRuleReference(candidate['reference']);
  const favourite = candidate['favourite'] === true;
  const prepared = candidate['prepared'] === true;
  if (!note && !reference && !favourite && !prepared) return undefined;
  return {
    ...(favourite ? { favourite: true } : {}),
    ...(prepared ? { prepared: true } : {}),
    ...(note ? { note } : {}),
    ...(reference ? { reference } : {}),
  };
}

function isPreferenceState(value: unknown): value is CharacterRulePreferenceState {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (
    candidate['version'] !== 1 ||
    candidate['entries'] === null ||
    typeof candidate['entries'] !== 'object'
  ) {
    return false;
  }
  const entries = candidate['entries'] as Record<string, unknown>;
  const records = Object.entries(entries);
  return (
    !Array.isArray(entries) &&
    records.length <= MAX_ENTRIES &&
    records.every(
      ([key, entry]) => key.length <= 512 && key.includes(':') && normalizePreference(entry),
    )
  );
}

@Injectable({ providedIn: 'root' })
export class CharacterRulePreferencesService {
  private readonly state = persistedSignal<CharacterRulePreferenceState>(
    'character-rule-preferences:v1',
    { version: 1, entries: {} },
    isPreferenceState,
  );

  get(
    campaignId: string | undefined,
    characterId: string,
    entryId: string,
  ): CharacterRulePreference {
    if (!campaignId) return {};
    return this.state().entries[this.key(campaignId, characterId, entryId)] ?? {};
  }

  toggle(
    campaignId: string | undefined,
    characterId: string,
    entryId: string,
    field: 'favourite' | 'prepared',
  ): void {
    const current = this.get(campaignId, characterId, entryId);
    this.update(campaignId, characterId, entryId, { ...current, [field]: !current[field] });
  }

  setNote(
    campaignId: string | undefined,
    characterId: string,
    entryId: string,
    note: string,
  ): void {
    this.update(campaignId, characterId, entryId, {
      ...this.get(campaignId, characterId, entryId),
      note: safeText(note, MAX_NOTE_LENGTH),
    });
  }

  setReference(
    campaignId: string | undefined,
    characterId: string,
    entryId: string,
    label: string,
    url: string,
  ): boolean {
    const reference = normalizeRuleReference({ label, url });
    if (!reference) return false;
    this.update(campaignId, characterId, entryId, {
      ...this.get(campaignId, characterId, entryId),
      reference,
    });
    return true;
  }

  clearReference(campaignId: string | undefined, characterId: string, entryId: string): void {
    const current = { ...this.get(campaignId, characterId, entryId) };
    delete current.reference;
    this.update(campaignId, characterId, entryId, current);
  }

  private update(
    campaignId: string | undefined,
    characterId: string,
    entryId: string,
    preference: CharacterRulePreference,
  ): void {
    if (!campaignId) return;
    const key = this.key(campaignId, characterId, entryId);
    this.state.update((state) => {
      const entries = { ...state.entries };
      const normalized = normalizePreference(preference);
      if (normalized) entries[key] = normalized;
      else delete entries[key];
      while (Object.keys(entries).length > MAX_ENTRIES) {
        const oldestKey = Object.keys(entries)[0];
        if (oldestKey === undefined) break;
        delete entries[oldestKey];
      }
      return { version: 1, entries };
    });
  }

  private key(campaignId: string, characterId: string, entryId: string): string {
    return `${campaignId}:${characterId}:${entryId}`;
  }
}
