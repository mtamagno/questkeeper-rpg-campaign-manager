# Character mobile audit and 1 November closeout

**Date:** 1 November 2026
**Classification:** shared
**Surfaces:** character profile, campaign home, global command bar and mobile drawer
**Campaign evidence:** public demo, completed Phandelver and active Curse of Strahd

## Outcome

The four character areas contain every existing profile surface and direct action.
The mobile shell now exposes the same capabilities without presenting the desktop
command bar, hidden horizontal tabs or nested desktop-sized cards on a phone.

No authored character content, protected boundary or action was removed.

## Ownership audit

| Area                         | Owned sections                                                                       | Direct actions                                                                                                                                      | Audit result                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Persistent identity hero** | portrait, name, ancestry/class/level, HP, AC, proficiency, height and player         | none                                                                                                                                                | Shared context is intentionally visible above every area. Values are derived from the current sheet rather than copied state.                                          |
| **Profile**                  | Character at a Glance; Keepsakes & Favourite Moments                                 | follow a cited story source                                                                                                                         | Complete. Mechanical inventory remains in Sheet; a keepsake is explicitly narrative.                                                                                   |
| **Story & bonds**            | Personal Chapters/Origins; Bonds along the Road; Iconic Quotes; What the Party Knows | move the bond carousel, open an entity or relationship, open the full map, follow public evidence                                                   | Complete. The authored personality bonds field and evolving relationship cards remain distinct concepts.                                                               |
| **Sheet**                    | Secret Profile; Character Sheet                                                      | unlock/relock, download PDF, select current or archived level, compare levels, navigate sheet sections, search/filter/save personal rule references | Complete. Every mechanic or protected prose action stays with the artifact it changes. The 3 November preservation matrix remains required before density refactoring. |
| **Journal**                  | optional Notebook; Gallery; Session Diary                                            | unlock/relock and turn notebook pages, open notebook art                                                                                            | Complete. Chronological memories are not duplicated into favourite moments; favourites only cite their source.                                                         |

## Findings carried forward

- The language control is a persisted global preference displayed inside each
  character hero. Its final ownership and whether a lightweight shortcut should
  remain are deliberately assigned to the 5 November User Settings review.
- Profile Bonds describes an authored character trait; Bonds along the Road
  describes live relationships. Later copy changes must keep that distinction
  clear instead of merging their data.
- The Sheet is functionally complete but visually dense. Its 3 November task is
  a lossless refactor and may not begin without the recorded parity matrix.
- Empty optional sections correctly disappear. The tab remains stable because
  each area still has a meaningful base surface.

## Mobile corrections

- The hamburger and compact command bar now share one 52-pixel control strip.
- Continue, quick navigation and the current-character shortcut remain primary
  when available; lower-frequency actions use a labelled overflow menu.
- The drawer sits above the backdrop and command bar, respects safe areas,
  limits its width and freezes the background document while open.
- Campaign home uses a shorter, left-aligned hero, compact quote/pulse surfaces
  and a two-by-two metric grid.
- All four character tabs are visible as a two-by-two grid; no horizontal
  discovery scroll is required.
- The identity hero, stats, profile facts and accordions use phone-scale spacing.
  Redundant outer section cards become transparent so content is not boxed twice.
- Touch targets remain at least 40-48 pixels and focus styling is preserved.

## Evidence

- npm run test:mobile-layout
- npm run test:character-profiles
- npm run test:accessibility
- strict TypeScript in both repositories
- complete public and production builds
- headless Chrome at 390 x 844 for Strahd home, Shyra profile, open navigation
  drawer and open mobile action overflow
- production validation covers 8 characters, 64 relationship feelings,
  Phandelver and Curse of Strahd; the public demo remains redistribution-safe

## Downstream constraints

The 2 November Profile and Story refinements inherit this ownership table. The
3 November Sheet task must preserve every action listed above. The 4 November
command-bar review starts from the new frequency-based mobile overflow rather
than restoring icon density. The 5 November settings review owns persisted
language placement. Any new character feature must name its area and direct
actions before implementation.
