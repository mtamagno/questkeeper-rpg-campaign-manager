# 11 November 2026 — Maps and illustrated-memory closeout

**Classification:** shared  
**Issue:** [#140](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/140)  
**Status:** complete

## User outcomes

- The atlas can be searched by localized name, region or description and filtered
  by exploration progress without changing campaign-authored data.
- Result counts, no-match recovery and explicit empty states keep both small and
  mature campaigns understandable.
- Location pages expose a stable return path plus previous/next atlas entries,
  while long descriptions, discoveries and media remain in focused sections.
- Gallery collections are countable and independently collapsible. Party and
  group images open first; larger NPC, session and minor-NPC collections stay
  compact until requested.
- Every thumbnail is a native button and the lightbox retains focus trapping,
  keyboard navigation, loading/error announcements, retry and focus restoration.
- Product-owned map, gallery and lightbox copy now lives in the unified
  data-defined UI registry. Campaign names, descriptions, discoveries, captions
  and other canon remain authored campaign data.

## Compatibility boundary

The reusable components, catalog keys and focused regression guard are paired in
the public template and production repository. The public example remains the
only upstream fixture. Phandelver and Curse of Strahd data, prose and media stay
production-only and are read without schema migration.

## Evidence

The final cross-repository gate covered the public example, completed
Phandelver and active Curse of Strahd after both daily tasks were present:

- targeted formatting and strict TypeScript;
- UI catalog, accessibility, lightbox and map/gallery quality guards;
- public demo plus both production campaign builds and entity-ID validation;
- import-graph performance budgets;
- responsive visual review of atlas, location, gallery and lightbox states.

Strict TypeScript, catalog parity, accessibility, lightbox lifecycle, the new
map/gallery guard, entity IDs, both builds and import-graph budgets pass. Chrome
reviewed the Strahd atlas at desktop, a location at tablet width, the 277-image
Phandelver gallery at 390 px, the public gallery at desktop and its open
lightbox. That review caught and fixed undersized SVG/lightbox rendering.

The complete map/gallery catalog adds 5,419 raw initial bytes in production and
5,480 in the public template (about 1.1-1.2%). This is the measured cost of
keeping every interface locale immediately available without a language flash.
The initial-byte ceilings move to 479,000 and 461,000 respectively; production's
catalog-bearing initial chunk also moves from 314,000 to 321,000. Request,
deferred-script and image limits remain unchanged.

The weekly health check ran on Node 26.13.0. Both repositories report the same
available patch updates for Angular 21, `basic-ftp` and `tslib`; the public
toolchain also has ESLint patch updates. Angular 22 and TypeScript 7 are major
upgrades, so none of these were mixed into the UI/accessibility delivery. They
remain inputs to the dedicated maintenance review rather than silent drift.
