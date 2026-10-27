# Wide-layout regression matrix

QuestKeeper's Manager and Companion shells are checked at the following desktop widths before release:

| Viewport    | Manager focus                                      | Companion focus                         |
| ----------- | -------------------------------------------------- | --------------------------------------- |
| 1366 × 768  | Sidebar, library actions, dialogs                  | Command bar, hero, two-column pages     |
| 1920 × 1080 | Adaptive card grids, readable forms                | Centered route shell, media balance     |
| 2560 × 1440 | Maximum workspace width, no stretched forms        | Bounded page content and readable prose |
| 3440 × 1440 | Centered ultrawide gutters, no horizontal overflow | Centered command bar and route content  |

Automated guardrails live in `tools/campaign-manager/tests/wide-layout.test.mjs`. A release review should also inspect the Campaign Library, one campaign editor, the campaign selector, and one campaign home at every width above. Long custom ruleset labels and campaigns without cover art are required fixtures.
