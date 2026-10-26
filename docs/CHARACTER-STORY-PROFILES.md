# Character story profiles

**Roadmap:** Day 08, commit 1
**Outcome:** A character profile reads first as a person, then as a record.

## Player outcome

The profile now follows a progressive public reading path:

1. **At a glance** — the familiar open summary of traits, ideals, written bonds,
   vulnerabilities and habits immediately follows the visual hero.
2. **Personal chapters** — illustrated origins remain the first long-form story.
3. **Bonds along the road** — every published party or NPC relationship lives in
   one horizontal, keyboard-scrollable carousel linked to the complete map.
4. **Known story** — public history and its evidence links sit together near the
   end of the profile, immediately before the session diary.

This layer sits between the portrait hero and the deeper artifacts. It provides
orientation without moving protected sheets, secrets or GM notes into the public
profile.

## Information contract

The story profile is a derived view. It introduces no second character schema:

| Surface           | Existing source                                              |
| ----------------- | ------------------------------------------------------------ |
| At-a-glance copy  | traits, ideals, bonds, flaws and hobbies                     |
| Personal chapters | lore chapters, with legacy backstory fallback in production  |
| People who matter | party and NPC relationship records                           |
| Known story       | `publicProfile.knownHistory`                                 |
| Latest memory     | final published diary entry                                  |
| Story references  | lore chapters, relationships, notebook, quotes and chronicle |

Relationship cards link to both the other person's public profile and the full
relationship record. The carousel contains the complete public set without
growing the page vertically; the relationship map remains the canonical overview.
The whole carousel is hosted in the same closable accordion used by the other
profile sections. Each card has one canonical relationship type and zero or more
directional feelings for the profile being viewed. A feeling includes its
five-step intensity and an evidence-based reason; a second participant's feelings
belong to that participant's card and to the full relationship page.
Known-story references link back to the artifact that supports them. Counts are
navigation cues, not new facts.

NPC dossiers consume the same canonical relationship records. Their closable
**Known relationships** section shows both recorded perspectives together,
because the reader is inspecting the subject rather than speaking as that NPC.
NPC feelings are phrased as what the party believes the NPC seems to feel;
NPC-to-NPC cards also display the observed, reported or inferred certainty and
its public evidence. Unresolved/private participants are omitted, while a valid
NPC with no published link receives an explicit empty state and a route to the
complete NPC network.

## Editorial rules

- Use public character and relationship fields only.
- A profile may honestly show an unwritten identity, forming bond or empty memory.
- Do not infer affection, conflict or shared events from prose.
- Do not summarize private profiles, character sheets or GM notes into this view.
- Never copy relationship prose into an NPC record. Character and NPC previews
  must derive from `party-relationships.json` and `npc-relationships.json`.
- Keep origin chapters, notebooks, quotes and diaries authoritative; the profile
  only connects them.
- Keep the first screen concise. Known history belongs with its evidence near the
  diary, not inside the opening summary.

## Responsive and accessible behavior

The relationship rail supports buttons, keyboard focus, native horizontal
scrolling and scroll snap. Compact identity fields reflow to one column on narrow
screens. Stable section landmarks preserve in-page references, focus rings remain
visible and every known-story reference has a text label.

## Scope boundary

The second Day 08 task now extends this hierarchy with optional
[story highlights](CHARACTER-STORY-HIGHLIGHTS.md): quick facts remain compact,
while sourced items and favourite moments sit in a closable section instead of
turning the opening profile into a statistics dashboard.

## Verification

`npm run test:character-profiles` checks the ordered public hierarchy,
character carousel, NPC relationship cards, both directional perspectives,
party-perception boundary, resolved participants, empty-state route and diary
derivation across every campaign. The full verification gate adds formatting,
TypeScript, accessibility, build and performance checks.
