# Narrative mood system

QuestKeeper can change the visual atmosphere of public narrative pages without changing campaign canon. The supported semantic moods are `default`, `light` and `dark`.

## Inheritance

Mood is resolved in this order:

1. campaign default;
2. published campaign phase;
3. session or chapter;
4. individual `summary`, `storySoFar` or `prose` block.

`default` means “inherit”. Existing campaigns without mood data keep their previous rendering.

Campaign phases use an explicit `startsAtSessionId`. A phase activates only when that public session exists, so private notes, unpublished drafts and inferred spoilers can never switch the player-facing mood.

```json
{
  "narrativeMood": {
    "default": "light",
    "phases": [
      {
        "id": "through-the-gate",
        "label": "Through the gate",
        "startsAtSessionId": "session-3",
        "mood": "dark"
      }
    ]
  }
}
```

A session may override the phase or only one block:

```json
{
  "mood": "dark",
  "blockMoods": {
    "summary": "light"
  }
}
```

## Campaign Manager

Open **Edit campaign → Narrative presentation** to choose the campaign default and published phase milestones. Open a session to review its chapter and block overrides. Each field previews all three supported semantic states.

AI-assisted drafts may suggest an atmosphere, but QuestKeeper never applies it automatically. The Master must choose and save the mood controls explicitly.

## Accessibility

Light and dark values use semantic text, surface, border and accent tokens. Print output is forced to high-contrast black on white, focus remains visible, and narrative transitions are disabled when reduced motion is requested.
