import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import baselineJson from '@arcana/data/baseline-compendium.json';
import { type CompendiumPackage } from '@arcana/models/compendium-package.model';
import { LanguageService } from '@guild/services/language.service';
import { UiTextService } from '@guild/services/uiText.service';

const BASELINE = baselineJson as CompendiumPackage;

@Component({
  selector: 'app-baseline-compendium',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './baseline-compendium.component.html',
  styleUrl: './baseline-compendium.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaselineCompendiumComponent {
  private readonly language = inject(LanguageService);
  readonly uiText = inject(UiTextService);
  readonly query = signal('');
  readonly isItalian = computed(() => this.language.currentLanguage() === 'it');
  readonly locale = computed<'en' | 'it'>(() => (this.isItalian() ? 'it' : 'en'));
  readonly manifest = BASELINE.manifest;
  readonly entries = computed(() => {
    const locale = this.locale();
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
