# Product interface text catalogs

**Status:** version 1 foundation; complete migration tracked by public epic #137

QuestKeeper keeps two kinds of language data separate:

- campaign-authored names, lore, rules, memories and captions belong to each
  campaign's JSON and use its locale registry;
- product-owned labels, controls, help, loading/empty/error states and
  accessible names belong to the interface catalogs.

## Editing copy

The shipped interface catalogs are:

- `src/app/guild/i18n/ui.en.json`;
- `src/app/guild/i18n/ui.it.json`.

Change the value in the relevant JSON file and run:

```console
npm run test:ui-texts
npm run typecheck
```

No Angular or TypeScript edit is required for an existing key. The resolver in
`uiText.service.ts` selects the current interface catalog, falls back to
English and replaces named placeholders such as `{name}`.

## Catalog contract

Every catalog contains:

- `meta.version`, currently `1`;
- its canonical `meta.locale`;
- an explicit `meta.fallbackLocale`;
- a nested `texts` object whose leaves are strings.

English is the reference key set for each repository. All shipped locales must
have exactly the same keys and exactly the same named placeholders. The
`test:ui-texts` gate rejects missing, extra or incompatible entries. Missing
runtime keys emit one development warning and show an explicit diagnostic
instead of silently rendering a raw key.

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
