# UI, UX and Accessibility Quality Fortnight

**Audit window:** 4–17 November 2026  
**Delivery targets:** public template and production Companion  
**Classification:** shared  
**Cadence:** two coherent review-and-remediation commits per active day

QuestKeeper pauses feature expansion for two weeks to review the complete
experience page by page. The goal is not a cosmetic reskin. Every screen must
make its purpose, primary action and reading order obvious while remaining
comfortable on a phone, a large monitor, a keyboard and assistive technology.

The production Companion is the compatibility proof: completed Phandelver
exercises dense legacy content, while active Curse of Strahd exercises current
profiles, notebooks, relationships, sessions, secrets and campaign moods. No
private campaign content is copied into the public template.

## What “finished” means for one page

A page leaves the audit only when all relevant statements are true:

- its purpose and primary action are understandable at first glance;
- headings, landmarks and visual hierarchy produce one clear reading order;
- frequently used information is visible, while secondary detail uses useful
  grouping or progressive disclosure instead of an endless wall of content;
- duplicate controls, raw technical labels, placeholder copy and decorative
  noise are removed;
- typography, spacing, cards, controls, imagery and empty space feel deliberate
  and use the shared design system rather than page-local approximations;
- no section becomes hard to find, unnecessarily tall or crowded with several
  competing actions;
- loading, empty, partial, error, success, locked and long-content states remain
  legible and recoverable;
- keyboard order, visible focus, landmarks, headings, labels, descriptions,
  status announcements and modal focus are correct;
- text and controls meet semantic contrast expectations and never rely on colour
  alone;
- touch targets, scrolling and sticky controls remain usable at 360 px, 768 px,
  desktop and wide-screen widths, at 200% zoom and with text enlargement;
- reduced motion, muted audio and content-protection boundaries continue to
  work without hiding information;
- the public example, Phandelver and Curse of Strahd all pass the affected
  automated and visual checks.

The audit does not impose a universal card count or page height. Density is
judged by the task: comparison views may be information-rich, while landing
pages should stay quiet. Carousels, tabs and collapsed sections are used only
when they improve discovery and preserve equivalent keyboard and screen-reader
access.

## Evidence recorded for every surface

Each audit entry records:

1. route or Manager workspace and the user trying to complete a task;
2. public-template and production examples used;
3. desktop, mobile, wide-screen and 200% zoom screenshots;
4. keyboard-only and screen-reader reading-order notes;
5. contrast, touch-target, loading and error-state findings;
6. changes made, deferred findings and the issue that owns any follow-up;
7. focused tests plus the final cross-repository verification result.

A page with an unresolved blocker remains explicitly open. “Looks better” is
not acceptance evidence.

## Fourteen-day route and workspace review

| Date       | Review and remediation 1                                                                        | Review and remediation 2                                                                                              | Production proof                                                |
| ---------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **4 Nov**  | Establish the route inventory, screenshot matrix and severity rubric                            | Audit global shell: sidebar, command bar, breadcrumbs, focus restoration, campaign switcher and responsive navigation | Both campaigns; long labels and deep routes                     |
| **5 Nov**  | Campaign selector, first-visit path and spoiler-consent journey                                 | Global and campaign User Settings, including audio, My Character and preference ownership                             | Fresh visitor, returning player and two campaign palettes       |
| **6 Nov**  | Campaign homepage hierarchy, cover, summary and linked metrics                                  | Campaign overview, story entry points and “latest / so far / archive” information architecture                        | Quiet Strahd home and completed Phandelver home                 |
| **7 Nov**  | Party list and relationship overview density                                                    | Relationship detail, one-type/many-feelings cards and perceived-evidence presentation                                 | Four-character parties and long relationship histories          |
| **8 Nov**  | Character identity header, quick facts, chapters, quotes and signature items                    | Protected profile, level history, current sheet, rules, inventory, resources, notebook and PDF actions                | Densest Phandelver profile and Shyra/Abrams level history       |
| **9 Nov**  | NPC list discovery, grouping, search and empty states                                           | NPC detail plus party-to-NPC and NPC-to-NPC perceived relationships                                                   | Legacy NPC volume and current Strahd uncertainty states         |
| **10 Nov** | Story-so-far, chapter and session-summary hierarchy                                             | Around-the-table moments, quote carousels, long-session chronology and source links                                   | Completed and active campaign timelines                         |
| **11 Nov** | Maps overview/detail, markers and long descriptions                                             | Gallery, image loading, lightbox, offline pack and media error states                                                 | Large Phandelver gallery and current Strahd art                 |
| **12 Nov** | Public baseline compendium and reference navigation                                             | Production spellbook, armory, City & Wild hubs, indexes, calculator, category and entry detail                        | Rules-heavy pages without copying licensed content upstream     |
| **13 Nov** | Production table rules, character generator and campaign-only utilities                         | Gazette list/detail plus DM tools, forge, manage and editor journeys                                                  | Public/private and player/GM boundaries                         |
| **14 Nov** | Guided setup and first launch, including runtime choices and shortcut outcomes                  | Manager Campaign Library, campaign creation/editing, modal errors and wide layouts                                    | Clean install and migrated 1.1.4 data                           |
| **15 Nov** | Manager character, NPC, session, map, notebook and relationship editors                         | Notes-to-session, character import, AI draft review, translation and local compendium workspaces                      | Manual path first; AI remains optional and reviewable           |
| **16 Nov** | Manager storage, backup, migration, preview, diagnostics and shutdown                           | Publishing, appearance, campaign palette, service controls and recoverable failures                                   | Local preview plus safe production publication boundaries       |
| **17 Nov** | Cross-surface keyboard, screen-reader, contrast, zoom, touch and reduced-motion regression pass | Resolve audit blockers, reconcile documentation/tests and publish the ranked follow-up register                       | Public demo, Phandelver and Curse of Strahd end-to-end journeys |

## Severity and scheduling

| Severity    | Meaning                                                                                                                       | Action                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Blocker** | A primary journey cannot be completed, protected content leaks, data is at risk or assistive technology cannot reach the task | Stop the current audit stream, fix and verify before continuing  |
| **High**    | Content is unreadable, hidden, misleading, keyboard-inaccessible or unusable at a required viewport/zoom                      | Fix within the fortnight before the surface is accepted          |
| **Medium**  | The task works but hierarchy, density, copy or visual consistency causes avoidable confusion                                  | Fix in the page pass when coherent; otherwise open a dated issue |
| **Low**     | Minor polish with no meaningful comprehension or access cost                                                                  | Record and batch only when it will not destabilise the page      |

The fortnight is a quality gate, not a promise to redesign every screen for its
own sake. Existing patterns are retained when they already satisfy the rubric.
Shared fixes ship in both repositories in the same delivery cycle; campaign-only
surfaces receive local adaptations and feed reusable discoveries upstream.

## Exit gate on 17 November

- Every listed route and workspace has an owner, result and evidence entry.
- No blocker or high-severity accessibility defect remains unowned.
- Shared fixes are paired in the public and production repositories.
- Public `npm run verify` passes.
- Production builds and validates Phandelver and Curse of Strahd.
- The live public demo and production deployment complete their core player and
  GM journeys after release.
- Deferred findings are ranked against the resumed roadmap rather than hidden
  in an unstructured polish backlog.

Feature delivery resumes on 18 November only after this exit review. The audit
may remove, merge or re-scope later UI work when evidence shows that an existing
pattern already solves it or that a deeper correction is required.
