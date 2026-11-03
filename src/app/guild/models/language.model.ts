/**
 * Language model — arbitrary campaign locales and localized text values.
 */

/** Any canonical BCP-47 language tag configured by a campaign. */
export type SupportedLanguage = string;

/** Localized prose keyed by campaign-defined locale tags. */
export interface LocalizedText {
  readonly [language: string]: string;
}

/** @deprecated Use LocalizedText. Retained while older content models migrate. */
export interface BilingualText extends LocalizedText {
  readonly en: string;
  readonly it: string;
}

export interface CampaignLocaleDefinition {
  readonly tag: string;
  readonly direction?: 'ltr' | 'rtl' | 'auto';
  readonly fallbacks?: ReadonlyArray<string>;
}

export interface CampaignLocaleRegistry {
  readonly version: 1;
  readonly locales: ReadonlyArray<CampaignLocaleDefinition>;
  readonly defaultLocale: string;
  readonly sourceLocale: string;
}

export interface ResolvedLocalizedText {
  readonly requestedLocale: string;
  readonly resolvedLocale?: string;
  readonly value: string;
  readonly isFallback: boolean;
  readonly isMissing: boolean;
}

function canonicalLocale(value: string): string | undefined {
  try {
    return Intl.getCanonicalLocales(value)[0];
  } catch {
    return undefined;
  }
}

/** Resolve campaign prose through explicit fallbacks, default and source locale. */
export function resolveLocalizedText(
  value: LocalizedText | undefined,
  requestedLocale: SupportedLanguage,
  registry: CampaignLocaleRegistry,
): ResolvedLocalizedText {
  const byTag = new Map(registry.locales.map((locale) => [locale.tag, locale]));
  const order: string[] = [];
  const visited = new Set<string>();
  const append = (tag: string | undefined): void => {
    if (!tag || visited.has(tag) || !byTag.has(tag)) return;
    visited.add(tag);
    order.push(tag);
    for (const fallback of byTag.get(tag)?.fallbacks ?? []) append(fallback);
  };
  append(canonicalLocale(requestedLocale));
  append(registry.defaultLocale);
  append(registry.sourceLocale);

  for (const locale of order) {
    const text = value?.[locale] ?? '';
    if (text.length > 0) {
      return {
        requestedLocale,
        resolvedLocale: locale,
        value: text,
        isFallback: locale !== canonicalLocale(requestedLocale),
        isMissing: false,
      };
    }
  }
  return { requestedLocale, value: '', isFallback: false, isMissing: true };
}

/** Resolves localized content through the registry or, for legacy callers, first populated value. */
export function localizeText(
  value: LocalizedText | undefined,
  language: SupportedLanguage,
  registry?: CampaignLocaleRegistry,
): string {
  if (value === undefined) return '';
  if (registry) return resolveLocalizedText(value, language, registry).value;
  return value[language] || Object.values(value).find((entry) => entry.length > 0) || '';
}
