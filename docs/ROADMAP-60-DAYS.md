# QuestKeeper — Extended AI-Accelerated Delivery Plan

**Period:** 18 October 2026–4 January 2027

**Target:** QuestKeeper 1.5 · Game Night Edition

**Cadence:** two meaningful, buildable commits per active day; 60 original
delivery days plus a 14-day UI, UX and accessibility quality fortnight.

This plan assumes AI-assisted implementation, testing, writing and asset
preparation. The increased speed is used to ship broader player-facing slices,
not to remove review or quality checks. Every commit must keep the build usable,
include the tests appropriate to its risk and avoid private or copyrighted
campaign content.

Delivery follows the [QuestKeeper working agreement](WORKING-AGREEMENT.md).
Every week begins with one player/GM outcome and closes with the reusable
[weekly review](templates/WEEKLY-REVIEW.md): shipped evidence, product health,
decisions, risks and deliberate re-planning. The two-commit cadence is a target,
never a reason to split broken work or bypass `npm run verify`. This file keeps
its historical path so existing issues, reviews and release notes do not lose
their links.

## Week 1 — A compelling first experience

| Day         | Commit 1                                                                               | Commit 2                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 01 · 18 Oct | [x] [`docs: define the Game Night Edition product goals`](GAME-NIGHT-EDITION-GOALS.md) | [x] [`docs: publish player and GM acceptance journeys`](GAME-NIGHT-ACCEPTANCE-JOURNEYS.md)                 |
| 02 · 19 Oct | [x] [`style: ship unified fantasy design tokens and components`](DESIGN-SYSTEM.md)     | [x] [`style: add heroic gothic and neutral campaign palettes`](DESIGN-SYSTEM.md#curated-campaign-palettes) |
| 03 · 20 Oct | [x] [`feat: add separate first-visit paths for players and GMs`](FIRST-VISIT-PATHS.md) | [x] [`feat: add a guided live-demo tour with remembered progress`](GUIDED-DEMO-TOUR.md)                    |
| 04 · 21 Oct | [x] [`feat: make the Companion installable as a PWA`](PWA-INSTALLATION.md)             | [x] [`feat: cache recent characters and recaps for offline reading`](OFFLINE-GAME-NIGHT.md)                |
| 05 · 22 Oct | [x] [`feat: introduce global command palette navigation`](GLOBAL-COMMAND-PALETTE.md)   | [x] [`feat: add recent pages favourites and continue-reading actions`](GLOBAL-COMMAND-PALETTE.md)          |
| 06 · 23 Oct | [x] [`a11y: complete keyboard focus and landmark overhaul`](ACCESSIBILITY.md)          | [x] [`perf: enforce image font and initial-load budgets`](PERFORMANCE-BUDGETS.md)                          |
| 07 · 24 Oct | [x] [`feat: publish a richer Lantern Road player journey`](LANTERN-ROAD-DEMO.md)       | [x] `release: ship QuestKeeper 1.1 Lanternwake` (moved to 20 Oct by explicit re-plan)                      |

### Field-feedback constraints carried forward · 22 October

The 1.1.2 correction batch did more than close isolated defects. Its findings
now constrain later work without pulling those future tasks into Day 05:

- Day 37's campaign health dashboard must distinguish required default-language
  content from valid partial secondary-language drafts, and link directly to
  the later translation completeness workflow on Day 51.
- Day 41's Theme Studio must show the selected palette on real representative
  surfaces, explain when a published Companion refreshes, and run contrast
  checks before a custom theme can be approved.
- Day 43's diagnostics must reuse one readiness model for Manager, Companion,
  Session Scribe, ports and launchers rather than inferring health from a
  button click or process start.
- Runtime diagnostics must show the exact active Node executable, version,
  architecture and npm state, allow a later safe switch between compatible
  system and private runtimes, and preserve the verified fallback path.
- Ruleset-aware terminology work must carry explicit ruleset provenance and
  review state so a label such as “2024” cannot silently describe legacy or
  unaudited content.

These are acceptance constraints for the listed tasks, not extra calendar
commits. Weekly review may split a constraint into a focused issue when its
parent task reaches Definition of Ready.

## Week 2 — Characters that grow with the story

Day 03 closed with the
[first-visit and guided-tour integration review](reviews/2026-10-20-day-03-closeout.md).
It corrected the combined journey without pulling Day 04 PWA work forward.
An explicit user-requested re-plan first added the Windows bootstrap and then
expanded it into the [cross-platform graphical setup](INSTALLATION-GUIDE.md),
bringing the 1.1 Lanternwake release forward from Day 07. The Day 04 PWA/offline
scope and date remain unchanged; they are not included in the immutable 1.1.0
tag. The focused 1.1.1 Hearthkey patch followed on 20 Oct to make Windows
shortcut creation safe for user names and installation paths containing spaces;
1.1.2 Hearthrest then added explicit clean shutdown of the local setup process.
Both are corrective release work, not borrowed scope from a later roadmap day.

| Day         | Commit 1                                                                                        | Commit 2                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 08 · 25 Oct | [x] [`feat: redesign profiles around identity bonds and memories`](CHARACTER-STORY-PROFILES.md) | [x] [`feat: add quick facts signature items and favourite moments`](CHARACTER-STORY-HIGHLIGHTS.md)   |
| 09 · 26 Oct | [x] [`feat: add instant return-to-my-character flow`](MY-CHARACTER.md)                          | [x] [`feat: remember private-sheet and journal reading position`](CHARACTER-READING-POSITION.md)     |
| 10 · 27 Oct | [x] [`feat: build side-by-side level history comparison`](LEVEL-HISTORY-COMPARISON.md)          | [x] [`feat: highlight gained spells abilities gear and stat changes`](LEVEL-HISTORY-COMPARISON.md)   |
| 11 · 28 Oct | [x] [`feat: add searchable spell and ability library per character`](CHARACTER-RULE-LIBRARY.md) | [x] [`feat: add prepared favourites usage notes and external references`](CHARACTER-RULE-LIBRARY.md) |
| 12 · 29 Oct | [x] `feat: redesign combat resources currency and inventory`                                    | [x] `feat: add signature equipment and attunement storytelling`                                      |
| 13 · 30 Oct | [x] `feat: add optional protected character notebooks`                                          | ↪ `feat: connect journal entries to sessions people and places` — rescheduled to 18 Nov              |
| 14 · 19 Nov | [ ] `feat: generate complete fantasy character dossiers`                                        | [ ] `feat: add print share and compact game-night PDF variants`                                      |

Days 09-12 are also the integrated stabilization window for
[QuestKeeper 1.1.5 Storyforge](releases/v1.1.5-plan.md). The release plan maps
all open 1.1.4 feedback issues onto these existing outcomes, keeps one issue per
PR and adds a hard Thursday verification/freeze gate without borrowing the Day
13 or Day 14 work.

## Planned pause and quality rebaseline

The project has no normal delivery quota from **31 October through 3 November**.
This is an explicit pause, not an ambiguous backlog slip. Emergency fixes may
still be made, but unfinished feature work is not silently counted as complete.

From **4 through 17 November**, feature expansion gives way to the shared
[UI, UX and accessibility quality fortnight](UI-UX-ACCESSIBILITY-FORTNIGHT.md).
Its 14 page-by-page audit days add 28 coherent review/remediation commits to the
plan. Every Companion route and Manager workspace is checked for hierarchy,
density, visual finish, responsive behavior, keyboard access, screen-reader
semantics, contrast, zoom, touch and complete loading/error states against the
public example, Phandelver and Curse of Strahd.

On **18 November**, delivery resumes with the deferred Day 13 journal-linking
outcome plus a combined character-story integration review. Day 14 then resumes
on 19 November. All later original delivery days move by 19 calendar days; no
planned feature is deleted to create the quality window.

| Recovery day | Commit 1                                                          | Commit 2                                                                             |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **18 Nov**   | [ ] `feat: connect journal entries to sessions people and places` | [ ] `review: close the complete character-story journey and re-plan downstream work` |

## Week 3 — The party remembers together

| Day         | Commit 1                                                      | Commit 2                                                               |
| ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 15 · 20 Nov | [ ] `feat: redesign party bonds as a living relationship map` | [ ] `feat: add trust tension affection and promise histories`          |
| 16 · 21 Nov | [ ] `feat: add character-to-character shared memory pages`    | [ ] `feat: surface conflicting versions of the same event`             |
| 17 · 22 Nov | [ ] `feat: introduce favourite campaign memories`             | [ ] `feat: build a party-wide memory gallery and filters`              |
| 18 · 23 Nov | [ ] `feat: create notebook table of contents and chronology`  | [ ] `feat: add mood session character and secrecy filters`             |
| 19 · 24 Nov | [ ] `feat: add letters sketches handouts and keepsakes`       | [ ] `feat: create accessible lightbox and print layouts for keepsakes` |
| 20 · 25 Nov | [ ] `style: ship multiple parchment and handwriting moods`    | [ ] `feat: adapt journal styling to narrator and emotional state`      |
| 21 · 26 Nov | [ ] `feat: add character epilogues and legacy pages`          | [ ] `release: ship QuestKeeper 1.2 character stories`                  |

## Week 4 — Game Night command centre

| Day         | Commit 1                                                             | Commit 2                                                                   |
| ----------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 22 · 27 Nov | [ ] `feat: build game-night dashboard with party and location state` | [ ] `feat: add open threads pinned clues promises and quests`              |
| 23 · 28 Nov | [ ] `feat: add five-minute campaign catch-up mode`                   | [ ] `feat: add previously-on presentation view for the table`              |
| 24 · 29 Nov | [ ] `feat: deliver campaign-wide full-text search`                   | [ ] `feat: group results across sessions characters NPCs places and clues` |
| 25 · 30 Nov | [ ] `feat: add campaign timeline with arcs and turning points`       | [ ] `feat: connect timeline events to every related page`                  |
| 26 · 01 Dec | [ ] `feat: introduce bookmarks and personal reading lists`           | [ ] `feat: add history-aware continue-reading recommendations`             |
| 27 · 02 Dec | [ ] `feat: create printable game-night packet`                       | [ ] `feat: add compact mobile table mode with wake-lock guidance`          |
| 28 · 03 Dec | [ ] `feat: add campaign ending and epilogue experience`              | [ ] `release: ship QuestKeeper 1.3 game-night preview`                     |

## Week 5 — A connected living world

| Day         | Commit 1                                                            | Commit 2                                                             |
| ----------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 29 · 04 Dec | [ ] `feat: expand NPC dossiers with encounters motives and changes` | [ ] `feat: add public knowledge versus GM truth presentation`        |
| 30 · 05 Dec | [ ] `feat: create interactive NPC relationship histories`           | [ ] `feat: connect NPC opinions to sessions and player choices`      |
| 31 · 06 Dec | [ ] `feat: add annotated maps with discovered markers`              | [ ] `feat: connect map markers to sessions NPCs clues and galleries` |
| 32 · 07 Dec | [ ] `feat: build clue board for evidence suspects and questions`    | [ ] `feat: add spoiler-aware connections and theory tracking`        |
| 33 · 08 Dec | [ ] `feat: add quest promise and obligation tracker`                | [ ] `feat: show consequences and ownership without task-app clutter` |
| 34 · 09 Dec | [ ] `feat: add story arcs chapter collections and completion state` | [ ] `feat: generate arc-level recaps and cast lists`                 |
| 35 · 10 Dec | [ ] `feat: create world explorer linking every content type`        | [ ] `release: ship QuestKeeper 1.4 living-world preview`             |

## Week 6 — The Game Master's creative studio

| Day         | Commit 1                                                        | Commit 2                                                                |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 36 · 11 Dec | [ ] `feat: rebuild onboarding as campaign creation journey`     | [ ] `feat: provide original campaign starters and guided examples`      |
| 37 · 12 Dec | [ ] `feat: add campaign health dashboard and repair actions`    | [ ] `feat: explain missing translations images links and required data` |
| 38 · 13 Dec | [ ] `feat: add live preview to character and NPC editors`       | [ ] `feat: add duplicate rename archive and bulk-update workflows`      |
| 39 · 14 Dec | [ ] `feat: create visual session and story-arc editor`          | [ ] `feat: add reusable mystery journey social and battle structures`   |
| 40 · 15 Dec | [ ] `feat: build media library for portraits maps and handouts` | [ ] `feat: add crop focal-point replacement and usage tracking`         |
| 41 · 16 Dec | [ ] `feat: add visual theme studio with instant preview`        | [ ] `feat: guard readability with automatic contrast suggestions`       |
| 42 · 17 Dec | [ ] `feat: add complete campaign import export and cloning`     | [ ] `feat: add preview-before-import and conflict resolution`           |

## Week 7 — Session Scribe and local creative AI

The October foundation already supplies a permanent provider/model catalog,
local-model discovery, independent prose/prompt/image engine selection,
scene-aware typed-notes-to-session drafts and reviewable character/NPC imports
from sheet images or public/shared Roll20 print views. It also provides direct
FTPS publishing after a clean production build. Week 7 therefore builds on
that shipped path: it improves evidence, correction and multi-source review
rather than introducing a second AI workflow.

| Day         | Commit 1                                                          | Commit 2                                                                     |
| ----------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 43 · 18 Dec | [ ] `feat: ship guided Discord Scribe setup and consent flow`     | [ ] `feat: add reliable launch status diagnostics and recovery`              |
| 44 · 19 Dec | [ ] `feat: improve speaker identity and party-name mapping`       | [ ] `fix: filter silence repetition and common transcription hallucinations` |
| 45 · 20 Dec | [ ] `feat: build transcript review desk with fast corrections`    | [ ] `feat: add speaker merge search highlights and chapter markers`          |
| 46 · 21 Dec | [ ] `feat: suggest key moments quotes NPCs places and clues`      | [ ] `feat: show transcript evidence behind every suggestion`                 |
| 47 · 22 Dec | [ ] `feat: draft quick full and GM-only recap variants`           | [ ] `feat: preserve narrator voice with reviewable tone profiles`            |
| 48 · 23 Dec | [ ] `feat: import typed notes and photos of handwritten pages`    | [ ] `feat: merge multiple note sources into one review queue`                |
| 49 · 24 Dec | [ ] `feat: apply approved archive suggestions as an atomic batch` | [ ] `feat: add draft discard cleanup and complete provenance history`        |

## Week 8 — Collaboration, languages and longevity

| Day         | Commit 1                                                          | Commit 2                                                             |
| ----------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| 50 · 25 Dec | [ ] `feat: add portable player contribution packages`             | [ ] `feat: build GM review inbox for journals memories and updates`  |
| 51 · 26 Dec | [ ] `feat: separate interface and campaign translation workflows` | [ ] `feat: add completeness reports and translation review packages` |
| 52 · 27 Dec | [ ] `feat: support custom system terminology and character facts` | [ ] `feat: add right-to-left foundations and broader script testing` |
| 53 · 28 Dec | [ ] `feat: add automatic versioned campaign backups`              | [ ] `feat: create visual preview-before-restore workflow`            |
| 54 · 29 Dec | [ ] `feat: add guided migrations for older campaign formats`      | [ ] `feat: validate complete transfer between machines and hosts`    |
| 55 · 30 Dec | [ ] `feat: add local campaign consistency assistant`              | [ ] `feat: flag conflicting names dates heights and known facts`     |
| 56 · 31 Dec | [ ] `feat: add original template and theme sharing format`        | [ ] `docs: publish creator legal accessibility and privacy guides`   |

## Final four days — QuestKeeper 1.5 launch

| Day         | Commit 1                                                           | Commit 2                                                             |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 57 · 01 Jan | [ ] `feat: rebuild Lantern Road as complete 1.5 showcase`          | [ ] `docs: capture new player GM Scribe and mobile demo journeys`    |
| 58 · 02 Jan | [ ] `test: run full player GM recovery and accessibility journeys` | [ ] `perf: complete mobile offline gallery and large-campaign audit` |
| 59 · 03 Jan | [ ] `fix: resolve release-candidate feedback and regressions`      | [ ] `docs: publish migration guide changelog and launch story`       |
| 60 · 04 Jan | [ ] `release: publish QuestKeeper 1.5 Game Night Edition`          | [ ] `docs: open the 2027 public feedback and roadmap cycle`          |

## Parallel AI-accelerated tracks

These run throughout the sixty days and do not replace the two daily commits:

- generate test fixtures and edge cases for every new content flow;
- maintain English and Italian interface copy together;
- audit visual consistency and accessibility after each design change;
- prepare original demo content, image briefs and alt text;
- keep schemas, examples and documentation synchronized;
- summarize feedback into reviewable proposals rather than automatic changes.

## Daily working agreement

- Each commit must deliver a coherent capability, not a partial broken layer.
- Tests and documentation travel with the feature whenever practical.
- The second daily commit should usually deepen the first, not merely rename it.
- The two dated commits are the day's scheduled scope. Do not borrow tomorrow's
  work simply because today's work finished early.
- A third task is normally a review/refinement pass across the day's combined
  experience: find mistakes, close gaps, connect prior decisions and update
  downstream tasks using the [daily closeout](templates/DAILY-CLOSEOUT.md).
- Moving a future-dated task earlier requires an explicit re-plan and a visible
  roadmap update; it is never an implicit use of spare capacity.
- Build and focused tests run before every push.
- The second push of the day is verified on GitHub Pages in Chrome and mobile view.
- A working release candidate is tagged at the end of every week.
- Public examples use only original or legally redistributable material.
- Private campaign data, tokens, transcripts and passwords never enter this repository.

## Definition of done for QuestKeeper 1.5

- Players can resume a campaign, find their character and understand active
  threads in under five minutes.
- Character profiles preserve progression, relationships, journals, memories
  and printable sheets.
- Sessions connect naturally to people, places, clues, quests and story arcs.
- The Campaign Manager supports creation, previews, media and recovery without
  manual data-file editing.
- Discord, typed and handwritten notes can become reviewable session drafts.
- Local AI suggestions show their sources and never publish automatically.
- Campaigns remain portable, backed up, multilingual and usable on mobile.
- The public demo shows the complete experience before installation.
