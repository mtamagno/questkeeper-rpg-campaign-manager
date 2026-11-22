# Campaign memory gallery

QuestKeeper's campaign memory gallery is the party-wide reading surface for
authored shared memories. It does not copy journal prose or create another
campaign archive: every card resolves the stable memory ID already owned by a
relationship and linked to a published session.

## Reader experience

- Open **Memory Gallery** from the campaign navigation.
- Filter by participant, source session or locally saved favourites.
- Mark or unmark a memory from either the gallery card or its detail page.
- Open the common facts, attributed viewpoints and explicit disagreements
  without losing the supporting relationship or session links.
- Reset all filters in one action. Empty campaigns and empty result sets remain
  valid, explained states.

Native selects, visible labels, 44-pixel controls, live result counts and
`aria-pressed` favourite controls keep the surface usable with touch, keyboard
and assistive technology.

## Data and privacy boundary

The gallery derives from `party-relationships.json > sharedMemories`. Favourites
reuse the existing per-campaign Journey Memory store and save only a route,
display title and visit timestamp in the current browser. They never modify
campaign JSON, publish a player's reading choices or store protected prose.

Campaign authors should therefore continue to create and review memories in the
relationship editor. The gallery is a reader and filter over that canonical
evidence graph, not a second authoring surface.

## Future continuity

Notebook chronology and future keepsakes should link to stable memory, session,
person and place IDs. They may add views and filters, but must not fork shared
facts, viewpoints or favourites into parallel content stores.
