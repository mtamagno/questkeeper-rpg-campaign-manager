# 15 November 2026 — Manager authoring closeout

**Plan:** UI, UX and Accessibility Quality Fortnight, 15 November

**Classification:** shared

**Issue slice:** #142 catalog and zero-inline-copy coverage for the Manager
surfaces changed today

## User journeys reviewed

| Journey                  | Shared Manager outcome                                                                                                                                                                         | Production proof                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Edit a character or NPC  | Manual identity and profile fields lead; optional AI import is collapsed and every result remains editable                                                                                     | Phandelver and Curse of Strahd character/NPC data             |
| Edit a session           | Identity and published chronicle stay visible; private note processing is an optional workspace with explicit model and consent choices                                                        | Existing session archives in both campaigns                   |
| Edit a location          | Identity, exploration state, artwork and description are separated into bounded sections                                                                                                       | Both campaign atlases                                         |
| Edit a notebook          | The existing optional per-character notebook editor remains inside the character journey and keeps manual page controls                                                                        | Public example plus private Shyra notebook compatibility      |
| Edit relationships       | Party and NPC collections now have real add/edit/remove flows for one relationship type, any number of directional feelings, shared events, quotes, evolution and the party-knowledge boundary | Existing party and NPC relationships in both campaigns        |
| Translate entities       | Scan, review and apply are shown as three separate consequences; AI stays optional and reviewed targets alone can be published                                                                 | N-language translation workspace                              |
| Maintain local compendia | Create/preview, verify rights and resolve conflicts are explicit stages before import                                                                                                          | Public portable storage and production local storage adapters |

## Remediation

- Every long entity dialog now reuses one keyboard-operable section index instead
  of limiting navigation to campaign settings.
- Character, NPC, session and location fields are grouped around authoring tasks,
  not storage-object order.
- Sheet extraction and notes processing use collapsed optional workspaces. Manual
  entry remains immediately available and generated values never bypass review.
- Relationship editing is now persistent rather than presentational. The API
  writes the complete reviewed collection and rejects self-links and duplicate
  directed edges before changing campaign files.
- Relationship fields retain the established model: one canonical relationship
  type, multiple independently rated feelings, and an explicit distinction
  between observed, reported and inferred NPC knowledge.
- Translation and compendium workspaces expose their review gates before the
  user starts a potentially remote or destructive operation.

## Cross-cutting analysis

The durable rule is **manual record → optional accelerator → explicit review →
single save boundary**. AI is not a parallel source of truth, and a long form is
not made usable merely by adding more tabs. Fields should first be grouped by
the user's goal, then indexed only when the groups exceed one viewport.

Relationship authoring adds a second durable rule: **one public classification,
many directional feelings, evidence before inference**. Future AI extraction,
session processing and NPC tools must preserve that cardinality and must never
turn hidden GM truth into a published relationship.

These decisions constrain the 16 November storage and publishing pass: backup,
migration and publish diagnostics must protect the same single reviewed-save
boundary, and failures must return the user to the exact manual draft rather
than restarting an AI task.

Issue #142 remains open. Today's focused regression covers the newly added
section navigation, optional AI disclosures, relationship workspace and workflow
labels. It does not claim the repository-wide JSON ownership and reviewed
exception inventory are complete.

## Boundaries

The behavior, API contract and tests are paired in both repositories. Public
fixtures remain original and redistributable. Phandelver and Curse of Strahd are
compatibility evidence only; no campaign canon, private note, transcript,
credential, licensed rules text or protected media entered the public template.
