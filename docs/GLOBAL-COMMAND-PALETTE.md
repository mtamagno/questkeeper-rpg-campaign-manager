# Global command palette

**Roadmap:** Day 05, commit 1  
**Goals:** GN-03 — Retrieve, GN-05 — Read anywhere  
**Journey:** P-04 — Retrieve a fact during play

QuestKeeper provides one navigation palette on every page. It promotes the
existing **Go to… / Vai a…** control into a keyboard-first route finder without
turning it into campaign-content search.

## Open and navigate

- Select **Go to… / Vai a…**, or press `Ctrl+K` on Windows and Linux and
  `Command+K` on macOS.
- Type any English or Italian route keyword.
- Use `Arrow Up` and `Arrow Down` to move through the visible destinations.
- Use `Home` or `End` to jump to the first or last result.
- Press `Enter` to open the selected destination and move focus to the new
  page, or `Escape` to close and return focus to the control that opened it.
- `Tab` remains inside the modal palette until it is closed.

The result list identifies destinations in the current campaign, other
campaigns and global QuestKeeper areas. The current page is labelled rather
than silently removed. Switching campaign still passes through the normal
spoiler-consent guard.

## Scope and trust boundary

The palette indexes stable navigation destinations only. It does not inspect
protected sheets, private notes, passwords or GM-only content, and it does not
bypass route guards. Character-, NPC-, session- and place-level full-text
search remains a later roadmap capability with its own visibility review.

Recent pages, favourites and continue-reading actions are deliberately absent
from this delivery. They are the second Day 05 task and must extend this
palette without changing its keyboard, focus or consent contract.

## Responsive and accessible behavior

- The palette uses a labelled modal dialog, combobox and listbox relationship.
- Result changes are announced without moving focus away from the search box.
- Pointer hover and keyboard selection share the same visible active state.
- The layout remains usable at 360 CSS pixels and honours reduced motion.
- Closing restores the previous focus; successful navigation focuses the main
  content landmark.

Production may add its own safe route destinations, such as the compendium,
gazette or table rules. Campaign canon and protected content never move into
the public template merely to populate the palette.
