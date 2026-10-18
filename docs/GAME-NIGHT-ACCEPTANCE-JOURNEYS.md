# QuestKeeper 1.5 — Player and GM Acceptance Journeys

**Status:** Release acceptance contract

**Target release:** 16 December 2026

**Product goals:** [Game Night Edition goals](GAME-NIGHT-EDITION-GOALS.md)

**Evidence template:** [Game Night validation scorecard](templates/GAME-NIGHT-SCORECARD.md)

## Purpose

These journeys turn goals GN-01 through GN-07 into observable release tests.
They define the experience QuestKeeper 1.5 must deliver; they do **not** imply
that every step is available in the current build.

Implementation details may change. The starting state, user intent and expected
outcome may not be weakened without updating the product goals and recording
the decision in a weekly review.

## Test vocabulary

| Term                  | Meaning                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Participant**       | A player or GM who did not implement the tested feature.                                                                                       |
| **Unaided**           | The facilitator reads the task once, then gives no navigation hint or explanation.                                                             |
| **Prompted**          | The facilitator repeats or clarifies the task without naming a control or destination.                                                         |
| **Intervention**      | The facilitator identifies a control, route or corrective action. The task does not pass unaided.                                              |
| **Deliberate action** | A click, tap, keyboard activation, search submission or browser-level install/save action. Scrolling and typing characters do not add actions. |
| **Task time**         | Time from the end of the facilitator's task statement until the participant states the answer or reaches the expected state.                   |
| **Critical journey**  | A release-blocking journey. `AT RISK`, `FAIL` and `NOT TESTED` do not count as passing.                                                        |

Misclicks count as deliberate actions. Backtracking does not reset the count.
Loading time is included because it is part of the table experience. A crash,
dead end, inaccessible control, incorrect answer or intervention is a failure.

## Controlled test fixture

Release validation uses **The Lantern Road**, never a participant's private
campaign. Before the release round, the fixture must contain:

- at least two player characters with distinct public profiles;
- one protected sheet with level history, abilities, equipment and spells;
- at least two completed session chapters with a clear latest event;
- at least two discovered places and one explicit current location;
- at least two known NPCs connected to sessions or places;
- at least two open threads, including one tied to a character concern;
- one bookmarkable page and enough text to demonstrate continue-reading;
- only original or redistributable text and media.

The fixture's expected answers are recorded privately in the validation round,
not revealed in the task wording.

## Reference environments

Run each critical journey in its specified environment. Across a complete
release round, cover all of these:

| Environment      | Required state                                                                  |
| ---------------- | ------------------------------------------------------------------------------- |
| Desktop pointer  | Latest stable Chromium, at least 1366 × 768                                     |
| Desktop keyboard | Same viewport; unplug or do not use the pointer                                 |
| Narrow touch     | 360 × 800 CSS pixels or a physical device of comparable width                   |
| Offline          | Installed Companion, prepared online first, then verified with network disabled |
| First visit      | Clean browser profile with no QuestKeeper storage or consent                    |
| Returning visit  | Saved character, recent page, bookmark and campaign consent already present     |

At least one full player round uses English UI and one uses Italian UI. Campaign
content in another configured language is checked once before release to ensure
the interface fallback does not block a journey.

## Player journeys

### P-01 — Find my way on the first visit

**Priority:** Critical

**Goals:** GN-01, GN-07

**Start:** First-visit environment on the public project page

**Timebox:** 2 minutes

**Task given to the participant:**

> You are joining a group that uses QuestKeeper. Find out what it gives you as
> a player and open a real example of a character you could return to before a
> session.

**Expected path and evidence:**

1. The participant understands that QuestKeeper is a campaign companion, not a
   virtual tabletop or commercial rules source.
2. They identify the player path without installation or repository knowledge.
3. They enter The Lantern Road with the spoiler warning understood.
4. They open one sample character and describe two useful things available
   there.

**Pass:** at least 4 of 5 participants complete the journey unaided in under two
minutes and describe the product accurately.

**Fail examples:** the primary player path is missed, the participant expects a
character builder or VTT, a warning has no clear consequence, or the demo
requires setup.

