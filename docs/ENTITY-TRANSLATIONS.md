# Reviewed entity translations

QuestKeeper can translate localized character, NPC, session, location and
relationship fields from the Campaign Manager's **Translations** tab. Manual
translation remains fully supported; AI only creates editable drafts.

## Workflow

1. Choose different source and target campaign languages.
2. Scan all entities, one type, or one entity. Uncheck fields to make any
   smaller selected batch, including a single field.
3. Write drafts manually or choose one configured local/remote prose model.
4. Save the batch as reviewed. This explicit step is required before Apply.
5. If a target already contains text, explicitly allow overwrite, then apply.

Missing and stale fields are selected by default; translations whose saved
source and target hashes still match are marked current and left unselected.
Drafts live in local QuestKeeper state, survive navigation and can be resumed.
An interrupted batch never publishes incrementally: Apply completes the
selected entity collections or restores the previous files and reports failure.

## Safety and privacy

- Names, entity IDs, relationship IDs, media paths and URLs are never
  translation targets.
- Markdown, HTML, placeholders, game terms and references must be preserved.
- If source text changes after planning, Apply refuses the stale draft.
- A remote request names the selected provider/model and sends exactly the
  checked fields only after consent. Local models require no cloud consent.
- The public template contains only original demo content; production campaign
  canon and private notes never enter this repository.
