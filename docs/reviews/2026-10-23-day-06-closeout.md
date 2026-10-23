# Day 06 closeout — remembered, accessible and measured journeys

**Date:** 23 October 2026

**Classification:** shared, with public-only release packaging

**Work reviewed:** overdue Day 05 reading memory plus both scheduled Day 06 tasks

**Explicitly not started:** Day 07 richer Lantern Road journey

## Combined journey reviewed

A Player can resume or favourite public campaign pages, move through the shell
with a keyboard or assistive technology, and reach content without paying a
silent loading penalty. A Game Master receives the same behavior in the private
production campaigns without protected prose entering local history or the
public template.

## Gaps found and closed

- Recent and favourite pages are bounded, campaign-aware URL/title metadata;
  protected body content and campaign-home noise are never stored.
- Route changes now announce the destination and focus its heading, while the
  initial page load leaves the user's focus alone.
- The mobile menu and every shared dialog contain and restore focus; production
  review also removed 28 implicit legacy button types.
- Fonts render with immediate fallbacks and swap asynchronously. Images declare
  loading/decoding intent, with high priority reserved for the campaign hero.
- Production-build budgets now fail on excessive initial bytes/requests, large
  chunks or oversized generated derivatives.

## Measured evidence

| Target     | Initial path | Initial assets | Largest deferred JS | Governed images |
| ---------- | ------------ | -------------- | ------------------- | --------------- |
| Public     | 405,466 B    | 11             | 459,176 B           | 10              |
| Production | 1,916,871 B  | 12             | 727,941 B           | 1,030           |

Focused tests, strict TypeScript and production builds passed in both targets.
The production build validated 292 Phandelver and 40 Curse of Strahd source
images before measuring their generated display and thumbnail derivatives.

## Continuity and downstream impact

- Day 07 may enrich the demo journey, but must reuse the versioned journey
  memory and remain within the public initial-load ceiling.
- Every future routed page needs one meaningful `h1`; every future overlay uses
  the shared focus helper.
- Image-heavy story, map and campaign-book work must use generated derivatives,
  explicit lazy loading and evidence before changing a budget.
- Cross-device profiles may later migrate favourites, but cannot silently sync
  local reading history or protected content.
- QuestKeeper 1.1.3 packages these contracts as the first LTS release; the tag
  remains immutable and future critical fixes receive a new patch version.

## Release-time runtime re-plan

Before tagging, the supported runtime moved from Node.js 24 to Node.js 26 across
source launchers, CI, native setup construction and private/runtime reuse. This
was an explicit release-gate re-plan, not Day 07 work. Validation uses the
official Node.js 26.12.1 archive and checksum. On this review date Node.js 26 is
still Current upstream and is scheduled to enter Active LTS on 28 October 2026;
the QuestKeeper LTS channel and the Node.js lifecycle are documented separately.
