# QuestKeeper 1.5 — Game Night Edition Product Goals

**Status:** Product baseline

**Target release:** 4 January 2027

**Planning window:** 18 October 2026–4 January 2027

**Primary audiences:** tabletop RPG players and Game Masters

**Related plan:** [extended delivery plan](ROADMAP-60-DAYS.md)

**Acceptance contract:**
[Player and GM acceptance journeys](GAME-NIGHT-ACCEPTANCE-JOURNEYS.md)

## Product promise

> When game night begins, any returning player or Game Master can open
> QuestKeeper on a phone or computer and recover who they are, where the party
> is, what matters now and what happened last — in five minutes or less.

QuestKeeper 1.5 turns a beautiful campaign archive into the party's shared
starting point before and during play. It does not replace the table, the Game
Master or the virtual tabletop. It removes the avoidable work between “we are
all here” and “we know what to do next.”

## The problem

Campaign knowledge is usually scattered across character sheets, chat threads,
voice transcripts, handwritten notes, maps and one person's memory. After even
a short break, players need the Game Master to reconstruct the current state.
During play, useful information exists but is too slow to find. After play,
capturing the session often feels like clerical work.

The result is lost time, repeated explanations and a campaign history that is
rich in theory but difficult to use at the table.

## Who we are designing for

### Primary: the returning player

They need to remember their character, the latest events, current relationships
and unresolved threads without reading the complete archive.

### Primary: the Game Master

They need to prepare a concise shared starting point, find campaign facts
quickly and publish updates without maintaining JSON by hand.

### Secondary: the campaign keeper

This may be the Game Master or a player. They preserve recaps, images, notes and
character changes while keeping the campaign portable and under the group's
control.

New visitors and self-hosting administrators matter, but 1.5 prioritizes the
people who are about to resume an existing game.

## Goals and measurable outcomes

Goal IDs remain stable throughout the release and will be referenced by issues,
pull requests and the acceptance journeys.

| ID                         | Product outcome                                                                                                     | Release measure                                                                                                        | 1.5 threshold                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **GN-01 — Understand**     | A first-time visitor understands what QuestKeeper offers and whether to enter as a player or GM.                    | Moderated first-visit test: time to explain the product and open one relevant demo page without assistance.            | At least 4 of 5 participants succeed in under 2 minutes.                                                      |
| **GN-02 — Resume**         | A returning group reconstructs the current campaign state without searching chat or asking for a verbal recap.      | Participants identify the last major event, current location, one open thread and their character's immediate concern. | At least 4 of 5 participants answer all four in under 5 minutes.                                              |
| **GN-03 — Retrieve**       | Information needed during play is quick to reach on desktop, mobile and keyboard.                                   | Task test covering a character ability, known NPC, discovered place and earlier session event.                         | Each item is found in at most 3 deliberate actions after opening the campaign; 90% task success.              |
| **GN-04 — Continue**       | Returning users resume from their own useful context instead of navigating from the beginning every time.           | Test remembered character, recent pages, bookmarks and continue-reading behavior after closing and reopening the site. | Context survives restart for all supported local preferences; every memory has a visible reset.               |
| **GN-05 — Read anywhere**  | Essential game-night material remains comfortable on a phone and available through an installed offline experience. | Review at 360 px, desktop, keyboard-only and simulated offline mode.                                                   | No blocked primary journey, horizontal page scroll or keyboard trap; saved essentials reopen offline.         |
| **GN-06 — Publish safely** | A non-technical campaign keeper updates game-night information without editing manifests or risking the only copy.  | Campaign Manager test: edit current state, preview, publish, then recover a removed item.                              | At least 4 of 5 participants complete the flow without repository knowledge; recovery succeeds every time.    |
| **GN-07 — Preserve trust** | The group understands where data lives, what is private and what a spoiler password can and cannot protect.         | Content and privacy review of onboarding, protected sections, Scribe controls and exported material.                   | No undisclosed network transfer, no secret presented as encrypted, and explicit consent before transcription. |

## North-star outcome

The release succeeds when a group returning after a four-week break can begin
meaningful play within five minutes using QuestKeeper as its only campaign
reference.

“Begin meaningful play” means the group can state:

- where the party is;
- what changed in the latest session;
- which people, promises or dangers are currently relevant;
- what at least one character wants to do next.

The measure is intentionally about readiness, not page views or time spent in
the product. QuestKeeper should give attention back to the table.

## Product principles for 1.5

### Player context before archive structure

