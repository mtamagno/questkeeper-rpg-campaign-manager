# Reviewed compendium sources

Reviewed on 28 October 2026. The machine-readable authority is
`tools/campaign-manager/compendium-source-matrix.json`.

| Candidate                 | Status        | Decision                                                                                                                                                                                                               |
| ------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wizards SRD 5.2.1         | Approved      | The official SRD page identifies version 5.2.1, localized downloads and CC BY 4.0 publication terms. QuestKeeper pins the version, retains source/license attribution and imports only reviewed SRD-derived summaries. |
| Commercial D&D core books | Excluded      | Purchase or online reading access is not a redistribution grant. Content absent from the SRD is not bundled.                                                                                                           |
| Paizo/ORC material        | Research only | ORC can cover licensed mechanics, but each product's ORC Notice and Reserved Material boundary must be reviewed before importing that product. No Pathfinder text is currently bundled.                                |

Primary references:

- <https://www.dndbeyond.com/srd>
- <https://creativecommons.org/licenses/by/4.0/legalcode>
- <https://paizo.com/licenses>
- <https://paizo.com/orclicense>

The importer fails when a source is not marked `approved`, a citation points to
another URL, package provenance is incomplete or publication permission is not
explicit. A later upstream version is a new review, not an automatic overwrite.
