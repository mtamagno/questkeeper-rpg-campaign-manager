# Quest Log modal workspace — completed 2026-11-28

## Classification

Shared behavior paired with the production Campaign Companion. The public demo uses a separate original, redistribution-safe party illustration.

## Decision

The Quest Log is one bounded workspace, not an expanding page and not a separate dialog for each quest. The route and character tab expose a compact launcher. Opening it creates one large accessible modal with filters, a title-only quest list on the left and one internally scrollable detail pane on the right. No quest is selected automatically; the initial state shows an original party illustration and localized “No quest selected” guidance.

## Preserved behavior

- Party and personal scopes still use the same canonical quest records.
- State, importance, owners, current objective, ordered evolution, images and evidence links remain visible without loss.
- Active, archived and all filters now live inside the reader.
- Escape, backdrop click and the close control dismiss the workspace; focus is trapped and restored.
- Mobile uses a full-screen reader with a bounded title region above the detail pane.
- The thumbnail generator now ignores generated `display/`, `thumbs/` and placeholder folders, preventing recursive derivatives after repeated builds.

## Validation

- Quest-contract, UI-catalog, accessibility and strict TypeScript checks.
- Original Lantern Road demo build and generated image derivative audit.
- The measured initial path is 517,082 bytes; only the aggregate ceiling moves by 1,000 bytes to 518,000. Request, individual-asset, deferred-script and image ceilings remain fixed.
- No production campaign content, identity, transcript or protected media entered the public repository.

## Future impact

Future quest metadata, AI proposals and Game Night updates must extend the right-hand detail view and must not add parallel cards or a second quest store. New filters belong in the modal workspace.
