import { type LocalizedText } from './language.model';

export type QuestScope = 'party' | 'character';
export type QuestAudience = 'party' | 'owners' | 'gm';
export type QuestState = 'rumour' | 'active' | 'paused' | 'completed' | 'failed' | 'abandoned';
export type QuestImportance = 'minor' | 'standard' | 'major' | 'critical';
export type QuestReferenceKind = 'session' | 'character' | 'npc' | 'location';

export interface QuestReference {
  readonly kind: QuestReferenceKind;
  readonly id: string;
}

export interface QuestUpdate {
  readonly id: string;
  readonly recordedAt: string;
  readonly sessionId?: string;
  readonly state: QuestState;
  readonly progress: LocalizedText;
  readonly nextObjective: LocalizedText;
  readonly evidence?: ReadonlyArray<QuestReference>;
}

export interface Quest {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly scope: QuestScope;
  readonly ownerCharacterIds: ReadonlyArray<string>;
  readonly audience: QuestAudience;
  readonly importance: QuestImportance;
  readonly kind?: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly related?: ReadonlyArray<QuestReference>;
  readonly updates: ReadonlyArray<QuestUpdate>;
}

export interface QuestProjection {
  readonly quest: Quest;
  readonly current: QuestUpdate;
}

/** One deterministic chronology for reader, Manager and future AI proposals. */
export function orderedQuestUpdates(quest: Quest): ReadonlyArray<QuestUpdate> {
  return [...quest.updates].sort(
    (left, right) =>
      left.recordedAt.localeCompare(right.recordedAt) || left.id.localeCompare(right.id),
  );
}

export function projectQuest(quest: Quest): QuestProjection | undefined {
  const updates = orderedQuestUpdates(quest);
  const current = updates.at(-1);
  return current === undefined ? undefined : { quest, current };
}

export const ACTIVE_QUEST_STATES: ReadonlySet<QuestState> = new Set([
  'rumour',
  'active',
  'paused',
]);

