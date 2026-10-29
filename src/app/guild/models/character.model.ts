/**
 * Character data models for player characters (PCs).
 * Covers public profile, private profile, character sheet, gallery, and session diary.
 */

import { type BilingualText } from '@guild/models/language.model';

/** Default password for protected character sections when none is configured. */
export const DEFAULT_CHARACTER_PASSWORD = 'cambiami';

/** Image reference used throughout the app (gallery, avatars, maps). */
export interface ImageRef {
  readonly url: string;
  readonly alt: string;
  readonly caption?: string;
}

/** Localized illustration attached to one public lore chapter. */
export interface CharacterLoreImage {
  readonly url: string;
  readonly alt: BilingualText;
  readonly caption?: BilingualText;
}

/** One illustrated, public chapter from a character's life before the adventure. */
export interface CharacterLoreChapter {
  readonly id: string;
  readonly title: BilingualText;
  readonly period?: BilingualText;
  readonly body: BilingualText;
  readonly image?: CharacterLoreImage;
}

/** Public artifact that can substantiate a character memory without duplicating it. */
export type CharacterStorySourceKind = 'chapter' | 'notebook' | 'diary' | 'quote' | 'chronicle';

export interface CharacterStoryReference {
  readonly kind: CharacterStorySourceKind;
  /** Chapter/page/session/story ID when a more precise source is available. */
  readonly id?: string;
  /** Human-readable source label; the route remains derived from `kind`. */
  readonly label: BilingualText;
}

/** A compact, non-mechanical fact that helps recognise a character quickly. */
export interface CharacterQuickFact {
  readonly id: string;
  readonly label: BilingualText;
  readonly value: BilingualText;
}

/** A meaningful possession described as part of the character's story, not inventory state. */
export interface CharacterSignatureItem {
  readonly id: string;
  readonly name: BilingualText;
  readonly description: BilingualText;
  readonly source?: CharacterStoryReference;
}

/** A character-owned recollection linked back to a published public source. */
export interface CharacterFavouriteMoment {
  readonly id: string;
  readonly title: BilingualText;
  readonly summary: BilingualText;
  readonly source: CharacterStoryReference;
}

/** Public profile — lore the party knows about this character. */
export interface CharacterPublicProfile {
  readonly backstory: BilingualText;
  readonly traits: BilingualText;
  readonly ideals: BilingualText;
  readonly bonds: BilingualText;
  readonly flaws: BilingualText;
  readonly knownHistory: BilingualText;
  /** Everyday interests, comforts and habits established during play. */
  readonly hobbies?: BilingualText;
  /** Short authored facts for the compact opening profile. */
  readonly quickFacts?: ReadonlyArray<CharacterQuickFact>;
  /** Story-significant possessions; never inferred from the mechanical inventory. */
  readonly signatureItems?: ReadonlyArray<CharacterSignatureItem>;
  /** Subjective favourite memories with an explicit public evidence link. */
  readonly favouriteMoments?: ReadonlyArray<CharacterFavouriteMoment>;
}

/** Private profile — secrets only the player and DM know. */
export interface CharacterPrivateProfile {
  readonly secretBackstory: BilingualText;
  readonly hiddenMotivations: BilingualText;
  readonly secrets: ReadonlyArray<BilingualText>;
  readonly dmNotes: BilingualText;
}

/** Visual mood used to style a page from a character-owned notebook. */
export type CharacterNotebookMood =
  | 'joyful'
  | 'tender'
  | 'calm'
  | 'hopeful'
  | 'mysterious'
  | 'wary'
  | 'uneasy'
  | 'fractured'
  | 'grief'
  | 'guilt'
  | 'memory'
  | 'time'
  | 'music'
  | 'renewal';

/** Notebook copy may be authored in one language or localized per campaign. */
export type CharacterNotebookText = string | BilingualText;

/** One complete illustrated two-page spread from a character's notebook. */
export interface CharacterNotebookPage {
  readonly id: string;
  readonly title: CharacterNotebookText;
  readonly era: BilingualText;
  readonly image: ImageRef;
  readonly reflection: CharacterNotebookText;
  readonly mood: CharacterNotebookMood;
}

/** Optional separately protected visual notebook attached to a character. */
export interface CharacterNotebook {
  readonly title: BilingualText;
  readonly description: BilingualText;
  readonly password: string;
  /** Per-character art direction used by manual authors and AI draft tools. */
  readonly styleDirectives?: string;
  /** Optional 2:3 portrait covers shown before and after the spreads. */
  readonly frontCover?: ImageRef;
  readonly backCover?: ImageRef;
  readonly pages: ReadonlyArray<CharacterNotebookPage>;
}

/** Ability scores block. */
export interface AbilityScores {
  readonly strength: number;
  readonly dexterity: number;
  readonly constitution: number;
  readonly intelligence: number;
  readonly wisdom: number;
  readonly charisma: number;
}

/** Coin carried by a character, split by common fantasy denominations. */
export interface CharacterCurrency {
  readonly cp?: number;
  readonly sp?: number;
  readonly ep?: number;
  readonly gp?: number;
  readonly pp?: number;
}

