# 17 November 2026 — UI, UX and accessibility exit review

**Plan:** UI, UX and Accessibility Quality Fortnight, exit gate

**Classification:** shared

**Issue slice:** #142 interface-copy ownership and repository-wide diagnostics

## Scheduled task 1 — cross-surface regression

The final pass exercises the same contracts across the public example and the
production Phandelver and Curse of Strahd campaigns instead of accepting one
polished route as representative of the product.

| Contract                | Automated boundary                                                                                                     | Review boundary                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Keyboard and focus      | Native button types, modal containment/restoration, tab arrow keys, no positive `tabindex`, no render-time `autofocus` | Sidebar, command bar, settings, character tabs, gallery and Manager workspaces       |
| Screen-reader structure | Routed `h1` focus, landmarks, live status, labelled tabs and explicit image alternative decisions                      | Campaign entry, dense character reading, NPC discovery, maps and operations recovery |
| Contrast and zoom       | Semantic narrative roles, high/forced-contrast foundations and no theme-local key-event colour                         | 360 px, 768 px, desktop, wide and 200% reading flow                                  |
| Touch and motion        | Global coarse-pointer minimums and reduced-motion override                                                             | Sticky controls, carousels, disclosure panels, lightbox and long Manager forms       |
| Locale ownership        | One JSON registry, placeholder parity, global literal-copy guard                                                       | English and Italian menus remain independent from campaign-authored prose            |

The accessibility guard now audits every tracked Angular template for image
alternative decisions, positive tab order, implicit buttons and stolen focus.

## Scheduled task 2 — blocker resolution and ranked follow-up

No unowned blocker or high-severity accessibility defect remains from the
fortnight. The final remediation moves protected-dialog copy, missing-character
recovery, stat names and screen-reader labels into the editable JSON registry.
The catalog guard now covers literal visible copy and user-facing attributes in
every tracked template; the only reviewed literal exceptions are keyboard
tokens, notation, document format, a proper module name and the URL syntax
example.

The public measured initial ceiling moves from 461,000 to 464,000 bytes and
production from 510,000 to 511,000 bytes for the new always-available registry
labels. Production's largest-initial-asset ceiling moves narrowly from 350,000
to 351,000 bytes after the shared catalog chunk measured 350,033 bytes.
Requests, deferred scripts and image ceilings do not move.

### Ranked follow-up register

1. **High · #142:** finish migrating inline bilingual branches in the global
   command palette and character reading surfaces. The new guard prevents fresh
   literal copy, but dynamic ternaries remain explicit debt rather than being
   hidden behind a false “zero-copy” claim.
2. **High · #139:** finish the character, sheet and journal catalog migration
   together so one profile never mixes registry-owned labels with fixed EN/IT
   branches.
3. **Awaiting release · #141:** close only after the next published release
   smoke test proves compendium, generator and production-tool catalog copy.
4. **Adoption evidence · #101:** external GM testing remains the decision gate
   for large new workflows after the quality window.

Production has additional `isItalian()` occurrences in rules modules because
some select licensed/data-owned localized fields rather than product chrome.
The #142 follow-up must classify those boundaries before changing them; data
selection is not automatically an interface-copy violation.

## Issue outcome

This is an independently complete #142 slice, not completion of the parent
issue. It delivers repository-wide literal-copy enforcement, reviewed
exceptions and an ordered remaining migration. #142 stays open until the
dynamic interface branches and final exception inventory are resolved.

## Cross-cutting analysis

The fortnight confirms one durable rule: an accessible control and editable
copy are the same ownership problem. A translated visual label with a fixed
English accessible name is still broken; moving only prose while leaving
titles, placeholders or recovery messages inline is also incomplete.

Feature delivery may resume on 18 November with the deferred journal-linking
outcome, but it inherits these constraints:

- new product-owned text enters through `ui.json`;
- campaign prose and licensed data remain campaign/data owned;
- every image declares its text-alternative decision;
- no component repairs reading order with a positive tab index or autofocus;
- route and Manager additions must satisfy the page-quality rubric at creation.

## Validation evidence

- Public `npm run verify` passed end to end: lint, formatting, strict
  TypeScript, 34 product contracts, 106 Manager tests, 11 transcriber tests,
  production build and performance budgets.
- Production strict TypeScript, 787-key UI catalog, 66-template accessibility,
  two-campaign entity-ID, build and performance gates passed; 89 Curse of
  Strahd and 292 Phandelver source images were checked.
- Browser review covered the public first-visit path at 360, 768 and 1,440 px,
  Curse of Strahd at 390 and 1,440 px, Phandelver at 768 px and a 200%-reading
  equivalent. Navigation stayed operable, copy remained legible and no
  horizontal clipping appeared in the reviewed paths.

## Boundaries

The reusable guards, catalog keys and quality conclusions are paired. The
production repository alone retains campaign canon, private notes, transcripts,
licensed rules data, credentials and protected media. No protected content
crosses into the public template.
