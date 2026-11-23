# Day 18 — Notebook chronology, filters and campaign authority

**Date:** 23 November 2026  
**Status:** implemented; #120 awaits a containing release  
**Classification:** shared

## Task 1 — Notebook contents and chronology

- Added a compact collapsible contents panel inside the lazy Journal reader.
- Added authored/oldest/newest ordering with undated pages kept stable.
- Preserved front/back covers and authored order when no filter is active.
- Added optional `recordedAt` evidence to page schema and Manager authoring.

## Task 2 — Mood, session, character and secrecy filters

- Added authored metadata and filter controls without inferring it from prose.
- Added localized labels, empty state and current-page metadata chips.
- Added Manager manual fields and conservative AI draft defaults.
- Backfilled Shyra only in production; the public demo uses original entities.

## Issue #120 — Campaign-scoped authority model

- Added a versioned schema and pure capability model.
- Covered owner, GM, editor, player, viewer, anonymous and local-only cases.
- Added revocation, expiry, transfer acceptance/cancellation/expiry and audit.
- Added legacy `unclaimed` state and privacy-safe public projection.
- Added focused tests and architecture documentation.

## Future impact

See `docs/reviews/2026-11-23-notebook-authority-closeout.md`. Day 19/20 must
reuse stable evidence IDs and secrecy. #121-#124 consume the authority contract
without duplicating its matrix or treating client state as server security.
