# Living relationship history

**Roadmap:** Day 15 · 20 November 2026  
**Classification:** shared

QuestKeeper keeps one canonical relationship edge and lets the table record how
that edge changes. The spatial map now summarizes people, bonds, authored
feelings and shared moments. Its accessible list exposes the same current pulse;
hover is never required.

## History contract

- `history` contains session-linked snapshots of trust, tension and affection.
- Each dimension is optional and uses an integer from 0 to 5. Missing means
  unknown, not zero.
- `promiseHistory` records changes to a stable `promiseId` as `made`, `kept`,
  `broken` or `released`.
- Notes and promise labels follow the campaign locale registry.
- The reader shows only authored values and always retains the canonical session
  ID as evidence.

Campaign Manager edits both timelines alongside the existing relationship
description, feelings, shared events, quotes and type evolution. It does not
infer scores from prose. The verification gate rejects unknown sessions,
out-of-range scores, invalid promise transitions and incomplete localized copy.

Future shared-memory and party-gallery work must link to this same relationship
and session evidence rather than creating a second bond store.

## Reader-scaled NPC map

The NPC relationship map is a view over the same canonical edges, not another
relationship store. Every player character stays pinned to the map. On a first
visit, QuestKeeper adds the two most recently encountered NPCs, using the latest
session cited by authored relationship evidence and manifest order as a stable
tie-breaker and legacy fallback.

Readers can search known NPCs and locations, add or remove NPCs, show everyone,
hide every NPC or return to the live “latest two” default. A custom selection is
stored only on the current device and is scoped to the campaign. The spatial
graph, network pulse and accessible linear list always receive the same filtered
edges; hiding an NPC never deletes, rewrites or conceals the canonical data from
other views.
