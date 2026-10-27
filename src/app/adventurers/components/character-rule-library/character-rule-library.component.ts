import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { SPELL_CATEGORIES } from '@arcana/constants/spells.constants';
import { SPELL_SCHOOLS, isSpellEntry, type SpellEntry } from '@arcana/models/compendium.model';
import { type CharacterSheet } from '@guild/models/character.model';

type CharacterRuleKind = 'feature' | 'spell';
type CharacterRuleFilter = 'all' | CharacterRuleKind;

interface CharacterSpellCard {
  readonly name: string;
  readonly originalName: string;
  readonly categoryId?: string;
  readonly key?: string;
  readonly level?: number;
  readonly school?: string;
  readonly castingTime?: string;
  readonly range?: string;
  readonly duration?: string;
  readonly description?: string;
  readonly isConcentration: boolean;
  readonly isRitual: boolean;
}

interface CharacterRuleLibraryEntry {
  readonly id: string;
  readonly kind: CharacterRuleKind;
  readonly name: string;
  readonly searchText: string;
  readonly spell?: CharacterSpellCard;
}

interface SpellcastingSummary {
  readonly ability: string;
  readonly saveDC: number;
  readonly attackBonus: string;
}

@Component({
  selector: 'app-character-rule-library',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './character-rule-library.component.html',
  styleUrl: './character-rule-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterRuleLibraryComponent {
  readonly sheet = input.required<CharacterSheet>();
  readonly characterId = input.required<string>();
  readonly isItalian = input.required<boolean>();

  readonly query = signal('');
  readonly filter = signal<CharacterRuleFilter>('all');

  readonly spellCards = computed<ReadonlyArray<CharacterSpellCard>>(() =>
    (this.sheet().spells ?? []).map((spellName) => this.resolveSpell(spellName)),
  );

  readonly entries = computed<ReadonlyArray<CharacterRuleLibraryEntry>>(() => {
    const features = this.sheet().features.map((name, index) => ({
      id: `feature-${index}-${this.normalize(name)}`,
      kind: 'feature' as const,
      name,
      searchText: this.normalize(`${name} feature ability trait capacity`),
    }));
    const spells = this.spellCards().map((spell, index) => ({
      id: `spell-${index}-${this.normalize(spell.originalName)}`,
      kind: 'spell' as const,
      name: spell.name,
      spell,
      searchText: this.normalize(
        [
          spell.name,
          spell.originalName,
          spell.school,
          spell.level === undefined ? undefined : `level ${spell.level} livello ${spell.level}`,
          'spell incantesimo',
        ]
          .filter(Boolean)
          .join(' '),
      ),
    }));
    return [...features, ...spells];
  });

  readonly filteredEntries = computed(() => {
    const query = this.normalize(this.query());
    const filter = this.filter();
    return this.entries().filter(
      (entry) =>
        (filter === 'all' || entry.kind === filter) &&
        (query.length === 0 || entry.searchText.includes(query)),
    );
  });

  readonly featureCount = computed(
    () => this.entries().filter((entry) => entry.kind === 'feature').length,
  );
  readonly spellCount = computed(
    () => this.entries().filter((entry) => entry.kind === 'spell').length,
  );

  readonly spellcastingSummary = computed<SpellcastingSummary | undefined>(() => {
    const sheet = this.sheet();
    const config = sheet.spellcasting;
    if (config === undefined) return undefined;
    const modifier = this.modifierValue(sheet.abilityScores[config.ability]);
    return {
      ability: this.abilityLabel(config.ability),
      saveDC: config.spellSaveDC ?? 8 + sheet.proficiencyBonus + modifier,
      attackBonus: this.formatSignedNumber(
        config.spellAttackBonus ?? sheet.proficiencyBonus + modifier,
      ),
    };
  });

  setFilter(filter: CharacterRuleFilter): void {
    this.filter.set(filter);
  }

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  private resolveSpell(originalName: string): CharacterSpellCard {
    const normalizedName = this.normalize(originalName);
    for (const category of SPELL_CATEGORIES) {
      const entry = category.entries.find((candidate) => {
        if (!isSpellEntry(candidate)) return false;
        const englishName = this.normalize(candidate.en);
        const italianName = this.normalize(candidate.it);
        return (
          englishName === normalizedName ||
          italianName === normalizedName ||
          englishName.endsWith(normalizedName)
        );
      });
      if (entry !== undefined && isSpellEntry(entry)) {
        return this.toSpellCard(originalName, category.id, entry);
      }
    }
    return {
      name: originalName,
      originalName,
      isConcentration: false,
      isRitual: false,
    };
  }

  private toSpellCard(
    originalName: string,
    categoryId: string,
    spell: SpellEntry,
  ): CharacterSpellCard {
    const italian = this.isItalian();
    const school = SPELL_SCHOOLS[spell.school] ?? { en: spell.school, it: spell.school };
    return {
      name: italian ? spell.it : spell.en,
      originalName,
      categoryId,
      key: spell.key,
      level: spell.level,
      school: italian ? school.it : school.en,
      castingTime: italian ? spell.castingTimeIt : spell.castingTimeEn,
      range: italian ? spell.rangeIt : spell.rangeEn,
      duration: italian ? spell.durationIt : spell.durationEn,
      description: italian ? spell.descriptionIt : spell.descriptionEn,
      isConcentration: spell.isConcentration,
      isRitual: spell.isRitual,
    };
  }

  private abilityLabel(ability: keyof CharacterSheet['abilityScores']): string {
    const labels: Record<keyof CharacterSheet['abilityScores'], readonly [string, string]> = {
      strength: ['STR', 'FOR'],
      dexterity: ['DEX', 'DES'],
      constitution: ['CON', 'COS'],
      intelligence: ['INT', 'INT'],
      wisdom: ['WIS', 'SAG'],
      charisma: ['CHA', 'CAR'],
    };
    return labels[ability][this.isItalian() ? 1 : 0];
  }

  private modifierValue(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  private formatSignedNumber(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
