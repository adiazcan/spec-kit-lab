/**
 * Inventory Filtering and Sorting Utilities
 *
 * Provides functions to filter and sort inventory items by various criteria.
 * Used by useInventory hook and UI components for dynamic filtering.
 */

import type { InventoryFilters, SortOption } from "@/hooks/useInventory";

/**
 * Rarity levels for sorting/filtering
 */
export const RARITY_ORDER: Record<
  "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary",
  number
> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

/**
 * Item types available for filtering
 */
export const ITEM_TYPES = ["Stackable", "Unique", "Armor", "Weapon"] as const;

/**
 * Filter inventory items by applied filters
 *
 * @param items - Array of inventory entries
 * @param filters - Filter criteria to apply
 * @returns Filtered array of items
 */
export function filterInventory(
  items: any[],
  filters: InventoryFilters,
): any[] {
  return items.filter((entry) => {
    // Filter by item type
    if (filters.itemType && entry.item.itemType !== filters.itemType) {
      return false;
    }

    // Filter by rarity
    if (filters.rarity && entry.item.rarity !== filters.rarity) {
      return false;
    }

    // Filter by slot compatibility (for equipment items)
    if (
      filters.slotCompatibility &&
      entry.item.slotType !== filters.slotCompatibility
    ) {
      return false;
    }

    // Filter equipped state
    if (filters.includeEquipped === false) {
      // If includeEquipped is explicitly false, exclude equipped items
      // In a real scenario, we'd check if the item is in the equipment slots
      // For now, we just check if it's a unique item (equipment)
      if (entry.item.itemType === "Unique" && entry.item.slotType) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort inventory items by applied sort options
 *
 * @param items - Array of inventory entries to sort
 * @param sorts - Array of sort options (applies in order)
 * @returns Sorted array of items
 */
export function sortInventory(items: any[], sorts: SortOption[]): any[] {
  if (!sorts || sorts.length === 0) {
    return items;
  }

  // Create a copy to avoid mutating original array
  const sorted = [...items];

  // Apply sorts in reverse order (so first sort has highest priority)
  for (let i = sorts.length - 1; i >= 0; i--) {
    const sort = sorts[i];
    sorted.sort((a, b) => {
      const aVal = getSortValue(a, sort.field);
      const bVal = getSortValue(b, sort.field);

      let comparison = 0;

      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      }

      return sort.order === "asc" ? comparison : -comparison;
    });
  }

  return sorted;
}

/**
 * Get the value to use for sorting based on the field
 *
 * @param entry - Inventory entry
 * @param field - Sort field
 * @returns Value to sort by
 */
function getSortValue(entry: any, field: SortOption["field"]): any {
  switch (field) {
    case "name":
      return entry.item?.name || "";
    case "rarity":
      return RARITY_ORDER[entry.item?.rarity as keyof typeof RARITY_ORDER] || 0;
    case "type":
      return entry.item?.itemType || "";
    case "quantity":
      return entry.quantity || 0;
    case "dateAdded":
      return entry.addedAt ? new Date(entry.addedAt) : new Date(0);
    default:
      return "";
  }
}

/**
 * Search inventory items by name and description
 *
 * @param items - Array of inventory entries
 * @param searchText - Text to search for (case-insensitive)
 * @returns Filtered array of matching items
 */
export function searchInventory(items: any[], searchText?: string): any[] {
  if (!searchText || searchText.trim() === "") {
    return items;
  }

  const query = searchText.toLowerCase().trim();

  return items.filter((entry) => {
    const name = (entry.item?.name || "").toLowerCase();
    const description = (entry.item?.description || "").toLowerCase();
    const type = (entry.item?.itemType || "").toLowerCase();

    return (
      name.includes(query) ||
      description.includes(query) ||
      type.includes(query)
    );
  });
}

/**
 * Get unique item types from inventory
 *
 * @param items - Array of inventory entries
 * @returns Array of unique item types
 */
export function getUniqueItemTypes(items: any[]): string[] {
  const types = new Set<string>();
  items.forEach((entry) => {
    if (entry.item?.itemType) {
      types.add(entry.item.itemType);
    }
  });
  return Array.from(types).sort();
}

/**
 * Get unique rarities from inventory
 *
 * @param items - Array of inventory entries
 * @returns Array of unique rarities
 */
export function getUniqueRarities(
  items: any[],
): Array<"Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"> {
  const rarities = new Set<
    "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
  >();
  items.forEach((entry) => {
    if (entry.item?.rarity) {
      rarities.add(entry.item.rarity);
    }
  });
  // Return sorted by rarity order
  return Array.from(rarities).sort(
    (a, b) => (RARITY_ORDER[a] || 0) - (RARITY_ORDER[b] || 0),
  );
}

/**
 * Get unique slot types from inventory
 *
 * @param items - Array of inventory entries
 * @returns Array of unique slot types
 */
export function getUniqueSlotTypes(items: any[]): string[] {
  const slots = new Set<string>();
  items.forEach((entry) => {
    if (entry.item?.slotType) {
      slots.add(entry.item.slotType);
    }
  });
  return Array.from(slots).sort();
}

/**
 * Clear all filters and sorts
 *
 * @returns Reset filters and sorts
 */
export function getDefaultFilters(): InventoryFilters {
  return {};
}

/**
 * Get default sort options
 *
 * @returns Default sort options
 */
export function getDefaultSorts(): SortOption[] {
  return [{ field: "name", order: "asc" }];
}

/**
 * Combine all filtering and sorting operations
 *
 * @param items - Array of inventory entries
 * @param filters - Filter criteria
 * @param sorts - Sort options
 * @param searchText - Search text
 * @returns Fully filtered and sorted items
 */
export function applyInventoryFiltering(
  items: any[],
  filters: InventoryFilters,
  sorts: SortOption[],
  searchText?: string,
): any[] {
  let result = items;

  // Apply search first
  result = searchInventory(result, searchText);

  // Apply filters
  result = filterInventory(result, filters);

  // Apply sorts
  result = sortInventory(result, sorts);

  return result;
}
