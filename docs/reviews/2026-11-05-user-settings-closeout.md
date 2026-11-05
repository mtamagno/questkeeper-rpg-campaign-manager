# User Settings closeout - 5 November 2026

**Classification:** shared  
**Plan:** Character and Settings UX Focus Week, 5 November  
**Issue slice:** #142, User Settings inline-copy migration and guard

## Outcome

The previous page mixed language, audio, character identity and a potentially
long personal rules library in one continuous document. The replacement keeps
every control and storage key while presenting one category at a time:

1. Interface - global language behavior;
2. Audio - global sound behavior;
3. Campaign - active chronicle and content locale;
4. Character - My Character and private rule preferences.

The categories are URL-addressable, keyboard operable and visibly labelled by
scope. Character rules are a nested disclosure rather than a second settings
page or an always-expanded list.

## Acceptance journeys

| Journey                   | Evidence                                                                                                                        | Result |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Fresh user                | Global `/settings` opens Interface; Campaign explains that a campaign must be chosen and lists available chronicles             | Pass   |
| Returning player          | Existing language, audio, campaign locale, My Character and rule keys are unchanged; selections resolve at read time            | Pass   |
| Changed/deleted character | The stored ID remains inspectable, produces a visible warning after campaign data loads and can be cleared safely               | Pass   |
| Two campaigns             | Campaign locale and My Character remain keyed by campaign; Strahd and Phandelver were built and visually reviewed independently | Pass   |
| Storage unavailable       | A live storage probe changes the visible result from persisted to current-visit-only with recovery guidance                     | Pass   |
| Keyboard/touch            | Native buttons, tab semantics, roving focus, arrow/Home/End behavior, 44 px controls and compact two-column navigation          | Pass   |

## Validation

- unified UI registry parity: 161 keys across two interface locales;
- focused User Settings and My Character guards;
- strict TypeScript, ESLint, accessibility and mobile-layout guards;
- public demo build;
- production build with 361 source images and entity IDs across Phandelver and
  Curse of Strahd;
- headless Chrome: global desktop/compact Settings, Strahd Character desktop
  and Phandelver Campaign compact states.

The integrated browser host was unavailable. Chrome's Windows headless minimum
layout width was used for compact visual evidence; the already scheduled 6
November pass retains the native 360 px, tablet, 200% zoom and long-label matrix.

## Cross-cutting analysis

- Product copy for this entire surface now lives in `ui.json`; #142 remains open
  for other surfaces and the repository-wide exception audit.
- Persistence failure is a product state, not a swallowed implementation detail.
  Future device-local settings must use the same honest outcome language.
- Settings category is navigation state, while the values edited inside it are
  durable preferences. Future tabs must not persist merely because their fields do.
- A stale entity ID is recoverable data, not the same as an unset choice. Future
  campaign-scoped selectors should preserve this distinction.
- The 6 November accessibility/performance work must test this console alongside
  the character workspaces; it must not reopen today's information architecture.
