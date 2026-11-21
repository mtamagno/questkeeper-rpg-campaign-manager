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
