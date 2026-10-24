# Character story profiles

**Roadmap:** Day 08, commit 1
**Outcome:** A character profile reads first as a person, then as a record.

## Player outcome

The profile now opens with one connected, public reading path:

1. **Identity** — the value that guides the character and an expandable portrait
   of temperament, vulnerabilities, habits and legacy origin copy.
2. **Bonds** — the character's written anchors plus up to four published party
   or NPC relationships, linked to the other person and the complete map.
3. **Memories** — known history, the latest diary memory and direct paths to
   personal chapters, notebooks, quotes and the complete diary.

This layer sits between the portrait hero and the deeper artifacts. It provides
orientation without moving protected sheets, secrets or GM notes into the public
profile.

## Information contract

The story profile is a derived view. It introduces no second character schema:

| Surface           | Existing source                                        |
| ----------------- | ------------------------------------------------------ |
| Inner compass     | `publicProfile.ideals`, falling back to traits         |
| Full portrait     | traits, flaws, hobbies and legacy backstory            |
| Written anchors   | `publicProfile.bonds`                                  |
| People who matter | party and NPC relationship records                     |
| Known memory      | `publicProfile.knownHistory`                           |
| Latest memory     | final published diary entry                            |
| Memory paths      | lore chapters, notebook pages, quotes and diary counts |

Relationship cards link to both the other person's public profile and the full
relationship record. The overview is intentionally capped at four cards while
the route label reports the complete count. Memory previews link back to the
artifact that supports them. Counts are navigation cues, not new facts.

## Editorial rules

- Use public character and relationship fields only.
- A profile may honestly show an unwritten identity, forming bond or empty memory.
- Do not infer affection, conflict or shared events from prose.
- Do not summarize private profiles, character sheets or GM notes into this view.
- Keep origin chapters, notebooks, quotes and diaries authoritative; the profile
  only previews and connects them.
- Long known-history copy is shortened at a word boundary, with the complete text
  available in an accessible native disclosure.

## Responsive and accessible behavior

The three numbered jump links remain keyboard-accessible and target stable
section landmarks. Cards reflow from three columns to the available width
without horizontal scrolling. Native `details` elements retain full keyboard
and assistive-technology support. Relationship portraits keep meaningful names,
focus rings remain visible and every compact memory path has a text label.

## Scope boundary

This task does not add the Day 08 quick-facts, signature-item or favourite-moment
schema. Those belong to the second scheduled task and must extend this hierarchy
without turning the story profile into a stat dashboard.

## Verification

`npm run test:character-profiles` checks the three public landmarks, relationship
and diary derivation, protected-data boundary and required public profile fields
across every campaign character. The full verification gate adds formatting,
TypeScript, accessibility, build and performance checks.
