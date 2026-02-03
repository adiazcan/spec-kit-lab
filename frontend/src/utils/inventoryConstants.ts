/**
 * Inventory System Constants and Metadata
 *
 * Centralized configuration for inventory display, validation,
 * and behavior constraints.
 */

import type { ItemRarity, SlotType } from "@/types/inventory";

/**
 * Inventory display and pagination constraints
 */
export const INVENTORY_LIMITS = {
  /** Maximum items to display per view */
  maxItemsPerView: 100,

  /** Default pagination limit */
  defaultLimit: 50,

  /** Maximum stack quantity for stackable items */
  maxStackQuantity: 100,

  /** Minimum stack quantity for stackable items */
  minStackQuantity: 1,

  /** Maximum number of unique item types */
  maxUniqueItemTypes: 500,
} as const;

/**
 * UI performance and responsiveness constraints
 */
export const PERFORMANCE_TARGETS = {
  /** Maximum time to render filtered/sorted inventory */
  filterResponseTime: 200, // milliseconds

  /** Maximum time to apply tooltip display */
  tooltipDelayMs: 300, // milliseconds

  /** Maximum time for drag-and-drop feedback */
  dragDropFeedbackMs: 50, // milliseconds

  /** Maximum time for equip/unequip operation feedback */
  equipmentFeedbackMs: 100, // milliseconds

  /** Target frame rate for animations */
  targetFrameRate: 60, // FPS

  /** Maximum time for list/grid render */
  maxRenderTime: 100, // milliseconds
} as const;

/**
 * Rarity level configuration with visual indicators
 */
export const RARITY_CONFIG: Record<
  ItemRarity,
  {
    label: string;
    bgColor: string; // Tailwind CSS class
    textColor: string; // Tailwind CSS class
    borderColor: string; // Tailwind CSS class
    sortOrder: number;
  }
> = {
  Common: {
    label: "Common",
    bgColor: "bg-gray-400",
    textColor: "text-gray-900",
    borderColor: "border-gray-500",
    sortOrder: 1,
  },
  Uncommon: {
    label: "Uncommon",
    bgColor: "bg-green-500",
    textColor: "text-white",
    borderColor: "border-green-600",
    sortOrder: 2,
  },
  Rare: {
    label: "Rare",
    bgColor: "bg-blue-500",
    textColor: "text-white",
    borderColor: "border-blue-600",
    sortOrder: 3,
  },
  Epic: {
    label: "Epic",
    bgColor: "bg-purple-500",
    textColor: "text-white",
    borderColor: "border-purple-600",
    sortOrder: 4,
  },
  Legendary: {
    label: "Legendary ✨",
    bgColor: "bg-amber-500",
    textColor: "text-white",
    borderColor: "border-amber-600",
    sortOrder: 5,
  },
};

/**
 * Equipment slot information for UI rendering
 */
export const EQUIPMENT_SLOT_METADATA: Record<
  SlotType,
  {
    label: string;
    icon: string;
    description: string;
    position: number;
  }
> = {
  Head: {
    label: "Head",
    icon: "🎩",
    description: "Helmets, circlets, and headgear",
    position: 1,
  },
  Chest: {
    label: "Chest",
    icon: "🛡️",
    description: "Armor, robes, and chest protection",
    position: 2,
  },
  Hands: {
    label: "Hands",
    icon: "🧤",
    description: "Gloves, gauntlets, and hand gear",
    position: 3,
  },
  Legs: {
    label: "Legs",
    icon: "👖",
    description: "Leg armor and pants",
    position: 4,
  },
  Feet: {
    label: "Feet",
    icon: "👢",
    description: "Boots and footwear",
    position: 5,
  },
  MainHand: {
    label: "Main Hand",
    icon: "⚔️",
    description: "Primary weapon",
    position: 6,
  },
  OffHand: {
    label: "Off Hand",
    icon: "🗡️",
    description: "Secondary weapon or shield",
    position: 7,
  },
};

/**
 * Available item type filter options
 */
export const ITEM_TYPE_OPTIONS = [
  { value: "Stackable", label: "Consumables & Materials" },
  { value: "Unique", label: "Equipment" },
  { value: "Armor", label: "Armor" },
  { value: "Weapon", label: "Weapons" },
] as const;

/**
 * Available rarity filter options
 */
