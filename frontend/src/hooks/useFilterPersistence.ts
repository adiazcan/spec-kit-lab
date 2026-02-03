/**
 * Filter Persistence Hook (T033)
 *
 * Custom hook for persisting quest filter state to localStorage
 * and restoring filters on page reload.
 *
 * Features:
 * - Saves filter state to localStorage after changes
 * - Restores filter state from localStorage on mount
 * - Handles localStorage unavailability gracefully
 * - Type-safe filter state management
 *
 * @module hooks/useFilterPersistence
 */

import { useEffect } from "react";
import type { QuestFilterState } from "@/types/quest";

const FILTER_STORAGE_KEY = "quest-tracker-filters";

/**
 * Hook for persisting and restoring quest filter state
 *
 * Manages:
 * - Saving filter state to localStorage when changed
 * - Loading filter state from localStorage on mount
 * - Graceful handling of storage errors
 * - Validation of persisted data
 *
 * @param filters - Current filter state
 * @param onFiltersChange - Callback to update filters with restored state
 *
 * @example
 * const [filters, setFilters] = useState(DEFAULT_FILTERS);
 * useFilterPersistence(filters, setFilters);
 *
 * // Filter state will be automatically persisted and restored
 */
export function useFilterPersistence(
  filters: QuestFilterState,
  onFiltersChange: (filters: QuestFilterState) => void,
): void {
  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
      if (storedFilters) {
        const parsedFilters = JSON.parse(storedFilters) as QuestFilterState;

        // Validate that parsed filters have required structure
        if (
          parsedFilters &&
          Array.isArray(parsedFilters.statusFilters) &&
          typeof parsedFilters.searchText === "string" &&
          typeof parsedFilters.sortBy === "string"
        ) {
          onFiltersChange(parsedFilters);
        }
      }
    } catch (error) {
      // Silently fail if localStorage is unavailable or corrupted
      console.warn("Failed to restore filter state from localStorage:", error);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      // Silently fail if localStorage is unavailable
      // (e.g., private browsing mode, quota exceeded)
      console.warn("Failed to save filter state to localStorage:", error);
    }
  }, [filters]);
}

/**
 * Helper function to clear persisted filter state
 *
 * Useful for:
 * - Reset/Clear Filters button functionality
 * - User logout or session management
 * - Testing and development
 *
 * @example
 * <button onClick={() => clearPersistedFilters()}>
 *   Clear History
 * </button>
 */
export function clearPersistedFilters(): void {
  try {
    localStorage.removeItem(FILTER_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear persisted filters:", error);
  }
}

/**
 * Helper function to get persisted filters without updating state
 *
 * Useful for:
 * - Checking if filters exist before rendering UI
 * - Debugging filter persistence issues
 * - Prefilling forms elsewhere in the app
 *
 * @returns Persisted filter state or null if not found
 *
 * @example
 * const savedFilters = getPersistedFilters();
 * if (savedFilters) {
 *   console.log("Saved filter state:", savedFilters);
 * }
 */
export function getPersistedFilters(): QuestFilterState | null {
  try {
    const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!storedFilters) return null;

    const parsed = JSON.parse(storedFilters) as QuestFilterState;

    // Validate structure
    if (
      parsed &&
      Array.isArray(parsed.statusFilters) &&
      typeof parsed.searchText === "string" &&
      typeof parsed.sortBy === "string"
    ) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.warn("Failed to parse persisted filters:", error);
    return null;
  }
}
