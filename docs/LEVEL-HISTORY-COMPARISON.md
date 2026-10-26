# Side-by-side level history

**Roadmap:** Day 10, commit 1

An unlocked character sheet with at least two recorded snapshots now offers two
independent level selectors and a row-aligned comparison. Identity, core stats,
ability scores and collection counts remain in the same position on both sides,
so a player can inspect exact historical values without repeatedly switching
the entire sheet.

The comparison keeps both columns side by side. On narrow screens it becomes a
labelled, keyboard-focusable horizontal reading region instead of stacking and
losing row correspondence; the two level pickers stack above it so their full
labels remain readable and keep 44-pixel touch targets. Characters with only
one recorded sheet receive an honest empty state explaining when comparison
becomes available.

This task deliberately establishes neutral comparison structure only. Day 10's
second task owns gained/lost/changed emphasis for spells, abilities, gear and
statistics.
