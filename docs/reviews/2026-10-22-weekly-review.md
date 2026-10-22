# Weekly product and ecosystem review — 2026-10-22

**Owner:** Marco Tamagno

**QuestKeeper release under review:** 1.1.2

**Evidence date:** 22 October 2026

## Outcome

Field feedback from 1.1.2 is being converted into one coherent authoring
journey: safe local setup, ruleset-aware content, optional AI and reviewable
translations. Bugs already corrected on `main` remain open until a downloadable
release containing them is smoke-tested.

## Dependency and runtime health

| Area                          | Evidence                                                                                                                                                                                                                                             | Decision                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Public npm tree               | `npm audit` initially reported 4 advisories through Angular build tooling; the supported Angular 21 patch update reduces this to 0                                                                                                                   | **Update now** within Angular 21; no framework-major migration                                                       |
| Production npm tree           | The older lockfile reported 40 advisories, including 3 critical; Angular 21 patches plus Sharp 0.35.5 reduce this to 0                                                                                                                               | **Update now** in the paired production repository and rebuild both campaigns                                        |
| Angular and TypeScript majors | Angular 22 and TypeScript 7 are available, but are outside the current compatibility line                                                                                                                                                            | **Defer** to a dedicated migration with native release testing                                                       |
| Node runtime                  | [Node 24.22.1](https://nodejs.org/en/blog/release) is the latest supported-line patch; Node 24 remains supported through April 2028 according to the [official schedule](https://github.com/nodejs/Release#release-schedule)                         | **Keep Node 24**. The installer resolves the newest Node 24 archive dynamically, so no pinned download needs editing |
| Python Session Scribe         | `davey` 0.1.7, `python-dotenv` 1.2.4 and the CUDA 12 packages are current inside their declared ranges; `faster-whisper` 1.2.1 remains compatible. PyAV stays below 17 because the documented transcription call is incompatible with later releases | **Keep constraints** and rerun the voice fixtures after any future Pycord/PyAV change                                |
| Pycord voice/DAVE             | Pycord remains pinned to an exact reviewed commit because receive-side DAVE support is not yet taken from a stable release                                                                                                                           | **Defer** changing the pin until a stable release can pass a live Discord smoke test                                 |
| GitHub Actions                | The workflows use the current major lines: checkout 7, setup-node 7, setup-python 7, Pages actions 5/6, artifact upload 7 and download 8                                                                                                             | **Keep** current majors; patch tags float within those reviewed major contracts                                      |

Commands used: `npm outdated --json`, `npm audit --json`, `npm ls --depth=0`,
`python -m pip index versions ...`, GitHub release metadata and the official
Node release sources linked above.

## Update proof

- Public and production lockfiles now resolve Angular build/CLI 21.2.28 and
  Angular runtime packages 21.2.25.
- Both repositories resolve `jspdf-autotable` 5.0.9 and Prettier 3.9.10.
- Production now resolves Sharp 0.35.5 instead of the vulnerable 0.34 line.
- Post-update `npm audit` reports zero vulnerabilities in both repositories.
- Full verification and both production campaign builds are required before
  the paired commits may be pushed.

## AI ecosystem checkpoint

The first monthly review is recorded in
[`2026-10-ai-ecosystem-review.md`](2026-10-ai-ecosystem-review.md). Its main
decision is to build a capability registry before adding provider-specific UI
branches. xAI/Grok and Gemini are the first implementation candidates; other
providers remain visible in the maintained matrix without becoming silent
fallbacks.

## Scope and downstream effects

| Completed evidence               | Future work affected                     | Effect                                                                            |
| -------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Security patch review            | Native release and installer smoke tests | Requires the next release to rebuild every platform artifact                      |
| Provider review                  | Issues #1, #8 and #9                     | Establishes capability filtering, provider-neutral consent and no silent fallback |
| Partial-locale fix               | Issues #2 and #9                         | Missing secondary text is a valid draft state, not a save error                   |
| Shared readiness decision QK-028 | Local AI and translation jobs            | Provider status must be verified, not inferred from saved settings                |

## Closeout

- [x] Dependency, security, tooling and Node evidence recorded.
- [x] Explicit update/defer decisions recorded with reasons.
- [x] First monthly AI ecosystem review completed.
- [x] Material security updates applied in both repositories.
- [ ] Full repository verification and campaign builds (completed with the
      implementation batch before push).
- [ ] Downloadable release artifacts (performed when the next version is cut).
