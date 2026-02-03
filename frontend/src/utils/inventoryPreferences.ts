/**
 * Inventory User Preferences Management
 *
 * Handles persistence and retrieval of user preferences
 * (view mode, sort, filters) using localStorage.
 */

import type {
  InventoryViewMode,
  InventoryFilters,
  SortOption,
} from "@/types/inventory";
import { PREFERENCE_KEYS, EQUIPMENT_SLOT_METADATA } from "./inventoryConstants";

/**
 * User preference state for inventory
 */
export interface UserInventoryPreferences {
  /** Preferred view mode (grid or list) */
  viewMode?: InventoryViewMode;

  /** Current sort options */
  sortOption?: SortOption;

  /** Currently applied filters */
  filters?: InventoryFilters;

  /** Last selected item ID in detail view */
  lastSelectedItemId?: string;

  /** Favorite item IDs for quick access */
  favoriteItems?: string[];

  /** Timestamp of last preference update */
  lastUpdated?: number;
}

/**
 * Get all stored preferences from localStorage
 */
export function getPreferences(): UserInventoryPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEYS.viewMode);
    const viewMode = (stored as InventoryViewMode) || "grid";

    const sortStr = localStorage.getItem(PREFERENCE_KEYS.sortOption);
    const sortOption = sortStr ? JSON.parse(sortStr) : undefined;

    const filterStr = localStorage.getItem(PREFERENCE_KEYS.filters);
    const filters = filterStr ? JSON.parse(filterStr) : undefined;

    const lastSelectedItemId =
      localStorage.getItem(PREFERENCE_KEYS.lastSelectedItemId) || undefined;

    const favoritesStr = localStorage.getItem(PREFERENCE_KEYS.favoriteItems);
    const favoriteItems = favoritesStr ? JSON.parse(favoritesStr) : undefined;

    return {
      viewMode,
      sortOption,
      filters,
      lastSelectedItemId,
      favoriteItems,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error("Failed to load inventory preferences:", error);
    return { viewMode: "grid" };
  }
}

/**
 * Save all preferences to localStorage
 */
export function savePreferences(prefs: UserInventoryPreferences): void {
  try {
    if (prefs.viewMode) {
      localStorage.setItem(PREFERENCE_KEYS.viewMode, prefs.viewMode);
    }

    if (prefs.sortOption) {
      localStorage.setItem(
        PREFERENCE_KEYS.sortOption,
        JSON.stringify(prefs.sortOption),
      );
    }

    if (prefs.filters) {
      localStorage.setItem(
        PREFERENCE_KEYS.filters,
        JSON.stringify(prefs.filters),
      );
    }

    if (prefs.lastSelectedItemId) {
      localStorage.setItem(
        PREFERENCE_KEYS.lastSelectedItemId,
        prefs.lastSelectedItemId,
      );
    }

    if (prefs.favoriteItems && prefs.favoriteItems.length > 0) {
      localStorage.setItem(
        PREFERENCE_KEYS.favoriteItems,
        JSON.stringify(prefs.favoriteItems),
      );
    }
  } catch (error) {
    console.error("Failed to save inventory preferences:", error);
  }
}

/**
 * Get stored view mode preference, with fallback to 'grid'
 */
export function getViewModePreference(): InventoryViewMode {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEYS.viewMode);
    if (stored === "grid" || stored === "list") {
      return stored;
    }
  } catch (error) {
    console.error("Failed to load view mode preference:", error);
  }
  return "grid";
}

/**
 * Set and persist view mode preference
 */
export function setViewModePreference(mode: InventoryViewMode): void {
  try {
    localStorage.setItem(PREFERENCE_KEYS.viewMode, mode);
  } catch (error) {
    console.error("Failed to save view mode preference:", error);
  }
}

/**
 * Get stored sort option preference
 */
export function getSortPreference(): SortOption | undefined {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEYS.sortOption);
    if (!stored) return undefined;

    const parsed = JSON.parse(stored);
    if (isValidSortOption(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load sort preference:", error);
  }
  return undefined;
}

/**
 * Set and persist sort option preference
 */
export function setSortPreference(sort: SortOption | undefined): void {
  try {
    if (!sort) {
      localStorage.removeItem(PREFERENCE_KEYS.sortOption);
      return;
    }

    if (isValidSortOption(sort)) {
      localStorage.setItem(PREFERENCE_KEYS.sortOption, JSON.stringify(sort));
    }
  } catch (error) {
    console.error("Failed to save sort preference:", error);
  }
}

/**
 * Get stored filter preference
 */
export function getFilterPreference(): InventoryFilters | undefined {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEYS.filters);
    if (!stored) return undefined;

    const parsed = JSON.parse(stored);
    if (isValidFilters(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to load filter preference:", error);
  }
  return undefined;
}

