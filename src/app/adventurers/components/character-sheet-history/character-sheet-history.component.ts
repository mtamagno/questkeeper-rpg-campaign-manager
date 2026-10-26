import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

import { type CharacterSheet, type CharacterSheetSnapshot } from '@guild/models/character.model';

interface EvolutionChange {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
}

interface ComparisonRow {
  readonly id: string;
  readonly label: string;
  readonly before: string;
  readonly after: string;
  readonly group: 'identity' | 'core' | 'abilities' | 'collections';
}

@Component({
  selector: 'app-character-sheet-history',
  standalone: true,
  templateUrl: './character-sheet-history.component.html',
  styleUrl: './character-sheet-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetHistoryComponent {
  readonly snapshots = input.required<ReadonlyArray<CharacterSheetSnapshot>>();
  readonly selectedLevel = input.required<number>();
  readonly currentLevel = input.required<number>();
  readonly isItalian = input(false);
  readonly levelSelected = output<number>();
  readonly comparisonBaseLevel = signal<number | undefined>(undefined);
  readonly comparisonTargetLevel = signal<number | undefined>(undefined);

  private readonly initializeComparison = effect(() => {
    const snapshots = this.snapshots();
    if (snapshots.length === 0) {
      this.comparisonBaseLevel.set(undefined);
      this.comparisonTargetLevel.set(undefined);
      return;
    }
    const levels = snapshots.map((snapshot) => snapshot.sheet.level);
    const target = levels.includes(this.comparisonTargetLevel() ?? -1)
      ? this.comparisonTargetLevel()
      : levels.at(-1);
    const base =
      levels.includes(this.comparisonBaseLevel() ?? -1) && this.comparisonBaseLevel() !== target
        ? this.comparisonBaseLevel()
        : ([...levels].reverse().find((level) => level !== target) ?? target);
    if (this.comparisonTargetLevel() !== target) this.comparisonTargetLevel.set(target);
    if (this.comparisonBaseLevel() !== base) this.comparisonBaseLevel.set(base);
  });

  readonly selectedSnapshot = computed(() =>
    this.snapshots().find((snapshot) => snapshot.sheet.level === this.selectedLevel()),
  );

  readonly isCurrentSelection = computed(() => this.selectedLevel() === this.currentLevel());

  readonly levelRange = computed(() => {
    const snapshots = this.snapshots();
    if (snapshots.length === 0) return '';
    const first = snapshots[0].sheet.level;
    const last = snapshots[snapshots.length - 1].sheet.level;
    return first === last ? `${first}` : `${first}-${last}`;
  });

  readonly changes = computed<ReadonlyArray<EvolutionChange>>(() => {
    const snapshots = this.snapshots();
    const selectedIndex = snapshots.findIndex(
      (snapshot) => snapshot.sheet.level === this.selectedLevel(),
    );
    if (selectedIndex <= 0) return [];

    const previous = snapshots[selectedIndex - 1].sheet;
    const current = snapshots[selectedIndex].sheet;
    return this.describeChanges(previous, current);
  });

  readonly comparisonSnapshots = computed(() => {
    const snapshots = this.snapshots();
    return {
      before: snapshots.find((snapshot) => snapshot.sheet.level === this.comparisonBaseLevel()),
      after: snapshots.find((snapshot) => snapshot.sheet.level === this.comparisonTargetLevel()),
    };
  });

  readonly comparisonRows = computed<ReadonlyArray<ComparisonRow>>(() => {
    const { before, after } = this.comparisonSnapshots();
    if (before === undefined || after === undefined) return [];
    const previous = before.sheet;
    const current = after.sheet;
    const italian = this.isItalian();
    const row = (
      id: string,
      label: string,
      beforeValue: string | number,
      afterValue: string | number,
      group: ComparisonRow['group'],
    ): ComparisonRow => ({
      id,
      label,
      before: String(beforeValue),
      after: String(afterValue),
      group,
    });

    return [
      row('role', italian ? 'Ruolo' : 'Role', previous.classType, current.classType, 'identity'),
      row('origin', italian ? 'Origine' : 'Origin', previous.race, current.race, 'identity'),
      row('background', 'Background', previous.background, current.background, 'identity'),
      row('xp', 'XP', previous.experiencePoints, current.experiencePoints, 'core'),
      row(
        'hp',
        italian ? 'Punti ferita massimi' : 'Maximum hit points',
        previous.maxHitPoints,
        current.maxHitPoints,
        'core',
      ),
      row(
        'ac',
        italian ? 'Classe armatura' : 'Armor class',
        previous.armorClass,
        current.armorClass,
        'core',
      ),
      row('speed', italian ? 'Velocità' : 'Speed', previous.speed, current.speed, 'core'),
      row(
        'proficiency',
        italian ? 'Bonus competenza' : 'Proficiency bonus',
        `+${previous.proficiencyBonus}`,
        `+${current.proficiencyBonus}`,
        'core',
      ),
      row(
        'strength',
        italian ? 'Forza' : 'Strength',
        previous.abilityScores.strength,
        current.abilityScores.strength,
        'abilities',
      ),
      row(
        'dexterity',
        italian ? 'Destrezza' : 'Dexterity',
        previous.abilityScores.dexterity,
        current.abilityScores.dexterity,
        'abilities',
      ),
      row(
        'constitution',
        italian ? 'Costituzione' : 'Constitution',
        previous.abilityScores.constitution,
        current.abilityScores.constitution,
        'abilities',
      ),
      row(
        'intelligence',
        'Intelligence',
        previous.abilityScores.intelligence,
        current.abilityScores.intelligence,
        'abilities',
      ),
      row(
        'wisdom',
        italian ? 'Saggezza' : 'Wisdom',
        previous.abilityScores.wisdom,
        current.abilityScores.wisdom,
        'abilities',
      ),
      row(
        'charisma',
        'Charisma',
        previous.abilityScores.charisma,
        current.abilityScores.charisma,
        'abilities',
      ),
      row(
        'skills',
        italian ? 'Competenze' : 'Skills',
        previous.skills.length,
        current.skills.length,
        'collections',
      ),
      row(
        'features',
        italian ? 'Privilegi' : 'Features',
        previous.features.length,
        current.features.length,
        'collections',
      ),
      row(
        'spells',
        italian ? 'Incantesimi' : 'Spells',
        previous.spells?.length ?? 0,
        current.spells?.length ?? 0,
        'collections',
      ),
      row(
        'equipment',
        italian ? 'Dotazioni' : 'Equipment',
        previous.equipment.length,
        current.equipment.length,
        'collections',
      ),
    ];
  });

  selectLevel(level: number): void {
    this.levelSelected.emit(level);
  }

  selectComparison(side: 'before' | 'after', event: Event): void {
    const level = Number((event.target as HTMLSelectElement).value);
    if (!Number.isInteger(level)) return;
    if (side === 'before') this.comparisonBaseLevel.set(level);
    else this.comparisonTargetLevel.set(level);
  }

  comparisonTitle(snapshot: CharacterSheetSnapshot): string {
    const title = snapshot.title;
    if (title === undefined) {
      return `${this.isItalian() ? 'Livello' : 'Level'} ${snapshot.sheet.level}`;
    }
    return (this.isItalian() ? title.it : title.en) || title.en || title.it;
  }

  private describeChanges(
    previous: CharacterSheet,
    current: CharacterSheet,
  ): ReadonlyArray<EvolutionChange> {
    const changes: EvolutionChange[] = [];
    const italian = this.isItalian();

    this.addNumericChange(changes, 'XP', previous.experiencePoints, current.experiencePoints);
    this.addNumericChange(
      changes,
      italian ? 'Punti ferita' : 'Hit points',
      previous.maxHitPoints,
      current.maxHitPoints,
    );
    this.addNumericChange(
      changes,
      italian ? 'Classe armatura' : 'Armor class',
      previous.armorClass,
      current.armorClass,
    );
    this.addNumericChange(
      changes,
      italian ? 'Competenza' : 'Proficiency',
      previous.proficiencyBonus,
      current.proficiencyBonus,
    );
    this.addNumericChange(changes, italian ? 'Velocità' : 'Speed', previous.speed, current.speed);

    const abilityLabels: ReadonlyArray<
      readonly [keyof CharacterSheet['abilityScores'], string, string]
    > = [
      ['strength', 'FOR', 'STR'],
      ['dexterity', 'DES', 'DEX'],
      ['constitution', 'COS', 'CON'],
      ['intelligence', 'INT', 'INT'],
      ['wisdom', 'SAG', 'WIS'],
      ['charisma', 'CAR', 'CHA'],
    ];
    for (const [ability, labelIt, labelEn] of abilityLabels) {
      this.addNumericChange(
        changes,
        italian ? labelIt : labelEn,
        previous.abilityScores[ability],
        current.abilityScores[ability],
      );
    }

    const newFeatures = this.countNewEntries(previous.features, current.features);
    if (newFeatures > 0) {
      changes.push({
        label: italian ? 'Nuovi privilegi' : 'New features',
        value: `+${newFeatures}`,
        detail: this.newEntries(previous.features, current.features).join(' · '),
      });
    }

    const newSpells = this.countNewEntries(previous.spells ?? [], current.spells ?? []);
    if (newSpells > 0) {
      changes.push({
        label: italian ? 'Nuovi incantesimi' : 'New spells',
        value: `+${newSpells}`,
        detail: this.newEntries(previous.spells ?? [], current.spells ?? []).join(' · '),
      });
    }

    const newSkills = this.countNewEntries(previous.skills, current.skills);
    if (newSkills > 0) {
      changes.push({
        label: italian ? 'Nuove abilità' : 'New skills',
        value: `+${newSkills}`,
        detail: this.newEntries(previous.skills, current.skills).join(' · '),
      });
    }

    const newEquipment = this.countNewEntries(previous.equipment, current.equipment);
    if (newEquipment > 0) {
      changes.push({
        label: italian ? 'Nuove dotazioni' : 'New gear',
        value: `+${newEquipment}`,
        detail: this.newEntries(previous.equipment, current.equipment).join(' · '),
      });
    }

    return changes;
  }

  private addNumericChange(
    changes: EvolutionChange[],
    label: string,
    previous: number,
    current: number,
  ): void {
    const delta = current - previous;
    if (delta === 0) return;
    changes.push({ label, value: delta > 0 ? `+${delta}` : String(delta) });
  }

  private countNewEntries(previous: ReadonlyArray<string>, current: ReadonlyArray<string>): number {
    return this.newEntries(previous, current).length;
  }

  private newEntries(
    previous: ReadonlyArray<string>,
    current: ReadonlyArray<string>,
  ): ReadonlyArray<string> {
    const existing = new Set(previous.map((entry) => entry.toLocaleLowerCase()));
    return current.filter((entry) => !existing.has(entry.toLocaleLowerCase()));
  }
}
