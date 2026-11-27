# Journal moods closeout — 27 November 2026

## Outcome

Day 20 is complete in the production Companion and public template. A notebook
can now look materially owned by its narrator without turning presentation into
canon or forcing campaign authors to edit CSS.

## Decisions

1. `presentation` is optional and notebook-scoped. Legacy content defaults to
   classic paper, measured writing and an observer narrator.
2. Paper and handwriting affect reader chrome and reflection copy only. The
   authored image remains the record of the physical spread.
3. Emotional styling comes only from the explicit page `mood`; the reader never
   guesses from prose, artwork, secrecy or linked people.
4. Narrator mode is a restrained visual rhythm and recurring mark. It cannot
   reveal private evidence or manufacture a character opinion.
5. System-font stacks avoid a new network request and keep the archive readable
   offline. Colour is decorative because mood remains available as text in the
   filter and page data.

## Cross-cutting analysis

- **Accessibility:** dark ink on each light paper surface retains strong visual
  separation; selectable text, keyboard navigation and reduced-motion behavior
  remain unchanged.
- **Privacy:** AI receives only the reviewed presentation choice, public
  character context, brief and existing style directives. Protected profile
  fields remain excluded by the prompt test.
- **Portability:** notebook presentation is independent of Quest Log issue #155;
  quest data remains portable without UI appearance fields.
- **Future work:** epilogues may reuse paper tokens explicitly, but must not
  inherit notebook voice or emotion. Game Night and campaign timelines should
  continue using campaign/session mood, not character-owned notebook mood.

## Validation intent

The final daily gate covers the public example, completed Phandelver, active
Curse of Strahd, Manager save/AI round trips, strict TypeScript, accessibility,
build and performance budgets.
