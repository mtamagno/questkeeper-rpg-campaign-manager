# Around the Table memories

**Classification:** shared  
**Surface:** Campaign navigation → Around the Table / Momenti al tavolo

`Session.tableMoments` stores memorable out-of-character jokes and comments
without mixing them into campaign canon. The dedicated page groups them by
session, shows the newest session first, and links back to the corresponding
story chapter.

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
canon boundary, accessible quotation markup, and responsive layout.
