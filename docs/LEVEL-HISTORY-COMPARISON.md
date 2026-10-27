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

The later column now distinguishes increased, decreased and otherwise changed
values with a signed label as well as colour. A compact live summary announces
how many values changed and how many collection entries were gained or lost.
Spells, features, skills and equipment are compared by normalized entry name,
then presented in responsive gained/lost cards; equal totals therefore cannot
hide a replacement. Whitespace, casing and duplicate entries do not create
false progression.

The comparison remains derived from immutable snapshots. QuestKeeper does not
write diff metadata into campaign data and does not infer missing history.
Importers and future AI-assisted extraction must preserve complete historical
collections so the same deterministic comparison remains trustworthy.
