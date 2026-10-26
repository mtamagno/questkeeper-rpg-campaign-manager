# My Character quick return

**Roadmap:** Day 09, commit 1

QuestKeeper lets a player identify their character once on each device and
return to that public profile in one deliberate action.

## Companion journey

1. Open **The Party**.
2. Choose **This is my character** on one card.
3. Use **My character** in the sidebar, the persistent top bar or quick
   navigation from then on.
4. Activate the selected card again to clear the shortcut or choose another
   character to replace it.

The preference is campaign-specific. It stores only campaign and character IDs
in browser storage; it never copies the sheet, journal, private profile,
password or other protected content into journey memory.

## Campaign Manager journey

The Characters tab exposes the same explicit choice. Once a character is
selected, **Open Companion** becomes **Open my character** and deep-links to the
public profile whenever the local Companion is ready. Manager and Companion
preferences remain device-local and reversible.

## Failure and change behavior

- A deleted, renamed or unpublished character cannot create a ghost shortcut:
  the stored ID must resolve in the currently loaded public party.
- A campaign without a selection links to the party chooser instead of guessing
  from player names, images or the last profile visited.
- Switching campaigns resolves an independent choice for that campaign.
- Storage failures leave the in-memory interaction usable for the current page.
