/**
 * useDragDrop Hook
 *
 * Manages drag-and-drop state for inventory/equipment interactions.
 * Provides handlers and computed drop zone validity for equipment slots.
 *
 * @module hooks/useDragDrop
 */

import { useCallback, useState } from "react";
import type { InventoryEntry } from "@/types/inventory";
import type { SlotType } from "@/types/inventory";
import { isEquippableItem, isValidSlotType } from "@/types/inventory";

export type DragSource = "inventory" | "equipment";

export interface UseDragDropReturn {
  isDragging: boolean;
  draggedItemId?: string;
  dragSource?: DragSource;
  hoverSlotType?: SlotType;
  isHoveringInventory?: boolean;
  validDropZones: Set<SlotType>;
  handleDragStart: (
    e: React.DragEvent<HTMLElement>,
    entry: InventoryEntry,
    source?: DragSource,
  ) => void;
  handleDragStartFromEquipment: (
    e: React.DragEvent<HTMLElement>,
    slotType: SlotType,
    item: any,
  ) => void;
  handleDragOver: (
    e: React.DragEvent<HTMLElement>,
    slotType?: SlotType,
  ) => void;
  handleDragOverInventory: (e: React.DragEvent<HTMLElement>) => void;
  handleDragLeave: (
    e: React.DragEvent<HTMLElement>,
    slotType?: SlotType,
  ) => void;
  handleDragLeaveInventory: (e: React.DragEvent<HTMLElement>) => void;
  handleDragEnd: (e: React.DragEvent<HTMLElement>) => void;
  reset: () => void;
  canDropOnSlot: (slotType: SlotType) => boolean;
  canDropOnInventory: () => boolean;
}

const EMPTY_SET = new Set<SlotType>();

/**
 * Hook for drag-and-drop state management.
 */
export const useDragDrop = (): UseDragDropReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | undefined>();
  const [dragSource, setDragSource] = useState<DragSource | undefined>();
  const [hoverSlotType, setHoverSlotType] = useState<SlotType | undefined>();
  const [isHoveringInventory, setIsHoveringInventory] = useState(false);
  const [validDropZones, setValidDropZones] =
    useState<Set<SlotType>>(EMPTY_SET);

  const reset = useCallback(() => {
    setIsDragging(false);
    setDraggedItemId(undefined);
    setDragSource(undefined);
    setHoverSlotType(undefined);
    setIsHoveringInventory(false);
    setValidDropZones(EMPTY_SET);
  }, []);

  const handleDragStart = useCallback(
    (
      e: React.DragEvent<HTMLElement>,
      entry: InventoryEntry,
      source: DragSource = "inventory",
    ) => {
      if (!entry?.id) return;

      const itemId = entry.id;

      const item = entry.item as any;
      const equippable = isEquippableItem(item);
      const slotType = equippable ? item.slotType : undefined;
      const zones = slotType ? new Set<SlotType>([slotType]) : EMPTY_SET;

      setIsDragging(true);
      setDraggedItemId(itemId);
      setDragSource(source);
      setHoverSlotType(undefined);
      setValidDropZones(zones);

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          itemId,
          source,
          slotType: slotType ?? null,
        }),
      );
      e.dataTransfer.setData("text/plain", itemId);
    },
    [],
  );

  /**
   * Handle drag start from equipment slot to unequip back to inventory
   */
  const handleDragStartFromEquipment = useCallback(
    (e: React.DragEvent<HTMLElement>, slotType: SlotType, item: any) => {
      setIsDragging(true);
      setDraggedItemId(item?.id);
      setDragSource("equipment");
      setHoverSlotType(undefined);
      setValidDropZones(EMPTY_SET); // Equipment items can only drop on inventory area

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          itemId: item?.id,
          source: "equipment",
          slotType,
        }),
      );
      e.dataTransfer.setData("text/plain", item?.id ?? "");
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLElement>, slotType?: SlotType) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (slotType && isValidSlotType(slotType)) {
        setHoverSlotType(slotType);
        setIsHoveringInventory(false);
      } else {
        setHoverSlotType(undefined);
      }
    },
    [],
  );

  /**
   * Handle drag over inventory area for unequipping
   */
  const handleDragOverInventory = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsHoveringInventory(true);
      setHoverSlotType(undefined);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (_e: React.DragEvent<HTMLElement>, slotType?: SlotType) => {
      if (!slotType || hoverSlotType === slotType) {
        setHoverSlotType(undefined);
      }
    },
    [hoverSlotType],
  );

  /**
   * Handle drag leave from inventory area
   */
  const handleDragLeaveInventory = useCallback(
    (_e: React.DragEvent<HTMLElement>) => {
      setIsHoveringInventory(false);
    },
    [],
  );

  const handleDragEnd = useCallback(
    (_e: React.DragEvent<HTMLElement>) => {
      reset();
    },
    [reset],
  );

  const canDropOnSlot = useCallback(
    (slotType: SlotType) => validDropZones.has(slotType),
    [validDropZones],
  );

  /**
   * Check if we can drop on inventory (when dragging from equipment)
   */
  const canDropOnInventory = useCallback(
    () => dragSource === "equipment" && isDragging,
    [dragSource, isDragging],
  );

  return {
    isDragging,
    draggedItemId,
    dragSource,
    hoverSlotType,
    isHoveringInventory,
    validDropZones,
    handleDragStart,
    handleDragStartFromEquipment,
    handleDragOver,
    handleDragOverInventory,
    handleDragLeave,
    handleDragLeaveInventory,
    handleDragEnd,
    reset,
    canDropOnSlot,
    canDropOnInventory,
  };
};
