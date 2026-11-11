# Quality catch-up: 6-10 November 2026

**Classification:** shared  
**Repositories:** production Companion and public QuestKeeper template  
**Campaign fixtures:** public demo, completed Phandelver and active Curse of Strahd

## Why these days are one delivery

The interrupted 6-10 November work touches the same reading journey: reach a
campaign, understand its people, follow their relationships and recover the
story. Implementing the dates as isolated patches would repeat accessibility,
locale and performance checks while making regressions between adjacent pages
harder to see. The catch-up therefore keeps each day's acceptance boundary but
uses one final cross-repository validation.

No task dated 11 November or later is pulled forward. Maps and gallery remain
the next scheduled part of the UI-catalog migration tracked by public issue
#140.

## 6 November - accessibility and first-view cost

- Tab-based surfaces share native tab roles, selected state, keyboard movement
  and a 44 px coarse-pointer target contract.
- Reduced-motion rules collapse decorative animation and transitions without
  hiding state changes.
- Build statistics now measure the real initial import graph separately from
  deferred route chunks and media, preventing a single total-build number from
  masking first-view regressions.
- Production no longer pulls the complete Compendium navigation tree into the
  bootstrap path; its lightweight route metadata stays separate from deferred
  rules content.

## 7 November - party and relationship reading

- Relationship maps retain their spatial SVG for sighted exploration.
- Every map also exposes a native, keyboard- and screen-reader-friendly linear
  relationship list. It contains the same participants, type, description and
  destination as the visual edge.
- Party, NPC-network and relationship-detail interface copy now resolves from
  the data-defined UI catalog rather than English/Italian branches in code.

## 8 November - character continuity

The 1-5 November character focus work already supplied the intended identity,
Profile, Story and bonds, Sheet, Journal and Settings review. This date is a
continuity gate, not a second refactor. The final journey reuses those focused
guards and confirms that the new relationship and chronicle work does not
remove character content, protected boundaries or direct links.

## 9 November - NPC discovery and detail

- The NPC index gains localized, accent-insensitive search across name, title,
  category, role, location and description.
- Results report visible and total counts, provide a clear action and preserve
  an explicit no-results state instead of showing an unexplained blank list.
- NPC detail keeps profile, gallery and perceived relationship destinations,
  while all interface labels move to the shared UI catalog.

## 10 November - chronicle and table memories

- Campaign overview, story so far, chapter, session summary, game-night brief
  and table moments now obtain reusable interface text from the UI registry.
- Session zero, prologue, numbered sessions, loading, empty, unavailable and
  navigation states use one consistent naming contract.
- Authored campaign prose, quotes, titles and images remain campaign data; the
  catalog contains product interface copy only.

## Regression contract

`test:quality-fortnight` binds the catch-up to four user outcomes:

1. NPC discovery has search, clear, count and honest empty-state behavior.
2. Relationship information is reachable without interpreting an SVG.
3. Chronicle surfaces use the locale registry and preserve Session 0/prologue.
4. Every declared interface locale provides the required new keys.

The final gate is run once after all catch-up implementation and documentation
are complete. It includes targeted formatting, strict TypeScript, UI catalog,
accessibility, chronicle, NPC/relationship, entity, build and performance
checks in both repositories, plus production validation of Phandelver and
Curse of Strahd.

## Scope boundaries and follow-up

- No campaign JSON, canon, private note, transcript, credential, compendium
  text or protected media moves to the public repository.
- Public issue #140 remains open after this slice: maps and gallery are owned by
  the scheduled 11 November work.
- The global-shell catalog migration in #138 also remains open until its later
  override and command-bar surfaces are complete.
