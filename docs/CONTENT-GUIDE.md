# Campaign content guide

> **Recommended:** launch `setup.bat` on Windows, `setup.command` on macOS or
> `./setup.sh` on Linux and use the local Campaign Manager. It creates these
> files, updates manifests and validates IDs for you. The details below are for
> advanced users who want to edit or generate campaign JSON directly.

Campaign data lives in `src/campaigns/`. The included
`example-campaign` is both a working demo and the canonical schema example.

## Directory layout

```text
src/campaigns/
├── campaigns.json
└── your-campaign-id/
    ├── data/
    │   ├── campaign.json
    │   ├── maps.json
    │   ├── party-relationships.json
    │   ├── npc-relationships.json
    │   ├── characters/
    │   │   ├── manifest.json
    │   │   └── character-id.json
    │   ├── npcs/
    │   │   ├── manifest.json
    │   │   └── npc-id.json
    │   └── sessions/
    │       ├── manifest.json
    │       └── session-id.json
    └── images/
```

Use lowercase URL-safe IDs. Declare the campaign's language codes and default
language in both `campaigns.json` and `data/campaign.json`:

Character, NPC, session and map IDs share one namespace inside a campaign. An
ID such as `test` may identify exactly one of those records, never one record
per folder. This keeps mixed relationship graphs, links, imports, search and
future campaign books unambiguous. Campaign IDs remain a separate top-level
namespace. Existing IDs stay stable when a display name or translation changes.

```json
{
  "languages": ["en", "es", "pt-BR"],
  "defaultLanguage": "es"
}
```

Every localized value is a map keyed by those codes, for example
`{"en": "The Lantern Road", "es": "El Camino de las Linternas"}`. Use normal
BCP-47-style codes such as `de`, `ja`, `fr-CA` or `pt-BR`. English is the
technical fallback; if it is omitted, the manager safely copies the first
available translation into `en` while keeping the chosen default language.

## Campaign manifest

`campaigns.json` is the homepage index. Each item needs `id`, localized
`name` and `description`, a `thumbnail` path from the site root and an
optional localized `status`. Set `palette` to `heroic`, `gothic` or `neutral`;
older entries without it safely retain the `heroic` appearance. The Campaign
Manager presents the same three choices when a campaign is created or edited.

```json
{
  "id": "your-campaign-id",
  "palette": "heroic"
}
```

The campaign folder name must exactly match its ID.

## Campaign and story

`data/campaign.json` controls the title, overview, game edition/system,
starting date, GM and party name. `heroImages` paths are relative to the
campaign root. `storySoFar` is a short cumulative recap.

Sessions are loaded in the order listed by
`data/sessions/manifest.json` and displayed by `sessionNumber`. The optional
`prose` field accepts simple HTML; use `<hr>` to split narrative sections.
Do not paste untrusted HTML.

## Characters

Each character JSON contains:

- public profile: backstory, traits, ideals, bonds, flaws, known history and
  optional hobbies;
- private profile: secrets, motivations and GM notes;
- sheet: level, archetype/class, ancestry, background, abilities, saves,
  skills, equipment, features, spells and currency;
- optional `sheetHistory`: prior sheet snapshots for level progression;
- diary, session knowledge and quotes;
- optional standing height in centimetres (`heightCm`), useful for consistent
  party-art proportions;
- optional localized `pronouns`, kept separate from the legacy localized
  `sex`/gender value. Record pronouns only when the player or source states
  them explicitly; omit the field when unknown;
- optional `loreChapters`, an ordered illustrated chronicle of the character's
  public background. Each chapter has an `id`, localized `title` and `body`, an
  optional localized `period`, and an optional image with localized `alt` and
  `caption` text;
- optional `notebook`, a password-gated, character-owned illustrated artifact.
  It has localized title and description, optional 2:3 front/back covers,
  ordered 3:2 interior spreads, and `styleDirectives` describing this specific
  owner's medium, palette, handwriting, symbols and emotional variation;
- optional public-profile `quickFacts`, `signatureItems` and `favouriteMoments`.
  Every entry has a stable ID and localized copy. Signature items describe story
  meaning rather than inventory state; favourite moments require a typed public
  source (`chapter`, `notebook`, `diary`, `quote` or `chronicle`) and localized
  link label;
- separate square `profileImageUrl` and 2:3 `portraitImageUrl` artwork (the
  manager accepts both independently), plus a temporary spoiler password.

Use `publicProfile.backstory` as the concise summary used by compact views and
exports. When `loreChapters` is present, the character page turns the longer
background into a visual sequence instead of repeating that summary as one
large block. Keep secrets, unrevealed motives and GM-only facts in
`privateProfile`; image content, alt text and captions in public chapters must
not reveal them.

Story highlights are optional. Omit empty collections. Do not infer them from
statistics or equipment, and do not label an event as a favourite unless the
character's writing, dialogue or player explicitly supports that preference.
See [Character story highlights](CHARACTER-STORY-HIGHLIGHTS.md) for the full
source and review contract.

