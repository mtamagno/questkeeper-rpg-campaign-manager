# Game-night campaign brief

**Classification:** shared  
**Roadmap:** Day 07 — richer player journey  
**Goals:** GN-02, GN-03 and GN-07

A campaign home with at least one completed session presents a four-step brief
for the few minutes before play:

1. **What changed** — the final recorded key event, linked to its full chapter.
2. **Where you are** — the latest chapter location, linked to discovered places.
3. **A personal thread** — one public character bond, linked to that profile.
4. **What matters now** — the campaign recap, linked to Story So Far.

The brief derives from existing public records. It introduces no duplicate
campaign state, reads no protected profile field and does not claim that a
summary is a new source of truth. A campaign with no completed chapter keeps its
existing pre-session empty state instead of showing invented context.

## Interaction contract

- English and Italian interface labels ship together; campaign text uses the
  configured language fallback.
- Cards are an ordered list with a labelled section and ordinary route links.
- The layout is four columns on wide screens, two on tablet and one on a narrow
  phone.
- Every summary links to its supporting chapter, map collection, character or
  complete recap.
- The feature coexists with recent pages, favourites, offline preparation and
  guided-tour progress; none is required before using the brief.

Run `npm run test:game-night-brief` to protect the derivation, evidence routes,
bilingual copy and responsive structure.
