const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const read = (path) => readFileSync(path, 'utf8');
const routes = read('src/app/app.routes.ts');
const sidebar = read('src/app/guild/components/sidebar/sidebar.component.html');
const page = read('src/app/guild/pages/user-settings/user-settings.component.html');
const code = read('src/app/guild/pages/user-settings/user-settings.component.ts');
const styles = read('src/app/guild/pages/user-settings/user-settings.component.scss');
const myCharacter = read('src/app/guild/services/myCharacter.service.ts');
const storage = read('src/app/guild/services/deviceStorageStatus.service.ts');
const catalog = read('src/app/guild/i18n/ui.json');
const party = read('src/app/adventurers/pages/party-list/party-list.component.html');
const commands = read('src/app/guild/components/site-command-bar/site-command-bar.component.ts');

assert.match(routes, /path: 'settings'/);
assert.ok((routes.match(/user-settings\.component/g) ?? []).length >= 2);
assert.match(sidebar, /sidebar\.userSettings/);
assert.doesNotMatch(sidebar, /app-audio-toggle|sidebar__my-character/);
assert.match(page, /role="tablist"/);
assert.match(page, /role="tab"/);
assert.match(page, /role="tabpanel"/);
assert.match(page, /id="global-settings"/);
assert.match(page, /id="campaign-scope-settings"/);
assert.match(page, /id="campaign-settings"/);
assert.match(page, /id="sound-muted"/);
assert.match(page, /id="sound-volume"/);
assert.match(page, /id="my-character"/);
assert.match(page, /id="rule-library-settings"/);
assert.match(page, /saveRuleReference/);
assert.match(page, /settings\.rules\.personalReference/);
assert.doesNotMatch(page, /isItalian\(\)/);
assert.match(code, /UserPreferencesService/);
assert.match(code, /MyCharacterService/);
assert.match(code, /selectCharacter/);
assert.match(code, /CharacterRulePreferencesService/);
assert.match(code, /characterRuleEntryId/);
assert.match(code, /SettingsSection = 'interface' \| 'audio' \| 'campaign' \| 'character'/);
assert.match(code, /ArrowRight.*ArrowDown/s);
assert.match(code, /queryParams: \{ section \}/);
assert.match(code, /DeviceStorageStatusService/);
assert.match(myCharacter, /selectionIsMissing/);
assert.match(storage, /'persistent' \| 'session'/);
assert.match(catalog, /"settings"/);
assert.doesNotMatch(party, /toggleMyCharacter/);
assert.match(commands, /global-settings/);
assert.match(styles, /@media \(max-width: 48rem\)/);
assert.match(styles, /@media \(max-width: 38rem\)/);
assert.match(styles, /min-height: 2\.75rem/);
assert.match(styles, /rule-preferences__reference-editor/);

console.log(
  'Central user settings verified: four scoped categories, recovery, honest persistence and responsive navigation.',
);
