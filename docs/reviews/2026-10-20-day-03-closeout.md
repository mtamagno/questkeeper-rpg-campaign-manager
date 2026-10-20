# Day 03 closeout — first visit and guided tour

**Date:** 20 October 2026  
**Classification:** shared  
**Scheduled work reviewed:** first-visit Player/GM paths and remembered guided
demo tour  
**Explicitly not started:** Day 04 PWA installation and offline cache

## Combined journey reviewed

The two Day 03 features were walked as one experience rather than as separate
deliveries: clean visitor, Player and GM choices, tour launch from the landing
page and command bar, pause/resume, role change and keyboard exit.

## Gaps found and closed

- A clean visitor could start the command-bar tour before choosing Player or
  Game Master, causing Player copy to be assumed. The action now returns to and
  focuses the role choice.
- Changing role preserved the previous tour's step and campaign. **Change
  path** now resets that progress so the new journey begins with clean context.
- The GM card promised to open the Manager before it actually did. Its label
  now says that it chooses the GM path; the resulting summary owns the explicit
  Manager action.
- Opening, pausing and completing the guide did not manage keyboard focus. The
  tour now receives focus when opened and restores it to a launch control when
  dismissed.
- The command-bar action now distinguishes start, active, paused and completed
  states in visible and accessible labels.

## Continuity and downstream impact

- QK-016 still owns role orientation and QK-019 still owns the non-modal tour;
  the refinement makes their boundary explicit instead of creating a third
  state system.
- Day 04 PWA and offline work must preserve both local keys and the clean reset
  relationship between them. It was not started during this closeout.
- Day 05 navigation may reuse the Tour command, but must preserve its clean-
  visitor redirect and active-panel refocus behavior.
- Day 06 accessibility work inherits the focus contract and should expand it,
  not reintroduce an unmanaged non-modal region.

## Evidence

The guided-tour contract guard now checks role-change reset, clean-visitor
routing, a focusable guide and focus restoration. Full verification and browser
review are recorded with the paired delivery commits.
