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

Notebook passwords discourage casual spoilers; they are not encryption or an
authorization boundary. Private campaign prose and protected media must never be
copied into the public template. AI-assisted pages remain editable drafts and
must be reviewed before save or publication.

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
