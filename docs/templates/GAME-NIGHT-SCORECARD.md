# Game Night Edition Validation Scorecard

Use one copy per validation round. Keep participant records anonymous and never
include private campaign material.

**Release/build:** _TBD_

**Test date:** _YYYY-MM-DD_

**Facilitator:** _TBD_

**Campaign fixture:** _Public demo or original consented fixture_

**Acceptance contract:**
[Player and GM journeys](../GAME-NIGHT-ACCEPTANCE-JOURNEYS.md)

## Participants and environments

| Label | Perspective | Familiarity     | Device/viewport | Input                      | Notes |
| ----- | ----------- | --------------- | --------------- | -------------------------- | ----- |
| P01   | Player / GM | New / returning |                 | Touch / pointer / keyboard |       |

Do not record names, contact details or unrelated personal characteristics.

## Goal results

Use `PASS`, `AT RISK`, `FAIL` or `NOT TESTED`. Link evidence rather than pasting
private notes into this document.

| Goal                   | Required threshold                                                                   | Result | Status     | Evidence/follow-up |
| ---------------------- | ------------------------------------------------------------------------------------ | ------ | ---------- | ------------------ |
| GN-01 — Understand     | ≥4/5 succeed in under 2 minutes                                                      |        | NOT TESTED |                    |
| GN-02 — Resume         | ≥4/5 answer all four context questions in under 5 minutes                            |        | NOT TESTED |                    |
| GN-03 — Retrieve       | Each item in ≤3 actions and ≥90% task success                                        |        | NOT TESTED |                    |
| GN-04 — Continue       | All supported preferences survive restart and expose reset                           |        | NOT TESTED |                    |
| GN-05 — Read anywhere  | No blocked primary journey, overflow or keyboard trap; saved essentials work offline |        | NOT TESTED |                    |
| GN-06 — Publish safely | ≥4/5 complete unaided and recovery always succeeds                                   |        | NOT TESTED |                    |
| GN-07 — Preserve trust | No undisclosed transfer or false privacy claim; transcription requires consent       |        | NOT TESTED |                    |

## Observations

Record behavior before interpretation.

| Participant | Expected outcome | Observed result | Time/actions | Assistance                   | Confusion or quote |
| ----------- | ---------------- | --------------- | ------------ | ---------------------------- | ------------------ |
|             |                  |                 |              | None / prompt / intervention |                    |

## Journey results

| Journey | Environment                       | Time/actions | Assistance | Status     | Evidence/follow-up |
| ------- | --------------------------------- | ------------ | ---------- | ---------- | ------------------ |
| P-01    | First visit / desktop             |              |            | NOT TESTED |                    |
| P-02    | Desktop and 360 px                |              |            | NOT TESTED |                    |
| P-03    | Returning visit                   |              |            | NOT TESTED |                    |
| P-04    | Desktop keyboard and pointer      |              |            | NOT TESTED |                    |
| P-05    | Returning visit                   |              |            | NOT TESTED |                    |
| P-06    | 360 px / offline                  |              |            | NOT TESTED |                    |
| P-07    | First visit                       |              |            | NOT TESTED |                    |
| GM-01   | First visit / desktop             |              |            | NOT TESTED |                    |
| GM-02   | Local manager                     |              |            | NOT TESTED |                    |
| GM-03   | Local manager / preview           |              |            | NOT TESTED |                    |
| GM-04   | Local manager                     |              |            | NOT TESTED |                    |
| GM-05   | Manual and Scribe paths           |              |            | NOT TESTED |                    |
| GM-06   | Clean export/import target        |              |            | NOT TESTED |                    |
| E2E-01  | Mixed desktop, 360 px and offline |              |            | NOT TESTED |                    |

## Accessibility and resilience checks

- [ ] Primary journeys checked at 360 px.
- [ ] Primary journeys checked on desktop.
- [ ] Keyboard order and visible focus checked.
- [ ] Zoom/reflow and text contrast checked.
- [ ] Reduced-motion preference checked.
- [ ] Saved essentials checked without a network connection.
- [ ] Empty, invalid and recovery states checked.

## Decision

**Round result:** _PASS / AT RISK / FAIL_

**What the evidence says:** _TBD_

**Highest-priority correction:** _TBD_

**Owner and review date:** _TBD_

### Release exceptions

| Goal | Reason | User impact | Owner | Follow-up date |
| ---- | ------ | ----------- | ----- | -------------- |
|      |        |             |       |                |

An unmet threshold without a recorded exception keeps the release gate closed.
