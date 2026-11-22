# 22 November 2026 — campaign memory gallery closeout

## Outcome

The Day 17 roadmap work closes the gap between isolated shared-memory links and
a discoverable party archive. Readers can now favourite a memory and browse all
campaign memories by person, session or favourite state.

## Cross-cutting analysis

The implementation deliberately reuses two existing authorities:

- relationship `sharedMemories` remain the only campaign-content source;
- Journey Memory remains the only local route-favourite store.

This prevents a third chronology from competing with relationship history and
the Character Journal. The next roadmap day should add its table of contents and
chronology inside the lazy Journal workspace, then link outward to stable memory
IDs. Mood and secrecy are presentation filters over authored metadata, never
automatic claims inferred from prose.

## Acceptance evidence

- The route and sidebar expose one campaign-wide gallery.
- Participant and session filters are generated from referenced data only.
- Favourite choices stay local and campaign-scoped.
- Empty campaigns and empty filtered results remain readable.
- UI copy is registry-owned in every interface locale.
- The public original demo and both production campaigns use the same reusable
  contract without moving production canon upstream.

The additional registry copy measures 494,157 initial bytes in public and
541,298 in production. Public extraction creates one 1,977-byte shared locale-
resolver chunk (15 initial requests); production remains at 14. The initial
ceilings move narrowly to 495,000 and 542,000 bytes, while image and deferred-
script ceilings remain unchanged. The public catalog chunk measures 341,026
bytes, so its asset ceiling moves narrowly from 341,000 to 342,000 bytes.

## Follow-up

Issue #142 receives a focused catalog-enforcement slice in the same daily
delivery. Day 18 must reuse this evidence graph and must not add a competing
memory or favourite model.

That slice now scans both tracked templates and new non-ignored templates in
the working tree. A newly created page therefore cannot evade the zero-inline-
copy audit merely because it has not yet been staged; ignored maintainer-only
files remain outside the public verification boundary.
