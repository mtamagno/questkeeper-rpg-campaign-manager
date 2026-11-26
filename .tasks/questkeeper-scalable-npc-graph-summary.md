# QuestKeeper — scalable NPC relationship graph summary

**Date:** 2026-11-23
**Classification:** shared

## Completed outcome

- Replaced the always-maximal NPC web with a reader-controlled graph view.
- Kept the whole party pinned and made the two latest encountered NPCs the live
  first-visit default.
- Added a collapsible, searchable selector grouped by known location, with
  single-NPC toggles and latest, all and none presets.
- Remembered custom choices per campaign and device without changing campaign
  data or canonical relationship edges.
- Applied the same filtered edge set to the visual graph, network pulse and
  accessible linear relationship list.

## Decisions carried forward

- Visibility is presentation state, never a second relationship model.
- “Latest encountered” is derived from authored session evidence; manifest
  order is only the deterministic tie-breaker and compatibility fallback.
- New NPCs automatically enter the default latest-two view until the reader
  creates a custom selection. “Latest two” returns to that live mode.
- Future graph filters must remain campaign-scoped, local to the reader and
  equivalent in spatial and non-spatial presentations.
