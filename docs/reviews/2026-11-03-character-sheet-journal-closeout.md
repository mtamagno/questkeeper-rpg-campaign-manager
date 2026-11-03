# Character Sheet and Journal Closeout

**Date:** 3 November 2026

**Classification:** shared

**Surfaces:** Character Sheet, Character Journal and their direct links

## Outcome

The complete character journey no longer turns mechanics and memories into one
long page. Sheet has five task-based workspaces; Journal has a lightweight index
and three optional memory collections. Both preserve every former datum and
action, expose stable URL destinations and keep transient reading state mounted
after first use.

## Lossless Sheet matrix

| Former content or action                                                | Current owner | Preserved behavior                                                                  |
| ----------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| Unlock, current level, combat essentials, currency and finite resources | At the table  | First visible workspace after unlock                                                |
| PDF export and relock                                                   | Sheet header  | Always reachable without changing workspaces                                        |
| Abilities, saves, skills, languages, features and traits                | Statistics    | Complete values and direct fragment routing                                         |
| Structured/legacy inventory, equipment, uses, weight and attunement     | Equipment     | Complete attributes plus an explicit empty state                                    |
| Spellcasting, slots, known/prepared spells and references               | Rules         | Existing rule links and explicit no-rules state                                     |
| Rule search, filters, favourites, prepared state and annotations        | Rules         | Mounted state survives workspace changes; durable preferences stay in User Settings |
| Level history, comparison and progression prose                         | Progression   | Archived level selection still drives the whole Sheet and PDF                       |
| Legacy `abilities` reading position                                     | Statistics    | Migrated rather than discarded                                                      |

No campaign schema or stored character record changed.

## Journal preservation matrix

| Concern                    | Evidence                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Discovery                  | Index lists only available notebook, gallery and diary collections and previews the latest diary entry       |
| Protected state            | Notebook keeps its existing password gate; switching collections does not recreate an already visited reader |
| Remembered position        | Existing character/campaign notebook index is clamped and exposed as **Continue reading**                    |
| Direct links               | `#character-journal`, `#notebook`, `#gallery` and `#diary` activate the owning outer and inner panels        |
| Large media                | Gallery and notebook do not initialize on the Journal index; first visit mounts only the selected collection |
| Lightbox/reader continuity | Visited workspaces remain mounted while hidden, preserving local component state                             |
| Empty archive              | A semantic message replaces missing controls when no collection is published                                 |
| Accessibility              | Real tab/panel IDs, selected state, roving focus and Left/Right/Home/End behavior are guarded                |

The password gate is a spoiler deterrent, not encryption or remote
authorization. This boundary is unchanged.

## Evidence

- Public and production strict TypeScript checks pass.
- `test:journal`, `test:notebooks`, `test:character-reading-position`,
  `test:character-profiles`, `test:mobile-layout` and `test:accessibility` pass
  in both repositories.
- Both Angular production builds pass.
- Production validates completed Phandelver and active Curse of Strahd: eight
  characters, one notebook, four galleries and eight diaries.
- Public fixtures validate notebook and diary behavior without importing any
  production canon or protected media.
- Visual review at 1440 x 1000 and 390 x 844 confirms a compact Journal index,
  two-column mobile tabs, stacked index cards, an isolated two-column mobile
  gallery and a readable desktop diary with no document-level horizontal
  overflow.

## Cross-cutting analysis

- **4 November command bar:** direct Journal links remain navigation actions;
  the command bar must not duplicate notebook position or other transient state
  as settings.
- **5 November User Settings:** language, audio, My Character and personal rule
  annotations remain durable preferences. Active Sheet/Journal workspace does
  not become a saved preference.
- **6 November performance:** measure gallery decoding with genuinely large
  collections. If evidence exceeds the budget, paginate or virtualize inside
  Gallery without rejoining the three Journal collections.
- **Dynamic campaign languages (#112):** new Journal labels and localized diary
  content must consume campaign language configuration when that epic lands;
  this refactor must not hard-code a permanent IT/EN data model.
- **Campaign authority (#113):** notebook passwords and browser state remain
  spoiler controls. They must never be presented as the server-side ownership
  boundary selected for publishing.
- **Future AI authoring:** notebook, gallery and diary drafts continue to require
  explicit review and publication. The reader hierarchy does not authorize an
  AI result to save itself.

## Remaining risk

Current production media is sufficient to prove deferred initialization and
layout, but not a pathological hundreds-of-images archive. That evidence belongs
to the scheduled 6 November performance task, not an unscheduled feature pulled
forward today.
