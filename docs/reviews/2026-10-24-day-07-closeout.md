# Day 07 closeout — a demo that teaches through play

**Date:** 24 October 2026

**Classification:** public-only demo content plus shared player journey

**Work reviewed:** both Day 07 outcomes after the Lanternwake release was
explicitly brought forward to 20 October

**Explicitly not started:** Day 08 character-profile redesign

## Outcome delivered

Lantern Road now behaves like a small but credible campaign rather than a set
of placeholders. Its two chapters carry connected prose, decisions, locations,
quotes and character memories. A focused demo guard protects that continuity.

The campaign homepage also turns those records into a four-step game-night
brief: what changed, where the party is, one personal thread and what matters
now. Every step links to its supporting public record, so the brief helps a
returning player without becoming a competing source of truth.

## Combined journey reviewed

- A first-time visitor can still follow the five-stop guided tour.
- A returning player can understand the current situation from campaign home
  and open the supporting chapter, place, profile or full recap.
- Recent pages, favourites and offline preparation remain independent helpers;
  the new brief does not gate them or duplicate their browser memory.
- Empty campaigns retain the existing pre-session state instead of presenting
  fabricated progress.

## Evidence

- `npm run test:demo` validates Lantern Road chronology, links and memories.
- `npm run test:game-night-brief` validates evidence derivation, bilingual UI,
  semantic ordering and responsive breakpoints.
- The complete public verification gate and both production campaign builds
  pass before publication.
- Chrome review covers Lantern Road, active Curse of Strahd and completed
  Phandelver. The brief remains four, two and one columns at its breakpoints.

## Continuity and downstream impact

- QK-034 makes public evidence and backlinking mandatory for later summaries,
  dashboards and AI-assisted reading paths.
- Day 08 can redesign character profiles without changing the brief contract;
  the personal-thread card must keep resolving to a public profile.
- Day 09 return-to-character work may add a faster shortcut, but cannot store
  protected text in recent-page memory.
- Day 57 can expand Lantern Road into the complete showcase by extending the
  same chronology and evidence graph instead of replacing this fixture.
- A pre-existing narrow-screen overflow on the first-visit chooser was observed
  during review and remains outside Day 07 scope for focused follow-up.

The re-planned release slot was already complete. Splitting today's remaining
journey outcome into one public fixture commit and one reusable campaign-home
commit restores two meaningful deliverables without borrowing Day 08 work.
