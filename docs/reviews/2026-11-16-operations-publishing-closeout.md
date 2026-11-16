# 16 November 2026 — Operations and publishing closeout

**Plan:** UI, UX and Accessibility Quality Fortnight, 16 November

**Classification:** shared, with public-only installed-storage diagnostics

**Issue slice:** #142 catalog and diagnostics coverage for the operations console

## User journeys reviewed

| Journey                  | Outcome                                                                                                                               | Recovery boundary                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Prepare and preview      | Preparation, private preview and validation form one bounded local workflow                                                           | A failed step identifies the unchanged data and offers only the safe retry            |
| Inspect and protect data | The installed public product reports storage health, latest complete backup and protected/replaceable locations                       | Diagnostics do not reveal secrets; backup and export remain distinct actions          |
| Publish                  | GitHub and direct hosting are explained separately; FTP/FTPS fields remain together and retain their values while changing workspaces | A failed upload leaves the published site unchanged and returns to destination review |
| Adjust appearance        | Manager theme and campaign palette are visibly different scopes                                                                       | Device preference cannot silently modify campaign data                                |
| Stop services            | The existing explicit Manager/Companion/all-services chooser is reachable from the operations console                                 | Destructive shutdown remains confirmed and authenticated                              |

## Remediation

- Replaced the long setup-and-publishing stack with four keyboard-operable areas:
  Preview, Recovery, Publishing and Appearance.
- Added a compact status row that links directly to the relevant area without
  removing or re-creating unsaved publishing fields.
- Added persistent, in-context operation outcomes and a bounded final-log view;
  background failures now explain what remained unchanged and the next safe
  action instead of relying on a disappearing toast.
- Added executable installed-storage health checks for campaign readability,
  write access, ownership preparation and the latest complete backup.
- Kept full portable storage controls public-only. Production offers a selected-
  campaign export and its existing version-controlled recovery boundary instead
  of pretending to use the packaged installer layout.
- Added responsive one/two/three-column behavior, 44-pixel tabs and Arrow/Home/
  End keyboard navigation.

## Validation evidence

- Public Manager: 106 tests, including real preview startup/stop, authenticated
  shutdown, storage migration, backup health and operations-console regression.
- Production Manager: 97 tests across the adapted Manager and both campaign
  storage contracts.
- Public lint and shared strict TypeScript passed; UI catalogs, accessibility,
  quality-fortnight, custom-palette and targeted formatting checks passed in
  both repositories.
- Public installer and production deploy-safety checks passed.
- Both production campaigns passed the entity-ID audit; both applications built
  successfully and stayed within their import-graph performance budgets.
- Headless Chrome review covered wide, 768-pixel and 390-pixel layouts in
  Italian, including the hidden outcome region and horizontal tab behavior.

## Cross-cutting analysis

Operational UX follows **state → consequence → recovery**. A status without a
consequence is merely telemetry; an error without a recovery action is merely a
log. Every future update, migration, import, AI job and publication flow must
therefore answer three questions in the same viewport:

1. what state QuestKeeper is in;
2. which saved or published data changed (usually none on failure);
3. the smallest safe action that resumes the journey.

Operations are also scoped by authority. Device appearance, campaign appearance,
local preview, portable storage and production publication are different
ownership domains even when they share one Manager screen. Future work under
#99 and #113 must reuse this console model, but must not imply that a successful
connection test grants campaign publication rights.

Issue #142 remains open. This slice catalogs and tests the new operations copy
and diagnostics, but does not complete the repository-wide JSON ownership and
reviewed-exception inventory.

## Boundaries

The reusable information architecture, failure contract, accessibility behavior
and focused regression are paired in both repositories. The public template
alone owns packaged storage paths, migration preparation and full local backups.
Production keeps Phandelver, Curse of Strahd, deployment configuration and all
private media local. No campaign canon, note, transcript, credential, licensed
text or protected media crossed repositories.
