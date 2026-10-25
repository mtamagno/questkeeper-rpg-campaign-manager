# Character story highlights

**Roadmap:** Day 08, commit 2
**Outcome:** A profile preserves the small details a normal character sheet forgets.

## Player outcome

The public profile can now carry three optional, deliberately compact layers:

- **quick facts** answer human questions such as a comfort, habit or familiar role;
- **signature items** explain why a possession matters without duplicating inventory;
- **favourite moments** preserve a character's subjective memory and link back to
  the public chapter, notebook, diary, quote or chronicle that supports it.

Quick facts stay inside the open at-a-glance section. Items and moments share one
closable section after relationships, so the profile's progressive reading order
remains identity, personal history, bonds, chosen details, known story and diary.

## Information contract

All three collections are optional and public. Every entry has a stable ID and
localized text. A favourite moment always has a typed public source. A signature
item may have a source, but it remains meaningful without one.

Sources are typed rather than arbitrary URLs: `chapter`, `notebook`, `diary`,
`quote` or `chronicle`. The Companion derives a safe route from the type and ID.
This keeps renamed deployments and campaign base paths working.

## Editorial boundaries

- Do not derive quick facts from ability scores or other mechanics.
- Do not copy equipment into signature items. Record only possessions whose
  emotional or narrative importance has been established.
- Do not call an event a favourite because it was dramatic. The character's own
  writing, dialogue or an explicit player choice must support that preference.
- Link memories to public evidence. Never cite a protected sheet, private profile,
  GM note or unrevealed notebook page.
- Missing content is honest. Omit a collection instead of inventing entries.

## Authoring and AI review

Campaign Manager provides add/remove cards for every collection, generates stable
IDs when authors do not supply them and requires a source plus link label for each
favourite moment. Assisted character import may propose entries only from explicit
source material. It must keep the result editable and cannot silently turn an
inventory list into story meaning or infer a subjective preference.

This compact layer does not replace the later equipment-storytelling or shared
campaign-memory milestones. Day 12 can deepen item state and attunement; Day 17
can build a filterable party-wide memory collection on the stable IDs and source
links established here.

## Verification

`npm run test:character-profiles` checks hierarchy, optional compatibility,
localized fields, stable unique IDs, supported source types and resolvable source
IDs across every campaign. The full verification gate adds Manager, accessibility,
offline, TypeScript, build and performance checks.