### P-02 — Resume after four weeks away

**Priority:** Critical

**Goals:** GN-02

**Start:** Campaign selected; no other campaign source available

**Timebox:** 5 minutes

**Task given to the participant:**

> Your group has not played for four weeks. Using only QuestKeeper, tell us
> where the party is, what changed last time, one unresolved thread and what
> your character currently cares about.

**Expected outcome:** all four answers are correct and each answer links to the
session, place, relationship or character context that supports it. The player
does not need to read the complete chronicle.

**Pass:** at least 4 of 5 participants answer all four questions unaided within
five minutes.

**Fail examples:** the summary contradicts its source pages, an answer exists
only in a private section the player was not told to unlock, or the participant
must search chat or ask the GM.

### P-03 — Be ready as my character

**Priority:** Critical

**Goals:** GN-02, GN-03

**Start:** The campaign home on a returning visit

**Timebox:** 3 minutes

**Task given to the participant:**

> Return to your character. Find the current level, one prepared or known
> ability, one important relationship and the most recent character change.

**Expected outcome:** the participant reaches their remembered character,
distinguishes current sheet data from an earlier level and can open supporting
details without losing their place.

**Pass:** all four facts are correct; the character is reached in one deliberate
action from the returning entry point and no individual fact requires more than
three further actions.

**Fail examples:** an archived level looks current, protected data appears
public, the remembered character has no visible reset, or mobile layout hides a
required control.

### P-04 — Retrieve a fact during play

**Priority:** Critical

**Goals:** GN-03

**Start:** Campaign open; participant may use navigation or search

**Timebox:** 90 seconds per item

Ask for these items in a randomized order:

1. one named character ability or spell;
2. one fact about a known NPC;
3. one discovery at a named place;
4. one event from an earlier session.

**Pass:** each correct item is found in no more than three deliberate actions
after the campaign is open, with at least 90% success across all item attempts.
Search results must identify content type and context well enough to avoid a
guess.

**Fail examples:** similarly named results are indistinguishable, keyboard users
cannot reach or leave search, or a result opens the wrong campaign.

### P-05 — Continue where I left off

**Priority:** Critical

**Goals:** GN-04

**Start:** Returning-visit environment

**Task given to the participant:**

> Save your character, bookmark a session and stop partway through reading it.
> Close QuestKeeper, reopen it and continue. Then remove everything it
> remembered about this journey.

**Expected outcome:** the saved character, bookmark, recent page and reading
position survive restart. Each remembered value has a discoverable reset, and
resetting it does not delete campaign content.

**Pass:** every supported preference restores the correct context, then clears
successfully. Storage behavior is explained in plain language.

**Fail examples:** one campaign's preferences leak into another, reset is
destructive, or the interface claims data is synced to an account.

### P-06 — Use essentials on a phone without a connection

**Priority:** Critical

**Goals:** GN-05

**Start:** Narrow-touch environment online, then offline

**Task given to the participant:**

> Prepare this campaign for a venue with unreliable internet. Go offline and
> reopen the game-night overview, your character and the latest recap.

**Expected outcome:** the participant can tell what will be available offline,
confirm when preparation is complete and reopen all three essentials with the
network disabled.

**Pass:** the three destinations work offline without horizontal page scroll,
cropped essential content or a touch-only dead end. Missing unsaved material is
identified honestly rather than failing as if cached.

**Fail examples:** the app reports success before assets are ready, navigation
silently leaves the offline scope, or the saved state exposes protected content
that was never unlocked.

### P-07 — Understand spoilers and private sections

**Priority:** Critical

**Goals:** GN-07

**Start:** First-visit environment

**Task given to the participant:**

> Enter a campaign, inspect one protected character section and explain what
> QuestKeeper is protecting from — and what it is not protecting from.

**Expected outcome:** the campaign spoiler decision is remembered only after
explicit entry; protected content is described as a client-side spoiler
curtain, not encryption; the participant can find how to reset remembered
choices.

**Pass:** the participant accurately states the boundary without facilitator
correction and no protected content appears before the intended interaction.

**Fail examples:** copy implies strong security, a default password is presented
as safe for real secrets, or declining entry stores consent.

