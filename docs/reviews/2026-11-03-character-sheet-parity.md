# Character Sheet lossless refactor parity matrix

**Date:** 3 November 2026  
**Classification:** shared  
**Fixtures:** original public demo, completed Phandelver and active Curse of Strahd

## Outcome

The Sheet area must show the information needed during play immediately without
rendering one endless document. This is an information-architecture and
progressive-rendering change, not a schema migration or content reduction.

The default **At the table** workspace owns the current play state. Four sibling
workspaces keep complete statistics, equipment, rules and progression easy to
find. A workspace is created only after its first visit and then remains mounted
but hidden, preserving transient search, filter and comparison state without
adding to page length.

## Before and after inventory

| Existing value, state or action                                            | Before 3 November                    | Preserved destination                                | Parity evidence                                                             |
| -------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Locked explanation and password dialog                                     | Sheet root                           | Sheet root before any workspace                      | Locked, wrong-password and successful-unlock checks                         |
| Shared unlocked state with protected profile                               | Sheet root                           | Sheet root                                           | Existing `PasswordService` contract remains authoritative                   |
| Relock protected character data                                            | Private Profile header               | Sheet header gains the same direct lock action       | Both surfaces close through the same character ID                           |
| PDF export, A4 label, progress and error feedback                          | Sheet header                         | Sheet header                                         | Current or selected archived level still drives the export                  |
| Level, ancestry, class, subclass, background, alignment and XP             | Long sheet stack                     | **At the table**                                     | Every identity value remains visible together                               |
| HP/max HP, AC, speed, initiative, passive perception and proficiency       | Combat dashboard                     | **At the table**                                     | Same source or existing derived calculation                                 |
| PP, GP, EP, SP and CP values                                               | Combat dashboard purse               | **At the table**                                     | Every non-zero denomination remains visible above equipment                 |
| Finite resource name, current/max, recovery, note and progress             | Resource cards                       | **At the table**                                     | Same clamping and recovery labels                                           |
| Six scores and modifiers                                                   | Ability panel                        | **Statistics**                                       | All six values remain visible in one grid                                   |
| Saving throws, skills and languages                                        | Training panel                       | **Statistics**                                       | Complete arrays; no truncation or merged labels                             |
| Structured and legacy inventory                                            | Inventory panel                      | **Equipment**                                        | Existing adapter remains the only source                                    |
| Item quantity, category, equipped state, attunement and note               | Inventory cards                      | **Equipment**                                        | Every metadata value remains on its item                                    |
| Signature-item title, prose and story return link                          | Inventory card aside                 | **Equipment**                                        | Existing explicit foreign key and story destination remain intact           |
| Feature and spell counts                                                   | Rule library                         | **Rules**                                            | Same derived collection membership                                          |
| Search plus All, Features, Spells, Prepared and Favourites filters         | Rule library                         | **Rules**                                            | Component stays mounted after first visit so transient state survives       |
| Spellcasting ability, save DC, attack bonus and slots                      | Rule library                         | **Rules**                                            | Existing inferred/explicit precedence is unchanged                          |
| Spell metadata, description, compendium link and provenance                | Rule cards                           | **Rules**                                            | Linked and unresolved entries remain distinguishable                        |
| Prepared/favourite state, personal note/reference and Settings link        | Rule cards                           | **Rules**                                            | User Settings remains the only editor                                       |
| Recorded-level count/range and current/archive state                       | Progression opening                  | **Progression**                                      | Same snapshots and selected level                                           |
| Level timeline and archived-level selection                                | Progression opening                  | **Progression**                                      | Selection still changes all workspaces and PDF                              |
| Archived-sheet warning and return-to-current action                        | Sticky index                         | Workspace navigation                                 | Warning remains visible above every workspace                               |
| Two-level selectors, comparison rows, signed deltas and collection changes | Progression comparison               | **Progression**                                      | Comparison component is unchanged and preserves its selection               |
| Evolution summary, snapshot title and changes from previous level          | Progression footer                   | **Progression**                                      | All recorded history prose remains visible                                  |
| One-level comparison empty state                                           | Progression comparison               | **Progression**                                      | Honest empty state remains available                                        |
| Empty inventory or rules collection                                        | Hidden because navigation omitted it | Stable **Equipment** or **Rules** workspace          | New explicit empty state explains that nothing is recorded                  |
| Remembered reading position                                                | Nearest scroll anchor                | Last selected workspace                              | Existing safe-anchor data is migrated without losing old `abilities` values |
| Direct links to the rules library and other sheet anchors                  | Fragment plus long-page scroll       | Fragment opens its owning workspace before scrolling | User Settings deep link remains functional                                  |
| Mouse, touch and keyboard section navigation                               | Sticky jump links                    | Accessible nested tablist                            | Click plus Left/Right/Home/End use the same workspace order                 |

## Workspace contract

| Workspace        | Purpose                                                                      | Initial rendering     |
| ---------------- | ---------------------------------------------------------------------------- | --------------------- |
| **At the table** | Identity, combat essentials, currency and finite resources                   | Default and immediate |
| **Statistics**   | Ability scores, saving throws, skills and languages                          | On first selection    |
| **Equipment**    | Complete structured or legacy inventory and signature-item links             | On first selection    |
| **Rules**        | Searchable features, spells, spellcasting and personal read-only annotations | On first selection    |
| **Progression**  | Level selection, archived sheets, comparison and evolution notes             | On first selection    |

Every workspace has a stable panel ID, visible focus, selected state and a short
plain-language description. Empty workspaces remain discoverable. Nested tabs
change only the current reading view; they are not a new durable setting.

## Exit checks

- [x] No field or action in the inventory above is absent after the refactor.
- [x] An archived level changes every workspace and the PDF, then returns safely
      to the current level.
- [x] Rule search/filter state and level-comparison selections survive switching
      workspaces after first render.
- [x] Direct sheet fragments activate the Sheet area and their owning workspace.
- [x] The default phone view ends after the table-ready content instead of the
      complete rule library and progression history.
- [x] Keyboard, narrow phone, 768 px, desktop and reduced-CSS-viewport zoom review pass.
- [x] The public demo, Phandelver and Curse of Strahd preserve their complete
      character data and protected boundaries.

## Validation evidence

- Angular template compilation and strict TypeScript pass in production and public repositories.
- The dedicated workspace and reading-position guards cover tab semantics, lazy-first rendering,
  mounted-state preservation, legacy `abilities` migration and direct fragments.
- Character-profile, rule-library, level-comparison, combat-resource, accessibility and entity-ID
  checks pass across the public demo, completed Phandelver and active Curse of Strahd.
- Headless Chrome reviewed Shyra at 390 x 844, 768 x 1024 and 1440 x 1000. The overview fits one
  desktop reading viewport; phone Equipment and tablet Statistics contain only their selected view.
