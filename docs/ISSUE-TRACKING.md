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

## Research readiness and epic promotion

An issue labelled `needs-research` is a research task, not an implementation-
ready feature. Its next useful outcome is a documented decision based on current
primary or authoritative sources, existing QuestKeeper contracts and relevant
user evidence.

The research must record:

1. the user problem and why it matters now;
2. evidence, source dates and any uncertainty that remains;
3. affected journeys, repositories, data, privacy, licensing and accessibility;
4. viable approaches, dependencies, risks and explicit non-goals;
5. a recommendation with testable exit criteria;
6. one of these dispositions: `no action`, `ready as one issue`, `split into
linked issues`, or `promote to epic`.

Promote the work to an epic when several independently deliverable capabilities
must land in a deliberate sequence, different owners or milestones are useful,
or the parent outcome cannot be verified honestly in one atomic change. The
epic must describe the user-visible outcome, non-goals, dependency order, exit
criteria and a linked checklist of child issues. Each child owns one coherent
result and links back to the epic. Do not create an epic merely to make a small
issue look larger.

After research, remove `needs-research` only when the disposition and next
action are explicit. A low-priority or future-horizon issue remains unscheduled
until a weekly review deliberately promotes it; research completion alone does
not move it into the active roadmap.

## Labels

- `reported-in:x.y.z`: version in which the feedback was observed;
- `resolved-in:x.y.z`: first verified published version containing the fix;
- `shared`, `public-only`, `campaign-only`: dual-repository delivery class;
- `area:*`: primary product area;
- `epic`: a user outcome intentionally split into linked issues;
- `needs-research`: a decision or compatibility matrix must be completed before
  implementation is ready; follow the research and epic-promotion rule above.

Never include API keys, passwords, private campaign notes, transcripts,
licensed rulebook text or protected media in an issue. Use the smallest safe
reproduction and describe licensed material rather than copying it.
