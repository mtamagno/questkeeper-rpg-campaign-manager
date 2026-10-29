import {
  type CharacterCombatResource,
  type CharacterInventoryItem,
  type CharacterSheet,
} from '@guild/models/character.model';

/** A stable presentation item, including a safe adapter for legacy string inventories. */
export interface CharacterInventoryView extends CharacterInventoryItem {
  readonly quantity: number;
  readonly category: NonNullable<CharacterInventoryItem['category']>;
  readonly equipped: boolean;
}

function legacyInventoryId(name: string, index: number): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `legacy-${slug || 'item'}-${index + 1}`;
}

/** Uses the structured inventory when present and otherwise adapts every legacy entry. */
export function inventoryViews(sheet: CharacterSheet): ReadonlyArray<CharacterInventoryView> {
  const source = sheet.inventory;
  if (source !== undefined && source.length > 0) {
    return source.map((item) => ({
      ...item,
      quantity: Math.max(1, Math.trunc(item.quantity ?? 1)),
      category: item.category ?? 'gear',
      equipped: item.equipped ?? false,
    }));
  }
  return sheet.equipment.map((name, index) => ({
    id: legacyInventoryId(name, index),
    name,
    quantity: 1,
    category: 'gear',
    equipped: false,
  }));
}

/** Clamps malformed resource values for display while leaving authored data untouched. */
export function combatResourceViews(
  resources: ReadonlyArray<CharacterCombatResource> | undefined,
): ReadonlyArray<CharacterCombatResource> {
  return (resources ?? []).map((resource) => {
    const maximum = Math.max(0, Math.trunc(resource.maximum));
    return {
      ...resource,
      maximum,
      current: Math.min(maximum, Math.max(0, Math.trunc(resource.current))),
    };
  });
}
