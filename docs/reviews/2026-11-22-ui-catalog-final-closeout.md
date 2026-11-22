# 22 November 2026 — UI catalog final closeout

## Outcome

Issue #142 is source-complete. Product interface copy for the remaining shared
homepage, command bar, guided tour, audio/loading states, offline pack and
character PDF surfaces now comes from the versioned JSON registry.

## Ownership boundary

- Product labels, accessible names, help, state and recovery messages belong to
  `src/app/guild/i18n/ui.json`.
- Campaign prose and dates retain their campaign content locale.
- Baseline compendium fields, built-in ruleset labels and compact game-rule
  abbreviations are authored data. Their exact reviewed exceptions are guarded
  by `UI-TEXT-DATA-OWNED` markers.

The production Companion additionally reviews its local `src/app/arcana/**`
tree as a protected authored-data prefix. No production rules text or campaign
content is copied into this repository.

## Enforcement

`test:ui-texts` now validates schema version, canonical locale tags, fallback
cycles, complete key and placeholder parity, deployment/campaign overrides,
missing-key diagnostics, literal template copy and unreviewed TypeScript or
template language branches. It scans tracked files and new non-ignored files.

## Release state

The completed catalog measures 507,936 initial bytes in public and 556,082 in
production. The respective initial-load ceilings move narrowly to 509,000 and
557,000 bytes; the largest-initial-asset ceilings move to 370,000 and 411,000
bytes because the registry is part of the shared locale-resolver chunk. Request,
deferred-script and generated-image ceilings remain unchanged.

The implementation is ready for the next QuestKeeper release. Per the issue
tracking policy, #142 remains open with `status:awaiting-release` until that
artifact is published and verified.
