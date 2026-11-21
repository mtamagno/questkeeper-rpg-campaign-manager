import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { type CharacterSheet, type CharacterSheetSnapshot } from '@guild/models/character.model';
import { UiTextService } from '@guild/services/uiText.service';

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
  readonly state: 'unchanged' | 'increased' | 'decreased' | 'changed';
  readonly delta?: string;
}

interface CollectionChange {
  readonly id: 'skills' | 'features' | 'spells' | 'equipment';
  readonly label: string;
  readonly gained: ReadonlyArray<string>;
  readonly lost: ReadonlyArray<string>;
}

@Component({
  selector: 'app-character-sheet-history',
  standalone: true,
  templateUrl: './character-sheet-history.component.html',
  styleUrl: './character-sheet-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetHistoryComponent {
  readonly uiText = inject(UiTextService);
  readonly snapshots = input.required<ReadonlyArray<CharacterSheetSnapshot>>();
  readonly selectedLevel = input.required<number>();
  readonly currentLevel = input.required<number>();
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
    const row = (
      id: string,
      label: string,
      beforeValue: string | number,
      afterValue: string | number,
      group: ComparisonRow['group'],
      formatter: (value: string | number) => string = String,
      forceChanged = false,
    ): ComparisonRow => ({
      id,
      label,
      before: formatter(beforeValue),
      after: formatter(afterValue),
      group,
      ...this.changeState(beforeValue, afterValue, forceChanged),
    });

    const collections = this.collectionChangesFor(previous, current);
    const collection = (id: CollectionChange['id']) =>
      collections.find((change) => change.id === id)!;

    return [
      row('role', this.uiText.text('characterUi.sheetHistory.fields.role'), previous.classType, current.classType, 'identity'),
      row('origin', this.uiText.text('characterUi.sheetHistory.fields.origin'), previous.race, current.race, 'identity'),
      row('background', 'Background', previous.background, current.background, 'identity'),
      row('xp', 'XP', previous.experiencePoints, current.experiencePoints, 'core'),
      row(
        'hp',
        this.uiText.text('characterUi.sheetHistory.fields.maxHp'),
        previous.maxHitPoints,
        current.maxHitPoints,
        'core',
      ),
      row(
        'ac',
        this.uiText.text('characterUi.sheetHistory.fields.armorClass'),
        previous.armorClass,
        current.armorClass,
        'core',
      ),
      row('speed', this.uiText.text('characterUi.sheet.speed'), previous.speed, current.speed, 'core'),
      row(
        'proficiency',
        this.uiText.text('characterUi.sheetHistory.fields.proficiencyBonus'),
        previous.proficiencyBonus,
        current.proficiencyBonus,
        'core',
        (value) => `+${value}`,
      ),
      row(
        'strength',
        this.uiText.text('characterUi.sheetHistory.fields.strength'),
        previous.abilityScores.strength,
        current.abilityScores.strength,
        'abilities',
      ),
      row(
        'dexterity',
        this.uiText.text('characterUi.sheetHistory.fields.dexterity'),
        previous.abilityScores.dexterity,
        current.abilityScores.dexterity,
        'abilities',
      ),
      row(
        'constitution',
        this.uiText.text('characterUi.sheetHistory.fields.constitution'),
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
        this.uiText.text('characterUi.sheetHistory.fields.wisdom'),
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
        this.uiText.text('characterUi.sheet.skills'),
        previous.skills.length,
        current.skills.length,
        'collections',
        String,
        collection('skills').gained.length > 0 || collection('skills').lost.length > 0,
      ),
      row(
        'features',
        this.uiText.text('characterUi.sheetHistory.fields.features'),
        previous.features.length,
        current.features.length,
        'collections',
        String,
        collection('features').gained.length > 0 || collection('features').lost.length > 0,
      ),
      row(
        'spells',
        this.uiText.text('characterUi.ruleLibrary.spells'),
        previous.spells?.length ?? 0,
        current.spells?.length ?? 0,
        'collections',
        String,
        collection('spells').gained.length > 0 || collection('spells').lost.length > 0,
      ),
      row(
        'equipment',
        this.uiText.text('characterUi.sheetHistory.fields.equipment'),
        previous.equipment.length,
        current.equipment.length,
        'collections',
        String,
        collection('equipment').gained.length > 0 || collection('equipment').lost.length > 0,
      ),
    ];
  });

  readonly comparisonCollectionChanges = computed<ReadonlyArray<CollectionChange>>(() => {
    const { before, after } = this.comparisonSnapshots();
    if (before === undefined || after === undefined) return [];
    return this.collectionChangesFor(before.sheet, after.sheet).filter(
      (change) => change.gained.length > 0 || change.lost.length > 0,
    );
  });

  readonly comparisonSummary = computed(() => {
    const changedValues = this.comparisonRows().filter(
      (row) => row.group !== 'collections' && row.state !== 'unchanged',
    ).length;
    const gained = this.comparisonCollectionChanges().reduce(
      (total, change) => total + change.gained.length,
      0,
    );
    const lost = this.comparisonCollectionChanges().reduce(
      (total, change) => total + change.lost.length,
      0,
    );
    return { changedValues, gained, lost, hasChanges: changedValues + gained + lost > 0 };
  });

  selectLevel(level: number): void {
    this.levelSelected.emit(level);
  }

  selectComparison(side: 'before' | 'after', event: Event): void {
    const level = Number((event.target as HTMLSelectElement).value);
    if (!Number.isInteger(level)) return;
    if (side === 'before') {
      this.comparisonBaseLevel.set(level);
      if ((this.comparisonTargetLevel() ?? level) <= level) {
        this.comparisonTargetLevel.set(
          this.snapshots().find((snapshot) => snapshot.sheet.level > level)?.sheet.level,
        );
      }
    } else {
      this.comparisonTargetLevel.set(level);
      if ((this.comparisonBaseLevel() ?? level) >= level) {
        this.comparisonBaseLevel.set(
          [...this.snapshots()].reverse().find((snapshot) => snapshot.sheet.level < level)?.sheet
            .level,
        );
      }
    }
  }

  comparisonDeltaLabel(row: ComparisonRow): string {
    if (row.state === 'increased')
      return `${this.uiText.text('characterUi.sheetHistory.increased')} ${row.delta}`;
    if (row.state === 'decreased')
      return `${this.uiText.text('characterUi.sheetHistory.decreased')} ${row.delta}`;
    if (row.state === 'changed') return this.uiText.text('characterUi.sheetHistory.changed');
    return this.uiText.text('characterUi.sheetHistory.unchanged');
  }

  comparisonTitle(snapshot: CharacterSheetSnapshot): string {
    const title = snapshot.title;
    if (title === undefined) {
      return this.uiText.text('characterUi.sheetHistory.levelTitle', { level: snapshot.sheet.level });
    }
    return this.uiText.localized(title);
  }

  private describeChanges(
    previous: CharacterSheet,
    current: CharacterSheet,
  ): ReadonlyArray<EvolutionChange> {
    const changes: EvolutionChange[] = [];

    this.addNumericChange(changes, 'XP', previous.experiencePoints, current.experiencePoints);
    this.addNumericChange(
      changes,
      this.uiText.text('characterUi.sheetHistory.fields.hitPoints'),
      previous.maxHitPoints,
      current.maxHitPoints,
    );
    this.addNumericChange(
      changes,
      this.uiText.text('characterUi.sheetHistory.fields.armorClass'),
      previous.armorClass,
      current.armorClass,
    );
    this.addNumericChange(
      changes,
      this.uiText.text('characterUi.detail.proficiency'),
      previous.proficiencyBonus,
      current.proficiencyBonus,
    );
    this.addNumericChange(changes, this.uiText.text('characterUi.sheet.speed'), previous.speed, current.speed);

    const abilityLabels: ReadonlyArray<readonly [keyof CharacterSheet['abilityScores'], string]> = [
      ['strength', this.uiText.text('characterUi.sheetHistory.abilities.strength')],
      ['dexterity', this.uiText.text('characterUi.sheetHistory.abilities.dexterity')],
      ['constitution', this.uiText.text('characterUi.sheetHistory.abilities.constitution')],
      ['intelligence', this.uiText.text('characterUi.sheetHistory.abilities.intelligence')],
      ['wisdom', this.uiText.text('characterUi.sheetHistory.abilities.wisdom')],
      ['charisma', this.uiText.text('characterUi.sheetHistory.abilities.charisma')],
    ];
    for (const [ability, label] of abilityLabels) {
      this.addNumericChange(
        changes,
        label,
        previous.abilityScores[ability],
        current.abilityScores[ability],
      );
    }

    const newFeatures = this.countNewEntries(previous.features, current.features);
    if (newFeatures > 0) {
      changes.push({
        label: this.uiText.text('characterUi.sheetHistory.newFeatures'),
        value: `+${newFeatures}`,
        detail: this.newEntries(previous.features, current.features).join(' · '),
      });
    }

    const newSpells = this.countNewEntries(previous.spells ?? [], current.spells ?? []);
    if (newSpells > 0) {
      changes.push({
        label: this.uiText.text('characterUi.sheetHistory.newSpells'),
        value: `+${newSpells}`,
        detail: this.newEntries(previous.spells ?? [], current.spells ?? []).join(' · '),
      });
    }

    const newSkills = this.countNewEntries(previous.skills, current.skills);
    if (newSkills > 0) {
      changes.push({
        label: this.uiText.text('characterUi.sheetHistory.newSkills'),
        value: `+${newSkills}`,
        detail: this.newEntries(previous.skills, current.skills).join(' · '),
      });
    }

    const newEquipment = this.countNewEntries(previous.equipment, current.equipment);
    if (newEquipment > 0) {
      changes.push({
        label: this.uiText.text('characterUi.sheetHistory.newGear'),
        value: `+${newEquipment}`,
        detail: this.newEntries(previous.equipment, current.equipment).join(' · '),
      });
    }

    return changes;
  }

  private changeState(
    previous: string | number,
    current: string | number,
    forceChanged = false,
  ): Pick<ComparisonRow, 'state' | 'delta'> {
    if (!forceChanged && previous === current) return { state: 'unchanged' };
    if (typeof previous === 'number' && typeof current === 'number') {
      const delta = current - previous;
      if (delta > 0) return { state: 'increased', delta: `+${delta}` };
      if (delta < 0) return { state: 'decreased', delta: String(delta) };
    }
    return { state: 'changed' };
  }

  private collectionChangesFor(
    previous: CharacterSheet,
    current: CharacterSheet,
  ): ReadonlyArray<CollectionChange> {
    const change = (
      id: CollectionChange['id'],
      label: string,
      before: ReadonlyArray<string>,
      after: ReadonlyArray<string>,
    ): CollectionChange => ({
      id,
      label,
      gained: this.newEntries(before, after),
      lost: this.newEntries(after, before),
    });
    return [
      change('skills', this.uiText.text('characterUi.sheet.skills'), previous.skills, current.skills),
      change('features', this.uiText.text('characterUi.sheetHistory.fields.features'), previous.features, current.features),
      change(
        'spells',
        this.uiText.text('characterUi.ruleLibrary.spells'),
        previous.spells ?? [],
        current.spells ?? [],
      ),
      change(
        'equipment',
        this.uiText.text('characterUi.sheetHistory.fields.equipment'),
        previous.equipment,
        current.equipment,
      ),
    ];
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
    const normalize = (entry: string): string => entry.trim().toLocaleLowerCase();
    const existing = new Set(previous.map(normalize));
    const emitted = new Set<string>();

    return current.filter((entry) => {
      const normalized = normalize(entry);
      if (normalized.length === 0 || existing.has(normalized) || emitted.has(normalized)) {
        return false;
      }

      emitted.add(normalized);
      return true;
    });
  }
}
