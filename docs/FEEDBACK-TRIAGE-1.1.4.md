# QuestKeeper 1.1.4 field-feedback triage

**Date:** 25 October 2026  
**Release observed:** 1.1.4 Seamkeep LTS  
**Status:** Open backlog; fixes are scheduled alongside, not instead of, the
two planned daily tasks.

## Triage principles

- Reproduce and fix one issue per commit and pull request.
- Keep **Resolved in version: Not yet** until a downloadable containing release
  is smoke-tested.
- Treat `reported-in:1.1.4` as observation context, not proof that 1.1.4
  introduced the defect.
- Deliver `shared` behavior in the public and production repositories together.
- Keep campaign canon, private conversations, credentials and licensed rules
  text out of the public tracker.
- Review issue dependencies during the weekly plan review so completed work can
  reorder or simplify later tasks.

## Immediate regressions and safety work

| Issue                                                                         | Outcome                                            | Why first                                        |
| ----------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| [#19](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/19) | Fix Windows `spawn EINVAL` when starting Companion | Blocks a primary packaged workflow               |
| [#20](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/20) | Allow AI setup to be deferred                      | Optional setup currently hijacks unrelated work  |
| [#21](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/21) | Render modal errors above the backdrop             | Validation exists but its result is inaccessible |
| [#23](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/23) | Make installation and campaign-data lifecycle safe | Parent data-loss-prevention outcome              |
| [#24](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/24) | Separate mutable user data from replaceable files  | Prevents update/removal mistakes                 |
| [#25](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/25) | Expose paths, backups and clean setup completion   | Makes the storage contract understandable        |

## Manager and campaign-authoring workflow

- [#22](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/22)
  removes the duplicate edition input and generates campaign IDs automatically.
- [#26](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/26)
  adds pronouns without overloading ruleset sex/gender data.
- [#27](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/27)
  extends the released translation review contract to entities and explicit
  batches.
- [#28](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/28)
  unifies Manager/Companion navigation, readiness and shutdown controls.
- [#29](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/29)
  adds a visual Campaign Library home.
- [#30](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/30)
  exposes system and edition to Companion readers.

## Presentation and responsive experience

- [#31](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/31):
  accessible custom Companion palettes.
- [#32](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/32):
  separate local Manager themes and clearer palette scope.
- [#33](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/33):
  correct loading, failure and stale-image behavior in the shared lightbox.
- [#34](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/34):
  desktop/1440p/4K/ultrawide layout audit for both surfaces.
- [#38](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/38):
  semantic mood inheritance for campaign phases and recap blocks.
- [Production #5](https://github.com/mtamagno/campaign-companion/issues/5):
  campaign-only darker Curse of Strahd treatment after the published mist
  threshold, without future spoilers.

## License-safe compendium track

- [#35](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/35)
  is the parent architecture and licensing outcome.
- [#36](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/36)
  researches authoritative redistributable baseline material before importing
  any rules data.
- [#37](https://github.com/mtamagno/questkeeper-rpg-campaign-manager/issues/37)
  adds local custom compendium authoring/import with private-by-default
  publishing.

## Feedback intentionally not reopened

- Advanced identity mode and generated entity IDs are already available through
  resolved issue #14. The new gap is campaign ID generation, tracked by #22.
- Switching campaign creation between D&D 2014 and 2024 was retested by the
  reporter and worked; no bug was opened.
- Equal character and NPC display names are supported because stored IDs are
  independent and campaign-wide unique; no bug was opened.
- Campaign-level reviewed translation shipped under #9. The remaining entity
  and batch scope is tracked separately by #27.
- Repeated HTTP 400 screenshots came from repeated invalid campaign submissions;
  evidence currently supports the hidden-error issue #21, not a separate retry
  storm. Reopen that analysis if one user action can reproduce multiple requests.

## Weekly review contract

At weekly review, check new evidence, dependencies, severity and whether a fix
changes later roadmap work. Closed implementation PRs remain unresolved until a
released artifact is verified and receives its `resolved-in:x.y.z` label.
