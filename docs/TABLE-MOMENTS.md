# Around the Table memories

**Classification:** shared  
**Surface:** Campaign navigation → Around the Table / Momenti al tavolo

`Session.tableMoments` stores memorable out-of-character jokes and comments
without mixing them into campaign canon. The dedicated page groups them by
session, shows the newest session first, and links back to the corresponding
story chapter. Each session owns an independent carousel that reveals one
quote card at a time, preventing a long campaign from becoming an unbroken
wall of text.

Readers can move with the previous and next buttons, choose a quote from the
position indicators, or use the left and right arrow keys while the carousel
has focus. The active card is announced to assistive technology. Cards and
controls use semantic campaign tokens rather than parchment-specific colours,
so every selectable palette retains readable foreground/background contrast.

Each entry contains:

- a stable `id` unique within the session;
- a public `speaker` display name;
- a bilingual `quote` that preserves the original meaning;
- an optional bilingual `context` explaining why the moment was memorable.

## Editorial boundary

- Record only words that were actually said; never turn an AI paraphrase into
  quotation marks.
- Include a moment only after the people involved are comfortable seeing it in
  the Companion. Prefer a character name, nickname, or neutral role when a real
  account name is unnecessary.
- Do not use this field for in-character dialogue, plot events, rules rulings,
  private conflict, or mockery at another player's expense.
- Translation may preserve the joke's intent, but the original meaning must
  not be embellished.
- Omitting `tableMoments` is valid. The page then presents an intentional empty
  state instead of inventing material.

Run `npm run test:table-moments` to protect the model, route, navigation,
canon boundary, carousel keyboard behavior, semantic contrast, accessible
quotation markup, and responsive layout.
