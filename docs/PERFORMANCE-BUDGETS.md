# Performance budgets

**Roadmap:** Day 06, commit 2  
**Applies to:** Player and Game Master Companion journeys

QuestKeeper treats speed as a product constraint. `npm run build` is followed by
`npm run test:performance`, which measures the generated application rather
than trusting source-file estimates.

## Guarded budgets

- The generated HTML plus initial JavaScript and CSS must stay within the
  repository-specific byte and request limits in `performance-budgets.json`.
- No initial asset or deferred JavaScript chunk may exceed its explicit ceiling.
- Optimized demo, thumbnail and display images stay below 400 KB each.
- Every rendered `<img>` declares loading and async decoding behavior. The
  campaign hero is the sole high-priority image.
- Web fonts use local fallbacks immediately, `display=swap`, preconnected font
  origins and a non-blocking stylesheet request with a no-script fallback.

The production repository has a higher initial-byte allowance because it ships
the private campaign compendium; it follows the same measurement method and
image/font policy. A larger campaign is not permission to remove the ceiling.

## Changing a budget

Optimize first. If a deliberate user-facing capability still needs more room,
record the measured before/after values and the reason in the decision log and
sync ledger. Never raise a threshold merely to make CI green.