/** When a table-side resource normally becomes available again. */
export type CharacterResourceRecovery = 'short-rest' | 'long-rest' | 'dawn' | 'manual';

/** A finite class, ancestry, item or encounter resource visible at a glance. */
export interface CharacterCombatResource {
  readonly id: string;
  readonly name: string;
  readonly current: number;
  readonly maximum: number;
  readonly recovery?: CharacterResourceRecovery;
  readonly note?: string;
}

/** Broad inventory grouping used for scanning, not rules automation. */
export type CharacterInventoryCategory =
  'weapon' | 'armor' | 'consumable' | 'tool' | 'quest' | 'gear' | 'other';

/** A structured carried item. Legacy `equipment` strings remain fully supported. */
export interface CharacterInventoryItem {
  readonly id: string;
  readonly name: string;
  readonly quantity?: number;
  readonly category?: CharacterInventoryCategory;
  readonly equipped?: boolean;
  readonly note?: string;
}

/** A pool of spell slots for one spell level. */
export interface CharacterSpellSlots {
  readonly level: number;
  readonly total: number;
  readonly used?: number;
}

/** Spellcasting values that cannot always be inferred from the base sheet. */
export interface CharacterSpellcasting {
  readonly ability:
    'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
  readonly spellSaveDC?: number;
  readonly spellAttackBonus?: number;
  readonly slots?: ReadonlyArray<CharacterSpellSlots>;
}

/** Character sheet — six-ability fantasy RPG stats and equipment. */
export interface CharacterSheet {
  readonly level: number;
  readonly classType: string;
  readonly subclass?: string;
  readonly race: string;
  readonly background: string;
  readonly alignment: string;
  readonly experiencePoints: number;
  readonly hitPoints: number;
  readonly maxHitPoints: number;
  readonly armorClass: number;
  readonly speed: number;
  readonly proficiencyBonus: number;
  readonly abilityScores: AbilityScores;
  readonly savingThrows: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<string>;
  readonly languages: ReadonlyArray<string>;
  /** Legacy inventory source retained for old campaigns and level-history comparison. */
  readonly equipment: ReadonlyArray<string>;
  /** Optional structured inventory used by the fast table view. */
  readonly inventory?: ReadonlyArray<CharacterInventoryItem>;
  /** Optional finite pools shown beside the combat essentials. */
  readonly combatResources?: ReadonlyArray<CharacterCombatResource>;
  readonly features: ReadonlyArray<string>;
  readonly spells?: ReadonlyArray<string>;
  readonly currency?: CharacterCurrency;
  readonly spellcasting?: CharacterSpellcasting;
}

/** Immutable character-sheet snapshot kept when the character gains a level. */
export interface CharacterSheetSnapshot {
  readonly sheet: CharacterSheet;
  readonly title?: BilingualText;
  readonly recordedAt?: string;
}

/** A single entry in the character's session diary. */
export interface DiaryEntry {
  readonly sessionId: string;
  readonly date: string;
  readonly title: BilingualText;
  readonly content: BilingualText;
}

/**
 * Per-session knowledge snapshot — what the character did and learned during a session.
 * @param sessionId - Reference to the session.
 * @param actions - What the character did during the session.
 * @param knownInfo - What the character (and player) knows by the end of the session.
 */
export interface SessionKnowledge {
  readonly sessionId: string;
  readonly actions: ReadonlyArray<BilingualText>;
  readonly knownInfo: ReadonlyArray<BilingualText>;
}

/** An iconic quote from a character during a session. */
export interface CharacterQuote {
  readonly sessionId: string;
  readonly text: BilingualText;
  readonly context?: BilingualText;
}

/** Full player character entity. */
export interface Character {
  readonly id: string;
  readonly name: string;
  readonly sex: BilingualText;
  /** Optional self-authored forms of address; never inferred from name, art, voice, or sex/gender. */
  readonly pronouns?: BilingualText;
  /** Canonical standing height, useful for profiles and proportion guides. */
  readonly heightCm?: number;
  readonly playerName?: string;
  readonly avatar: ImageRef;
  readonly gallery: ReadonlyArray<ImageRef>;
  /** Square face or bust image shown on the left side of the profile header. */
  readonly profileImageUrl: string;
  /** 2:3 full portrait shown on the right side of the profile header. */
  readonly portraitImageUrl: string;
  /** Optional illustrated chapters that replace the single public backstory block. */
  readonly loreChapters?: ReadonlyArray<CharacterLoreChapter>;
  readonly publicProfile: CharacterPublicProfile;
  readonly privateProfile: CharacterPrivateProfile;
  /** Optional visual journal with its own password and unlock state. */
  readonly notebook?: CharacterNotebook;
  /** Older level snapshots. The current version always remains in `sheet`. */
  readonly sheetHistory?: ReadonlyArray<CharacterSheetSnapshot>;
  readonly sheet: CharacterSheet;
  readonly diary: ReadonlyArray<DiaryEntry>;
  readonly sessionKnowledge: ReadonlyArray<SessionKnowledge>;
  readonly quotes: ReadonlyArray<CharacterQuote>;
  readonly password?: string;
}
