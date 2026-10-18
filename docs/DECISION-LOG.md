# QuestKeeper Decision Log

This is the project's durable memory. Completed tasks remain inputs to future
planning, implementation and review: a checked roadmap item means its result is
available and authoritative, not that it has stopped mattering.

Use this log for decisions that affect more than one task, constrain future
work or change how the roadmap should be interpreted. Keep detailed requirements
in their source document and link them here instead of duplicating them.

## How to maintain this log

- Read relevant active decisions before starting a task.
- Add or amend an entry when new evidence changes a durable decision.
- Never silently delete an old decision. Mark it `Superseded` and link its
  replacement so the reasoning remains traceable.
- During weekly review, check whether completed work changes dependencies,
  priority, acceptance criteria or scope of future tasks.
- A decision is `Active`, `Superseded` or `Retired`. A temporary exception also
  records an owner and review date.

## Decisions

### QK-001 — Completed work remains active project context

**Date:** 18 October 2026

**Status:** Active

**Decision:** Every completed task must leave reusable evidence and be considered
when planning, reviewing or implementing later tasks. Closure records what
changed downstream, which assumptions became true or false and which future
items need adjustment.

**Why:** Treating tasks as isolated checkboxes creates contradictory features,
repeated analysis and a roadmap that ignores what the project has learned.

**Consequences:** The working agreement, pull request template and weekly review
all require continuity and downstream-impact checks. A roadmap checkbox links
to its authoritative result whenever practical.

**Revisit when:** The project adopts an issue or product-management system that
provides equal or stronger traceability automatically.

### QK-002 — Game Night Edition optimizes readiness, not engagement

**Date:** 18 October 2026

**Status:** Active

**Decision:** QuestKeeper 1.5 prioritizes reducing the time between opening the
Companion and making the next informed decision at the table. Its north-star
outcome is meaningful play within five minutes after a four-week break.

**Why:** Page views and time spent would reward a denser archive, while the user
need is faster shared understanding.

**Consequences:** Future 1.5 tasks must support a numbered product goal, protect
a release guardrail or unlock another scheduled goal.

**Source:** [Game Night Edition product goals](GAME-NIGHT-EDITION-GOALS.md)

**Revisit when:** Validation shows that the five-minute outcome is either
unrealistic or too weak to represent table readiness.

### QK-003 — Acceptance journeys are the release contract

**Date:** 18 October 2026

**Status:** Active

**Decision:** Presence of a feature does not make it complete. QuestKeeper 1.5
must pass its critical player, GM and end-to-end journeys in two consecutive
validation rounds.

**Why:** Repeatable outcomes make design and implementation decisions comparable
and prevent isolated features from passing without a coherent experience.

**Consequences:** Pull requests identify affected journey IDs; weekly planning
prioritizes failed journeys; the release scorecard records evidence rather than
subjective confidence.

**Source:**
[Player and GM acceptance journeys](GAME-NIGHT-ACCEPTANCE-JOURNEYS.md)

**Revisit when:** A goal changes or evidence demonstrates that a journey no
longer measures the intended outcome.

### QK-004 — Product evidence must preserve local-first trust

**Date:** 18 October 2026

**Status:** Active

**Decision:** QuestKeeper does not add analytics by default. Validation uses
consented usability sessions, anonymous scorecards, accessibility review,
opt-in campaign feedback and CI evidence.

**Why:** Measuring success must not contradict the product's privacy promise.

**Consequences:** New measurement proposals disclose every transfer and require
an explicit user benefit and opt-in. Test evidence contains no private campaign
content or participant identity.

**Source:** [Game Night Edition product goals](GAME-NIGHT-EDITION-GOALS.md)

**Revisit when:** A privacy-preserving measurement approach offers meaningful
new evidence and users can make an informed choice.

### QK-005 — Shared product work has two delivery targets

**Date:** 18 October 2026

**Status:** Active

**Decision:** Maintainer work on reusable QuestKeeper behavior is evaluated for
both this public template and the maintained production Campaign Companion that
hosts existing campaigns. A shared change is complete only after compatible
implementations are verified in both repositories, or an explicit target-specific
exception is recorded.

**Why:** The public template and the real campaign site must inform each other.
Otherwise the template can promise unproven behavior while active campaigns
miss improvements or break when changes eventually arrive.

**Consequences:** Every maintainer task is classified as `shared`, `public-only`
or `campaign-only`. Shared work records the corresponding commits and validation
in both repositories. Campaign data, credentials, transcripts, licensed content
and private integrations never flow into the public template.

**Source:** Maintainer continuity rule in the
[working agreement](WORKING-AGREEMENT.md)

**Revisit when:** The repositories adopt an automated, privacy-safe upstream
and downstream release process with equivalent compatibility evidence.

### QK-006 — Mobile releases are first-class QuestKeeper experiences

**Date:** 18 October 2026

**Status:** Active

**Decision:** QuestKeeper will release on Android and iOS for both phones and
tablets. Portrait phone and landscape tablet use are separate first-class
layouts, not accidental adaptations of the desktop interface.

**Why:** Players reach for different devices during preparation, at the table
and while reading between sessions. A usable mobile release must respect those
contexts instead of merely fitting within the viewport.

**Consequences:** Shared navigation, offline, persistence, touch targets and
content layouts must anticipate native packaging. Release validation will
cover portrait phones and landscape tablets on both platforms while preserving
the self-hosted, portable campaign model.

**Source:** [QuestKeeper annual roadmap](../ROADMAP.md)

**Revisit when:** Device testing or distribution constraints require a revised
platform scope without weakening the two layout experiences.

### QK-007 — A finished campaign can become an owned Campaign Book

**Date:** 18 October 2026

**Status:** Active

**Decision:** At campaign closure, QuestKeeper will offer a Campaign Book
studio with cover, chapters and supporting material. Groups can author it
manually, semi-automatically, automatically with local AI or automatically with
an explicitly chosen remote AI provider.

**Why:** The lasting value of a completed campaign is its shared memory. The
group should be able to turn that memory into an editable keepsake without
surrendering authorship, privacy or control of the archive.

**Consequences:** Session data, artwork and credits need book-ready provenance.
Generated prose remains editable and requires approval. Remote processing is
opt-in with a clear preview of shared data; local AI remains available; manual
authoring never becomes a second-class path.

**Source:** [QuestKeeper annual roadmap](../ROADMAP.md)

**Revisit when:** Real completed campaigns reveal that the authoring modes,
book structure or export formats do not support how groups preserve their
stories.

## New decision template

### QK-XXX — Short decision title

**Date:** YYYY-MM-DD

**Status:** Active

**Decision:** What the project will do.

**Why:** Evidence and trade-off behind the choice.

**Consequences:** Tasks, behavior, constraints and future work affected.

**Source:** Link to the authoritative artifact, issue or pull request.

**Revisit when:** Concrete evidence or date that should trigger reconsideration.
