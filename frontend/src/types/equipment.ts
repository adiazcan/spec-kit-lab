/**
 * Equipment Management Type Definitions
 *
 * These types define the structure for character equipment slots,
 * stat modifications, and equipment state management.
 */

import type { components } from "./api";
import type { SlotType } from "./inventory";

// Type alias for Item from API
export type Item = components["schemas"]["ItemResult"];

// Re-export for external use
export type { SlotType };

/**
 * Stat modifier applied by an equipped item
 */
export interface StatModifier {
  statName: string;
  value: number;
}

/**
 * An item currently equipped in a specific slot
 */
export interface EquippedItem {
  itemId: string;
  item: Item;
  equippedAt: Date;
  slotType: SlotType;
}

/**
 * Summary of all stat modifications from equipped items
 */
export interface StatModifierSummary {
  [statName: string]: number;
}

/**
 * Equipment slot metadata and availability
 */
export interface EquipmentSlot {
  type: SlotType;
  label: string;
  icon: string; // Unicode emoji or icon identifier
  description: string;
  equippedItem?: EquippedItem | null;
}

/**
 * Complete equipment state for a character
 */
export interface EquipmentState {
  // Current equipped items by slot type
  equippedItems: Record<SlotType, EquippedItem | null>;

  // Selected slot for viewing/interaction
  selectedSlotType?: SlotType;

  // Aggregated stat modifiers from all equipped items
  totalStatModifiers: StatModifierSummary;

  // Loading and error state
  isLoading: boolean;
  error?: Error | null;
}

/**
 * Slot compatibility information for equipping
 */
export interface SlotCompatibility {
  slotType: SlotType;
  canEquip: boolean;
  reason?: string; // Explanation if cannot equip
}

/**
 * Equipment-related validation result
 */
export interface EquipmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * All seven equipment slots with metadata
 */
export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  {
    type: "Head",
    label: "Head",
    icon: "🎩",
    description: "Helmets, circlets, and headgear",
  },
  {
    type: "Chest",
    label: "Chest",
    icon: "🛡️",
    description: "Armor, robes, and chest protection",
  },
  {
    type: "Hands",
    label: "Hands",
    icon: "🧤",
    description: "Gloves, gauntlets, and hand gear",
  },
  {
    type: "Legs",
    label: "Legs",
    icon: "👖",
    description: "Leg armor and pants",
  },
  {
    type: "Feet",
    label: "Feet",
    icon: "👢",
    description: "Boots and footwear",
  },
  {
    type: "MainHand",
    label: "Main Hand",
    icon: "⚔️",
    description: "Primary weapon",
  },
  {
    type: "OffHand",
    label: "Off Hand",
    icon: "🗡️",
    description: "Secondary weapon or shield",
  },
];

/**
 * Get equipment slot metadata by type
 */
export function getSlotMetadata(slotType: SlotType): EquipmentSlot {
  const slot = EQUIPMENT_SLOTS.find((s) => s.type === slotType);
  if (!slot) {
    throw new Error(`Unknown equipment slot: ${slotType}`);
  }
  return slot;
}

/**
 * Check if an item can be equipped to a specific slot
 */
export function canEquipToSlot(item: Item, slotType: SlotType): boolean {
  // Check if item has a slot type
  if (!("slotType" in item) || !item.slotType) {
    return false;
  }
  // Check if item's slot matches the target slot
  return item.slotType === slotType;
}

/**
 * Validate equipment operation
 */
export function validateEquipment(
  item: Item,
  slotType: SlotType,
): EquipmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check item eligibility
  if (!("slotType" in item) || !item.slotType) {
    errors.push("Item is not equippable");
  } else if (item.slotType !== slotType) {
    errors.push(`This item cannot be equipped to the ${slotType} slot`);
  }

  // Check for level requirement
  if ("level" in item && item.level) {
    warnings.push(`Item requires level ${item.level}`);
  }

  // Check requirements
  if ("requirementsMet" in item && !item.requirementsMet) {
    warnings.push("Character does not meet item requirements");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate total stat modifiers from equipped items
 */
export function calculateTotalModifiers(
  equippedItems: Record<SlotType, EquippedItem | null>,
): StatModifierSummary {
  const totals: StatModifierSummary = {};

  Object.values(equippedItems).forEach((equippedItem) => {
    if (!equippedItem) return;

    const { item } = equippedItem;
    if ("modifiers" in item && Array.isArray(item.modifiers)) {
      item.modifiers.forEach((modifier: StatModifier) => {
        totals[modifier.statName] =
          (totals[modifier.statName] ?? 0) + modifier.value;
      });
    }
  });

  return totals;
}

/**
 * Get human-readable slot name
 */
export function getSlotLabel(slotType: SlotType): string {
  return getSlotMetadata(slotType).label;
}

/**
 * Get slot icon
 */
export function getSlotIcon(slotType: SlotType): string {
  return getSlotMetadata(slotType).icon;
}

/**
 * Check if a slot is currently equipped
 */
export function isSlotEquipped(
  equippedItems: Record<SlotType, EquippedItem | null>,
  slotType: SlotType,
): boolean {
  return equippedItems[slotType] != null;
}

/**
 * Get currently equipped item for a slot
 */
export function getEquippedItemForSlot(
  equippedItems: Record<SlotType, EquippedItem | null>,
  slotType: SlotType,
): EquippedItem | null {
  return equippedItems[slotType] ?? null;
}