/**
 * Set and persist filter preference
 */
export function setFilterPreference(
  filters: InventoryFilters | undefined,
): void {
  try {
    if (!filters || Object.keys(filters).length === 0) {
      localStorage.removeItem(PREFERENCE_KEYS.filters);
      return;
    }

    if (isValidFilters(filters)) {
      localStorage.setItem(PREFERENCE_KEYS.filters, JSON.stringify(filters));
    }
  } catch (error) {
    console.error("Failed to save filter preference:", error);
  }
}

/**
 * Get last selected item ID
 */
export function getLastSelectedItemId(): string | undefined {
  try {
    return (
      localStorage.getItem(PREFERENCE_KEYS.lastSelectedItemId) || undefined
    );
  } catch (error) {
    console.error("Failed to load last selected item ID:", error);
    return undefined;
  }
}

/**
 * Set and persist last selected item ID
 */
export function setLastSelectedItemId(itemId: string | undefined): void {
  try {
    if (!itemId) {
      localStorage.removeItem(PREFERENCE_KEYS.lastSelectedItemId);
      return;
    }
    localStorage.setItem(PREFERENCE_KEYS.lastSelectedItemId, itemId);
  } catch (error) {
    console.error("Failed to save last selected item ID:", error);
  }
}

/**
 * Get favorite item IDs
 */
export function getFavoriteItems(): string[] {
  try {
    const stored = localStorage.getItem(PREFERENCE_KEYS.favoriteItems);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load favorite items:", error);
    return [];
  }
}

/**
 * Add item to favorites
 */
export function addFavorite(itemId: string): void {
  try {
    const favorites = getFavoriteItems();
    if (!favorites.includes(itemId)) {
      favorites.push(itemId);
      localStorage.setItem(
        PREFERENCE_KEYS.favoriteItems,
        JSON.stringify(favorites),
      );
    }
  } catch (error) {
    console.error("Failed to add favorite:", error);
  }
}

/**
 * Remove item from favorites
 */
export function removeFavorite(itemId: string): void {
  try {
    const favorites = getFavoriteItems();
    const updated = favorites.filter((id) => id !== itemId);
    if (updated.length > 0) {
      localStorage.setItem(
        PREFERENCE_KEYS.favoriteItems,
        JSON.stringify(updated),
      );
    } else {
      localStorage.removeItem(PREFERENCE_KEYS.favoriteItems);
    }
  } catch (error) {
    console.error("Failed to remove favorite:", error);
  }
}

/**
 * Check if item is favorited
 */
export function isFavorited(itemId: string): boolean {
  return getFavoriteItems().includes(itemId);
}

/**
 * Clear all inventory preferences
 */
export function clearAllPreferences(): void {
  try {
    Object.values(PREFERENCE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear preferences:", error);
  }
}

/**
 * Validation helper for SortOption
 */
function isValidSortOption(obj: unknown): obj is SortOption {
  if (typeof obj !== "object" || obj === null) return false;

  const sorted = obj as Record<string, unknown>;
  const validFields = ["name", "rarity", "type", "quantity", "dateAdded"];
  const validOrders = ["asc", "desc"];

  return (
    typeof sorted.field === "string" &&
    validFields.includes(sorted.field) &&
    typeof sorted.order === "string" &&
    validOrders.includes(sorted.order)
  );
}

/**
 * Validation helper for InventoryFilters
 */
function isValidFilters(obj: unknown): obj is InventoryFilters {
  if (typeof obj !== "object" || obj === null) return true; // Empty object is valid

  const filters = obj as Record<string, unknown>;

  // Validate itemType if present
  if (filters.itemType && typeof filters.itemType !== "string") {
    return false;
  }

  // Validate rarity if present
  if (filters.rarity && typeof filters.rarity !== "string") {
    return false;
  }

  // Validate slotCompatibility if present
  if (
    filters.slotCompatibility &&
    (typeof filters.slotCompatibility !== "string" ||
      !Object.keys(EQUIPMENT_SLOT_METADATA).includes(filters.slotCompatibility))
  ) {
    return false;
  }

  // Validate includeEquipped if present
  if (filters.includeEquipped && typeof filters.includeEquipped !== "boolean") {
    return false;
  }

  // Validate searchText if present
  if (filters.searchText && typeof filters.searchText !== "string") {
    return false;
  }

  return true;
}

/**
 * Export all preferences as JSON (for backup/debugging)
 */
export function exportPreferences(): string {
  return JSON.stringify(getPreferences(), null, 2);
}

/**
 * Import preferences from JSON
 */
export function importPreferences(jsonStr: string): boolean {
  try {
    const imported = JSON.parse(jsonStr) as UserInventoryPreferences;
    savePreferences(imported);
    return true;
  } catch (error) {
    console.error("Failed to import preferences:", error);
    return false;
  }
}
