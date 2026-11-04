import { Injectable, inject } from '@angular/core';

import {
  DEFAULT_INTERFACE_LOCALE,
  UI_TEXT_CATALOG,
  resolveInterfaceLocale,
  type UiTextTree,
} from '@guild/i18n/uiCatalog';
import { LanguageService } from '@guild/services/language.service';

type UiTextParameters = Readonly<Record<string, string | number>>;

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
    const requestedLocale =
      resolveInterfaceLocale(this.language.currentLanguage()) ?? DEFAULT_INTERFACE_LOCALE;
    const searchOrder: string[] = [];
    const visited = new Set<string>();
    const appendLocale = (locale: string | undefined): void => {
      if (locale === undefined || visited.has(locale)) return;
      const catalog = UI_TEXT_CATALOG.locales[locale];
      if (catalog === undefined) return;
      visited.add(locale);
      searchOrder.push(locale);
      for (const fallback of catalog.fallbacks) {
        appendLocale(resolveInterfaceLocale(fallback));
      }
    };
    appendLocale(requestedLocale);
    appendLocale(DEFAULT_INTERFACE_LOCALE);

    const resolved = searchOrder
      .map((locale) => readPath(UI_TEXT_CATALOG.locales[locale].texts, key))
      .find((value) => value !== undefined);
    if (resolved !== undefined) return interpolate(resolved, parameters);

    if (!this.warnedKeys.has(key)) {
      this.warnedKeys.add(key);
      console.warn(`[QuestKeeper] Missing UI text catalog key: ${key}`);
    }
    return `Missing text: ${key}`;
  }
}
