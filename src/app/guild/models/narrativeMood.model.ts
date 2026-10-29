import { type Campaign } from '@guild/models/campaign.model';
import { type Session } from '@guild/models/session.model';

export const NARRATIVE_MOODS = ['default', 'light', 'dark'] as const;
export type NarrativeMood = (typeof NARRATIVE_MOODS)[number];
export type NarrativeMoodBlock = 'summary' | 'storySoFar' | 'prose';

export interface NarrativeMoodPhase {
  readonly id: string;
  readonly label?: string;
  /** Public session ID whose publication activates this phase. */
  readonly startsAtSessionId: string;
  readonly mood: NarrativeMood;
}

export interface CampaignNarrativeMood {
  readonly default?: NarrativeMood;
  readonly phases?: ReadonlyArray<NarrativeMoodPhase>;
}

export type NarrativeBlockMoods = Readonly<Partial<Record<NarrativeMoodBlock, NarrativeMood>>>;

export function normalizeNarrativeMood(value: unknown): NarrativeMood {
  return NARRATIVE_MOODS.includes(value as NarrativeMood) ? (value as NarrativeMood) : 'default';
}

function inherited(current: NarrativeMood, candidate: unknown): NarrativeMood {
  const normalized = normalizeNarrativeMood(candidate);
  return normalized === 'default' ? current : normalized;
}

/** Resolves only published, explicit scope data: campaign → phase → session → block. */
export function resolveNarrativeMood(
  campaign: Campaign | undefined,
  sessions: ReadonlyArray<Session>,
  session?: Session,
  block?: NarrativeMoodBlock,
): NarrativeMood {
  let resolved = inherited('default', campaign?.narrativeMood?.default);
  const ordered = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const targetSession = session ?? ordered.at(-1);
  if (targetSession) {
    const targetIndex = ordered.findIndex(({ id }) => id === targetSession.id);
    if (targetIndex >= 0) {
      for (const phase of campaign?.narrativeMood?.phases ?? []) {
        const milestoneIndex = ordered.findIndex(({ id }) => id === phase.startsAtSessionId);
        if (milestoneIndex >= 0 && milestoneIndex <= targetIndex) {
          resolved = inherited(resolved, phase.mood);
        }
      }
    }
  }
  if (session) {
    resolved = inherited(resolved, session.mood);
    if (block) resolved = inherited(resolved, session.blockMoods?.[block]);
  }
  return resolved;
}
