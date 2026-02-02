/**
 * useInventory Hook
 *
 * Primary hook for inventory state management and API calls.
 * Manages inventory data, view modes, filters, sorts, and pagination.
 *
 * @module hooks/useInventory
 */

import { useState, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  inventoryClient,
  ItemOperationResult,
  UseItemResult,
} from "@/services/inventoryClient";

/**
 * Inventory filter options
 */
export interface InventoryFilters {
  itemType?: string; // 'Stackable', 'Unique', 'Armor', 'Weapon', etc.
  rarity?: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  slotCompatibility?: string; // SlotType filter
  includeEquipped?: boolean;
}

/**
 * Sort configuration
 */
export interface SortOption {
  field: "name" | "rarity" | "type" | "quantity" | "dateAdded";
  order: "asc" | "desc";
}

/**
 * Return type for useInventory hook
 */
export interface UseInventoryReturn {
  // Data - typed as 'any' until we have generated types from API
  items: any[];
  filteredItems: any[];
  totalCount: number;

  // Pagination
  limit: number;
  offset: number;
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;

  // View and filtering
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  filters: InventoryFilters;
  setFilters: (filters: InventoryFilters) => void;
  sorts: SortOption[];
  setSorts: (sorts: SortOption[]) => void;
  searchText?: string;
  setSearchText: (text?: string) => void;

  // Detail view
  selectedItemId?: string;
  setSelectedItemId: (id?: string) => void;

  // Mutations
  addItem: UseMutationResult<any, Error, { itemId: string; quantity: number }>;
  removeItem: UseMutationResult<ItemOperationResult, Error, string>;
  useItem: UseMutationResult<UseItemResult, Error, string>;

  // State
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for managing inventory state and operations
 *
 * @param adventureId - The adventure ID for which to load inventory
 * @returns Inventory state and operations
 *
 * @example
 * ```tsx
 * const inventory = useInventory('adventure-123');
 *
 * // Access inventory items
 * console.log(inventory.items);
 *
 * // Toggle view mode
 * inventory.setViewMode('list');
 *
 * // Apply filters
 * inventory.setFilters({ rarity: 'Legendary' });
 *
 * // Remove an item
 * inventory.removeItem.mutate('item-id-123');
 * ```
 */
export const useInventory = (adventureId: string): UseInventoryReturn => {
  const queryClient = useQueryClient();

  // Local UI state
  const [viewMode, setViewModeState] = useState<"grid" | "list">(() => {
    // Load from localStorage
    const saved = localStorage.getItem("inventoryViewMode");
    return saved === "grid" || saved === "list" ? saved : "grid";
  });

  const [filters, setFilters] = useState<InventoryFilters>({});
  const [sorts, setSorts] = useState<SortOption[]>([]);
  const [searchText, setSearchText] = useState<string | undefined>();
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Query for inventory data
  const query: UseQueryResult<any, Error> = useQuery({
    queryKey: ["inventory", adventureId, limit, offset],
    queryFn: () => inventoryClient.getInventory(adventureId, limit, offset),
    staleTime: 1000, // 1 second
    refetchInterval: 5000, // 5 second polling for real-time updates
    refetchOnWindowFocus: true,
  });

  // Extract items from response
  const items = query.data?.entries ?? [];
  const totalCount = query.data?.totalEntries ?? 0;

  // Client-side filtering and sorting
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Apply search text filter
    if (searchText && searchText.trim().length > 0) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (entry: any) =>
          entry.item.name.toLowerCase().includes(searchLower) ||
          (entry.item.description &&
            entry.item.description.toLowerCase().includes(searchLower)),
      );
    }

    // Apply type filter
    if (filters.itemType) {
      result = result.filter(
        (entry: any) => entry.item.itemType === filters.itemType,
      );
    }

    // Apply rarity filter
    if (filters.rarity) {
      result = result.filter(
        (entry: any) => entry.item.rarity === filters.rarity,
      );
    }

    // Apply slot compatibility filter
    if (filters.slotCompatibility) {
      result = result.filter(
        (entry: any) =>
          "slotType" in entry.item &&
          entry.item.slotType === filters.slotCompatibility,
      );
    }

    // Apply sorts
    if (sorts.length > 0) {
      result.sort((a: any, b: any) => {
        for (const { field, order } of sorts) {
          let aVal: any, bVal: any;

          switch (field) {
            case "name":
              aVal = a.item.name;
              bVal = b.item.name;
              break;
            case "rarity":
              aVal = a.item.rarity;
              bVal = b.item.rarity;
              break;
            case "type":
              aVal = a.item.itemType;
              bVal = b.item.itemType;
              break;
            case "quantity":
              aVal = a.quantity ?? 0;
              bVal = b.quantity ?? 0;
              break;
            case "dateAdded":
              aVal = new Date(a.addedAt).getTime();
              bVal = new Date(b.addedAt).getTime();
              break;
            default:
              continue;
          }

          if (aVal !== bVal) {
            const comparison = aVal > bVal ? 1 : -1;
            return order === "asc" ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [items, filters, sorts, searchText]);

  // Mutation for adding items
  const addItem = useMutation<any, Error, { itemId: string; quantity: number }>(
    {
      mutationFn: ({
        itemId,
        quantity,
      }: {
        itemId: string;
        quantity: number;
      }) => inventoryClient.addItem(adventureId, itemId, quantity),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inventory", adventureId] });
      },
    },
  );

  // Mutation for removing items
  const removeItem = useMutation<ItemOperationResult, Error, string>({
    mutationFn: (entryId: string) =>
      inventoryClient.removeItem(adventureId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", adventureId] });
    },
  });

  // Mutation for using items
  const useItem = useMutation<UseItemResult, Error, string>({
    mutationFn: (entryId: string) =>
      inventoryClient.useItem(adventureId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", adventureId] });
    },
  });

  // Persist view mode to localStorage
  const setViewMode = (mode: "grid" | "list") => {
    setViewModeState(mode);
    localStorage.setItem("inventoryViewMode", mode);
  };

  return {
    // Data
    items,
    filteredItems,
    totalCount,

    // Pagination
    limit,
    offset,
    setLimit,
    setOffset,

    // View and filtering
    viewMode,
    setViewMode,
    filters,
    setFilters,
    sorts,
    setSorts,
    searchText,
    setSearchText,

    // Detail view
    selectedItemId,
    setSelectedItemId,

    // Mutations
    addItem,
    removeItem,
    useItem,

    // State
    isLoading: query.isLoading,
    error: query.error,
  };
};
