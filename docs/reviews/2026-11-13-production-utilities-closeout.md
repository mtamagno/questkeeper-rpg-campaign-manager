# 13 November 2026 — Production utilities closeout

**Plan:** UI, UX and Accessibility Quality Fortnight, 13 November  
**Classification:** shared contracts with production-only utility routes  
**Issue slices:** #141 completion and #142 zero-inline-copy diagnostics

## User journeys reviewed

| Journey                 | Public boundary                      | Production proof                              | Result                                                                                     |
| ----------------------- | ------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Read table agreements   | no campaign-specific rules page      | Strahd Table Rules                            | compact chapter index, native disclosure state and expand/collapse-all recovery            |
| Build a quick character | reusable catalog and locale resolver | Character Generator                           | all product chrome is catalog-owned; generated content remains data-owned                  |
| Find a newspaper        | no production Gazette backend        | Gazette archive/detail                        | search, live counts, article index and distinct empty/not-found/error states               |
| Author N-language news  | campaign locale contract             | Gazette editor                                | fields follow the configured registry instead of fixed English/Italian pairs               |
| Reach protected tools   | no credentials or endpoints upstream | DM dashboard, login, forge, manage and editor | clear authentication boundary, semantic status/error feedback and destructive confirmation |

## Shared remediation

- `UiTextService.localized()` resolves data-owned labels through the selected
  interface locale and its catalog fallback chain without hardcoding a pair of
  languages.
- The UI-catalog verifier rejects fixed Italian/English branches and literal
  user-facing `aria-label`, `placeholder` or `title` attributes on every audited
  surface.
- The public template carries only this reusable resolver and regression
  contract. Gazette endpoints, DM authentication, campaign rules, generator
  content and all production campaign data remain downstream.

## Production remediation

- Table Rules uses progressive disclosure without losing index order, deep
  reading or screen-reader state.
- Character Generator, Gazette and Sanctum chrome moved to the editable
  `ui.json` registry.
- Gazette authored fields use locale-keyed dictionaries and the campaign locale
  registry; model descriptions, moods, sections and statuses use interface
  catalog keys.
- Archive and detail failures are recoverable and no longer masquerade as
  legitimate empty content.

## Evidence and boundaries

The final gate covers strict TypeScript, catalog parity, accessibility and the
quality-fortnight guard, both production campaigns, builds and import-graph
performance. Chrome reviewed Table Rules, Character Generator and Gazette at
1440 × 1000 and 390 × 844, including the unavailable-backend state.

Production's expanded editable catalog measures 508,042 initial bytes with a
347,609 byte largest initial asset. Only those two ceilings move to 510,000 and
350,000 bytes; request, deferred-script and generated-image limits stay fixed.

No campaign canon, newspaper data, private note, transcript, credential,
licensed rules corpus or protected media crossed into the public repository.

## Cross-cutting analysis

The systemic defect was ownership confusion, not merely untranslated labels.
Interface locale controls product chrome; campaign content locale controls
authored data. Editors must enumerate campaign-defined locales, while viewers
resolve them through campaign fallback rules. This constraint carries directly
into the 15 November Manager editor audit and the remaining #142 exception
review.

Issue #141 can move to awaiting release after merge. Issue #142 remains open:
today adds an enforceable guard for the audited surfaces, but does not claim a
repository-wide inventory or final exception policy.
