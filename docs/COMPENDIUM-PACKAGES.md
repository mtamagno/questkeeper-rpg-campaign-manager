# Compendium package contract

QuestKeeper keeps redistributable baseline material and table-owned references
in the same search model without treating them as the same kind of content.

Every package declares a stable namespace, semantic version, owner and source,
ruleset/edition, locales, visibility and explicit license/attribution. Entries
resolve as `namespace:type:id`; a local entry may replace another entry only by
declaring its complete `overrideOf` identifier. Coincidental IDs never win by
load order.

`bundled` packages are reviewed project inputs. `local` packages belong to the
table and are private by default. Ordinary export and publication omit private
or non-redistributable packages; inclusion must be an explicit, warned action.
An unknown license never implies permission.

This foundation contains no proprietary rules text. The reviewed baseline and
the local authoring workflow are delivered by issues #36 and #37.
