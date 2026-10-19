# First-visit paths

QuestKeeper now gives a new visitor two clear starting points before presenting
the campaign ledger. This is a lightweight orientation choice, not an account,
role system or authorization boundary.

## User outcome

- A player immediately understands that the Companion is where they recover a
  campaign, character, relationships and recent events.
- A Game Master immediately understands that Campaign Manager edits local files
  through guided forms and can open its safe public demo.
- Either visitor can change the choice at any time.
- The choice stays on the current device and never changes campaign access.

This delivers Game Night goals `GN-01` (understand the product) and `GN-07`
(preserve trust), player journey `P-01` and the opening of GM journey `GM-01`.

## Interaction contract

On a clean first visit, the campaign selector presents two keyboard-accessible
choices in English or Italian:

1. **Player** remembers the player path and moves to the campaign ledger.
2. **Game Master** remembers the GM path and reveals an explicit action to open
   Campaign Manager.

Returning visitors see a compact summary with the relevant next action and a
visible **Change path** control. `first-visit-audience` is stored through the
same local preference mechanism used elsewhere in the Companion. Only
`player`, `gm` or `null` are accepted.

Campaign spoiler consent, protected profiles and every other permission remain
separate systems. Clearing browser storage also clears the orientation choice.

## Accessibility and responsive behavior

- Both paths use native links or buttons with visible keyboard focus.
- The choice is explained in text; icons are decorative.
- Desktop presents two equal cards; narrow screens stack them in reading order.
- The selected-state actions maintain the shared 44 px control target.
- Motion and contrast continue to follow the shared design-system preferences.

## Verification

Run `npm run test:first-visit` to verify the two journey markers, bilingual copy,
local-only disclosure, reset, destinations and focus contract. The check is
part of `npm run verify` in the public template.

The [guided live-demo tour](GUIDED-DEMO-TOUR.md) reads this preference only to
choose its opening and closing guidance. It does not hide features or treat the
value as identity or authorization.
