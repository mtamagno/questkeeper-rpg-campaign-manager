import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import baselineJson from '@arcana/data/baseline-compendium.json';
import { type CompendiumPackage } from '@arcana/models/compendium-package.model';
import { LanguageService } from '@guild/services/language.service';

const BASELINE = baselineJson as CompendiumPackage;

@Component({
  selector: 'app-baseline-compendium',
  standalone: true,
  templateUrl: './baseline-compendium.component.html',
  styleUrl: './baseline-compendium.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaselineCompendiumComponent {
  private readonly language = inject(LanguageService);
  readonly query = signal('');
  readonly isItalian = computed(() => this.language.currentLanguage() === 'it');
  readonly manifest = BASELINE.manifest;
  readonly entries = computed(() => {
    const locale = this.isItalian() ? 'it' : 'en';
    const query = this.query().trim().toLocaleLowerCase(locale);
    return BASELINE.entries.filter((entry) => {
      const haystack = [entry.name[locale], entry.summary?.[locale], entry.content?.[locale]]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(locale);
      return query.length === 0 || haystack.includes(query);
    });
  });

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
