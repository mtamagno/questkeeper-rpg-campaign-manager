import catalog from '@guild/i18n/ui.json';

export type InterfaceTextDirection = 'ltr' | 'rtl' | 'auto';
export type UiTextTree = Readonly<Record<string, unknown>>;

export interface InterfaceLocaleDefinition {
  readonly tag: string;
  readonly label: string;
  readonly direction: InterfaceTextDirection;
  readonly fallbacks: ReadonlyArray<string>;
}

interface UiTextLocaleCatalog {
  readonly label: string;
  readonly direction: InterfaceTextDirection;
  readonly fallbacks: ReadonlyArray<string>;
  readonly texts: UiTextTree;
}

interface UiTextCatalogRegistry {
  readonly meta: {
    readonly version: number;
    readonly defaultLocale: string;
  };
  readonly locales: Readonly<Record<string, UiTextLocaleCatalog>>;
}

/** Versioned interface-copy registry. Adding a locale is a JSON-only change. */
export const UI_TEXT_CATALOG = catalog as UiTextCatalogRegistry;

const localeLookup = new Map(
  Object.keys(UI_TEXT_CATALOG.locales).map((tag) => [tag.toLowerCase(), tag]),
);

function canonicalLocale(locale: string): string | undefined {
  try {
    return Intl.getCanonicalLocales(locale.trim())[0];
  } catch {
    return undefined;
  }
}

/** Resolves exact BCP-47 tags first, then a configured base-language catalog. */
export function resolveInterfaceLocale(locale: string): string | undefined {
  const canonical = canonicalLocale(locale);
  if (canonical === undefined) return undefined;
  return (
    localeLookup.get(canonical.toLowerCase()) ??
    localeLookup.get(canonical.split('-')[0].toLowerCase())
  );
}

export const DEFAULT_INTERFACE_LOCALE =
  resolveInterfaceLocale(UI_TEXT_CATALOG.meta.defaultLocale) ??
  Object.keys(UI_TEXT_CATALOG.locales)[0];

export const INTERFACE_LOCALES: ReadonlyArray<InterfaceLocaleDefinition> = Object.entries(
  UI_TEXT_CATALOG.locales,
).map(([tag, locale]) => ({
  tag,
  label: locale.label,
  direction: locale.direction,
  fallbacks: locale.fallbacks,
}));

export function interfaceLocaleDefinition(locale: string): InterfaceLocaleDefinition | undefined {
  const resolved = resolveInterfaceLocale(locale);
  return INTERFACE_LOCALES.find(({ tag }) => tag === resolved);
}
