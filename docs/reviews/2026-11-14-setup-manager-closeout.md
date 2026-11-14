# 14 November 2026 — Setup and Campaign Manager closeout

**Plan:** UI, UX and Accessibility Quality Fortnight, 14 November

**Classification:** public-only setup packaging plus shared Manager behavior

**Issue slice:** #142 catalog and diagnostic coverage for the surfaces changed today

## User journeys reviewed

| Journey                   | Public product          | Production proof                | Result                                                                                                                        |
| ------------------------- | ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Choose a runtime          | graphical setup         | not distributed by production   | the selected private/system consequence is visible before installation and safe fallback remains explicit                     |
| Choose data storage       | graphical setup         | 1.1.4 migration fixture         | the destination and portable/per-user consequence are visible before installation; migrated data retains rollback evidence    |
| Create launchers          | graphical setup         | not distributed by production   | Manager and Companion shortcuts explain their different outcomes instead of appearing interchangeable                         |
| Finish first launch       | graphical setup         | clean process shutdown          | completion reports runtime, storage and migration; either app can be opened before a visible automatic close                  |
| Find a campaign           | shared Campaign Library | Phandelver and Curse of Strahd  | neutral archive, search, covers, metrics and primary actions remain readable at desktop and compact widths                    |
| Create or edit a campaign | shared Manager editor   | both production campaigns       | sticky section navigation avoids an undifferentiated long form; the original Library context is preserved                     |
| Recover from mistakes     | shared Manager dialog   | API and native validation paths | inline error summary, first-invalid-field focus, duplicate-submit guard and unsaved-draft confirmation form one recovery path |

## Remediation

- Setup now presents a live consequence summary for runtime, storage,
  shortcuts and first launch before any work begins.
- Shortcut labels distinguish the authoring Manager from the player-facing
  Companion and the completion state reports what was actually prepared.
- Completion remains process-safe: the user can open either app or close
  immediately, while a visible 30-second fallback still terminates the setup
  service if no action is taken.
- The campaign editor gains a sticky, keyboard-operable section index. Section
  headings receive real heading semantics and programmatic focus targets.
- User edits show an explicit unsaved state and closing by button, Cancel or
  Escape uses the same loss-prevention contract.
- Editing a card from the Campaign Library no longer navigates away from the
  Library behind the dialog.

## Cross-cutting analysis

The common requirement is **choice → consequence → recovery**. A setup choice
must explain what will be installed and where; an editor choice must preserve
context, reveal unsaved state and offer a predictable recovery path. This is a
stronger reusable rule than adding more explanatory prose or larger dialogs.

The 15 November editor audit must therefore reuse the campaign editor's
bounded-section pattern where forms are long, but only after grouping fields by
the task the user is trying to complete. It must not create one tab per field or
hide required manual authoring behind AI. Character, NPC, session, map,
notebook and relationship editors must retain entered values through validation
and keep AI results reviewable drafts.

Issue #142 remains open. Today's regression extends translated coverage to the
new Manager navigation, draft state and destructive warning, and extends setup
verification to the new consequence/outcome contract. It does not claim that
the standalone Setup and Manager catalogs have completed the repository-wide
JSON migration or exception inventory.

## Boundaries

Setup is intentionally public-only because production does not distribute the
native installer. Manager behavior and its tests are paired in both
repositories. Phandelver and Curse of Strahd are compatibility evidence only;
no canon, private note, transcript, credential, licensed corpus or protected
media entered the public template.
