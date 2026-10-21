# Issue and release traceability

QuestKeeper records where feedback was observed and where its resolution first
became available. This applies to bugs, regressions and enhancement requests:
the reported version describes the product context, not an admission that the
behavior was introduced by that release.

## Required issue metadata

Every actionable issue must include:

- **Reported in version:** the released version used by the reporter, or
  `Unreleased / unknown` when it cannot be established;
- **Resolved in version:** `Not yet` while the issue is open;
- **Classification:** `shared`, `public-only` or `campaign-only`;
- reproduction evidence or user outcome, scope boundaries, dependencies and
  testable acceptance criteria;
- an area label and a `reported-in:x.y.z` label when a release is known.

Do not use “reported in” as “caused by.” When a report spans several concerns,
keep one parent issue for the user outcome and link independently deliverable
child issues. Record blocking relationships in both directions.

## Resolution rule

An implementation commit or pull request must reference the issue, but that
alone does not set the resolved version. Keep **Resolved in version: Not yet**
until all of the following are true:

1. the acceptance criteria and required public/production compatibility checks
   pass;
2. the fix is contained in a published, downloadable release;
3. the released artifact—not only the source branch—has been smoke-tested.

Then update the issue body to the first containing version, add the
`resolved-in:x.y.z` label, link the release and verification evidence, and close
the issue. If a fix is reverted, reopen the issue and remove the resolved label
until a new containing release is verified.

## Labels

- `reported-in:x.y.z`: version in which the feedback was observed;
- `resolved-in:x.y.z`: first verified published version containing the fix;
- `shared`, `public-only`, `campaign-only`: dual-repository delivery class;
- `area:*`: primary product area;
- `epic`: a user outcome intentionally split into linked issues;
- `needs-research`: a decision or compatibility matrix must be completed before
  implementation is ready.

Never include API keys, passwords, private campaign notes, transcripts,
licensed rulebook text or protected media in an issue. Use the smallest safe
reproduction and describe licensed material rather than copying it.
