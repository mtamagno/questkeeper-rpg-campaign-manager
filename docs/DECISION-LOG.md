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

### QK-008 — Character backgrounds are illustrated chapter sequences

**Date:** 18 October 2026

**Status:** Active

**Decision:** A substantial public character background may be presented as an
ordered sequence of illustrated `loreChapters`. The ordinary backstory remains
a concise summary and fallback; private facts remain exclusively in the
protected profile.

**Why:** A long biography is difficult to scan and gives every memory the same
visual weight. Chapters let players understand a character through distinct
turning points while giving campaign art a narrative purpose.

**Consequences:** Every chapter requires a focused public scene, localized
title and body, accessible alt text and an optional emotional caption. Images,
captions and alt text must be reviewed for accidental spoilers. Campaigns that
do not define chapters keep the existing backstory presentation unchanged.

**Source:** [Campaign content guide](CONTENT-GUIDE.md#characters)

**Revisit when:** Character histories become large enough to need pagination,
reordering tools or chapter-level visibility controls.

## New decision template

### QK-009 — One consent-first AI setup and one reviewable draft path

**Date:** 18 October 2026

**Status:** Active

**Decision:** Campaign Manager owns a single AI configuration for manual,
local and remote creation. Ollama provides local structured prose, ComfyUI
provides local images and OpenAI is the initial opt-in remote provider. Raw
notes become an editable session draft; no prose, suggestion or relationship
change is published without the Game Master's explicit save.

**Why:** Separate scripts and hidden configuration make a useful workflow feel
technical and encourage inconsistent privacy behavior. A visible installer can
recommend models from hardware, explain image-generation constraints and keep
the same consent boundary from setup through every processing task.

**Consequences:** AI setup remains a permanent provider and model library after
onboarding. A session run independently selects its prose model, its text model
for visual prompts and its image-rendering model. Secrets remain in the
Git-ignored local manager directory; local endpoints are restricted to
localhost; remote tasks require per-action consent; local failure never
triggers cloud fallback. Image placement is explicit, reviewable and bound to
real prose scenes. Future AI features must extend the same draft, evidence and
review model. Downloaded checkpoints are never committed and their licenses
remain the user's responsibility.

**Source:** [AI setup and session-draft workflow](AI-SETUP.md)

**Revisit when:** A second remote provider, cross-device secret storage or
archive-wide automatic edits require a broader provider and approval model.

### QK-010 — Publishing may bypass GitHub without bypassing safeguards

**Date:** 18 October 2026

**Status:** Active

**Decision:** Campaign Manager can publish a fresh production build directly
to a configured FTPS destination. GitHub Pages remains supported but is not a
required intermediary. Plain FTP is a deliberately discouraged compatibility
option that requires explicit acknowledgement before each connection or
upload.

**Why:** Many Game Masters already pay for ordinary web hosting and should not
need to understand GitHub Actions or copy build artifacts manually to keep a
chronicle current.

**Consequences:** Host, remote folder and credentials live only in the
Git-ignored local manager directory. The browser never receives a saved
password. Every upload starts with a validated production build, overwrites
matching files and leaves unrelated remote files untouched. Future publishing
providers must preserve this local-secret and build-before-upload boundary.

**Source:** [Deployment guide](DEPLOYMENT.md#direct-ftps-from-campaign-manager)

**Revisit when:** SFTP, managed hosting or encrypted OS-level secret storage is
added.

### QK-011 — AI imports evidence into an editable character draft

**Date:** 18 October 2026

**Status:** Active

**Decision:** Character and NPC creation can begin from sheet photos,
screenshots or a public/shared Roll20 print-view URL when the selected provider
supports browsing. Extraction populates the normal editor but never saves the
entry automatically. Manual authoring remains a complete first-class path.

**Why:** Re-entering existing sheets is slow and error-prone, while direct
automation without review can silently invent statistics, identities or secret
history.

**Consequences:** The GM chooses the extraction model and language, reviews
uncertainties and edits every field before saving. Private or signed-in Roll20
sheets use deliberately supplied screenshots; QuestKeeper does not borrow the
user's authenticated browser session. Visual appearance is not evidence for
sensitive character facts. Future imports from PDFs or other VTTs extend this
same draft-and-review contract.

**Source:** [AI setup and privacy guide](AI-SETUP.md#import-player-characters-and-npcs)

**Revisit when:** A provider-independent browser connector or structured VTT
export format can supply stronger source attribution.

### QK-012 — Every Manager workflow ships in English and Italian

**Date:** 19 October 2026

**Status:** Active

**Decision:** The local Campaign Manager exposes an always-visible English /
Italian interface selector, detects the browser language on first use and
remembers the choice. New Manager screens and guidance must add both languages
in the same delivery. Campaign-content languages remain an independent choice.

**Why:** Installation, AI consent and publishing are the moments in which
unclear copy creates the greatest risk. A translated README is not enough when
the actual controls still require technical English.

**Consequences:** Every future Manager feature must include translated labels,
help text, warnings, empty states and action feedback. Automated checks protect
the catalog and script order; Chrome review covers language switching and the
critical guided journeys. Switching the interface must never rewrite campaign
content or provider configuration.

**Source:** [AI setup guide](AI-SETUP.md#open-the-interactive-installer)

**Revisit when:** A third complete Manager interface catalog is ready or the
project adopts a framework-level internationalization system.

### QK-013 — The README is a doorway, not the rulebook

**Date:** 19 October 2026

**Status:** Active

**Decision:** The root README presents QuestKeeper's value, live experiences
and shortest setup path. Installation, player-facing Companion behavior and
Game Master workflows each live in a focused guide with clear cross-links.
Original high-fantasy guide characters identify those paths consistently.

**Why:** A single exhaustive README made the project feel difficult before a
new player or GM understood what it offered. Task-oriented guides preserve the
detail while giving the repository landing page a fast, inviting reading path.

**Consequences:** New detailed instructions belong in the appropriate guide or
specialist reference rather than accumulating in the README. README changes
must keep the live Companion, Manager demo, installation and roadmap visible
without requiring a long scroll. Guide art must remain original, readable on
light and dark GitHub themes, optimized for the web and decorative rather than
instruction-bearing.

**Source:** [Project README](../README.md) and the
[Installation](INSTALLATION-GUIDE.md), [Companion](COMPANION-GUIDE.md) and
[Manager](MANAGER-GUIDE.md) guides.

**Revisit when:** User testing shows that an essential first-run question is
not reachable from the landing page in one obvious choice.

### QK-014 — Shared UI consumes a semantic runtime token layer

**Date:** 19 October 2026

**Status:** Active

**Decision:** QuestKeeper separates raw SCSS values, semantic runtime `--qk-*`
tokens and framework-agnostic UI primitives. Campaign identity changes the
semantic accent tier; shared components do not acquire campaign-specific
selectors for ordinary theming.

**Why:** Compile-time color variables and repeated component styles cannot
support multiple coherent campaign palettes without drift. A semantic runtime
contract allows one accessible component implementation to serve the public
demo, Phandelver, Curse of Strahd and future campaigns.

**Consequences:** New reusable controls begin with the documented `qk-*`
primitives or extend them. New tokens describe purpose rather than a particular
color. Status colors, focus, touch size, contrast preferences and reduced motion
remain stable across campaign palettes. Existing components migrate when they
are changed rather than through an unsafe bulk rewrite.

**Source:** [QuestKeeper Interface Foundations](DESIGN-SYSTEM.md)

**Revisit when:** Native applications require a generated cross-platform token
artifact or browser support allows a safer typed custom-property contract.

### QK-015 — Campaign identity uses three curated palette presets

**Date:** 19 October 2026

**Status:** Active

**Decision:** QuestKeeper provides `heroic`, `gothic` and `neutral` campaign
palettes. Campaign manifests choose a preset; product pages without an active
campaign use `neutral`, while manifests without a choice fall back to
`heroic` for backward compatibility.

**Why:** A small set of tested visual identities gives campaigns atmosphere
without reintroducing arbitrary component colors or making every Game Master
responsible for contrast and interaction states.

**Consequences:** Palette selection is available in Campaign Manager, shared
components inherit it through semantic tokens, and campaign IDs do not define
ordinary theme colors. Every preset must maintain WCAG AA contrast for body
text and text on primary accents. Free-form palette editing remains reserved
for the later Theme Studio with automatic contrast guidance.

**Source:**
[Curated campaign palettes](DESIGN-SYSTEM.md#curated-campaign-palettes)

**Revisit when:** Theme Studio can validate custom choices as reliably as the
curated presets or a light color scheme becomes a committed product outcome.

### QK-016 — First-visit roles orient; they never authorize

**Date:** 19 October 2026

**Status:** Active

**Decision:** A first-time visitor may choose a Player or Game Master path.
QuestKeeper remembers that preference only on the current device and uses it to
offer a clearer next action. It never hides capabilities, grants campaign access
or represents an authenticated identity.

**Why:** Players and Game Masters arrive with different immediate questions,
but forcing accounts or ambiguous role-based access would undermine the local,
portable and self-hosted product promise.

**Consequences:** Every role-aware surface must keep a visible reset, explain
local storage and preserve the full product. Guided tours may personalize their
opening from this preference, while protected content continues to use its own
explicit access mechanism.

**Source:** [First-visit paths](FIRST-VISIT-PATHS.md)

**Revisit when:** QuestKeeper introduces optional multi-user accounts with a
documented permission model.

### QK-017 — Stable releases are immutable verified archives

**Date:** 19 October 2026

**Status:** Active

**Decision:** QuestKeeper stable tags match the package semantic version and
produce versioned ZIP and TAR.GZ archives exclusively from tracked public files.
Every release reruns the full verification suite and publishes SHA-256 checksums.

**Why:** A downloadable release should start reliably without Git knowledge and
must never inherit private campaigns, credentials or local workspace debris.
Immutable tags keep bug reports, documentation and upgrades reproducible.

**Consequences:** Release notes are committed before tagging, setup installs
locked dependencies on first launch, and a published tag is never moved to
different code. Future roadmap versions advance from the 1.0.0 public baseline.

**Source:** [Releasing QuestKeeper](RELEASING.md)

**Revisit when:** Native installers replace source archives as the primary
desktop distribution.

### QK-018 — Every public version has a fantasy identity and companion

**Date:** 19 October 2026

**Status:** Active

**Decision:** Every stable QuestKeeper tag receives a permanent fantasy
codename, a plain-language chapter title and one new original release companion.
This includes patch releases, whose companion may use a smaller familiar-scale
presentation. The identity is recorded in the root Release Codex and that
version's notes before tagging.

**Why:** Version numbers are precise but forgettable. A consistent cast turns
the project's evolution into an inviting journey that players and Game Masters
can recognize without hiding the practical outcome of each release.

**Consequences:** Release verification requires a codename, companion block and
version-prefixed art asset. Published identities are never reused or renamed;
art remains original, accessible and independent of commercial fantasy worlds.
The already-published 1.0.0 archives and tag stay immutable while its companion
is documented in the living release catalog.

**Source:** [The QuestKeeper Release Codex](../RELEASES.md)

**Revisit when:** The cast becomes difficult to distinguish at a glance or the
project adopts a different public release cadence.

### QK-019 — The demo tour guides without taking control

**Date:** 20 October 2026

**Status:** Active

**Decision:** The live-demo tour is a five-stop, non-modal guide whose progress
is validated and remembered only in the current browser. It may personalize
copy from the first-visit Player/GM preference, but the visitor chooses the
campaign, grants spoiler consent normally and can pause, deviate or restart at
any time.

**Why:** A useful tour should shorten the path to understanding without
replacing exploration, hiding the real interface or implying permissions that
do not exist. Remembered progress prevents an interrupted introduction from
becoming repeated friction.

**Consequences:** Tour steps use stable product destinations rather than brittle
element spotlights. Route deviations offer recovery instead of forced
navigation. PWA and offline work must preserve the versioned state and handle
unavailable stops honestly; future navigation remains usable without completing
the tour.

**Source:** [Guided live-demo tour](GUIDED-DEMO-TOUR.md)

**Revisit when:** Moderated first-visit sessions show that the five stops do not
help at least four of five visitors explain and navigate the Companion within
two minutes.

### QK-020 — Close the day before moving the calendar

**Date:** 20 October 2026

**Status:** Active

**Decision:** The two dated items in the 60-day plan define the scheduled scope
for that day. A third work block is normally a closeout review that tests the
combined journey, corrects gaps, connects durable decisions and updates future
task assumptions. Work assigned to a later date moves forward only through an
explicit re-plan recorded in the roadmap.

**Why:** Fast implementation can make adjacent features look complete in
isolation while leaving contradictory labels, stale state, missing focus or
outdated documentation between them. Pulling later work forward hides those
integration costs and makes the calendar unreliable.

**Consequences:** Daily reviews use the reusable closeout template, may produce
a focused refinement commit and must record downstream impact. Spare capacity
is spent strengthening today's outcome before tomorrow's scope is opened.

**Source:** [Daily closeout template](templates/DAILY-CLOSEOUT.md) and
[Day 03 integration review](reviews/2026-10-20-day-03-closeout.md)

**Revisit when:** A weekly review deliberately adopts a different cadence and
updates both the 60-day plan and working agreement.

### QK-021 — Windows setup begins with choices, not prerequisites

**Date:** 20 October 2026

**Status:** Superseded by QK-022

**Decision:** Windows users begin with a bilingual graphical bootstrap that
works before Node.js exists. It can install the supported Node.js 24 release,
prepare locked dependencies and create separate Manager and Companion desktop
shortcuts. Every machine-changing option is visible before execution.

**Why:** Asking a Game Master to interpret missing-runtime errors and terminal
commands makes local ownership feel harder than a cloud account. The bootstrap
can remove that friction without hiding trust decisions.

**Consequences:** Node.js is downloaded only from `nodejs.org`, matched against
the official SHA-256 manifest and installed only after the user starts the
selected setup and accepts Windows elevation. AI models remain outside this
bootstrap. macOS and Linux keep their existing launchers until equivalent
native, verifiable flows are designed.

**Source:** [Installation Guide](INSTALLATION-GUIDE.md)

**Revisit when:** See QK-022.

### QK-022 — One verified setup path across desktop platforms

**Date:** 20 October 2026

**Status:** Active

**Decision:** Stable releases contain standalone graphical setup builds for
Windows x64, Linux x64, macOS Intel and macOS Apple Silicon. The same local,
bilingual browser UI prepares a private Node.js 24 runtime, locked dependencies
and optional Manager/Companion desktop launchers. Source scripts remain fallback
developer entries rather than the recommended player path.

**Why:** A Game Master should not have to install a programming runtime or learn
terminal commands before seeing the Manager. An application-owned runtime also
keeps version support consistent without making system-wide changes.

**Consequences:** Platform binaries are built as Node.js Single Executable
Applications on matching GitHub runners. Runtime archives come only from
`nodejs.org` and must pass the published SHA-256 check. The local setup server
binds to loopback and requires a random token. Unsigned first-release binaries
must disclose SmartScreen/Gatekeeper warnings; signing and notarization are a
future trust improvement. The explicit re-plan moves 1.1.0 forward but does not
move Day 04 PWA/offline work.

**Source:** [Installation Guide](INSTALLATION-GUIDE.md) and
[QuestKeeper 1.1.0 release notes](releases/v1.1.0.md)

**Revisit when:** Signing credentials are available, another desktop
architecture has demonstrated demand, or Node SEA leaves active development.

### QK-023 — Installation is progressive; offline availability is explicit

**Date:** 21 October 2026

**Status:** Active

**Decision:** QuestKeeper ships one hosting-path-independent web app manifest,
branded standard and maskable icons, and a production-only Angular service
worker. Its bilingual in-app Install action appears only after the browser
raises `beforeinstallprompt`; other browsers retain their native install or
home-screen path. This first delivery caches only the application shell and
brand assets, not campaign records.

**Why:** An unavailable install button erodes trust, while silently caching an
undefined subset of campaign content creates dangerous confidence before a
game night. Relative manifest scope lets the same shared implementation work at
the public root and production's `/DnD/` path.

**Consequences:** Normal browser reading remains the fallback. Development
builds do not register the service worker. The second Day 04 task must add a
visible, testable preparation state for recent characters and recaps rather
than broad background caching, and must not expose protected data that was
never deliberately unlocked.

**Source:** [PWA installation guide](PWA-INSTALLATION.md), GN-05 and acceptance
journey P-06.

**Revisit when:** Browser installation events change materially, native shells
replace the web install path, or offline journey evidence requires a different
scope.

### QK-024 — Offline readiness is a public-only, user-prepared snapshot

**Date:** 21 October 2026

**Status:** Active

**Decision:** Each campaign offers a visible offline pack that the participant
prepares and removes explicitly. It stores selected public character identity
and profile fields plus at most the three newest concise recaps in versioned
local browser storage. The service worker caches only the public campaign
directory, campaign metadata and public artwork needed to reopen that pack;
character and session source JSON remain outside its data cache.

**Why:** Static character files also contain protected sheets and secrets.
Caching them wholesale would violate the trust boundary even when the visible
page was public. A small rendered snapshot is easier to explain, inspect,
refresh and remove, and gives an honest answer to “what works at the table?”

**Consequences:** The offline library shows preparation time and exact counts,
works in every configured campaign language, and never claims an unprepared
page is available. Preparing again replaces only that campaign's pack. Browser
storage is a convenience copy rather than an archive. Future offline work must
extend the sanitized snapshot schema or introduce an equally reviewable
boundary; it may not broaden service-worker patterns to protected JSON.

**Source:** [Offline game-night guide](OFFLINE-GAME-NIGHT.md), GN-05 and
acceptance journey P-06.

**Revisit when:** User testing shows that three recaps are insufficient, a
secure encrypted vault is designed, or native storage provides a clearer
equivalent boundary.

### QK-025 — Issues record observed and released versions separately

**Date:** 21 October 2026

**Status:** Active

**Decision:** Every actionable issue records the released version in which the
feedback was observed with both a body field and a `reported-in:x.y.z` label.
The resolved version remains unset until a published artifact containing the
change passes its required compatibility checks and a release smoke test. Only
then is `resolved-in:x.y.z` applied and the issue closed.

**Why:** A merged commit is not necessarily available to players, and “reported
in” does not prove that a release introduced the behavior. Keeping observation,
implementation and verified distribution separate makes regressions and
release notes traceable without rewriting history.

**Consequences:** Bug and feature templates request the observed version;
parent/child dependencies remain linked when feedback needs several deliveries;
and issue bodies must exclude secrets, private campaign material and protected
rules text. Maintainers update the first containing version during the release
workflow rather than guessing a future target during triage.

**Source:** [Issue and release traceability](ISSUE-TRACKING.md)

**Revisit when:** GitHub provides an equally explicit native field for both
observed and first-released versions, or the project adopts a different public
release tracker.

### QK-026 — Ecosystem freshness is reviewed on a fixed evidence cadence

**Date:** 21 October 2026

**Status:** Active

**Decision:** Every weekly closeout records dependency, security, build-tool and
Node runtime health. The first weekly review of each month also compares the AI
provider/model landscape using official evidence and updates the provider
research matrix. Findings receive an explicit adopt, experiment, watch,
deprecate or no-action decision; nothing is upgraded or added merely because it
is newer.

**Why:** QuestKeeper packages a private runtime, local authoring services and
optional fast-changing AI integrations. Ad-hoc checks can miss security or
deprecation deadlines, while automatic novelty-driven updates can break
downloadable builds, change costs or weaken the user's privacy expectations.

**Consequences:** Weekly notes contain a repeatable runtime/dependency table and
the monthly review records capabilities, privacy, price shape, regional and
hardware constraints, licenses and deprecations. Material findings become
focused issues. Runtime changes are verified in downloadable artifacts; shared
provider work follows the dual-repository contract and never silently changes a
configured model or sends campaign data remotely.

**Source:** [Working Agreement](WORKING-AGREEMENT.md),
[weekly review template](templates/WEEKLY-REVIEW.md),
[monthly ecosystem review](templates/MONTHLY-ECOSYSTEM-REVIEW.md) and public
issue #15.

**Revisit when:** Dependency and provider monitoring is automated with equally
clear human decisions, the release cadence changes, or a supported runtime
enters end-of-life before the next scheduled review.

### QK-027 — The command palette indexes routes, not private content

**Date:** 22 October 2026

**Status:** Active

**Decision:** The persistent **Go to… / Vai a…** control is QuestKeeper's global
keyboard-first navigation palette. It exposes current-campaign destinations,
campaign switching and global product areas; supports `Ctrl/Command+K`, arrow,
boundary, Enter, Escape and trapped-Tab navigation; restores focus on close;
and sends focus to the main landmark after navigation. It indexes stable routes
and bilingual navigation keywords only.

**Why:** A route palette shortens in-play retrieval without pretending to be
full-text search or reading protected campaign records. A single predictable
interaction also scales better than adding more permanent controls to the
responsive command bar.

**Consequences:** Route guards and spoiler consent remain authoritative. The
palette may label the current route and production-only destinations, but it
must not expose protected sheets, GM notes or campaign canon in the public
template. Day 05's recent/favourite work extends the palette as explicit local
actions; later content search requires a separate visibility-aware index.

**Source:** [Global command palette](GLOBAL-COMMAND-PALETTE.md), GN-03, GN-05
and acceptance journey P-04.

**Revisit when:** Full-text search ships, route volume makes grouping
insufficient, or user testing shows that keyboard and touch discovery need
different entry points.

### QK-028 — Operational state comes from one verified readiness model

**Date:** 22 October 2026

**Status:** Active

**Decision:** Setup, launchers and Manager controls must describe the same
observed operational state: configured, detected, starting, ready, conflicting,
failed or safely falling back. A process spawn, saved preference or existing
file is not by itself proof that a capability is ready.

**Why:** Field feedback exposed the same failure family in several forms: an
installed Node.js runtime was ignored, Companion controls disagreed about
whether the site could open, palette selection appeared inert until a reload,
and valid partial translations were treated as invalid finished translations.
Each bug came from presenting an inferred state instead of the user-relevant
state and transition.

**Consequences:** Runtime selection validates the exact executable, version,
architecture and npm; local services use active readiness probes and actionable
port-conflict states; visual settings pair preview with an explicit application
boundary; translation health distinguishes missing required source content from
an intentionally unfinished secondary-language draft. Future health dashboards
reuse these contracts instead of implementing new boolean checks.

**Source:** Public issues #4, #5, #6 and #10; the 22 October field-feedback
constraints in the [60-day plan](ROADMAP-60-DAYS.md).

**Revisit when:** A persistent background service can provide a typed health
protocol shared across setup, Manager, Companion and Session Scribe, or user
testing shows that the state vocabulary is still ambiguous.

### QK-029 — Reading memory stores navigation metadata, never campaign content

**Date:** 23 October 2026

**Status:** Active

**Decision:** Recent pages, favourites and continue-reading state are stored
locally per campaign as a bounded list of normalized URLs, visible page titles
and visit timestamps. Campaign landing pages do not replace the last readable
destination. The same state powers the campaign home and command palette.

**Why:** Players need a quick return path, but copying rendered prose or private
records into another browser store would create a hidden content cache with an
unclear spoiler and security boundary.

**Consequences:** Reading memory remains device-local, capped at twelve recent
and twelve favourite pages per product store, and never inspects protected
fields, page text or passwords. Route guards remain authoritative. A future
account or contribution system must migrate this metadata explicitly rather
than silently synchronizing browser history.

**Source:** [Global command palette](GLOBAL-COMMAND-PALETTE.md), roadmap Day 05
and acceptance journeys P-04/P-06.

**Revisit when:** Cross-device profiles ship, route identities change during a
schema migration, or user testing requires an explicit history-disable option.

### QK-030 — Route focus and modal focus belong to the shared shell

**Date:** 23 October 2026

**Status:** Active

**Decision:** Every in-app navigation announces its destination and moves focus
to the new routed heading after the initial load. Every modal contains Tab focus,
supports Escape and restores its launcher. These behaviors use shared shell and
focus utilities rather than per-page workarounds.

**Why:** A visually successful route change can leave keyboard and screen-reader
users operating controls from the previous page. Independently implemented
overlays also drift in Escape, Tab and restoration behavior.

**Consequences:** Routed pages keep one meaningful `h1`; persistent navigation
must not introduce another. New dialogs use the shared focus helper. Visual
focus must survive campaign palettes, increased contrast and forced colours.

**Source:** [Accessibility contract](ACCESSIBILITY.md), roadmap Day 06 and all
published player/GM acceptance journeys.

**Revisit when:** Native mobile shells define an equivalent navigation-focus
API or automated browser accessibility checks can replace part of the static
guard without reducing coverage.

### QK-031 — Performance limits are executable product contracts

**Date:** 23 October 2026

**Status:** Active

**Decision:** Initial HTML, JavaScript and CSS, request count, deferred chunks,
optimized images and font loading each have repository-specific ceilings that
are measured after a production build.

**Why:** A feature can appear correct while quietly making every session slower,
especially on game-night Wi-Fi and mobile devices. Review-only guidance cannot
prevent gradual regressions.

**Consequences:** Every image declares loading and decoding intent, only the hero
receives high fetch priority, and fonts cannot block first text. Budget increases
require measured evidence and a recorded decision; the public and production
ceilings may differ while their policy and verifier remain equivalent.

**Source:** [Performance budgets](PERFORMANCE-BUDGETS.md), roadmap Day 06 and the
mobile/offline acceptance journeys.

**Revisit when:** Real-user measurements justify a tighter ceiling, a self-hosted
font package replaces the current provider, or native shells need separate
budgets.

### QK-032 — Node.js 26 is the single supported runtime line

**Date:** 23 October 2026

**Status:** Active

**Decision:** QuestKeeper development, CI, native setup construction, private
runtime downloads and compatible system-runtime selection all require Node.js 26. QuestKeeper 1.1.3 may be branded LTS independently, but documentation must
describe Node.js 26 as Current until its scheduled upstream LTS transition on
28 October 2026.

**Why:** One major across every execution path removes misleading detection and
build differences. Moving before the upstream transition lets the release be
validated against the exact runtime it will carry, without making a false LTS
claim.

**Consequences:** `package.json`, `.nvmrc`, Actions, source launchers, the setup
wizard and native builders enforce major 26. Historical release notes remain
unchanged. Weekly ecosystem reviews verify the newest 26.x patch and reassess
the baseline only through a recorded decision.

**Source:** [Node.js 26 runtime contract](NODE-26-RUNTIME.md), official Node.js
release schedule and QuestKeeper 1.1.3 release gate.

**Revisit when:** Node.js 26 nears maintenance or end-of-life, a supported
dependency changes its runtime floor, or a newer even-numbered LTS is proven in
all native packages.

### QK-033 — Voice capture must be monitored, recoverable, and visible

**Date:** 24 October 2026

**Status:** Active

**Decision:** An active Session Scribe entry is not proof that audio is still
being captured. Every running voice session must continuously verify both the
Discord connection and Pycord recording state, attempt bounded automatic
reconnection into the same transcript, mark interruptions and recoveries in
that file, and privately notify the operator when capture stops or resumes.

**Why:** A Discord voice handshake can terminate while the bot process and its
in-memory session remain alive. Treating the session dictionary as health
silently lost roughly twenty minutes of a real game session.

**Consequences:** `/stato` reports the real capture state and recovery count;
`/ferma` also closes local workers when no voice client remains; recovery gets a
fresh audio sink but preserves the existing buffer, participant names and file.
Tests must distinguish connected, recording, wrong-channel and disconnected
states without using the network.

**Source:** Production incident logs from the 23 October 2026 session and the
[Discord Scribe guide](../discord-transcriber/README.md).

**Revisit when:** Pycord exposes a supported recording-disconnect callback with
stronger guarantees, or field evidence shows that connection/recording checks
cannot detect a class of silent audio loss.

### QK-034 — Campaign briefs derive from public evidence

**Date:** 24 October 2026

**Status:** Active

**Decision:** The game-night brief in the campaign chronicle is a derived
reading path, not a second campaign state. Each item must be built from public
campaign, session, map or character fields and link back to the record that
supports it. Protected notes, inferred secrets and unpublished drafts are never
eligible inputs.

**Why:** A player needs a fast answer to what changed, where the party is, which
personal thread matters and what remains unresolved. Duplicating those answers
would let the homepage drift away from the campaign chronicle and could expose
information that the player-facing source deliberately hides.

**Consequences:** New brief items require an evidence route and a public-data
test. Empty campaigns retain their honest pre-session state. Future automation
may suggest or rank public evidence, but cannot silently publish a new truth or
read protected character fields.

**Source:** [Game-night campaign brief](GAME-NIGHT-BRIEF.md) and
[Lantern Road demo journey](LANTERN-ROAD-DEMO.md).

**Revisit when:** A versioned campaign-state model can prove authorship,
visibility and reconciliation without duplicating or weakening the chronicle.

### QK-035 — Campaign home is a cover, not a dashboard

**Date:** 24 October 2026

**Status:** Active

**Decision:** Campaign home contains only campaign identity, one optional party
voice and a compact pulse whose four metrics link to adventurers, NPCs,
sessions and places. Story preparation belongs in the campaign chronicle;
personal reading memory belongs in the global command palette; persistent
navigation is not repeated as a card grid.

**Why:** Stacking recap, reading history, player shortcuts and route cards below
the cover made the entry point slower to scan and obscured the four destinations
players actually need. Each capability remains useful, but not at the same
level of the information hierarchy.

**Consequences:** New homepage sections require evidence that they represent
campaign identity or a primary destination. Counts are real links with visible
keyboard focus. Briefs, favourites, recent pages and utilities must live in the
focused surface that owns them instead of being duplicated on home.

**Source:** User review of the Day 07 campaign home and
[Game-night campaign brief](GAME-NIGHT-BRIEF.md).

**Revisit when:** User research shows that a missing primary destination cannot
be reached quickly through the pulse, persistent navigation or command palette.

### QK-036 — Table memories are not campaign canon

**Date:** 24 October 2026

**Status:** Active

**Decision:** Memorable out-of-character jokes and comments live in the
dedicated Around the Table page through optional `Session.tableMoments` data.
They remain visibly separate from key events, character dialogue, story prose
and cumulative recaps. Only words actually said and approved for publication
may appear as quotations.

**Why:** A campaign is also remembered through the people playing it, but
placing table talk inside the chronicle would create false canon and could
publish a real person's words without the intended context or consent.

**Consequences:** Every table moment carries a stable ID, a public speaker name,
bilingual quotation and optional context. AI may identify candidates for human
review but cannot fabricate, silently rewrite or auto-publish quotations. An
empty collection is an honest supported state.

**Source:** User experience review and [Around the Table memories](TABLE-MOMENTS.md).

**Revisit when:** The Manager gains a review workflow that can preserve an
original transcript excerpt, explicit approval and translated presentation as
separate provenance fields.

### QK-037 — Character notebooks are optional, personal artifacts

**Date:** 25 October 2026

**Status:** Active

**Decision:** Any player character may optionally own a password-gated
illustrated notebook. All notebooks share one reader and one data contract, but
each character owns separate covers, pages, reflections and art directives.
Campaign Manager supports equivalent manual and AI-assisted authoring paths.
AI planning and rendering remain separate selectable roles and return an
editable draft rather than publishing automatically.

**Why:** The first production notebook proved that an in-world artifact can
preserve a character's subjective memory better than an objective chronicle. Making the
capability reusable avoids a one-character component, while keeping it opt-in
prevents every profile from acquiring an artifact that does not fit its owner.

**Consequences:** Covers use 2:3 portrait assets, interior images are complete
3:2 spreads, and every automatic draft needs character-specific style
directives. The planner receives public character context only unless the Game
Master deliberately types additional facts into the brief. Manual editing,
remote-consent checks, review and explicit save remain available at every step.

**Source:** [Campaign content guide](CONTENT-GUIDE.md#characters),
[Manager guide](MANAGER-GUIDE.md#optional-character-notebooks) and
[design guide](DESIGN-AND-ART-GUIDE.md#personal-journals-and-notebooks).

**Revisit when:** Multiple volumes, collaborative journals or per-page access
rules become a demonstrated player need.

### QK-038 — Character profiles are derived story maps

**Date:** 25 October 2026

**Status:** Active

**Decision:** A player-character profile opens with a compact at-a-glance identity,
then progresses through personal chapters, a horizontal relationship carousel and
a known-story section immediately before the diary. The view derives its copy and
links from existing public profile, relationship, lore, notebook, quote and diary
records instead of storing a second summary model.

**Why:** The former accordion stack exposed every field but did not answer the
player's first questions, but presenting all three answers in one large opening
surface displaced the familiar summary and repeated later sections. Progressive
disclosure keeps identity immediate while placing bonds and memories beside the
artifacts that give them context.

**Consequences:** Relationship previews include both party and NPC connections in
one scrollable rail; known history links back to its supporting artifacts; missing
content receives an honest empty state. Protected profiles, sheets and GM notes
are forbidden inputs. The Day 08 quick-facts task may add compact facts but cannot
replace the opening identity summary with a statistics dashboard.

**Source:** [Character story profiles](CHARACTER-STORY-PROFILES.md).

**Revisit when:** Player testing shows that a different first question is more
important, or versioned memory data can improve the overview without creating a
competing source of truth.

### QK-039 — Relationships separate bond type, feelings and party knowledge

**Date:** 25 October 2026

**Status:** Active

**Decision:** Every relationship has one canonical bond type, while each
participant may hold any number of directional feelings with its own strength
and evidence-based reason. NPC-to-party and NPC-to-NPC relationships may appear
only as the party's current reading, labelled as observed, reported or inferred
and accompanied by the event evidence that supports it.

**Why:** A single label such as friendship or distrust describes the social
shape of a bond but cannot express mixed or asymmetric emotions. NPC networks
also become accidental Game Master spoilers when deductions are presented as
omniscient facts.

**Consequences:** Character profiles use a closable card carousel; relationship
details show one perspective card per participant and every recorded feeling.
AI-assisted note processing may propose PC-PC, PC-NPC and NPC-NPC links, but it
must preserve uncertainty, cite visible evidence and never expose private canon.
Missing feelings or uncertain links remain missing instead of being invented.

**Source:** [Character story profiles](CHARACTER-STORY-PROFILES.md) and
[campaign content guide](CONTENT-GUIDE.md#relationships).

**Revisit when:** The product gains explicit Game Master-only relationship
layers or players need to compare how the perceived relationship changed over
time.

### QK-040 — Story highlights are authored, subjective and evidence-linked

**Date:** 25 October 2026

**Status:** Active

**Decision:** Character profiles may add optional quick facts, signature items
and favourite moments. These are public authored records with stable IDs;
favourite moments always cite a typed public story source, while signature items
remain distinct from mechanical inventory.

**Why:** Small personal details make profiles worth revisiting, but deriving them
from statistics, equipment or dramatic events would turn interpretation into
false canon and repeat information already owned elsewhere.

**Consequences:** Quick facts remain inside the compact opening; items and moments
share one closable section. Manager and assisted import use the same editable
contract, and AI cannot infer preference or story significance. Day 12 equipment
storytelling and Day 17 party memories must extend these IDs and evidence links
rather than introduce competing fields.

**Source:** [Character story highlights](CHARACTER-STORY-HIGHLIGHTS.md).

**Revisit when:** Players need private favourites, per-player disagreement or a
campaign-wide memory curation workflow.

### QK-XXX — Short decision title

**Date:** YYYY-MM-DD

**Status:** Active

**Decision:** What the project will do.

**Why:** Evidence and trade-off behind the choice.

**Consequences:** Tasks, behavior, constraints and future work affected.

**Source:** Link to the authoritative artifact, issue or pull request.

**Revisit when:** Concrete evidence or date that should trigger reconsideration.
