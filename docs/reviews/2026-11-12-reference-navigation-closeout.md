# 12 November 2026 — Reference navigation closeout

**Plan:** UI, UX and Accessibility Quality Fortnight, 12 November  
**Classification:** shared patterns with production-only licensed reference content  
**Issue slice:** #141 remains open for the 13 November generator, Gazette and GM-tool work

## User journeys reviewed

| Journey                                 | Public proof                          | Production proof                               | Result                                                                                     |
| --------------------------------------- | ------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Reach a trusted rule quickly            | Essential Compendium                  | Rules Compendium hub                           | Clear source context, direct index/search and catalog-owned chrome                         |
| Narrow a large rule set                 | Five redistributable baseline entries | category lists, Spellbook and Armory           | Search, source/category filters, honest result counts and recoverable empty states         |
| Read a result on a phone                | baseline cards                        | rule, spell and item results                   | Tables become labelled cards below 720 px instead of requiring a wide horizontal scan      |
| Move between reference levels           | source citation and campaign return   | hub, category, entry and City & Wild tools     | Correct category breadcrumb, visible back paths and compact tool links                     |
| Explore the extended homebrew reference | not redistributed                     | City & Wild hub, index, calculator and credits | Long chapter inventory is collapsible; index/search and calculator result remain reachable |

## Remediation delivered

- The public baseline owns no visible bilingual branch in its template. Interface
  copy is resolved from the versioned JSON registry, while rule content stays in
  the approved redistributable package.
- Its sticky rule index exposes direct anchors; search keeps a live result count,
  source citations announce new-tab behavior and 44 px targets remain usable by
  touch and keyboard.
- Production gains category search in addition to its existing source and
  subcategory filters. Spellbook and Armory filters can be collapsed without
  hiding their state or reset path.
- Dense tables receive explicit mobile labels and become readable cards. Desktop
  tables retain their compact comparative layout.
- City & Wild places index, calculator and credits together at the top of the
  hub; chapter collections use native disclosure and the calculator announces
  recalculated output politely.
- The entry breadcrumb now returns to its real category rather than silently
  sending every reader to the top-level hub.

## Accessibility and content boundaries

- Product-owned reference chrome added today is stored in `ui.json` for every
  shipped interface locale.
- Proper names, rule data, source taxonomies and licensed/homebrew prose stay in
  their existing data sources. None of the production-only reference corpus was
  copied into the public template.
- Native links, search inputs, disclosure widgets, headings, live counts and
  mobile `data-label` values preserve an understandable non-visual order.
- The largest public initial asset now exceeds its previous 300,000-byte ceiling
  by 2,468 bytes, so that one ceiling moves to 305,000 bytes. Total initial
  bytes, request count, deferred scripts and image limits do not move.

## Cross-cutting analysis

The recurring defect was not one oversized table; it was treating all reference
screens as desktop indexes. The durable rule is now: discovery first, optional
filters second, comparable results third, and one clear route back. Wide tables
may remain on desktop only when the mobile representation carries the same field
names and values.

Issue #141 is deliberately not closed. This slice externalizes the public
baseline and the production reference shell, but the 13 November audit still
owns Character Generator, Gazette and GM-tool copy. The final #142 audit remains
responsible for repository-wide zero-inline-copy enforcement and exception
review; content-language selections and licensed data are not UI-copy defects.
The same evidence shows that completing #137 by repeatedly embedding the full
catalog in JavaScript would create cumulative bootstrap cost. #142 must preserve
the one-file editing contract while evaluating asset/bootstrap delivery for the
registry before its final zero-inline-copy gate.

## Future-task impact

- 13 November reuses this discovery/filter/result pattern for campaign-only
  utilities instead of creating a second dense dashboard style.
- 15 November local-compendium and import work must preserve source provenance,
  search recovery and the mobile labelled-result contract.
- 17 November regression evidence must include 360 px, keyboard disclosure,
  a no-results recovery and one long entry with a table of contents.
- No feature-expansion roadmap item was pulled forward.
