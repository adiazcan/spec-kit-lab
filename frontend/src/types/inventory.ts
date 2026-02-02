/**
 * Inventory Management Type Definitions
 *
 * These types extend the auto-generated API types from the backend
 * to support inventory-specific state management and UI rendering.
 */

import type { components } from "./api";

// Type aliases for API types
export type InventoryEntry = components["schemas"]["InventoryEntryResult"];
export type Item = components["schemas"]["ItemResult"];

/**
 * Supported item rarity levels with visual and mechanical significance
 */
export type ItemRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

/**
 * Equipment slot types representing character armor and weapon positioning
 */
export type SlotType =
  | "Head"
  | "Chest"
  | "Hands"
  | "Legs"
  | "Feet"
  | "MainHand"
  | "OffHand";

/**
 * Inventory view mode preference
 */
export type InventoryViewMode = "grid" | "list";

/**
 * Represents a single item in the inventory with metadata
 */
export interface InventoryItem {
  entry: InventoryEntry;
  isSelected?: boolean;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Grouped inventory state for component-level management
 */
export interface InventoryState {
  // Current view mode
  viewMode: InventoryViewMode;

  // Pagination
  limit: number;
  offset: number;

  // Filter and sort preferences
  activeFilters: InventoryFilters;
  activeSorts: SortOption[];
  searchText?: string;

  // UI selection state
  selectedItemId?: string;

  // Loading and error states
  isLoading: boolean;
  error?: Error | null;
}

/**
 * Filter criteria for inventory items
 */
export interface InventoryFilters {
  /** Filter by item type (e.g., 'Stackable', 'Unique') */
  itemType?: string;

  /** Filter by rarity level */
  rarity?: ItemRarity;

  /** Filter by equipment slot compatibility */
  slotCompatibility?: SlotType;

  /** Include/exclude currently equipped items */
  includeEquipped?: boolean;

  /** Search text to match against item names */
  searchText?: string;
}

/**
 * Sort ordering for inventory lists
 */
export interface SortOption {
  field: "name" | "rarity" | "type" | "quantity" | "dateAdded";
  order: "asc" | "desc";
}

/**
 * Type guard to check if an item is stackable
 */
export function isStackableItem(
  item: Item,
): item is Item & { itemType: "Stackable"; maxStackSize: number } {
  return "itemType" in item && item.itemType === "Stackable";
}

/**
 * Type guard to check if an item is equippable
 */
export function isEquippableItem(
  item: Item,
): item is Item & { slotType: SlotType } {
  return "slotType" in item && item.slotType != null;
}

/**
 * Type guard to check if an inventory entry is selected
 */
export function isItemSelected(
  selectedId: string | undefined,
  entryId: string,
): boolean {
  return selectedId === entryId;
}

/**
 * Helper to determine if a quantity is at maximum
 */
export function isAtMaxStack(quantity: number, maxSize: number): boolean {
  return quantity >= maxSize;
}

/**
 * Helper to format quantity display for stackable items
 */
export function formatQuantity(
  quantity: number,
  maxStackSize?: number,
): string {
  if (!maxStackSize) return String(quantity);
  return `${quantity}/${maxStackSize}`;
}

/**
 * Helper to get visual indicator for rarity
 */
export function getRarityLabel(rarity: ItemRarity): string {
  const rarityLabels: Record<ItemRarity, string> = {
    Common: "Common",
    Uncommon: "Uncommon",
    Rare: "Rare",
    Epic: "Epic",
    Legendary: "Legendary ✨",
  };
  return rarityLabels[rarity] ?? "Unknown";
}

/**
 * Helper to validate slot type
 */
export function isValidSlotType(slot: unknown): slot is SlotType {
  const validSlots: SlotType[] = [
    "Head",
    "Chest",
    "Hands",
    "Legs",
    "Feet",
    "MainHand",
    "OffHand",
  ];
  return typeof slot === "string" && validSlots.includes(slot as SlotType);
}