Navigation begins with recognizable questions — my character, the latest
chapter, current place and open threads — rather than the repository's content
types.

### Summary first, evidence one step away

A concise catch-up links to the full session, character, NPC and location pages
that support it. Summary never replaces the campaign record.

### Shared facts, clearly personal perspectives

Campaign state and session history present agreed table facts. Character
journals may be subjective, incomplete or secret and must look distinct from an
objective recap.

### Local-first and reversible

No account, subscription or cloud service is required. Preferences explain
their storage and offer a reset. Content edits preserve backups or a recovery
path.

### Fantasy atmosphere without usability tax

Art, typography and motion create identity while preserving contrast, focus,
responsive reading and fast access. The
[design and art guide](DESIGN-AND-ART-GUIDE.md) is part of the release bar.

### Useful without automation

Handwritten notes and manually authored recaps remain first-class. The Session
Scribe and local AI helpers may accelerate work, but the campaign keeper reviews
everything before publication.

## Included in the 1.5 outcome

- distinct first-visit guidance for players and Game Masters;
- a polished public demo that proves the complete player value quickly;
- installable and intentionally cached game-night essentials;
- fast return to a character, recent page or unfinished chapter;
- a game-night overview of party state, current location and open threads;
- concise catch-up, search, bookmarks and connected campaign references;
- character growth, relationships, journals and campaign memory;
- mobile, keyboard, print and offline presentation of essential material;
- safe Campaign Manager workflows for maintaining the shared context;
- consent-based transcription and reviewed notes as optional inputs.

## Explicit non-goals for 1.5

QuestKeeper 1.5 will not become:

- a virtual tabletop, battle map or initiative tracker;
- a complete rules engine or licensed game compendium;
- a real-time multi-user editor or cloud account platform;
- encrypted secret storage or a replacement for access-controlled hosting;
- an autonomous Game Master or an automatic publisher of raw AI output;
- a scheduling, video-call or Discord replacement;
- a universal campaign importer for every third-party tool.

These boundaries protect the release from becoming broad while its central
game-night journey remains incomplete.

## Measurement without surveillance

QuestKeeper does not add analytics by default. Product evidence will come from:

1. repeatable, consented usability sessions using the public demo;
2. a versioned [validation scorecard](templates/GAME-NIGHT-SCORECARD.md)
   recording completion, time, assistance and confusion;
3. accessibility and responsive review at each weekly checkpoint;
4. opt-in feedback from real campaigns after a game night;
5. CI evidence for build, validation, tests and offline assets.

Test records use participant labels rather than names and contain no private
campaign material. The first benchmark uses at least five participants across
both player and GM perspectives; the release benchmark uses at least ten people
from three different groups.

## Release guardrails

The 1.5 label may be published only when:

- GN-01 through GN-07 meet their thresholds or have a documented release
  decision with an owner and follow-up date;
- the [player and GM acceptance journeys](GAME-NIGHT-ACCEPTANCE-JOURNEYS.md)
  pass on desktop and a 360 px viewport;
- the production build, lint, formatting, type checks and automated tests pass;
- the public demo contains no credential, personal transcript or unlicensed
  campaign material;
- essential game-night pages work with keyboard navigation and saved offline
  content behaves honestly;
- release notes explain new behavior, limitations, data changes and recovery.

## Risks to review weekly

| Risk                                           | Early warning                                                               | Default response                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| The product becomes a dense encyclopedia.      | Important context needs several unrelated pages or long reading.            | Strengthen the game-night summary and connect evidence directly.       |
| Features serve the keeper but not the players. | Manager work grows while player task times do not improve.                  | Prioritize the next failed player journey before more authoring depth. |
| Visual ambition harms speed or clarity.        | Cropped focal points, poor contrast, slow images or mobile overflow appear. | Reduce decoration, create purpose-built crops and enforce budgets.     |
| Offline behavior creates false confidence.     | A page appears saved but a linked essential asset is missing.               | Show cache state explicitly and test the complete saved journey.       |
| AI output is mistaken for table truth.         | Generated summaries invent motives, choices or chronology.                  | Require review and separate sourced facts from interpretation.         |
| Fast delivery produces disconnected systems.   | Similar controls, schemas or layouts diverge.                               | Stop feature work long enough to consolidate the shared pattern.       |

## Decision rule

When scope competes, choose the work that most reduces the time between opening
QuestKeeper and making the next informed decision at the table. If it does not
improve a goal above, protect a release guardrail or unlock a scheduled goal, it
does not belong in Game Night Edition.
