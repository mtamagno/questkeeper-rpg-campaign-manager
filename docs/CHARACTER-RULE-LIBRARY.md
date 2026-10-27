# Per-character spell and ability library

QuestKeeper projects each unlocked character sheet into one searchable library
instead of maintaining a second rules database.

## Player experience

- Search the selected level's spells and abilities by name.
- Spell searches also match localized school and level metadata when that data
  exists in the local Compendium.
- Filter the result set between all entries, abilities and spells.
- Open an exact local Compendium match from its card; unresolved entries remain
  readable sheet records and never receive invented rules text.
- Keyboard focus, 44-pixel controls, live result counts and a bilingual empty
  state keep the library usable at the table and on a phone.

## Data and provenance contract

The sheet remains the source of truth for what the character knows. The library
is a derived view over `sheet.features`, `sheet.spells` and the existing local
spell catalog.

- `Sheet` means the name came from character-owned campaign data.
- `Local compendium` means QuestKeeper found an exact bilingual catalog entry
  and can route to its detail page.
- A missing catalog match is not an error and does not trigger fuzzy rules-text
  substitution.
- The public template intentionally ships no licensed spell descriptions.
  Installations may add only material they are allowed to redistribute.

Prepared/favourite state, usage notes and external references are deliberately
outside this first Day 11 task and remain the next roadmap outcome.
