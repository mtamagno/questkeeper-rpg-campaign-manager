# User Settings contract

QuestKeeper gives player-owned preferences one predictable home. The User
Settings page is available globally at `/settings` and in campaign context at
`/:campaignId/settings`.

## Scope matrix

| Preference           | Scope                  | Current storage                               | Privacy                                         |
| -------------------- | ---------------------- | --------------------------------------------- | ----------------------------------------------- |
| Audio mute           | Device-wide            | Existing audio preference payload             | Public preference                               |
| Audio volume         | Device-wide            | Existing audio preference payload             | Public preference                               |
| My Character         | Per campaign           | `my-character:v1`, campaign ID → character ID | Public identifiers only                         |
| Character rule state | Per campaign/character | `character-rule-preferences:v1`               | Private device notes; never published or synced |

Global settings behave the same in every campaign on the current browser.
Campaign settings are isolated by stable campaign ID. Opening global Settings
offers campaign choices; entering from a campaign keeps that campaign's data
and visual palette active.

## UI ownership

- The sidebar exposes one **User settings** destination, not individual
  preference widgets.
- The Settings page is the only editor for player-owned preferences.
- Other pages may show the resulting state. For example, a party card may say
  “My character,” but must not become a second chooser.
- A quick action may navigate using a preference. If the required preference
  is unset, it opens the matching Settings section.
- Campaign Manager authoring, publishing credentials, AI configuration and DM
  administration are product settings, not player User Settings.

## Adding a preference

Before implementing a new field, record:

1. `global` or `campaign` scope;
2. a versioned storage key and validated payload;
3. default and unavailable-storage behavior;
4. migration and rollback behavior;
5. whether it contains an identifier, private content or a secret;
6. bilingual copy, keyboard behavior and a narrow touch layout;
7. a static or behavioral regression assertion.

Persist the smallest safe value. Resolve public records at read time instead
of copying profiles, journals, character sheets or protected prose into
preference storage. Never persist passwords, API keys or private campaign
content here. Personal rule notes are explicit, bounded device-local content;
they must never be published, exported or synced implicitly.

## Compatibility

Existing preference keys remain readable unless an explicit migration is
introduced and tested. New campaign-scoped settings must handle deleted or
renamed entities with an honest unset fallback. Account sync, cloud storage and
native apps require a separate portability decision before changing this
device-local contract.
