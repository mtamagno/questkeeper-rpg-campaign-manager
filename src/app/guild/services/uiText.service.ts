import { Injectable, inject } from '@angular/core';

import englishCatalog from '@guild/i18n/ui.en.json';
import italianCatalog from '@guild/i18n/ui.it.json';
import { LanguageService } from '@guild/services/language.service';

type UiTextParameters = Readonly<Record<string, string | number>>;
type UiTextTree = Readonly<Record<string, unknown>>;

interface UiTextCatalog {
  readonly meta: {
    readonly version: number;
    readonly locale: string;
    readonly fallbackLocale: string;
  };
  readonly texts: UiTextTree;
}

const CATALOGS: Readonly<Record<string, UiTextCatalog>> = {
  en: englishCatalog,
  it: italianCatalog,
};

function baseLocale(locale: string): string {
  return locale.trim().toLowerCase().split('-')[0] || 'en';
}

function readPath(root: UiTextTree, path: string): string | undefined {
  let current: unknown = root;
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null || !(segment in current)) return undefined;
    current = (current as Readonly<Record<string, unknown>>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, parameters: UiTextParameters): string {
  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(parameters, name) ? String(parameters[name]) : placeholder,
  );
}

/** Resolves product-owned interface copy from editable, versioned JSON catalogs. */
@Injectable({ providedIn: 'root' })
export class UiTextService {
  private readonly language = inject(LanguageService);
  private readonly warnedKeys = new Set<string>();

  text(key: string, parameters: UiTextParameters = {}): string {
    const locale = baseLocale(this.language.currentLanguage());
    const catalog = CATALOGS[locale] ?? CATALOGS['en'];
    const resolved = readPath(catalog.texts, key) ?? readPath(CATALOGS['en'].texts, key);
    if (resolved !== undefined) return interpolate(resolved, parameters);

    if (!this.warnedKeys.has(key)) {
      this.warnedKeys.add(key);
      console.warn(`[QuestKeeper] Missing UI text catalog key: ${key}`);
    }
    return `Missing text: ${key}`;
  }
}
