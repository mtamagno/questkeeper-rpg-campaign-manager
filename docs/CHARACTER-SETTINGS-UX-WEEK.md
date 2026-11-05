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

| Date      | Task 1                                                                                                                                  | Task 2                                                                                                                              | Same-day closeout                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **1 Nov** | [x] **Character information architecture and accessible tab foundation**                                                                | [x] Audit every current section, landmark and direct action against the four areas; record missing, duplicated or misplaced content | [x] Verify the combined journey after both tasks                                                                      |
| **2 Nov** | [x] **Refine Profile into a true at-a-glance start without deleting authored content**                                                  | [x] **Refine Story & bonds: chapter discovery, relationship density, known-history sources and quotes**                             | [x] Test short, empty and very long profiles                                                                          |
| **3 Nov** | [x] **Review and refactor the heavy Sheet tab: inventory every value/action first, then make current play state immediately scannable** | [x] **Refine Journal hierarchy: notebook, gallery and diary with useful progressive disclosure**                                    | [x] Prove Sheet content/function parity, then check protected state, remembered positions and large media collections |
| **4 Nov** | [x] Inventory the sticky command bar by frequency, context and screen size                                                              | [x] Simplify its responsive hierarchy and overflow while preserving campaign switch, recovery and quick navigation                  | [ ] Keyboard, 360 px, 200% zoom and long-label visual review (browser host unavailable)                               |
| **5 Nov** | [x] Rebuild User Settings around RPG-style stable categories and clear global/campaign scope                                            | [x] Add save-state, descriptions, recovery and empty/error feedback without scattering editors                                      | [x] Fresh user, returning player and two-campaign review                                                              |
| **6 Nov** | Cross-surface accessibility pass: tabs, headings, focus, names/states, contrast, reduced motion and touch                               | Performance and rendering pass so inactive areas and heavy media do not punish the first view                                       | Phone, tablet, desktop, wide screen and 200% zoom evidence                                                            |
| **7 Nov** | Walk the complete player journey in the public demo, Phandelver and Curse of Strahd                                                     | Resolve regressions, reconcile docs/tests and rank only evidence-backed follow-ups                                                  | Weekly review, dependency/runtime health and downstream plan update                                                   |

### Sheet tab review and refactoring — 3 November

The Sheet task is a preservation refactor, not a content reduction. Before its
markup or hierarchy changes, record a before/after matrix for every existing
surface and action:

- unlock and relock state, current level identity and compact combat essentials;
- ability scores, saving throws, skills, languages, features and traits;
- currency, combat resources, structured and legacy inventory, equipment state
  and attunement;
- spellcasting values, slots, known/prepared spells and links to rule or spell
  descriptions;
- searchable rule library, filters, prepared/favourite state, annotations and
  their User Settings ownership;
- level history, two-level comparison and remembered reading position;
- PDF export in every supported language, empty/loading/error states and all
  keyboard or touch actions.

The refactor may introduce a compact summary, internal navigation, sub-tabs,
collapsible groups or progressive disclosure when evidence supports them. It
must not silently remove, merge, truncate or make any current datum or action
harder to find. Repeated facts may gain one canonical presentation only after
every former use and destination has been mapped.

The task closes only when the public demo, completed Phandelver and active Curse
of Strahd prove the same content and functions before and after the change,
including empty, short, spell-heavy, inventory-heavy and multi-level sheets at
phone, tablet, desktop, keyboard-only and 200% zoom sizes.

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

## 3 November Task 1 outcome

The protected Sheet no longer renders as one long mechanics document. Five
stable workspaces now separate **At the table**, **Statistics**, **Equipment**,
**Rules** and **Progression**. At the table remains the immediate default; each
heavier workspace is created on first use and stays mounted while hidden, so
rule filters and level-comparison choices survive navigation without adding to
the visible page length.

The refactor is lossless: PDF export, relock, archived-level selection, combat
resources, every inventory attribute, spell references and progression prose
retain their former source and behavior. Empty Equipment and Rules views are
now explicit instead of disappearing. Legacy reading positions migrate from
`abilities` to Statistics, and direct sheet fragments open both the outer Sheet
area and the correct inner workspace.

The parity matrix and focused guard cover the complete value/action inventory.
Strict TypeScript, lint, Angular builds, character-profile, rule-library,
level-comparison, combat-resource, accessibility and entity-ID checks pass.
Headless Chrome reviewed Shyra at phone, tablet and desktop widths; the desktop
table-ready view fits one reading viewport and phone views expose only the
selected task. Task 2 still owns the Journal hierarchy and the combined media
closeout.

## 3 November Task 2 and closeout

Journal now opens as a compact personal-archive index instead of rendering a
notebook, gallery and full diary in one continuous page. Only collections that
exist are offered. Notebook, Gallery and Sessions are nested accessible
workspaces; each heavy workspace is created on first use and remains mounted so
password state, reading position and lightbox context survive navigation.

Legacy `#notebook`, `#gallery` and `#diary` links still reveal the outer Journal
and now select the correct inner panel. The index identifies a remembered
notebook position as **Continue reading**, previews the newest public diary
entry and gives an explicit empty archive when no memories are published. The
shared [Journal contract](CHARACTER-JOURNAL.md) prevents future media growth
from returning the page to an endless stack.

