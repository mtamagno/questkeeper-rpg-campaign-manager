/**
 * NPC data models for non-player characters.
 * Simpler than PC models — no character sheet, no password-protected sections.
 */

import type { BilingualText, LocalizedText } from '@guild/models/language.model';
import type { ImageRef } from './character.model';

/** NPC profile — public information about the NPC. */
export interface NpcProfile {
  readonly description: BilingualText;
  readonly role: BilingualText;
  readonly personality: BilingualText;
  readonly location: BilingualText;
  readonly knownHistory: BilingualText;
}

/** NPC allegiance — relationship with the party. */
export const NPC_ALLEGIANCES = {
  ALLY: 'ally',
  ENEMY: 'enemy',
  NEUTRAL: 'neutral',
} as const;

export type NpcAllegiance = (typeof NPC_ALLEGIANCES)[keyof typeof NPC_ALLEGIANCES];

/** NPC entity with display labels resolved for the active campaign locale. */
export interface Npc {
  readonly id: string;
  readonly name: string;
  readonly sex: BilingualText;
  readonly title?: string;
  readonly profileImageUrl?: string;
  readonly portraitImageUrl?: string;
  readonly avatar: ImageRef;
  readonly gallery: ReadonlyArray<ImageRef>;
  readonly profile: NpcProfile;
  readonly allegiance: NpcAllegiance;
  readonly isAlive: boolean;
  readonly category?: string;
  /** When true, the NPC is hidden from the sidebar but still listed in the full NPC page. */
  readonly isMinor?: boolean;
}

/** Campaign JSON accepts both legacy strings and translated labels. */
export interface NpcSource extends Omit<Npc, 'name' | 'title'> {
  readonly name: string | LocalizedText;
  readonly title?: string | LocalizedText;
}

export function localizeNpc(
  npc: NpcSource,
  resolve: (value: LocalizedText | undefined) => string,
): Npc {
  const name = typeof npc.name === 'string' ? npc.name : resolve(npc.name);
  const title = typeof npc.title === 'string' ? npc.title : resolve(npc.title);
  return { ...npc, name: name || npc.id, title: title || undefined };
}
