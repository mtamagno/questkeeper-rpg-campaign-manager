/**
 * Character sheet section — password-protected fantasy RPG stats.
 * Displays ability scores, skills, equipment, and features.
 */

import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  effect,
  inject,
  input,
  signal,
  computed,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { PasswordService } from '@guild/services/password.service';
import {
  type CharacterPublicProfile,
  type CharacterCombatResource,
  type CharacterAttunementState,
  type CharacterInventoryCategory,
  type CharacterSignatureItem,
  type CharacterSheet as CharacterSheetModel,
  type CharacterSheetSnapshot,
} from '@guild/models/character.model';
import { LanguageService } from '@guild/services/language.service';
import { type BilingualText } from '@guild/models/language.model';
import { CampaignService } from '@guild/services/campaign.service';
import {
  CharacterReadingPositionService,
  SAFE_SHEET_ANCHORS,
  type SafeSheetAnchor,
} from '@guild/services/characterReadingPosition.service';
import { PasswordDialogComponent } from '@guild/components/password-dialog/password-dialog.component';
import { CharacterSheetHistoryComponent } from '../character-sheet-history/character-sheet-history.component';
import { CharacterSheetNavigationComponent } from '../character-sheet-navigation/character-sheet-navigation.component';
import { CharacterRuleLibraryComponent } from '../character-rule-library/character-rule-library.component';
import {
  combatResourceViews,
  inventoryViews,
  type CharacterInventoryView,
} from '../../utils/characterSheetPresentation';

interface AbilityScoreEntry {
  readonly name: string;
  readonly value: number;
  readonly modifier: string;
}

interface CurrencyEntry {
  readonly code: string;
  readonly value: number;
  readonly label: string;
}

interface InventoryStoryView extends CharacterInventoryView {
  readonly signatureItem?: CharacterSignatureItem;
}

/**
 * Displays a fantasy RPG character sheet behind password protection.
 * Shares unlock state with PrivateProfileComponent via PasswordService.
 */