The combined Sheet-to-Journal preservation matrix is recorded in the
[3 November closeout](reviews/2026-11-03-character-sheet-journal-closeout.md).
Focused journal, notebook, reading-position, profile, mobile and accessibility
checks pass with both builds. Production validates eight characters across
Phandelver and Curse of Strahd, including one notebook, four galleries and
eight diaries; public fixtures cover notebook and diary behavior. Desktop and
390 px visual checks confirm a compact index, two-column mobile navigation,
isolated gallery media and a readable diary without document overflow.

## 1 November closeout

The second task, mobile correction and combined journey review are recorded in
[the character mobile audit](reviews/2026-11-01-character-mobile-audit.md). Its
ownership table is the baseline for the remaining six days: no later density or
settings work may silently move, duplicate or remove one of those surfaces or
actions.

## 2 November Task 1 outcome

Profile now opens with one semantic, always-visible identity surface instead of
an expanded accordion nested inside the page card. Quick facts lead into a
compact facet grid for personality, ideals, authored bonds, vulnerabilities and
pastimes; keepsakes and favourite moments remain the secondary, closable Profile
section established by the ownership audit.

The overview is a dedicated shared component rather than more weight inside the
already dense character-detail component. Short copy stays fully visible. Long
copy remains complete in the document and gains a keyboard-accessible,
state-announcing `Read full text` / `Show less` disclosure after a five-line
visual preview. No campaign data, public/private boundary or profile schema
changed.

The focused overview guard exercises compact and enriched fixtures, checks the
honest empty state and rejects destructive string truncation. Strict TypeScript,
profile, mobile and accessibility checks, both builds, entity-ID checks and
performance budgets pass. Visual review covered Shyra's very long profile and
Sennar's compact legacy profile at 390 x 844, plus Shyra at 1440 x 1000. The
second task and same-day closeout still own Story density and the combined
short, empty and long-profile journey.

-

## 2 November Task 2 and closeout

Story & bonds now opens with one compact narrative map linking to origins, bonds,
quotes and the party-known account. Personal chapters gain a stable, shareable
index. Relationship rails render six cards for the first read, preserve the full
set behind an announced disclosure and move plural feelings into native details;
quote collections follow the same lossless pattern with three initial cards.
Known history remains the concluding public account before the Journal and keeps
its chapter, relationship, notebook, quote, chronicle and latest-memory sources.

Direct fragments now wait for asynchronous character data and can open an
accordion after initial render, fixing a systemic deep-link failure rather than
special-casing this page. The dedicated Story guard covers compact/legacy, dense
and structural empty states while rejecting private-profile access. Shared
TypeScript, lint, story/profile/mobile/accessibility/entity-ID, build and
performance gates pass. Visual review covered Shyra and Vulf at 390 x 844 plus
Shyra at 1440 x 1000, including direct links to bonds and quotes. Extracting the
new components also removed the character-detail style-budget warning and
reduced its production lazy chunk by roughly 6.4 kB.

## Design references

The interaction model adapts established game accessibility patterns rather than
copying a specific visual skin:

- [Cyberpunk 2077 Update 2.1 accessibility features](https://www.cyberpunk.net/en/news/49591/update-2-1-accessibility-features): dedicated categories and reduced HUD noise;
- [Xbox Accessibility Guideline 112](https://learn.microsoft.com/en-my/gaming/accessibility/xbox-accessibility-guidelines/112): consistent menu layout, predictable focus and equivalent digital navigation;
- [Xbox Accessibility Guideline 114](https://learn.microsoft.com/bg-bg/xbox/accessibility/xbox-accessibility-guidelines/114): clear hierarchy and enough context before a player activates a control.

Fantasy atmosphere may decorate the categories, but labels, contrast, focus and
recovery remain more important than ornament.

## 5 November tasks and closeout - one lightweight settings console

User Settings is now a four-category console: **Interface**, **Audio**,
**Campaign** and **Character**. Desktop uses a stable vertical rail; narrow
screens use a two-by-two category grid. Only one panel participates in the
reading flow, while `?section=` makes the current category shareable without
turning navigation into a persisted preference. Arrow keys plus Home/End move
and activate tabs. Legacy fragments still select the correct new category.

Scope is visible before every edit. Interface and audio are global to the
device, authored-content language belongs to the active campaign, and My
Character plus the personal rule library belong to the current character. The
rule library remains complete but is closed by default, preventing private
notes and long rules lists from dominating the settings landing view.

Every change now reports whether it was saved on this device or can survive
only the current visit. Blocked/full browser storage, campaign loading, empty
campaigns, load failures and deleted/renamed remembered characters all have an
honest recovery state. No existing storage key changed. The full User Settings
surface moved from inline English/Italian branches to the data-defined UI text
registry as an atomic slice of #142.

Static and compile-time gates cover the tab contract, URL state, storage probe,
stale-character recovery and zero `isItalian()` branching in this surface.
Headless Chrome reviewed global Settings, Strahd Character and Phandelver
Campaign states at desktop and compact widths. The integrated browser host was
unavailable; the 6 November cross-surface pass still owns its planned native
360 px and 200% zoom matrix rather than borrowing that task today.

## Downstream effect

This week refines, rather than discards, QK-056, QK-057, QK-064 and QK-066.
Character rule content remains derived, personal annotations keep one private
editor, and all new settings must declare scope, persistence, privacy, default
and migration behavior. At the closeout, matching quality-fortnight entries are
marked with the evidence produced here; later tasks inherit this tab and
action-ownership contract.
