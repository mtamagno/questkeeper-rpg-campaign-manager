/**
 * Relationship models for party and NPC connection graphs.
 * Used to render visual relationship maps.
 */

import { type BilingualText } from '@guild/models/language.model';

/** Types of relationships between characters. */
export const RELATIONSHIP_TYPES = {
  FRIENDSHIP: 'friendship',
  RIVALRY: 'rivalry',
  ALLIANCE: 'alliance',
  ROMANCE: 'romance',
  FAMILY: 'family',
  MENTOR: 'mentor',
  ENEMY: 'enemy',
  NEUTRAL: 'neutral',
  DISTRUST: 'distrust',
  RESPECT: 'respect',
} as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[keyof typeof RELATIONSHIP_TYPES];

/**
 * A directed relationship edge in the graph.
 * @param sourceId - The character/NPC who holds this relationship.
 * @param targetId - The character/NPC they have a relationship with.
 * @param type - The nature of the relationship.
 * @param description - A short description of their bond.
 * @param isBidirectional - Whether the relationship is mutual.
 * @param sharedEvents - Key moments that shaped this relationship.
 * @param quotes - Memorable dialogue between the two characters.
 * @param evolution - How the relationship changed over time.
 * @param perspectives - Directional feelings held by each person in the relationship.
 * @param partyPerception - How the party knows or infers this public relationship.
 */
export interface Relationship {
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: RelationshipType;
  readonly description: BilingualText;
  readonly isBidirectional: boolean;
  readonly sharedEvents?: ReadonlyArray<SharedEvent>;
  readonly quotes?: ReadonlyArray<RelationshipQuote>;
  readonly evolution?: ReadonlyArray<RelationshipEvolution>;
  readonly perspectives?: ReadonlyArray<RelationshipPerspective>;
  readonly partyPerception?: PartyRelationshipPerception;
}

/** How strongly the public relationship is supported by the party's experience. */
export const PARTY_PERCEPTION_CERTAINTIES = {
  OBSERVED: 'observed',
  REPORTED: 'reported',
  INFERRED: 'inferred',
} as const;

export type PartyPerceptionCertainty =
  (typeof PARTY_PERCEPTION_CERTAINTIES)[keyof typeof PARTY_PERCEPTION_CERTAINTIES];

/**
 * Makes the public epistemic boundary explicit, especially for NPC-to-NPC bonds.
 * It records what the party has observed, been told or reasonably inferred,
 * never private GM truth.
 */
export interface PartyRelationshipPerception {
  readonly certainty: PartyPerceptionCertainty;
  readonly basis: BilingualText;
}

/** Bilingual labels for the source of a party assessment. */
export const PARTY_PERCEPTION_LABELS: Readonly<Record<PartyPerceptionCertainty, BilingualText>> = {
  observed: { en: 'Observed', it: 'Osservata' },
  reported: { en: 'Reported', it: 'Riferita' },
  inferred: { en: 'Inferred', it: 'Dedotta' },
} as const;

/**
 * One person's current emotional reading of a relationship.
 * A relationship keeps one canonical type, while each participant may hold
 * several simultaneous, independently rated feelings.
 */
export interface RelationshipPerspective {
  /** Entity whose point of view is being recorded. */
  readonly entityId: string;
  /** Feelings currently supported by published campaign evidence. */
  readonly feelings: ReadonlyArray<RelationshipFeeling>;
}

/** A named feeling, its strength and the concrete reason behind it. */
export interface RelationshipFeeling {
  readonly label: BilingualText;
  /** Narrative intensity from 1 (faint) to 5 (defining). */
  readonly intensity: number;
  /** Evidence-based explanation; never an unevidenced personality inference. */
  readonly reason: BilingualText;
}

/**
 * A key event that shaped a relationship, tied to a specific session.
 * @param sessionId - The session where this event occurred.
 * @param title - Short title of the event.
 * @param description - What happened and how it affected the relationship.
 */
export interface SharedEvent {
  readonly sessionId: string;
  readonly title: BilingualText;
  readonly description: BilingualText;
}

/**
 * A memorable quote or dialogue exchange between two characters.
 * @param sessionId - The session where this was said.
 * @param speakerId - Who said it (sourceId or targetId).
 * @param text - The quote text.
 */
export interface RelationshipQuote {
  readonly sessionId: string;
  readonly speakerId: string;
  readonly text: BilingualText;
}

/**
 * A snapshot of how the relationship evolved at a point in time.
 * @param sessionId - The session that triggered this evolution.
 * @param fromType - The relationship type before the change (optional for initial state).
 * @param toType - The relationship type after the change.
 * @param note - Explanation of what caused the shift.
 */
export interface RelationshipEvolution {
  readonly sessionId: string;
  readonly fromType?: RelationshipType;
  readonly toType: RelationshipType;
  readonly note: BilingualText;
}

/**
 * Node type in the relationship graph.
 * Used to visually distinguish PCs from NPCs.
 */
export const NODE_TYPES = {
  PC: 'pc',
  NPC: 'npc',
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

/** Bilingual labels for relationship types. */
export const RELATIONSHIP_TYPE_LABELS: Readonly<Record<RelationshipType, BilingualText>> = {
  friendship: { en: 'Friendship', it: 'Amicizia' },
  rivalry: { en: 'Rivalry', it: 'Rivalità' },
  alliance: { en: 'Alliance', it: 'Alleanza' },
  romance: { en: 'Romance', it: 'Romanticismo' },
  family: { en: 'Family', it: 'Famiglia' },
  mentor: { en: 'Mentor', it: 'Mentore' },
  enemy: { en: 'Enemy', it: 'Nemico' },
  neutral: { en: 'Neutral', it: 'Neutrale' },
  distrust: { en: 'Distrust', it: 'Diffidenza' },
  respect: { en: 'Respect', it: 'Rispetto' },
} as const;

/** Emoji icons for relationship types — used in graph edges and legend. */
export const RELATIONSHIP_TYPE_EMOJIS: Readonly<Record<RelationshipType, string>> = {
  friendship: '🤝',
  rivalry: '⚔️',
  alliance: '🛡️',
  romance: '❤️',
  family: '🏠',
  mentor: '📖',
  enemy: '💀',
  neutral: '➖',
  distrust: '👁️',
  respect: '⭐',
} as const;

/** A node in the relationship graph (represents a character or NPC). */
export interface RelationshipNode {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly nodeType: NodeType;
}