export const RARITY_FILTER_OPTIONS: Array<{
  value: ItemRarity;
  label: string;
}> = [
  { value: "Common", label: "Common" },
  { value: "Uncommon", label: "Uncommon" },
  { value: "Rare", label: "Rare" },
  { value: "Epic", label: "Epic" },
  { value: "Legendary", label: "Legendary" },
];

/**
 * Available sort field options
 */
export const SORT_FIELD_OPTIONS = [
  { value: "name" as const, label: "Name" },
  { value: "rarity" as const, label: "Rarity" },
  { value: "type" as const, label: "Type" },
  { value: "quantity" as const, label: "Quantity" },
  { value: "dateAdded" as const, label: "Recently Added" },
];

/**
 * Default sort order for rarity values
 */
export const RARITY_SORT_ORDER: Record<ItemRarity, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

/**
 * Grid layout configuration
 */
export const GRID_LAYOUT = {
  /** Number of columns in grid view (responsive) */
  columnsSmall: 4, // Mobile
  columnsMedium: 6, // Tablet
  columnsLarge: 8, // Desktop

  /** Item card dimensions */
  itemWidth: 100,
  itemHeight: 120,

  /** Spacing between items */
  gap: 12,

  /** Minimum viewport width for grid view */
  minWidth: 320,
} as const;

/**
 * List layout configuration
 */
export const LIST_LAYOUT = {
  /** Row height for list items */
  rowHeight: 48,

  /** Minimum viewport width for list view */
  minWidth: 640,

  /** Columns to display */
  columns: ["name", "type", "quantity", "rarity"] as const,
} as const;

/**
 * Drag and drop configuration
 */
export const DRAG_DROP_CONFIG = {
  /** Allowed item sources for equipment slots */
  allowedSources: ["inventory", "equipment"] as const,

  /** Data transfer effect for drag operations */
  dropEffect: "move" as const,

  /** CSS class for valid drop zone */
  validDropZoneClass: "bg-green-100 border-green-500",

  /** CSS class for invalid drop zone */
  invalidDropZoneClass: "opacity-50 border-red-500",

  /** CSS class for drag over state */
  dragOverClass: "ring-2 ring-blue-400",
} as const;

/**
 * Validation constraints
 */
export const VALIDATION = {
  /** Valid quantity range */
  isValidQuantity: (q: number) =>
    q > INVENTORY_LIMITS.minStackQuantity &&
    q <= INVENTORY_LIMITS.maxStackQuantity,

  /** Valid slot type check */
  isValidSlot: (slot: string) =>
    Object.keys(EQUIPMENT_SLOT_METADATA).includes(slot),

  /** Valid item type check */
  isValidItemType: (type: string) =>
    ITEM_TYPE_OPTIONS.some((opt) => opt.value === type),

  /** Valid rarity check */
  isValidRarity: (rarity: string) =>
    Object.keys(RARITY_CONFIG).includes(rarity),
} as const;

/**
 * Inventory preference keys for localStorage
 */
export const PREFERENCE_KEYS = {
  viewMode: "inventory_view_mode",
  sortOption: "inventory_sort_option",
  filters: "inventory_filters",
  lastSelectedItemId: "inventory_last_selected_item",
  favoriteItems: "inventory_favorite_items",
} as const;

/**
 * Animation and transition timings
 */
export const ANIMATION_TIMINGS = {
  /** Fast transition for UI state changes */
  fast: 150, // milliseconds

  /** Normal transition for interactions */
  normal: 300, // milliseconds

  /** Slow transition for emphasis */
  slow: 500, // milliseconds

  /** Hover effect delay */
  hoverDelay: PERFORMANCE_TARGETS.tooltipDelayMs, // milliseconds
} as const;

/**
 * Keyboard shortcuts configuration
 */
export const KEYBOARD_SHORTCUTS = {
  /** Open inventory detail view */
  openDetail: "Enter",

  /** Close modals and dialogs */
  closeModal: "Escape",

  /** Navigate to previous item */
  previousItem: "ArrowUp",

  /** Navigate to next item */
  nextItem: "ArrowDown",

  /** Quick equip in detail view */
  quickEquip: "e",

  /** Quick use in detail view */
  quickUse: "u",

  /** Toggle view mode */
  toggleView: "v",
} as const;