```json
{
  "loreChapters": [
    {
      "id": "first-road",
      "title": { "en": "The First Road", "it": "La prima strada" },
      "period": { "en": "Before the party", "it": "Prima del party" },
      "body": {
        "en": "A focused chapter of the public character history.",
        "it": "Un capitolo mirato della storia pubblica del personaggio."
      },
      "image": {
        "url": "images/characters/hero-lore-01.webp",
        "alt": {
          "en": "Accessible scene description",
          "it": "Descrizione accessibile della scena"
        },
        "caption": { "en": "A short emotional coda.", "it": "Una breve chiusa emotiva." }
      }
    }
  ]
}
```

A notebook is deliberately opt-in. Omit `notebook` entirely for a character
who does not keep one. The Manager can build it manually or create a reviewable
AI draft; both paths produce the same data:

```json
{
  "notebook": {
    "title": { "en": "Mira's Roadbook", "it": "Il taccuino di Mira" },
    "description": {
      "en": "Routes and unfinished deliveries.",
      "it": "Rotte e consegne incompiute."
    },
    "password": "cambiami",
    "styleDirectives": "Graphite and burgundy ink; route lines and paper birds; every spread contains Mira's first-person thought.",
    "frontCover": {
      "url": "images/characters/mira-notebook-front.webp",
      "alt": "Mira's red roadbook"
    },
    "backCover": {
      "url": "images/characters/mira-notebook-back.webp",
      "alt": "Back of Mira's roadbook"
    },
    "pages": [
      {
        "id": "north-road",
        "title": { "en": "The North Road", "it": "La strada del nord" },
        "era": { "en": "Before the beacon", "it": "Prima del faro" },
        "reflection": {
          "en": "Rain makes every mile honest.",
          "it": "La pioggia rende sincero ogni miglio."
        },
        "mood": "wary",
        "image": {
          "url": "images/characters/mira-notebook-01.webp",
          "alt": "A sketched rainy route"
        }
      }
    ]
  }
}
```

An interior asset is one complete two-page spread, not one page. Keep notebook
passwords different from the character-sheet password when the audiences
differ, and remember that client-side password gates discourage casual spoilers
but are not encryption.

The local manager is the recommended way to maintain these fields. Existing
art is preserved when editing a character; uploading a new square profile no
longer overwrites the full-body portrait.

Use `"password": "cambiami"` only while setting up. Remember that a static
site cannot provide real server-side secrecy.

Spells are shown from names in the character sheet. This public repository does
not include a rulebook compendium or spell descriptions. If you extend the
empty catalog in `src/app/arcana/constants/spells.constants.ts`, add only
material whose license permits redistribution.

## NPCs, maps and relationships

NPCs support localized profile details, ally/enemy/neutral allegiance and an
optional category. Maps contain localized descriptions, image arrays,
discoveries and exploration status.

Relationship files contain directed edges between existing character/NPC IDs.
`party-relationships.json` connects player characters; `npc-relationships.json`
may connect an NPC with a player character or another NPC.
Supported types are defined in
`src/app/guild/models/relationship.model.ts`. Empty arrays are valid.

Keep one `type` for the relationship itself. Record the emotions inside optional
directional `perspectives`: each participant can hold any number of simultaneous
feelings, including conflicting ones. Every feeling needs a short bilingual
label, an intensity from 1 to 5 and a concrete bilingual reason supported by a
published event. Do not duplicate a perspective to make a bond look mutual.

```json
{
  "sourceId": "aria-vale",
  "targetId": "mira-thorn",
  "type": "friendship",
  "description": { "en": "A dependable partnership.", "it": "Una collaborazione affidabile." },
  "isBidirectional": true,
  "perspectives": [
    {
      "entityId": "aria-vale",
      "feelings": [
        {
          "label": { "en": "Trust", "it": "Fiducia" },
          "intensity": 5,
          "reason": {
            "en": "Mira crossed the broken span using Aria's route without hesitation.",
            "it": "Mira ha attraversato il ponte spezzato seguendo senza esitazione la rotta di Aria."
          }
        }
      ]
    }
  ]
}
```

`description` summarizes the relationship; `perspectives` explains how each
person currently experiences it. Update the latter when new notes provide
evidence, while `sharedEvents` and `evolution` preserve how it changed.

Do not duplicate these fields inside a character or NPC profile. Both profile
views derive their cards from the relationship files. An NPC dossier can show
each participant's published perspective, but describes an NPC's inner state as
the party's current reading rather than objective truth. A participant ID that
does not resolve to a published character or NPC is never rendered.

NPC-to-NPC relationships are always public party knowledge, not omniscient GM
truth. Add `partyPerception` with a `certainty` of `observed`, `reported` or
`inferred`, plus a bilingual `basis` naming the event that supports the party's
reading. If the group has no evidence yet, do not publish the relationship.

## Images

Keep original or properly licensed images under each campaign's `images/`
folder. PNG, JPEG and WebP files receive incremental display/thumbnail variants
during `npm run build`; SVG files are copied as-is. Write meaningful alt text.

Do not commit AI checkpoints, source scans or images whose license you cannot
verify. Keep a `CREDITS.md` beside third-party assets and record author,
source URL and license.

## Validate

```bash
npm ci
npm run build
```

Then browse every route, test each configured language, export a PDF and verify
direct page reloads on your hosting provider.
