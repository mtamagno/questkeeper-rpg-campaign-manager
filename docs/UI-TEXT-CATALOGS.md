# Product interface text catalogs

**Status:** version 2 locale registry; complete copy migration tracked by public epic #137

QuestKeeper keeps two kinds of language data separate:

- campaign-authored names, lore, rules, memories and captions belong to each
  campaign's JSON and use its locale registry;
- product-owned labels, controls, help, loading/empty/error states and
  accessible names belong to the interface catalogs.

## Editing copy

Every shipped interface language lives in the single registry:

- `src/app/guild/i18n/ui.json`.

Change an existing value or add a locale under `locales`, then run:

```console
npm run test:ui-texts
npm run typecheck
```

No Angular or TypeScript edit is required. The language selectors, persisted
preference and resolver discover their options from this registry, follow the
configured fallback chain and replace named placeholders such as `{name}`.

```json
{
  "meta": { "version": 2, "defaultLocale": "en" },
  "locales": {
    "en": {
      "label": "English",
      "direction": "ltr",
      "fallbacks": [],
      "texts": {}
    }
  }
}
```

## Catalog contract

The registry declares `meta.version`, a data-defined `meta.defaultLocale`, and
one entry per canonical BCP-47 tag. Each locale supplies its native `label`,
text direction, ordered fallbacks and a nested `texts` object whose leaves are
strings.

The default locale defines the reference key set for each repository. Every
shipped locale must have exactly the same keys and named placeholders. The
`test:ui-texts` gate rejects invalid tags, missing or extra keys, unknown or
cyclic fallbacks and placeholder drift. Missing runtime keys emit one
development warning and show an explicit diagnostic instead of silently
rendering a raw key.

To add another interface language, copy the default locale entry inside
`locales`, change its tag, native label, direction, fallbacks and translated
values. It then appears automatically in the interface-language selectors.
Campaign content languages remain independent and continue to come from each
campaign's locale registry.

The public and production catalogs share reusable keys. Production may add keys
for local-only routes such as Table Rules, Gazette, DM tools or the extended
Compendium; those additions must stay out of the public template unless the
feature itself becomes reusable.

## Authoring rules

- Never add translatable prose directly to an Angular template or TypeScript
  conditional.
- Keep symbols, identifiers, URLs, user data and campaign-authored content out
  of the product catalog.
- Prefer stable semantic keys over keys derived from the English sentence.
- Use named placeholders rather than string concatenation.
- Add accessible labels to the same catalog as their visible counterparts.
- Preserve the menu/content alignment preference: storage remains separate,
  while the default reader experience keeps supported interface and campaign
  locales together.

The initial slice externalizes the language selector, campaign selector,
sidebar navigation, alignment controls and production Table Rules chrome.
Issues #139-#142 complete the remaining character, chronicle, NPC, compendium,
PDF/offline and accessibility surfaces until the zero-inline-copy audit passes.
