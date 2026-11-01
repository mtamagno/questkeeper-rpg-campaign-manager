# Character and Settings UX Focus Week

**Window:** 1–7 November 2026  
**Classification:** shared  
**Outcome:** a complete character experience that stays light to navigate, plus one
clear home for durable player preferences  
**Cadence:** two independently useful tasks per active day, followed by a same-day
journey review rather than an early task from another date

This focus week uses the former pause window and front-loads the character,
settings and command-bar portions of the wider UI, UX and accessibility audit.
Evidence completed here satisfies the matching entries in the quality fortnight;
it must not be repeated merely to fill a later slot. The 7 November closeout will
reassign only genuinely untested routes.

## Experience contract

The character page is organized by the task the player is trying to complete,
not by the order in which fields were added:

| Area              | Content                                                                                                  | Default behavior                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Profile**       | identity hero, quick facts, personality, ideals, flaws, hobbies, signature objects and favourite moments | first view, concise and public                   |
| **Story & bonds** | personal chapters, relationship cards, iconic quotes, known history and source links                     | one narrative trail without mixing private data  |
| **Sheet**         | protected profile, current sheet, resources, inventory, rules, level history and PDF export              | mechanics and their direct actions stay together |
| **Journal**       | optional notebook, gallery and session diary                                                             | campaign memory separated from current mechanics |

Each area has a stable URL state, a single tab panel, visible focus, arrow-key plus
Home/End navigation and an honest description. Existing landmark links must open
the area that owns the target. A tab is navigation state, not a saved preference.

### Action or setting?

| Control                                                                          | Ownership                          | Reason                                                            |
| -------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Continue reading, favourite page, guided tour, switch campaign, quick navigation | contextual/global action bar       | each acts on the current route or navigation context              |
| Install QuestKeeper                                                              | application action                 | it changes app availability, not reading preferences              |
| Download character PDF                                                           | Sheet area                         | it acts on the current character artifact                         |
| Mute and volume                                                                  | global User Settings               | durable player preference across campaigns                        |
| My Character                                                                     | campaign User Settings             | durable identity with campaign scope                              |
| Prepared/favourite rules, notes and personal references                          | character library in User Settings | private durable state with one editor                             |
| Language, motion, text density and future accessibility choices                  | review on 5 November               | they need an explicit global/campaign scope before implementation |

The top bar must expose common context and navigation, not become a second
settings page. Low-frequency actions may move into a clearly labelled overflow,
but no action becomes harder to discover solely to make the bar shorter.

## Daily plan

| Date      | Task 1                                                                                                    | Task 2                                                                                                                              | Same-day closeout                                                         |
| --------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **1 Nov** | [x] **Character information architecture and accessible tab foundation**                                  | [ ] Audit every current section, landmark and direct action against the four areas; record missing, duplicated or misplaced content | [ ] Verify the combined journey after both tasks                          |
| **2 Nov** | Refine Profile into a true at-a-glance start without deleting authored content                            | Refine Story & bonds: chapter discovery, relationship density, known-history sources and quotes                                     | Test short, empty and very long profiles                                  |
| **3 Nov** | Refine Sheet hierarchy: current values first, resources/rules/history next, PDF as a direct action        | Refine Journal hierarchy: notebook, gallery and diary with useful progressive disclosure                                            | Check protected content, remembered positions and large media collections |
| **4 Nov** | Inventory the sticky command bar by frequency, context and screen size                                    | Simplify its responsive hierarchy and overflow while preserving campaign switch, recovery and quick navigation                      | Keyboard, 360 px, 200% zoom and long-label review                         |
| **5 Nov** | Rebuild User Settings around RPG-style stable categories and clear global/campaign scope                  | Add save-state, descriptions, recovery and empty/error feedback without scattering editors                                          | Fresh user, returning player and two-campaign review                      |
| **6 Nov** | Cross-surface accessibility pass: tabs, headings, focus, names/states, contrast, reduced motion and touch | Performance and rendering pass so inactive areas and heavy media do not punish the first view                                       | Phone, tablet, desktop, wide screen and 200% zoom evidence                |
| **7 Nov** | Walk the complete player journey in the public demo, Phandelver and Curse of Strahd                       | Resolve regressions, reconcile docs/tests and rank only evidence-backed follow-ups                                                  | Weekly review, dependency/runtime health and downstream plan update       |

## Task 1 acceptance criteria

- All existing character content belongs to one of the four named areas.
- The initial view contains the identity hero and Profile only; the page no longer
  reads as one unbroken stack of every system.
- The active area is represented by the `tab` query parameter and can be shared.
- Existing links to chapters, bonds, notebook, quotes and diary still reveal and
  reach their target.
- Tabs expose correct roles, selected state, roving focus and Left/Right/Home/End
  keyboard behavior.
- PDF export remains in Sheet and no durable preference is introduced outside
  User Settings.
- The original public demo, completed Phandelver and active Curse of Strahd pass
  the affected profile, accessibility and build checks.

## Design references

The interaction model adapts established game accessibility patterns rather than
copying a specific visual skin:

- [Cyberpunk 2077 Update 2.1 accessibility features](https://www.cyberpunk.net/en/news/49591/update-2-1-accessibility-features): dedicated categories and reduced HUD noise;
- [Xbox Accessibility Guideline 112](https://learn.microsoft.com/en-my/gaming/accessibility/xbox-accessibility-guidelines/112): consistent menu layout, predictable focus and equivalent digital navigation;
- [Xbox Accessibility Guideline 114](https://learn.microsoft.com/bg-bg/xbox/accessibility/xbox-accessibility-guidelines/114): clear hierarchy and enough context before a player activates a control.

Fantasy atmosphere may decorate the categories, but labels, contrast, focus and
recovery remain more important than ornament.

## Downstream effect

This week refines, rather than discards, QK-056, QK-057, QK-064 and QK-066.
Character rule content remains derived, personal annotations keep one private
editor, and all new settings must declare scope, persistence, privacy, default
and migration behavior. At the closeout, matching quality-fortnight entries are
marked with the evidence produced here; later tasks inherit this tab and
action-ownership contract.
