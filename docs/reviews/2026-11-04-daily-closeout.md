# Daily closeout — 4 November 2026

## Date and scope

- **Scheduled task 1:** inventory the sticky command bar by frequency, context
  and screen size.
- **Scheduled task 2:** simplify its responsive hierarchy and overflow while
  preserving campaign switch, recovery and quick navigation.
- **Issue slot:** #118, high priority because it closes the dependency chain of
  the active dynamic-locale epic #112.
- **Issue outcome:** one-, two- and N-target manual/local/remote translation
  planning, capability preflight, per-target review and recoverable partial
  failure.
- **Issue still open:** yes. Implementation is complete locally; the issue
  remains open until its containing release and public/Phandelver/Strahd smoke
  tests assign a resolved version.
- **Classification:** shared.
- **Explicitly out of scope:** 5 November User Settings restructuring, 6
  November broad accessibility/performance work, release tagging and any
  future-dated feature.

## Delivery boundaries

- [x] Both scheduled tasks came from the 4 November focus-week plan.
- [x] #118 was current-milestone work already ordered after #115–#117.
- [x] No needs-research issue was treated as implementation-ready.
- [x] No future-dated task was borrowed.
- [x] #118 remains visibly open pending release and smoke evidence.

## Combined journey

- [x] Campaign-defined content locales remain independent from EN/IT interface
      chrome and work with one, two or N registered tags.
- [x] Continue reading, My Character and quick navigation remain primary while
      campaign switch and tools remain reachable through one overflow.
- [x] Clean, missing, remembered, partial-failure, retry and guarded-apply states
      have focused automated coverage.
- [x] Keyboard names/states, Escape focus recovery, outside dismissal and
      40/48 px target contracts have source-level regression coverage.
- [x] Completed Phandelver and active Curse of Strahd build without campaign
      data changes; the public example remains redistribution-safe.
- [ ] 360 px, 768 px, desktop and 200% zoom screenshots are pending because the
      browser access host was unavailable.

## Cross-cutting analysis

The locale work and shell audit reinforce the same ownership boundary:
campaign-authored content follows each campaign's registry, while persistent
interface preferences belong in User Settings and transient navigation stays in
the command bar. No translation target, notebook position or active Sheet/
Journal workspace becomes a global shortcut or saved setting.

The combined pass found and corrected desktop action flattening, incomplete
overflow dismissal and competing palette/overflow state. The translation flow
keeps exact provider/model/field disclosure and human apply boundaries. No
campaign prose was sent to a provider during verification.

Production's denser route inventory makes its initial path 2,006,498 bytes. Its
ceiling moves by 1,000 bytes (about 0.05%); request, deferred-script and image
budgets remain unchanged, and the public build stays within its existing
ceiling.

## Continuity

- **Prior constraints:** QK-067 keeps navigation separate from durable
  preferences; QK-068 requires the 2 + 1 + 1 closeout; QK-070 makes campaign
  locales registry-owned and interface language independent.
- **Decision added:** QK-071 defines a frequency-based global command hierarchy
  and one responsive overflow.
- **Future tasks constrained:** 5 November User Settings owns language, audio
  and My Character editing; 6 November must complete the live visual matrix and
  actual-browser focus pass; Day 37 health reporting must consume per-target
  translation states rather than one aggregate flag.
- **Runtime finding:** the local shell currently resolves Node 24.15.0 and the
  portable public runtime is 24.22.0, while the repository contract is Node 26.
  The 7 November dependency/runtime review must restore a supported validation
  runtime instead of weakening the declared engine range.
- **Future-dated task moved early:** No.

## Evidence

- Public Manager suite: 100 passing tests plus redistributable compendium
  baseline.
- Production Manager suite: 91 passing tests.
- Public ESLint and strict TypeScript; production strict TypeScript.
- Command palette, mobile layout, accessibility, journey memory, My Character,
  guided tour and PWA guards in both repositories.
- Both production builds, 361 source images and campaign-wide entity IDs.
- Public and production performance budgets after the documented production
  rebaseline.
- Browser/responsive review: blocked by unavailable browser access host; no
  screenshot evidence claimed.
- #118 commits: public ac2f0c7; production 6ba0051.
- Task 1 commits: public 6cd754f; production 678928a.
- Task 2 commits: public 60662b5; production 5eefc79.
- Deployment: not started; branches remain local until the coordinated
  push/PR cycle.
