# Character Journal

The Journal is a character-owned memory archive. It keeps illustrated notebooks,
gallery media and session diary entries separate from the current mechanical
Sheet and from the public Story & bonds trail.

## Reader contract

- The first view is a lightweight index. It lists only collections that exist
  for that character and previews the latest diary entry.
- Notebook, gallery and diary are independent nested workspaces. Opening one
  does not make the other collections part of the same long page.
- A workspace is rendered on first visit and then remains mounted while hidden.
  This avoids initial media cost while preserving notebook position, gallery
  lightbox state and diary reading context during the visit.
- `#character-journal` opens the index. Existing `#notebook`, `#gallery` and
  `#diary` links remain valid and open both the outer Journal area and the
  requested collection.
- A remembered notebook position is presented as **Continue reading**. Reading
  position is navigation state, not a User Setting.
- Characters without published memories receive an honest empty archive rather
  than missing navigation or invented content.

The collection tabs use native buttons with `tablist`, `tab` and `tabpanel`
semantics, roving focus and Left/Right/Home/End navigation. Every tab controls
one real panel, and phone layouts keep the four possible destinations visible in
a compact two-column grid.

## Authoring contract

All collections are optional and remain data-driven:

- `notebook` may contain a front cover, back cover and illustrated spreads;
- `gallery` contains character-owned image references;
- `diary` contains localized public session memories.

Every diary entry has one required `sessionId` and may carry
`relatedCharacterIds`, `relatedNpcIds` and `relatedMapIds`. The Companion turns
resolved references into compact links beneath the reflection; unknown IDs are
rejected by the journal validation gate instead of producing dead navigation.
The session, people and places remain canonical entities: do not repeat their
names or URLs inside the diary schema.

Campaign Manager exposes the same contract as an editable **Session diary**
workspace. Authors choose the session and optional related entities from the
current campaign, while localized title and reflection fields follow the
campaign's configured languages. Hand-authored JSON remains supported.

Notebook passwords discourage casual spoilers; they are not encryption or an
authorization boundary. Private campaign prose and protected media must never be
copied into the public template. AI-assisted pages remain editable drafts and
must be reviewed before save or publication.

The notebook reader keeps covers and authored order intact by default. Its
collapsible index and filters operate inside the lazy Journal workspace, so a
long archive does not become a second infinite profile page. Optional page
metadata supplies chronology, mood, linked session, related people and intended
audience. Missing metadata remains valid and is shown as undated/private rather
than inferred from prose or artwork.

### Reader materials and handwriting

An optional notebook-level `presentation` selects a semantic `paper` and
`handwriting` style. The supported paper surfaces are `classic`, `weathered`,
`moonlit`, `ash` and `botanical`; handwriting may be `measured`, `flowing`,
`compact`, `angular` or `ornate`. Missing values preserve the classic/measured
legacy rendering. These choices style only the reader frame and reflection copy:
they never recolour, reinterpret or replace the authored spread image.

Campaign Manager exposes both fields as constrained selects and stores the
choice with the notebook. Every handwriting stack uses local system fallbacks,
keeps text selectable and preserves readable contrast at phone sizes.

## Performance and future growth

The index must not decode gallery images or initialize the notebook reader.
Large-media testing belongs to the shared performance gate. If real campaigns
outgrow the current gallery, add pagination or virtualization inside the gallery
workspace; do not return to one continuously rendered Journal page.

## Regression checks

Run:

```bash
npm run test:journal
npm run test:notebooks
npm run test:character-reading-position
npm run test:mobile-layout
npm run test:accessibility
```

The public demo exercises notebook and diary behavior. Production additionally
validates gallery-heavy characters across completed Phandelver and active Curse
of Strahd without moving their data upstream.