## Game Master journeys

### GM-01 — Understand the GM path

**Priority:** Critical

**Goals:** GN-01, GN-07

**Start:** First-visit environment on the public project page

**Timebox:** 2 minutes

**Task given to the participant:**

> You run a campaign and do not want to edit JSON. Find out how QuestKeeper
> helps you, open the Campaign Manager demo and explain where campaign data
> lives.

**Pass:** at least 4 of 5 participants reach the interactive manager demo
unaided in under two minutes and correctly describe the local-first model.

**Fail examples:** the GM believes a cloud account is required, cannot
distinguish the demo from the live Companion, or expects the public site to edit
their local files.

### GM-02 — Create a playable campaign foundation

**Priority:** Critical

**Goals:** GN-06, GN-07

**Start:** A clean local checkout with dependencies installed

**Timebox:** 15 minutes, excluding image creation

**Task given to the participant:**

> Using the Campaign Manager, create an original campaign with its language,
> one character, one NPC, one place and one first session. Preview the result
> without opening a source file.

**Expected outcome:** the manager creates valid IDs, manifests, relative media
paths and campaign data. Validation explains incomplete required fields before
writing invalid content.

**Pass:** at least 4 of 5 participants complete and preview the campaign unaided
without editing JSON or learning repository structure.

**Fail examples:** a successful form produces a broken build, the participant
must manually update a manifest, or destructive overwrite is the only way to
correct an ID.

### GM-03 — Prepare the shared game-night state

**Priority:** Critical

**Goals:** GN-02, GN-06

**Start:** The Lantern Road editable in the Campaign Manager

**Timebox:** 10 minutes, excluding prose writing

**Task given to the participant:**

> Prepare the next session by setting the current place, latest recap, party
> state, two open threads and one character concern. Preview what players will
> see on desktop and mobile.

**Expected outcome:** every summary item has a source or destination, visibility
is explicit and the preview matches the published structure.

**Pass:** the GM completes all fields unaided, identifies what is public or
protected and verifies the four P-02 answers from the preview.

**Fail examples:** private GM truth appears in the public summary, duplicate
facts must be maintained independently, or preview and built output disagree.

### GM-04 — Correct a mistake and recover safely

**Priority:** Critical

**Goals:** GN-06

**Start:** A valid editable copy of the test fixture

**Task given to the participant:**

> Correct a session title, attempt to save one broken reference, remove a test
> NPC and then restore it.

**Expected outcome:** the valid edit persists; the invalid reference is blocked
with a field-specific correction; removal states its scope; restoration brings
back the same ID and relationships.

**Pass:** recovery succeeds in every attempt and the final campaign validates
without unrelated data loss.

**Fail examples:** validation discards input silently, a cascade is not disclosed
before deletion, or recovery requires Git or manual manifest editing.

### GM-05 — Turn session notes into a reviewed draft

**Priority:** Critical

**Goals:** GN-06, GN-07

**Start:** A campaign with a scheduled next session

The GM chooses either input path; both must remain supported.

**Manual-notes path:** import or paste handwritten/typed notes, assign the
session and prepare a draft without Discord or AI.

**Session Scribe path:** after every participant has consented, start the bot
from the manager, capture a short named-speaker sample, stop it and open the
local draft. Confirm that no audio recording was retained.

**Shared expected outcome:** the output is visibly a draft, uncertain speaker or
content segments remain reviewable and nothing publishes automatically. The GM
can correct names, distinguish table facts from interpretation and remove a
private passage before approval.

**Pass:** both paths produce an editable local draft; the Scribe cannot begin
without an explicit consent step; publishing always requires human review.

**Fail examples:** Discord is mandatory, speaker guesses become unquestioned
facts, raw notes publish automatically, or consent and audio-retention behavior
are ambiguous.

### GM-06 — Validate, export and publish

**Priority:** Critical

**Goals:** GN-06, GN-07

**Start:** A reviewed campaign update ready for release

**Task given to the participant:**

> Validate the campaign, export a portable backup and publish the update. Import
> the backup into a clean test copy and verify its visible content.

