# Guided live-demo tour

QuestKeeper now offers a five-stop walkthrough that helps a first-time visitor
understand the player-facing Companion without turning the interface into a
blocking tutorial.

## User outcome

- A player can move from campaign choice to party, story and places in about two
  minutes.
- A Game Master sees the same player journey with copy that explains what their
  group will experience.
- Progress survives a refresh and can be paused, resumed or restarted.
- The visitor remains in control of campaign choice and spoiler consent.

This deepens Game Night goals `GN-01` and `GN-07`, player journey `P-01` and GM
journey `GM-01` after the first-visit role choice.

## The five stops

| Stop | Destination          | What it teaches                                                                 |
| ---- | -------------------- | ------------------------------------------------------------------------------- |
| 1    | Campaign ledger      | What the tour covers and how the selected Player/GM path changes guidance only. |
| 2    | Chosen campaign home | How to understand the campaign pulse and immediate next actions.                |
| 3    | Party                | Where identity, relationships, memories and progression live.                   |
| 4    | Story so far         | How to recover the shared narrative after time away.                            |
| 5    | Places               | How maps reconnect locations, journeys and session memories.                    |

The visitor chooses the campaign through the ordinary card and spoiler dialog.
The tour never grants consent, fabricates access or silently picks a campaign.
If the visitor navigates elsewhere, the guide offers a clear return to the
remembered stop instead of forcing a redirect.

## Progress contract

`GuidedTourService` validates and stores this versioned local state under
`campaign-companion:guided-demo-tour-v1`:

- status: `idle`, `active`, `paused` or `completed`;
- current zero-based step;
- campaign ID only after the visitor explicitly enters one.

Malformed or obsolete state falls back to a clean idle tour. **Continue later**
preserves the exact stop. Opening a completed tour starts a fresh walkthrough.
Choosing **Change path** clears tour progress as well as the previous role so a
new Player/GM journey never resumes with stale context. No progress leaves the
browser and it is not an identity, analytics signal or permission boundary.

## Entry points and accessibility

- The selected first-visit path shows a prominent two-minute tour action.
- Before a path is chosen, the persistent command bar returns the visitor to
  the Player/GM choice instead of silently assuming a role.
- Once a path exists, the command bar can start, resume, restart or refocus the
  active tour from any page and exposes that state in its label.
- The guide is a non-modal complementary region, so the underlying page remains
  readable and interactive.
- Step changes are announced politely; progress has native progressbar
  semantics; opening moves keyboard focus into the guide.
- Escape or **Continue later** pauses instead of discarding progress and returns
  focus to a tour launcher.
- Mobile uses a compact bottom sheet and animation respects reduced-motion
  preferences.

## Verification

Run `npm run test:guided-tour` for the persistent-state, route-recovery,
bilingual-copy and accessibility contract. It is also part of `npm run verify`.

Manual review covers a clean Player journey, a clean GM journey, pause/refresh/
resume, route deviation and recovery, spoiler cancellation, 360 px layout and
keyboard-only completion.

## Downstream impact

- PWA installation and offline work must preserve this versioned local state and
  make every tour destination recover gracefully when unavailable.
- Future navigation and continue-reading features may offer stronger shortcuts,
  but must not make the tour a prerequisite for using the Companion.
- The richer Lantern Road demo and the chronicle game-night brief reuse the
  same five-stop destinations and evidence routes. Campaign home remains the
  concise campaign identity and navigation stop; deeper recap material belongs
  to the Story destination without silently changing the tour contract.
