const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const model = read('src/app/guild/models/character.model.ts');
const view = read('src/app/adventurers/components/character-sheet/character-sheet.component.html');
const adapter = read('src/app/adventurers/utils/characterSheetPresentation.ts');
const manager = read('tools/campaign-manager/public/app.js');
const demo = JSON.parse(
  read('src/campaigns/example-campaign/data/characters/mira-thorn.json'),
);

for (const contract of [
  'CharacterCombatResource',
  'CharacterInventoryItem',
  'combatResources?',
  'inventory?',
]) {
  assert.match(model, new RegExp(contract.replace('?', '\\?')));
}
assert.match(adapter, /sheet\.inventory/);
assert.match(adapter, /sheet\.equipment\.map/);
assert.match(view, /Combat resources/);
assert.match(view, /inventoryItems\(\)/);
assert.match(manager, /parseInventory/);
assert.match(manager, /parseResources/);
assert.ok(demo.sheet.inventory.length >= 4, 'demo should exercise structured inventory');
assert.ok(demo.sheet.combatResources.length >= 2, 'demo should exercise finite resources');
assert.deepEqual(
  demo.sheet.equipment,
  demo.sheet.inventory.map((item) => item.name),
  'legacy equipment names remain the level-history compatibility source',
);

console.log('Combat resources, currency and inventory contract verified.');
