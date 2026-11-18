# Complete character-story journey review

**Roadmap:** 18 November recovery day, commit 2  
**Classification:** shared  
**Outcome:** a reader can move from identity to evidence without meeting a dead
end or one endlessly growing character page.

## Journey now closed

The complete public route is deliberately progressive:

1. **Profile** gives identity, traits and the smallest useful facts.
2. **Personal chapters** preserve authored background without repeating it in
   the summary.
3. **Bonds and highlights** connect people, meaningful possessions and chosen
   memories to their canonical evidence.
4. **Known story** separates public knowledge from protected narrative.
5. **Journal index** keeps notebook, gallery and session memories in independent
   workspaces.
6. **Session diary references** reconnect a reflection to its session, people
   and places through stable IDs.

The profile therefore remains an orientation surface. Long prose, media,
mechanics and protected material stay in their own destinations. Nothing in this
review authorizes private notes or campaign canon to enter the public template.

## Integration findings

- Stable typed references are preferable to copied names or hand-written URLs.
  Renaming an entity does not break the reader path.
- Optional content needs an honest empty state; absence is not a reason to
  invent a memory or hide the whole Journal destination.
- Journal navigation and interface copy are one contract. The same delivery
  moved the Journal chrome to `ui.json`, while campaign-authored reflections
  remain data-owned.
- Manager authoring is part of the schema definition. A data field is not
  complete if normal authors must edit JSON to use it.
- Cross-links are evidence, not inference. AI-assisted import may propose them
  only from explicit source material and the GM must be able to edit them.

## Downstream plan correction

The next story week builds on existing surfaces instead of replacing them:

- **Day 15** evolves the existing relationship network with temporal trust,
  tension, affection and promise history; it does not create a second map.
- **Day 16** introduces shared-memory records and conflicting viewpoints that
  link back to the canonical session and participants.
- **Day 17** aggregates existing character memories into a party-wide view with
  source-aware filters; it does not copy diary prose into a new store.
- **Day 18** adds chronology and filtering inside notebooks while preserving the
  current lightweight index and lazy workspaces.
- **Days 19–20** add keepsakes and narrator/mood presentation through the same
  typed-source and accessibility rules.
- **Day 21** composes epilogues and legacy pages from reviewed public sources,
  never from protected or inferred facts.

This is a clarification of acceptance criteria, not permission to pull those
features forward.

## Verification contract

`npm run test:journal` validates resolvable session, character, NPC and map IDs,
unique reference lists, reader routes, JSON-owned Journal copy and Manager
authoring hooks. The normal full gate still covers localization parity, strict
TypeScript, accessibility, mobile layout, build and performance.

