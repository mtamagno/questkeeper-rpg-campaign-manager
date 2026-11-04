# Global shell and command-bar audit

**Date:** 4 November 2026  
**Classification:** shared  
**Surfaces:** sticky command bar, breadcrumbs, quick navigation and global shell  
**Evidence fixtures:** public example, completed Phandelver and active Curse of Strahd

## User outcome

The sticky surface must answer three questions without becoming a second
sidebar: where am I, how do I resume, and how do I reach another destination?
Actions that configure the application or happen rarely stay available in one
clearly labelled overflow. Nothing in this bar becomes a durable setting.

## Route and state inventory

| State                          | Required context            | Primary actions                                         | Secondary actions                                               |
| ------------------------------ | --------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Campaign library               | current route               | Quick navigation                                        | local Manager, install, guided tour                             |
| Campaign route                 | breadcrumb/campaign context | Continue when available, My Character, quick navigation | switch campaign, favourite, local Manager, install, guided tour |
| Deep character/chronicle route | current page and campaign   | Continue, My Character, quick navigation                | same campaign tools; direct fragments remain page-owned         |
| No remembered page             | current route               | My Character and quick navigation                       | no empty Continue control                                       |
| No chosen character            | current campaign            | Choose My Character links to campaign settings          | no invented character destination                               |
| Installed application          | current route/campaign      | unchanged                                               | no unavailable Install action                                   |
| Hosted Companion               | current route/campaign      | unchanged                                               | no local Manager action                                         |
| Open sidebar or palette        | owning surface              | focus stays in the active modal/drawer contract         | command overflow must not compete above it                      |

## Action ownership and frequency

| Control                                  | Frequency                      | Context                  | Placement decision                                                         | Persistence                              |
| ---------------------------------------- | ------------------------------ | ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------- |
| Breadcrumbs                              | frequent orientation           | current route            | visible on wide screens; sidebar and quick navigation cover compact widths | none                                     |
| Continue reading                         | frequent recovery, conditional | remembered page          | primary at every width                                                     | existing local journey memory            |
| My Character / choose character          | frequent campaign return       | active campaign          | primary at every width                                                     | choice remains in campaign User Settings |
| Quick navigation                         | frequent global navigation     | all routes               | primary at every width; Ctrl/Cmd+K remains available                       | query is transient                       |
| Switch campaign                          | occasional context change      | active campaign          | first contextual item in overflow                                          | active campaign follows navigation       |
| Favourite current page                   | occasional journey action      | eligible route           | overflow                                                                   | existing local journey memory            |
| Campaign Manager                         | author-only and local          | local service available  | overflow                                                                   | none                                     |
| Install QuestKeeper                      | one-time and conditional       | install prompt available | overflow                                                                   | browser/PWA owned                        |
| Guided tour                              | onboarding/recovery            | all routes               | overflow                                                                   | existing tour progress                   |
| Language, audio and My Character editing | durable preference             | global or campaign       | User Settings, never duplicated here                                       | User Settings owned                      |
| PDF, notebook, Sheet and Journal actions | artifact action                | owning page              | stay inside their page/workspace                                           | page state only                          |

## Viewport hierarchy

| Viewport                            | Visible strip                                                     | Overflow behavior                                                                            |
| ----------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Wide desktop                        | breadcrumb; labelled Continue, Character and Go to; labelled More | one anchored panel, campaign switch first                                                    |
| Tablet / narrow desktop / 200% zoom | compact primary actions plus More                                 | same content and order; labels may collapse before actions do                                |
| Phone at 360 px                     | hamburger beside up to three 40 px primary actions plus More      | panel fits the viewport, uses 48 px rows and never creates page overflow                     |
| Long translated labels              | primary controls may become icon plus accessible name             | overflow copy wraps; campaign name truncates visually without truncating its accessible name |

## Findings and severity

1. **High — incomplete overflow dismissal.** The current compact menu has no
   outside-click or independent Escape recovery and can remain open after
   unrelated route changes.
2. **Medium — desktop action flattening.** \`display: contents\` promotes every
   low-frequency action into the wide command row, so all controls compete with
   recovery and navigation.
3. **Medium — breakpoint-specific ownership.** Names such as \`mobile-more\`
   describe presentation rather than the stable action hierarchy and make
   future responsive changes harder to reason about.
4. **Medium — visual equality hides frequency.** Manager, install and tour use
   the same weight as Continue and quick navigation on wide screens.
5. **Low — compact icon ambiguity.** Accessible names exist, but the overflow
   trigger needs a visible More label whenever space permits.

## Task 2 remediation contract

- Use one overflow model and action order at every width.
- Keep Continue, My Character and quick navigation primary and conditional.
- Put campaign switch first in the overflow, followed by page/campaign actions,
  then application tools.
- Close the overflow on action, navigation, outside click and Escape; Escape
  returns focus to its trigger.
- Preserve the palette dialog, keyboard shortcut, focus trap and breadcrumb
  semantics.
- Keep at least 40 px primary and 48 px overflow touch targets.
- Verify 360 px, 768 px, desktop, 200% zoom, long campaign names, keyboard-only
  use and unavailable conditional actions.

## Downstream constraints

The 5 November User Settings review owns language, audio and My Character
editing. The 6 November accessibility pass inherits the overflow dismissal and
focus contract. New global actions must declare frequency, context, placement
and persistence before entering the command bar.
