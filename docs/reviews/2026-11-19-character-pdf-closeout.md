# 19 November 2026 daily closeout

## Classification

Shared delivery, paired with the production Campaign Companion.

## Planned outcomes

- [x] Generate complete fantasy character dossiers.
- [x] Add print, public-share and compact game-night PDF variants.

## Issue slice

Issue #139 advances through the export journey: selector labels, descriptions,
privacy guidance, errors and accessible names now come from the single JSON UI
catalog. The issue stays open because other Character and Sheet surfaces still
contain product-owned inline copy.

## Cross-cutting analysis

The four formats must remain outcomes, not arbitrary layout presets. Complete
is the archival bridge toward campaign books; Print is the durable mechanical
record; Share is an allowlisted public narrative; Game Night is a compact
snapshot. This distinction prevents later AI, book and live-session features
from creating competing story stores or weakening the privacy boundary.

The initial implementation exposed a stylesheet-budget failure. Extracting the
chooser into a focused component fixed the architecture and preserved the
budget instead of normalising growth. Future dense sheet additions should use
the same component boundary and progressive-disclosure rule.

The catalog-owned bilingual chooser then measured 468,755 public initial bytes
and 515,915 production bytes: 2,755 and 2,915 bytes above the previous baselines.
The total and largest-initial ceilings therefore move by exactly 3,000 bytes in
each repository. Request, image and deferred-script limits stay unchanged; an
attempted deferred block was rejected because its runtime cost was larger.

## Compatibility and privacy

- Public and production behavior are paired.
- Production validates completed Phandelver and active Curse of Strahd.
- The public template contains no production canon, transcripts, credentials,
  private notes, source PDFs or protected media.
- The generator contract accepts no private profile, password or notebook.

## Evidence

- Dedicated four-format and privacy-boundary regression in both repositories.
- Strict TypeScript, UI-catalog parity, accessibility, mobile, sheet-workspace,
  entity-ID, build and performance gates in the final daily verification.
