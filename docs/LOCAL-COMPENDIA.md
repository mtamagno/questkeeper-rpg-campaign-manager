# Local custom compendia

QuestKeeper treats local rules, homebrew and table notes as user-owned packages,
not as loose additions to the bundled catalog. Open **Local compendia** in the
Campaign Manager to create, edit, validate, search, import or export them without
AI.

## Safety defaults

- New packages use `kind: local` and `visibility: private`.
- They live in the protected storage root, outside replaceable application and
  build files.
- Ordinary campaign sharing exports never include them.
- Local recovery backups include them and declare that the backup may contain
  private user-owned material.
- Exporting a private package requires a visible warning and explicit action.
- QuestKeeper never infers redistribution permission from a title, game system,
  source URL or AI output.

## Identity and references

Every package owns a stable namespace and semantic version. Entries resolve as
`namespace:type:id`. References and overrides must use that complete qualified
form; a local package cannot reuse a bundled namespace. Overrides are explicit
and never depend on file load order.

## Import review

Importing is two-stage. The preview reports the incoming namespace and version,
counts by entry type, validation errors, conflicts, invalid references and
whether an installed namespace would be replaced. Nothing is written until the
preview is valid and the Game Master explicitly confirms any overwrite.

## Updating QuestKeeper

Application updates replace code and bundled packages, not the protected local
compendium root. Local packages therefore survive updates. A future package
registry must preserve this ownership boundary and cannot silently adopt,
publish or rewrite local entries.

## Optional AI

Manual authoring is the baseline. Future AI extraction may only produce an
editable draft. It must preserve qualified IDs and citations, and it cannot
infer source ownership, license terms or redistribution permission.
