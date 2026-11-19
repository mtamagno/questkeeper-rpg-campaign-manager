# Character PDF exports

QuestKeeper offers four exports from the unlocked Character Sheet. They all use
the currently selected level snapshot and the active campaign content locale.

| Format                    | Intended use                       | Included                                                                                                     | Deliberately excluded                                              |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Complete fantasy dossier  | A lasting character record         | Illustrated identity, public story anchors, recent public memories, quotes and the selected mechanical sheet | Private profile, passwords and protected notebook pages            |
| Printable character sheet | Filing and handwritten table notes | Two focused mechanical pages                                                                                 | Story pages, private prose and notebook pages                      |
| Public story dossier      | Sharing with players or readers    | Portraits, public profile, lore chapters, public diary excerpts and quotes                                   | Protected mechanics, private profile, passwords and notebook pages |
| Game-night quick sheet    | Fast reference during play         | One page of combat values, abilities, resources, slots, equipped gear, spells and features                   | Long prose, full inventory history and private material            |

## Privacy boundary

The PDF service accepts only public narrative inputs and the already unlocked
sheet snapshot. It has no input for a password, private profile or notebook.
The public story dossier is the safest sharing choice, but the player should
still review the generated file before distributing it.

## Product rules

- A historical level selected in the sheet exports that level, never silently
  the latest one.
- Export is read-only and never changes campaign or character data.
- Interface labels come from the JSON UI catalog; authored story text remains
  campaign data.
- Adding a fifth format requires a focused user purpose, an explicit content
  allowlist and a regression update in `verify-character-pdf-exports.cjs`.
- The complete dossier can later feed the campaign-book workflow; the
  game-night format remains a compact snapshot, not a second live tracker.
