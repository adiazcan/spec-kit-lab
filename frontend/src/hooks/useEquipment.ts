/**
 * Equipment State Management Hook
 *
 * Provides equipment state, mutations, and handlers for equipping/unequipping items.
 * Manages character equipment slots, stat modifiers, and equipment operations.
 */

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EquippedItem, StatModifierSummary } from "@/types/equipment";
import { calculateTotalModifiers } from "@/types/equipment";
import type { SlotType } from "@/types/inventory";
import { equipmentClient } from "@/services/equipmentClient";

/**
 * Return type for useEquipment hook
 */
export interface UseEquipmentReturn {
  // Data
  equippedItems: Record<SlotType, EquippedItem | null>;
  statModifiers: StatModifierSummary;

  // Selected slot
  selectedSlot?: SlotType;
  setSelectedSlot: (slot?: SlotType) => void;

  // Mutations
  equipItem: {
    mutate: (params: { itemId: string; slotType: SlotType }) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
  unequipItem: {
    mutate: (slotType: SlotType) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
  swapItem: {
    mutate: (params: { itemId: string; slotType: SlotType }) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };

  // State
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing character equipment
 *
 * Provides read-only access to equipped items and mutations for equipping/unequipping.
 * Uses React Query for data fetching and caching with automatic refetch on mutations.
 *
 * @param adventureId - The adventure ID to load equipment for
 * @returns Equipment state, mutations, and handlers
 *
 * @example
 * const equipment = useEquipment(adventureId);
 * if (equipment.isLoading) return <div>Loading...</div>;
 *
 * return (
 *   <div>
 *     {equipment.equippedItems.Map.MainHand?.item.name}
 *     <button onClick={() => equipment.equipItem.mutate({ itemId: 'item123', slotType: 'Head' })}>
 *       Equip
 *     </button>
 *   </div>
 * );
 */
export function useEquipment(adventureId: string): UseEquipmentReturn {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<SlotType>();

  // Query: Get all equipped items
  const {
    data: equippedItemsResponse,
    isLoading: isLoadingEquipped,
    error: equipmentError,
  } = useQuery({
    queryKey: ["equipment", adventureId],
    queryFn: async () => {
      const response = await equipmentClient.getEquippedItems(adventureId);
      return response;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute (previously called cacheTime)
  });

  // Default to empty equipped items if not loaded
  const equippedItems: Record<SlotType, EquippedItem | null> = useMemo(() => {
    if (!equippedItemsResponse?.equippedItems) {
      return {
        Head: null,
        Chest: null,
        Hands: null,
        Legs: null,
        Feet: null,
        MainHand: null,
        OffHand: null,
      };
    }
    return equippedItemsResponse.equippedItems;
  }, [equippedItemsResponse]);

  // Calculate total stat modifiers from equipped items
  const statModifiers: StatModifierSummary =
    calculateTotalModifiers(equippedItems);

  // Mutation: Equip an item
  const equipItemMutation = useMutation({
    mutationFn: async (params: { itemId: string; slotType: SlotType }) => {
      const result = await equipmentClient.equipItem(
        adventureId,
        params.itemId,
        params.slotType,
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to equip item");
      }

      return result;
    },
    onSuccess: () => {
      // Refetch equipment data after successful equip
      queryClient.invalidateQueries({
        queryKey: ["equipment", adventureId],
      });

      // Also refetch inventory since unequipped item goes to inventory
      queryClient.invalidateQueries({
        queryKey: ["inventory", adventureId],
      });
    },
    onError: (error: Error) => {
      console.error("Error equipping item:", error);
    },
  });

  // Mutation: Unequip an item
  const unequipItemMutation = useMutation({
    mutationFn: async (slotType: SlotType) => {
      const result = await equipmentClient.unequipItem(adventureId, slotType);

      if (!result.success) {
        throw new Error(result.error || "Failed to unequip item");
      }

      return result;
    },
    onSuccess: () => {
      // Refetch equipment data after successful unequip
      queryClient.invalidateQueries({
        queryKey: ["equipment", adventureId],
      });

      // Also refetch inventory since unequipped item goes to inventory
      queryClient.invalidateQueries({
        queryKey: ["inventory", adventureId],
      });

      // Clear selected slot if it was unequipped
      setSelectedSlot(undefined);
    },
    onError: (error: Error) => {
      console.error("Error unequipping item:", error);
    },
  });

  // Mutation: Swap items (equip from inventory, unequip current)
  const swapItemMutation = useMutation({
    mutationFn: async (params: { itemId: string; slotType: SlotType }) => {
      const result = await equipmentClient.swapItem(
        adventureId,
        params.itemId,
        params.slotType,
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to swap item");
      }

      return result;
    },
    onSuccess: () => {
      // Refetch both equipment and inventory after successful swap
      queryClient.invalidateQueries({
        queryKey: ["equipment", adventureId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inventory", adventureId],
      });
    },
    onError: (error: Error) => {
      console.error("Error swapping item:", error);
    },
  });

  // Determine overall loading and error state
  const isLoading = isLoadingEquipped;
  const error = (equipmentError as Error) || null;

  return {
    // Data
    equippedItems,
    statModifiers,

    // Selected slot
    selectedSlot,
    setSelectedSlot,

    // Mutations with simplified interface
    equipItem: {
      mutate: equipItemMutation.mutate,
      isPending: equipItemMutation.isPending,
      isError: equipItemMutation.isError,
      error: (equipItemMutation.error as Error) || null,
    },
    unequipItem: {
      mutate: unequipItemMutation.mutate,
      isPending: unequipItemMutation.isPending,
      isError: unequipItemMutation.isError,
      error: (unequipItemMutation.error as Error) || null,
    },
    swapItem: {
      mutate: swapItemMutation.mutate,
      isPending: swapItemMutation.isPending,
      isError: swapItemMutation.isError,
      error: (swapItemMutation.error as Error) || null,
    },

    // State
    isLoading,
    error,
  };
}

/**
 * Helper hook to format equipment state for display
 */
export function useEquipmentDisplay(equipment: UseEquipmentReturn) {
  return {
    hasEquippedItems: Object.values(equipment.equippedItems).some(
      (item) => item !== null,
    ),
    equippedCount: Object.values(equipment.equippedItems).filter(
      (item) => item !== null,
    ).length,
    emptySlots: Object.values(equipment.equippedItems).filter(
      (item) => item === null,
    ).length,
    totalStatModifiers: equipment.statModifiers,
  };
}