**Expected outcome:** lint, type checks, tests, content validation and production
build pass before deployment. The export preserves IDs, languages, relationships
and licensed/original media. Import does not overwrite an existing campaign
without a clear choice and recovery path.

**Pass:** the published Companion and imported copy match expected campaign
counts and primary links; no token, local path, private transcript or unlicensed
asset is exposed.

**Fail examples:** deployment proceeds after a failed quality gate, secrets are
included in export, or import silently replaces an existing campaign.

## Shared end-to-end journey

### E2E-01 — From preparation to the next decision

**Priority:** Critical

**Goals:** GN-01 through GN-07

**Participants:** one GM and at least two players

**Timebox:** 20 minutes total, including a 5-minute player catch-up

1. The GM updates and previews the shared game-night state.
2. A returning player identifies the four P-02 context answers within five
   minutes.
3. A second player retrieves one character fact, NPC fact, place discovery and
   earlier event under the P-04 limits.
4. The group goes offline and reopens the prepared essentials on a narrow
   viewport.
5. After a short simulated scene, the GM creates a reviewed draft using manual
   notes or the consented Scribe path.
6. The GM exports a backup and validates the campaign update.

**Pass:** every participant completes their portion without implementation
knowledge, no private information crosses a visibility boundary and the group
can state its next informed in-fiction decision.

## Cross-cutting acceptance matrix

| Concern           | Release expectation                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility     | Semantic landmarks, visible focus, logical order, no keyboard trap, meaningful labels and reduced-motion support across all critical destinations. |
| Responsive layout | P-02, P-03, P-05, P-06 and E2E-01 pass at 360 px without horizontal page scrolling.                                                                |
| Language          | Core journeys pass in English and Italian; arbitrary campaign-language content has a usable fallback.                                              |
| Errors            | Validation and runtime errors explain what happened, preserve entered data and identify a recovery action.                                         |
| Empty state       | A new campaign explains the first useful action instead of presenting a broken or decorative blank page.                                           |
| Performance       | Navigation and local interactions provide immediate feedback; image loading does not move or hide the next action.                                 |
| Privacy           | No journey requires analytics, a cloud account or undisclosed transfer. Protected client data is never described as encrypted.                     |
| Content rights    | The fixture and captured evidence contain only original or redistributable content.                                                                |

## Evidence and scoring protocol

1. Copy the [validation scorecard](templates/GAME-NIGHT-SCORECARD.md) for the
   round and record the build commit.
2. Give the task statement verbatim. Do not teach the interface first.
3. Record completion, time, deliberate actions, assistance and observed
   confusion. Record behavior before interpretation.
4. Save screenshots only when they contain no participant identity or private
   campaign data.
5. Mark each journey `PASS`, `AT RISK`, `FAIL` or `NOT TESTED`.
6. Convert repeated confusion into an issue linked to the journey and goal ID.
7. Review results in the weekly planning session before changing future scope.

## Release decision

QuestKeeper 1.5 may ship only when:

- every critical player, GM and end-to-end journey passes in two consecutive
  validation rounds;
- the final round includes at least ten people from three groups, with at least
  six player perspectives and four people who prepare or publish campaigns;
- GN-01 through GN-07 meet the thresholds in the product brief;
- there are no unresolved critical accessibility, privacy, data-loss or content
  licensing defects;
- any lower-severity exception records user impact, owner and follow-up date.

Project maintainers may facilitate a round but do not count as participants in
the final usability threshold.

## Traceability

| Goal                   | Acceptance journeys                            |
| ---------------------- | ---------------------------------------------- |
| GN-01 — Understand     | P-01, GM-01, E2E-01                            |
| GN-02 — Resume         | P-02, P-03, GM-03, E2E-01                      |
| GN-03 — Retrieve       | P-03, P-04, E2E-01                             |
| GN-04 — Continue       | P-05, E2E-01                                   |
| GN-05 — Read anywhere  | P-06, E2E-01                                   |
| GN-06 — Publish safely | GM-02 through GM-06, E2E-01                    |
| GN-07 — Preserve trust | P-01, P-07, GM-01, GM-02, GM-05, GM-06, E2E-01 |