@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [
    PasswordDialogComponent,
    CharacterSheetHistoryComponent,
    CharacterSheetNavigationComponent,
    CharacterRuleLibraryComponent,
  ],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetComponent {
  private readonly passwordService = inject(PasswordService);
  private readonly languageService = inject(LanguageService);
  private readonly campaignService = inject(CampaignService);
  private readonly readingPosition = inject(CharacterReadingPositionService);
  private restoredIdentity = '';
  private scrollFrame: number | undefined;
  private isRestoringPosition = false;

  /** Shared terminology profile used by the Companion and PDF export. */
  readonly rulesetProfile = this.campaignService.activeRuleset;

  /** Whether the current interface language is Italian. */
  readonly isItalian = computed(() => this.languageService.currentLanguage() === 'it');

  /** Character ID for password state tracking. */
  readonly characterId = input.required<string>();

  /** Character name for dialog display. */
  readonly characterName = input.required<string>();

  /** The latest character sheet, exposed to templates through the selected snapshot. */
  // The alias keeps the public template binding concise while distinguishing
  // the input from the selected historical sheet exposed below.
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly currentSheet = input.required<CharacterSheetModel>({ alias: 'sheet' });

  /** Immutable sheets preserved from earlier levels. */
  readonly sheetHistory = input<ReadonlyArray<CharacterSheetSnapshot>>([]);

  /** Public lore included in the printable character dossier. */
  readonly publicProfile = input<CharacterPublicProfile>();

  /** Optional self-authored pronouns included once in the printable dossier. */
  readonly pronouns = input<BilingualText>();

  /** Character artwork included in the printable character dossier. */
  readonly profileImageUrl = input<string>();
  readonly portraitImageUrl = input<string>();

  /** Explicitly selected archived level; undefined means the latest sheet. */
  readonly selectedLevel: WritableSignal<number | undefined> = signal(undefined);

  /** Complete chronological timeline, with the latest sheet always included. */
  readonly sheetSnapshots: Signal<ReadonlyArray<CharacterSheetSnapshot>> = computed(() => {
    const current = this.currentSheet();
    const snapshotsByLevel = new Map<number, CharacterSheetSnapshot>(
      this.sheetHistory().map((snapshot) => [snapshot.sheet.level, snapshot]),
    );
    const existingCurrent = snapshotsByLevel.get(current.level);
    snapshotsByLevel.set(current.level, {
      ...existingCurrent,
      sheet: current,
    });
    return [...snapshotsByLevel.values()].sort((a, b) => a.sheet.level - b.sheet.level);
  });

  /** Sheet shown on screen and exported to PDF. */
  readonly sheet: Signal<CharacterSheetModel> = computed(() => {
    const requestedLevel = this.selectedLevel();
    return (
      this.sheetSnapshots().find((snapshot) => snapshot.sheet.level === requestedLevel)?.sheet ??
      this.currentSheet()
    );
  });

  /** Metadata belonging to the selected sheet snapshot. */
  readonly activeSnapshot: Signal<CharacterSheetSnapshot | undefined> = computed(() =>
    this.sheetSnapshots().find((snapshot) => snapshot.sheet.level === this.sheet().level),
  );

  /** The stored password to verify against. */
  readonly password = input.required<string>();

  /** Whether the password dialog is currently open. */
  readonly isDialogOpen: WritableSignal<boolean> = signal(false);

  /** Whether the last password attempt was incorrect. */
  readonly hasPasswordError: WritableSignal<boolean> = signal(false);

  /** Whether the printable PDF is currently being generated. */
  readonly isGeneratingPdf: WritableSignal<boolean> = signal(false);

  /** User-facing error raised if PDF generation fails. */
  readonly pdfError: WritableSignal<boolean> = signal(false);

  /** Whether this character is already unlocked. */
  readonly isUnlocked: Signal<boolean> = computed(() =>
    this.passwordService.isUnlocked(this.characterId())(),
  );

  private readonly restoreReadingPosition = effect(() => {
    const campaignId = this.campaignService.activeCampaignId();
    const characterId = this.characterId();
    const unlocked = this.isUnlocked();
    const identity = `${campaignId ?? ''}:${characterId}`;
    if (!unlocked) {
      this.restoredIdentity = '';
      return;
    }
    if (this.restoredIdentity === identity) return;
    this.restoredIdentity = identity;

    const anchor = this.readingPosition.get(campaignId, characterId)?.sheetAnchor;
    if (anchor === undefined) return;
    this.isRestoringPosition = true;
    setTimeout(() => {
      this.scrollToSection(anchor, false);
      setTimeout(() => (this.isRestoringPosition = false), 500);
    });
  });

  /** Whether the character sheet is empty (not yet compiled). */
  readonly isSheetEmpty: Signal<boolean> = computed(() => {
    const sheetData = this.sheet();
    return sheetData.level === 0 && sheetData.maxHitPoints === 0;
  });

  /** Formatted ability scores for display. */
  readonly abilityScoreEntries: Signal<ReadonlyArray<AbilityScoreEntry>> = computed(() => {
    const scores = this.sheet().abilityScores;
    return [
      { name: 'STR', value: scores.strength, modifier: this.formatModifier(scores.strength) },
      { name: 'DEX', value: scores.dexterity, modifier: this.formatModifier(scores.dexterity) },
      {
        name: 'CON',
        value: scores.constitution,
        modifier: this.formatModifier(scores.constitution),
      },
      {
        name: 'INT',
        value: scores.intelligence,
        modifier: this.formatModifier(scores.intelligence),
      },
      { name: 'WIS', value: scores.wisdom, modifier: this.formatModifier(scores.wisdom) },
      { name: 'CHA', value: scores.charisma, modifier: this.formatModifier(scores.charisma) },
    ];
  });

  /** Initiative derived from Dexterity. */
  readonly initiativeModifier: Signal<string> = computed(() =>
    this.formatModifier(this.sheet().abilityScores.dexterity),
  );

  /** Passive Perception, including proficiency when Perception is listed. */
  readonly passivePerception: Signal<number> = computed(() => {
    const data = this.sheet();
    const wisdomModifier = this.modifierValue(data.abilityScores.wisdom);
    const hasProficiency = data.skills.some((skill) => {
      const normalized = this.normalizeSpellName(skill);
      return normalized === 'perception' || normalized === 'percezione';
    });
    return 10 + wisdomModifier + (hasProficiency ? data.proficiencyBonus : 0);
  });

  /** Structured currency displayed in the top summary rather than inventory. */
  readonly currencyEntries: Signal<ReadonlyArray<CurrencyEntry>> = computed(() => {
    const currency = this.sheet().currency;
    if (currency === undefined) return [];
    const values: ReadonlyArray<CurrencyEntry> = [
      { code: 'PP', value: currency.pp ?? 0, label: this.isItalian() ? 'Platino' : 'Platinum' },
      { code: 'GP', value: currency.gp ?? 0, label: this.isItalian() ? 'Oro' : 'Gold' },
      { code: 'EP', value: currency.ep ?? 0, label: this.isItalian() ? 'Elettro' : 'Electrum' },
      { code: 'SP', value: currency.sp ?? 0, label: this.isItalian() ? 'Argento' : 'Silver' },
      { code: 'CP', value: currency.cp ?? 0, label: this.isItalian() ? 'Rame' : 'Copper' },
    ];
    return values.filter((entry) => entry.value > 0);
  });

  /** Structured inventory with transparent support for legacy string-only sheets. */
  readonly inventoryItems: Signal<ReadonlyArray<InventoryStoryView>> = computed(() => {
    const signatureItems = new Map(
      (this.publicProfile()?.signatureItems ?? []).map((item) => [item.id, item]),
    );
    return inventoryViews(this.sheet()).map((item) => ({
      ...item,
      signatureItem: item.signatureItemId ? signatureItems.get(item.signatureItemId) : undefined,
    }));
  });

  readonly attunedItemCount = computed(
    () => this.inventoryItems().filter((item) => item.attunement === 'attuned').length,
  );

  /** Finite resources, defensively clamped for a trustworthy table view. */
  readonly combatResources: Signal<ReadonlyArray<CharacterCombatResource>> = computed(() =>
    combatResourceViews(this.sheet().combatResources),
  );

  inventoryCategoryLabel(category: CharacterInventoryCategory): string {
    const labels: Readonly<Record<CharacterInventoryCategory, readonly [string, string]>> = {
      weapon: ['Arma', 'Weapon'],
      armor: ['Armatura', 'Armor'],
      consumable: ['Consumabile', 'Consumable'],
      tool: ['Strumento', 'Tool'],
      quest: ['Missione', 'Quest'],
      gear: ['Equipaggiamento', 'Gear'],
      other: ['Altro', 'Other'],
    };
    return labels[category][this.isItalian() ? 0 : 1];
  }

  attunementLabel(state: CharacterAttunementState): string {
    const labels: Readonly<Record<CharacterAttunementState, readonly [string, string]>> = {
      'not-required': ['Nessuna sintonia', 'No attunement'],
      required: ['Richiede sintonia', 'Requires attunement'],
      attuned: ['In sintonia', 'Attuned'],
    };
    return labels[state][this.isItalian() ? 0 : 1];
  }

  storyText(value: BilingualText): string {
    return this.isItalian() ? value.it || value.en : value.en || value.it;
  }

  resourceRecoveryLabel(resource: CharacterCombatResource): string {
    const labels = {
      'short-rest': ['Riposo breve', 'Short rest'],
      'long-rest': ['Riposo lungo', 'Long rest'],
      dawn: ['All’alba', 'At dawn'],
      manual: ['Manuale', 'Manual'],
    } as const;
    const recovery = resource.recovery ?? 'manual';
    return labels[recovery][this.isItalian() ? 0 : 1];
  }

  resourceFill(resource: CharacterCombatResource): string {
    if (resource.maximum <= 0) return '0%';
    return `${Math.round((resource.current / resource.maximum) * 100)}%`;
  }

  /** Opens the password dialog. */
  openDialog(): void {
    this.hasPasswordError.set(false);
    this.isDialogOpen.set(true);
  }

  /** Closes the password dialog. */
  closeDialog(): void {
    this.isDialogOpen.set(false);
    this.hasPasswordError.set(false);
  }

  /**
   * Attempts to unlock with the provided password.
   * @param inputPassword - The password entered by the user.
   */
  onPasswordSubmit(inputPassword: string): void {
    const success = this.passwordService.unlock(this.characterId(), inputPassword, this.password());

    if (success) {
      this.isDialogOpen.set(false);
      this.hasPasswordError.set(false);
    } else {
      this.hasPasswordError.set(true);
    }
  }

  /** Opens a preserved version of the sheet without affecting the latest data. */
  selectSheetLevel(level: number): void {
    this.selectedLevel.set(level === this.currentSheet().level ? undefined : level);
  }

  /** Returns from an archived sheet to the character's latest level. */
  showCurrentSheet(): void {
    this.selectedLevel.set(undefined);
  }

  /** Scrolls to a section without causing an Angular route navigation. */
  scrollToSection(section: string, remember = true): void {
    if (!SAFE_SHEET_ANCHORS.includes(section as SafeSheetAnchor)) return;
    if (remember) {
      this.readingPosition.rememberSheet(
        this.campaignService.activeCampaignId(),
        this.characterId(),
        section as SafeSheetAnchor,
      );
    }
    document
      .getElementById(`character-sheet-${section}-${this.characterId()}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  @HostListener('window:scroll')
  rememberVisibleSection(): void {
    if (!this.isUnlocked() || this.isRestoringPosition || this.scrollFrame !== undefined) return;
    this.scrollFrame = requestAnimationFrame(() => {
      this.scrollFrame = undefined;
      const visible = SAFE_SHEET_ANCHORS.map((anchor) => ({
        anchor,
        element: document.getElementById(`character-sheet-${anchor}-${this.characterId()}`),
      }))
        .filter((entry) => entry.element !== null)
        .map((entry) => ({
          ...entry,
          distance: Math.abs(entry.element!.getBoundingClientRect().top - 160),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (visible !== undefined) {
        this.readingPosition.rememberSheet(
          this.campaignService.activeCampaignId(),
          this.characterId(),
          visible.anchor,
        );
      }
    });
  }

  /** Builds and downloads a three-page illustrated PDF in the active language. */
  async downloadPdf(): Promise<void> {
    if (this.isGeneratingPdf()) return;

    this.isGeneratingPdf.set(true);
    this.pdfError.set(false);
    try {
      const { generateCampaignCharacterSheetPdf } =
        await import('../../services/campaignCharacterSheetPdf.service');
      const language = this.isItalian() ? 'it' : 'en';
      const blob = await generateCampaignCharacterSheetPdf(
        this.characterName(),
        this.sheet(),
        language,
        {
          publicProfile: this.publicProfile(),
          pronouns: this.pronouns(),
          profileImageUrl: this.profileImageUrl(),
          portraitImageUrl: this.portraitImageUrl(),
          chapterTitle: this.activeSnapshot()?.title,
          recordedAt: this.activeSnapshot()?.recordedAt,
          identityLabels: Object.fromEntries(
            this.rulesetProfile().fields.map((field) => [field.storageKey, field.labels[language]]),
          ),
        },
      );
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${this.slugify(this.characterName())}-level-${this.sheet().level}-character-sheet-${language}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      this.pdfError.set(true);
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  /**
   * Calculates the ability modifier from an ability score.
   * @param score - The raw ability score (1-30).
   * @returns Formatted modifier string (e.g. "+2", "-1").
   */
  private formatModifier(score: number): string {
    return this.formatSignedNumber(this.modifierValue(score));
  }

  private modifierValue(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  private formatSignedNumber(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  private normalizeSpellName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private slugify(value: string): string {
    return this.normalizeSpellName(value).replace(/\s+/g, '-');
  }
}
