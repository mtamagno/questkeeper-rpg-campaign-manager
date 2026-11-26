# Character keepsakes

**Classification:** `shared`

Character keepsakes are party-visible letters, sketches, handouts and mementos
stored beside a character's notebook, gallery and session diary. They preserve
the object and its meaning without copying prose from the source that proves it.

## Data contract

Add the optional top-level `keepsakes` array to a character:

```json
{
  "keepsakes": [
    {
      "id": "sealed-letter",
      "kind": "letter",
      "title": { "en": "The sealed letter" },
      "description": { "en": "Why the character kept it." },
      "image": {
        "url": "images/characters/sealed-letter.webp",
        "alt": "A weathered letter closed with red wax"
      },
      "source": {
        "kind": "diary",
        "id": "session-3",
        "label": { "en": "Read the Session 3 memory" }
      },
      "recordedAt": "2026-11-26",
      "sessionId": "session-3"
    }
  ]
}
```

- `id` is unique inside the character and uses lowercase letters, numbers and
  hyphens.
- `kind` is `letter`, `sketch`, `handout` or `memento`.
- `title`, `description` and `source.label` use the campaign's configured
  locale map; no locale is assumed.
- `image.url` is campaign-relative and `image.alt` is mandatory.
- `source` is mandatory and points to an existing `chapter`, `notebook`,
  `diary`, `quote` or `chronicle` ID.
- A notebook source is valid only when that page is explicitly `party` or
  `public`. Missing and `private` pages remain hidden and the Manager rejects
  them.
- `recordedAt` and `sessionId` are optional chronology links; an entered
  session must exist.

## Authoring and AI boundary

The Campaign Manager is the complete manual authoring path: upload or replace
the image, write localized copy, choose the kind and link the published source.
The same validation runs before save.

Any future local or remote AI workflow must return an editable proposal using
this exact contract. It may suggest a keepsake only when the supplied notes or
approved media identify both the object and its source. It must not invent a
private object, convert inventory into narrative evidence, expose a protected
notebook page or save automatically. The Game Master reviews copy, image,
accessibility text, dates and evidence before accepting it.

## Reader and print behavior

Keepsakes are a lazy Character Journal workspace. The opening index shows only
the count; images load after the collection is opened. Image buttons use the
shared focus-trapped lightbox with Escape, arrow navigation, loading/error
announcements and focus restoration. **Print collection** isolates the keepsake
archive and uses two-column, page-break-safe cards; controls and zoom affordances
do not appear on paper.
