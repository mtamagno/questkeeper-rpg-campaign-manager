# Dynamic campaign locales

**Date:** 2026-11-03  
**Status:** Accepted research contract; implementation is tracked by
[#115](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/115)
through
[#118](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/118).  
**Classification:** `shared`  
**Research issue:**
[#114](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/114)  
**Parent epic:**
[#112](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/112)

## Decision

QuestKeeper will separate the language of the application interface from the
languages of campaign-authored content. Each campaign will own one versioned,
ordered locale registry containing one or more canonical BCP 47 tags, an
explicit default locale, an explicit authoring source locale and optional
fallbacks between configured locales.

Localized campaign values remain JSON objects keyed by locale tag. They no
longer require `en` or `it`. A single shared resolver returns both the text and
the locale that actually supplied it, so fallback content is never presented
as if it were a completed translation.

The disposition is **continue with the existing epic and linked children**.
The research found several independently deliverable surfaces and confirms the
current split; no additional child issue is required before implementation.

## Why this matters now

The Campaign Manager already accepts arbitrary language tags, but the reader,
models and generated artifacts still contain fixed bilingual assumptions.
Changing only the visible selector would let a Game Master save a locale that
some pages, search results, PDFs or offline packs cannot read correctly.

The contract must land before more translation or publication behavior is
built on the legacy shape. It also protects existing campaigns: migration must
not rewrite valid prose merely to introduce metadata.

## Evidence and inventory

The inventory was run against the public reusable repository and the two
production compatibility fixtures on 3 November 2026.

| Surface                     | Current evidence                                                                                                                                                | Required ownership                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Reusable value model        | `BilingualText` requires `en` and `it`; `localizeText` falls back to English and then the first non-empty object value                                          | Locale registry and shared resolver (#115)                                                  |
| Reader preference           | `LanguageService` stores one global `campaign_companion_language`, validates only simple language/region tags and exposes a fixed EN/IT toggle plus `isItalian` | Campaign-scoped content locale service; separate UI locale service (#117)                   |
| Reader selector             | The visible selector can read `languages`, but falls back to `['en', 'it']` and shares the global preference                                                    | Registry-derived one-or-N selector (#117)                                                   |
| Reusable Angular code       | 34 files reference `BilingualText`; 17 files access `.en` or `.it` directly; 28 files consume `isItalian`                                                       | Typed migration and consumer audit (#115, #117)                                             |
| PDFs                        | The two character PDF services contain 118 fixed English/Italian branches, direct localized properties and fixed `en-GB`/`it-IT` formatting                     | Content-locale resolver plus an independent PDF-chrome catalog (#117)                       |
| Search and identity checks  | Placeholder checks concatenate `value.en` and `value.it`; campaign status checks read English; several templates track rows by `.en`                            | Locale-neutral identity and per-locale indexes (#117)                                       |
| Offline                     | Offline fallback names create `{ en, it }`; packs copy localized values without registry or resolved-locale metadata                                            | Versioned pack carrying locale registry and selection (#117)                                |
| Manager configuration       | `Intl.getCanonicalLocales` already canonicalizes arbitrary tags; selected languages generate authoring fields and removal preserves hidden values               | Evolve the existing picker into the registry editor (#115, #116)                            |
| Manager fallback            | Legacy Manager reads infer tags from campaign-name keys and otherwise fall back to `en`; campaign overview localization prefers English/first value             | Shared resolver and explicit migration adapter (#115, #116)                                 |
| Translation workspace       | Entity translation works for one dynamic source/target pair, but does not validate both against a versioned registry or support independent multi-target jobs   | Registry-bound resumable pair jobs (#118)                                                   |
| Setup and Manager interface | Setup and Manager chrome deliberately offer English and Italian as product-interface translations                                                               | Remains UI chrome and is not campaign locale data                                           |
| Ruleset labels              | Built-in system terms have product-owned English/Italian labels and custom labels                                                                               | Ruleset presentation catalog; not evidence that campaign content must contain either locale |
| Public demo                 | 10 of 13 campaign JSON files contain localized maps; manifest and campaign data declare `languages: [en, it]` and `defaultLanguage: en`                         | Explicit registry migration fixture                                                         |
| Phandelver                  | 81 of 84 campaign JSON files contain localized maps; neither manifest nor campaign data declares locale metadata                                                | Legacy read-through and lossless migration fixture                                          |
| Curse of Strahd             | 19 of 22 campaign JSON files contain localized maps; neither manifest nor campaign data declares locale metadata                                                | Active-campaign compatibility fixture                                                       |

The counts are evidence of migration scope rather than permanent quality
metrics. The implementation issues must replace the underlying assumptions,
not merely drive these numbers to zero through renaming.

## Four distinct language concerns

QuestKeeper must not reuse one setting for unrelated purposes.

1. **UI chrome locale** controls product-owned labels, help and controls. It is
   a user preference. Today the Manager and setup chrome support English and
   Italian; a campaign may use neither.
2. **Campaign content locale** selects authored names, prose, captions and
   memories. It is constrained by the active campaign registry and remembered
   per campaign.
3. **Ruleset terminology locale** selects product/package-owned game terms.
   The closest available package locale may be used without changing the
   campaign content selection, and custom labels remain explicit.
4. **Provider locale capability** describes what an AI or external integration
   can process. It is capability metadata, never a reason to remove a campaign
   locale or silently choose another model.

## Registry contract

The first persisted representation will be versioned and duplicated in the
global campaign manifest and `data/campaign.json`, as current campaign identity
metadata is. The loader rejects conflicting copies with an actionable campaign
and field path rather than guessing.

```json
{
  "localeRegistry": {
    "version": 1,
    "locales": [
      { "tag": "it", "direction": "ltr" },
      { "tag": "en-GB", "fallbacks": ["it"], "direction": "ltr" },
      { "tag": "ar", "fallbacks": ["en-GB"], "direction": "rtl" }
    ],
    "defaultLocale": "it",
    "sourceLocale": "it"
  }
}
```

### Invariants

- `version` is required and starts at `1`.
- `locales` is ordered, duplicate-free and contains at least one entry.
- Every `tag` is canonicalized through `Intl.getCanonicalLocales` and stored
  in canonical BCP 47 form. Valid tags are not limited to language-region
  pairs: scripts, variants and private-use tags remain possible.
- `defaultLocale` and `sourceLocale` must identify configured entries.
- `fallbacks` may reference only configured entries, contain no duplicates and
  form no cycles. A locale cannot fall back to itself.
- `direction` is `ltr`, `rtl` or `auto`. Known tags may receive a suggested
  value; an explicit author override remains available for custom/private tags.
- Display names are derived with `Intl.DisplayNames` in the current UI locale.
  A non-localized optional author label may be added later, but the registry
  must not create recursively localized locale names.
- A tag change is a reviewed remap operation, not an in-place string edit.

`defaultLocale` is the first campaign-content choice for a visitor who has no
valid preference. `sourceLocale` identifies the authoritative prose used for
translation staleness and completeness. They may be the same but have distinct
semantics.

## Localized value and resolver contract

Localized content remains simple and portable:

```json
{
  "it": "La strada delle lanterne",
  "en-GB": "The Lantern Road",
  "ar": ""
}
```

The reusable type becomes a locale-keyed record; `BilingualText` survives only
as a deprecated compatibility alias while consumers migrate. Unknown keys are
preserved on read, edit, import, backup and export.

Resolving a field returns structured evidence:

```ts
interface ResolvedLocalizedText {
  requestedLocale: string;
  resolvedLocale?: string;
  value: string;
  isFallback: boolean;
  isMissing: boolean;
}
```

The deterministic lookup order is:

1. the requested locale;
2. its explicit fallback chain, in declared order;
3. the campaign default locale and its explicit chain;
4. the campaign source locale and its explicit chain;
5. an explicit missing result.

The resolver never uses the first object property and never assumes English.
It deduplicates visited tags and must terminate even if invalid legacy data
contains a cycle. RFC 4647 lookup is appropriate for matching a browser
preference to the configured registry; it does not invent field-level
translations. CLDR inheritance likewise remains an implementation resource for
product chrome and formatting, not an implicit cross-language campaign
fallback.

When fallback text is rendered, the containing element receives the actual
`lang` value and direction. The UI may mark it as fallback or missing according
to context, but must never label it as a completed value in the requested
locale.

## Required behavior by campaign shape

| Case                | Behavior                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One locale          | No redundant reader switch. Manager still shows source/default as the same immutable choice until another locale is added.                                                 |
| Two locales         | Both appear in registry order. This preserves the familiar workflow without giving either tag special meaning.                                                             |
| N locales           | Every configured locale is available; long and non-Latin names wrap without truncating the tag or action. Translation jobs track each source/target pair independently.    |
| Missing value       | Resolve through the declared chain and report the actual locale. If no value exists, show an explicit empty/missing state; never fabricate text.                           |
| Partial translation | Saving unrelated content remains possible. Completeness and stale state are visible per locale and field.                                                                  |
| Removed locale      | Block removal while referenced values, preferences, jobs or generated artifacts exist unless the GM chooses a reviewed remap or archive. Never delete its values silently. |
| Renamed tag         | Canonical-equivalent input is normalized. A materially different tag requires a previewed remap of registry references and localized keys.                                 |
| Invalid tag         | Reject the write with campaign, registry index and offending value. Existing unknown legacy keys remain preserved for repair.                                              |

## Compatibility and migration

Migration is read-through first and write-later.

1. If `localeRegistry` exists, validate and use it.
2. If legacy `languages` and `defaultLanguage` exist, expose a virtual version-1
   registry in that order. Use the legacy default as both default and provisional
   source until the GM confirms the authoring source.
3. If neither exists, inspect only structural localized-map keys, beginning with
   manifest and campaign identity fields. Preserve first-seen order, prefer `en`
   as the provisional default only when it exists to match current behavior,
   otherwise use the first discovered key. This is a compatibility adapter, not
   normal campaign configuration.
4. If no structural key can be discovered, expose an actionable migration error
   rather than creating prose or a language silently.

Persisting the registry is a separate explicit action. The Manager shows the
detected tags, default and provisional source, reports unknown/orphan keys,
creates a backup and writes metadata without re-keying localized prose. The
operation is idempotent. Downgrade/recovery retains the legacy arrays during a
documented transition window, derived from the registry, until all supported
readers understand version 1.

The public demo migrates from its explicit `[en, it]` fields. Phandelver and
Curse of Strahd exercise the no-metadata adapter. Their source locale must be
confirmed by the campaign owner rather than inferred from how much prose each
language contains.

## Cross-surface requirements

### URLs and persistence

- Entity and route identifiers stay locale-neutral and are never translated.
- The remembered campaign-content locale is stored under a versioned,
  campaign-scoped key such as
  `questkeeper:campaign-content-locale:v1:<campaignId>`.
- A validated `lang=<canonical-tag>` query parameter may provide a shareable
  override. It never becomes part of an entity ID and is ignored with an
  accessible notice when the active campaign does not configure it.
- Switching campaigns revalidates the selection against the new registry.

### Search and sorting

- Build independent search documents per campaign locale and retain the locale
  that supplied each indexed value. Do not concatenate fixed `.en` and `.it`
  properties.
- Fallback matches are identified as such. Filtering campaign lifecycle state
  uses stable machine values, not translated English status prose.
- User-visible ordering uses `Intl.Collator` for the active content locale;
  stable IDs provide deterministic ties.

### Accessibility and direction

- Set `lang` on the document or the smallest content region that changes
  language. Fallback fragments use their resolved locale.
- Use semantic `dir`/`bdi` behavior for authored text; do not implement text
  direction only through CSS.
- The selector announces the language name and canonical tag, active state,
  fallback/missing state and removal errors. Keyboard behavior must remain
  usable with long labels and one, two or N options.

### PDF and print

- PDF content uses the chosen campaign locale and the same resolver as the
  Companion.
- PDF-owned headings belong to a separate product/PDF chrome catalog. When a
  PDF chrome translation is unavailable, QuestKeeper reports and uses its
  documented chrome fallback without changing or mislabelling campaign prose.
- Dates, collation and number formatting use the selected effective locale,
  not a binary `it-IT`/`en-GB` branch.

### Offline and import/export

- Offline pack version 2 includes the complete registry, selected locale and
  all localized keys required by its snapshots. A pack can resolve and label
  fallback content without network access.
- Import, export, clone, backup and restore preserve registry order, unknown
  locale keys and orphaned values. No path drops data because it is not in a
  built-in catalog.

### Manual and AI translation

- Source and target choices come from the registry. Self-translation and writes
  to removed locales are rejected.
- Store review/stale state by stable entity path plus source and target locale;
  it does not live inside published prose values.
- Multi-target translation is a set of independent, idempotent pair jobs. A
  partial provider failure does not invalidate successful targets.
- Prompts include canonical tags and human-readable language names. Capability
  checks explain unsupported pairs. Remote consent identifies provider, model,
  exact fields and each source/target before sending data.

## Options considered

### Keep fixed `en` and `it` properties

Rejected. It contradicts campaign ownership, cannot represent one/N-language
campaigns and perpetuates special-case branches in every new surface.

### Store every localized value as an array of records

Deferred. Arrays can attach status to each value, but would require a broad
rewrite, make hand-edited JSON heavier and duplicate translation-workspace
state inside publishable campaign data.

### Keep locale-keyed maps plus a registry

Accepted. It preserves existing files and manual editability, supports unknown
tags losslessly and lets review/staleness remain in the recoverable translation
workspace. The registry supplies the ordering and semantics a plain object
cannot express.

## Dependency order and exit criteria

1. **#114 (this research):** accept this contract and close as research.
2. **#115:** implement registry, shared resolver, validators and lossless legacy
   adapter/migration.
3. **#116 and #117:** proceed in coordinated parallel slices after #115. The
   Manager owns authoring/removal; the Companion owns reading, persistence,
   search, PDF and offline behavior.
4. **#118:** may build its registry-bound engine after #115, but release only
   after the authoring and fallback/status contracts used from #116/#117 are
   integrated.

Each implementation issue must cover one-, two- and N-locale fixtures, missing
values, removed/renamed tags, long labels, at least one RTL candidate, import
round trips and public/Phandelver/Strahd compatibility. #112 remains open until
all children are released and smoke-tested.

## Non-goals of this research

- No campaign JSON is migrated here.
- No selector, schema or reader behavior changes here.
- No new product-chrome translations are promised.
- No AI provider is enabled or contacted.
- No private campaign prose, credentials, transcripts or licensed material is
  copied into the public repository.

## Primary references

- [RFC 5646 — Tags for Identifying Languages](https://www.rfc-editor.org/rfc/rfc5646.html)
  defines BCP 47 structure and canonical form.
- [RFC 4647 — Matching of Language Tags](https://www.rfc-editor.org/rfc/rfc4647.html)
  defines lookup for matching requested and available language tags.
- [ECMA-402 — ECMAScript Internationalization API](https://tc39.es/ecma402/)
  defines canonical locale processing used by `Intl.getCanonicalLocales`.
- [Unicode TR35 — Locale Data Markup Language](https://www.unicode.org/reports/tr35/)
  distinguishes locale matching, inheritance and fallback behavior.
- [W3C — Declaring language in HTML](https://www.w3.org/International/questions/qa-html-language-declarations.en)
  explains language declarations for documents and embedded ranges.
- [WHATWG HTML — the `dir` attribute](https://html.spec.whatwg.org/multipage/dom.html#the-dir-attribute)
  defines semantic text direction and the limitations of automatic detection.
