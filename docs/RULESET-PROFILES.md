# Ruleset profiles

QuestKeeper stores campaign identity in `gameSystem` while preserving the
legacy free-text `edition` field:

```json
{
  "gameSystem": {
    "id": "dnd-2024",
    "edition": "2024 rules",
    "customLabels": {}
  }
}
```

A profile contains a stable ID, translated campaign/character terminology and
ordered semantic identity fields. Semantic keys such as `ancestry` map to
existing storage keys such as `sheet.race`; changing a label therefore never
rewrites character data.

Presentation fields are separate from mechanical identity. Every profile may
show, rename or hide the existing `sex`/gender field and the optional localized
`pronouns` field independently. Generic/custom campaigns control both labels;
leaving one blank hides that editor without deleting the stored value. Pronouns
are self-authored presentation data and are never derived from sex/gender,
names, portraits or voices.

Bundled profiles cover 5E fantasy 2014 and 2024, Pathfinder 2e Remaster,
cosmic-horror investigators and Generic/Custom. Existing campaigns infer a
profile from `edition` at read time and are not rewritten until the GM saves.

Terminology is separate from option catalogs. Every bundled option records its
source, license and URL. QuestKeeper currently bundles only a small SRD 5.2.1
catalog under CC-BY-4.0; profiles without a redistributable catalog remain
custom-entry first instead of copying protected rulebook lists.
