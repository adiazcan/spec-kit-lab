/**
 * Equipment Slot Component
 *
 * Displays a single equipment slot with empty state, equipped item, and interactions.
 * Supports drag-and-drop, unequip buttons, and visual feedback for drag operations.
 */

import { useState, useCallback } from "react";
import type { EquippedItem } from "@/types/equipment";
import { getSlotLabel, getSlotIcon } from "@/types/equipment";
import type { SlotType } from "@/types/inventory";

interface EquipmentSlotProps {
  slotType: SlotType;
  equippedItem: EquippedItem | null;
  onUnequip?: () => void;
  onDrop?: (itemId: string) => void;
  onDragStart?: (
    e: React.DragEvent<HTMLDivElement>,
    slotType: SlotType,
    item: any,
  ) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOverSlot?: (
    e: React.DragEvent<HTMLDivElement>,
    slotType: SlotType,
  ) => void;
  onDragLeaveSlot?: (
    e: React.DragEvent<HTMLDivElement>,
    slotType: SlotType,
  ) => void;
  isDragOver?: boolean;
  isDropAllowed?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * EquipmentSlot Component
 *
 * Renders a single equipment slot with support for:
 * - Empty slot state with icon and label
 * - Equipped item display with icon and name
 * - Unequip button (fallback for accessibility)
 * - Drag-and-drop feedback (highlight on hover)
 * - Loading state during mutations
 *
 * @example
 * <EquipmentSlot
 *   slotType="Head"
 *   equippedItem={headItem}
 *   onUnequip={handleUnequip}
 *   onDrop={handleDrop}
 *   isDragOver={isDragOver}
 *   isLoading={isLoading}
 * />
 */
export function EquipmentSlot({
  slotType,
  equippedItem,
  onUnequip,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragOverSlot,
  onDragLeaveSlot,
  isDragOver = false,
  isDropAllowed = false,
  isLoading = false,
  disabled = false,
  showLabel = true,
}: EquipmentSlotProps) {
  const [localDragOver, setLocalDragOver] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const isOver = isDragOver || localDragOver;

  const slotLabel = getSlotLabel(slotType);
  const slotIcon = getSlotIcon(slotType);

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setLocalDragOver(true);
      onDragOverSlot?.(e, slotType);
    },
    [onDragOverSlot, slotType],
  );

  // Handle drag leave
  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setLocalDragOver(false);
      onDragLeaveSlot?.(e, slotType);
    },
    [onDragLeaveSlot, slotType],
  );

  // Handle drag start from equipped item
  const handleItemDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!equippedItem) return;
      e.stopPropagation();
      onDragStart?.(e, slotType, equippedItem.item);
    },
    [equippedItem, slotType, onDragStart],
  );

  // Handle drag end from equipped item
  const handleItemDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation();
      onDragEnd?.(e);
    },
    [onDragEnd],
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setLocalDragOver(false);
      onDragLeaveSlot?.(e, slotType);

      if (!isDropAllowed) {
        setIsRejected(true);
        window.setTimeout(() => setIsRejected(false), 800);
        return;
      }

      // Get the item ID from drag data
      const itemId = e.dataTransfer.getData("application/json");
      if (itemId && onDrop && !disabled && !isLoading) {
        try {
          const data = JSON.parse(itemId);
          onDrop(data.itemId);
        } catch {
          // If not JSON, treat as plain item ID
          onDrop(itemId);
        }
      }
    },
    [onDrop, disabled, isLoading, isDropAllowed, onDragLeaveSlot, slotType],
  );

  // Get rarity color class
  const getRarityClass = (rarity?: string | null): string => {
    const rarityColors: Record<string, string> = {
      Common: "border-gray-400 bg-gray-50",
      Uncommon: "border-green-500 bg-green-50",
      Rare: "border-blue-500 bg-blue-50",
      Epic: "border-purple-500 bg-purple-50",
      Legendary: "border-yellow-500 bg-yellow-50",
    };
    return rarityColors[rarity ?? "Common"] || rarityColors.Common;
  };

  return (
    <div
      className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all duration-200 ${
        isOver
          ? isDropAllowed
            ? "border-blue-400 bg-blue-100 shadow-lg"
            : "border-red-400 bg-red-100 shadow-lg"
          : equippedItem
            ? getRarityClass(equippedItem.item.rarity)
            : "border-gray-300 bg-gray-100"
      } ${disabled ? "opacity-50" : ""} ${
        isLoading ? "cursor-progress" : "cursor-pointer"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label={`Equipment slot: ${slotLabel}`}
      tabIndex={0}
    >
      {/* Slot Icon and Label */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-3xl">{slotIcon}</div>
        {showLabel && (
          <div className="text-xs font-semibold text-gray-700">{slotLabel}</div>
        )}
      </div>

      {/* Equipped Item or Empty State */}
      {equippedItem ? (
        <div
          className="w-full cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={handleItemDragStart}
          onDragEnd={handleItemDragEnd}
          title="Drag to inventory to unequip"
        >
          {/* Equipped Item Display */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center rounded bg-white p-2">
              <span className="text-2xl">
                {(equippedItem.item.rarity ?? "Common") === "Legendary"
                  ? "👑"
                  : (equippedItem.item.rarity ?? "Common") === "Epic"
                    ? "✨"
                    : (equippedItem.item.rarity ?? "Common") === "Rare"
                      ? "💎"
                      : (equippedItem.item.rarity ?? "Common") === "Uncommon"
                        ? "⭐"
                        : "📦"}
              </span>
            </div>

            <div className="line-clamp-2 text-center text-sm font-medium">
              {equippedItem.item.name}
            </div>

            {/* Unequip Button (Accessibility Alternative) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnequip?.();
              }}
              disabled={isLoading || disabled}
              className="mt-2 w-full rounded bg-white/50 px-2 py-1 text-xs font-medium text-gray-700 transition-all hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Unequip item from ${slotLabel}`}
              title="Unequip this item (or drag back to inventory)"
            >
              Unequip
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-xs text-gray-600">Empty</div>
          <div className="text-xs text-gray-500">
            Drag item here or click to equip
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Drag Over Hint */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-400/20">
          <div
            className={`text-center text-sm font-semibold ${
              isDropAllowed ? "text-blue-700" : "text-red-700"
            }`}
          >
            {isDropAllowed ? "Drop here" : "Invalid slot"}
          </div>
        </div>
      )}

      {/* Rejection Indicator */}
      {isRejected && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500/20">
          <div className="text-center text-xs font-semibold text-red-700">
            Cannot equip here
          </div>
        </div>
      )}

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 rounded-lg bg-gray-400/20" />
      )}
    </div>
  );
}

/**
 * EquipmentSlotEmpty Component
 *
 * Simplified empty slot component for use in list/matrix layouts
 */
export function EquipmentSlotEmpty({
  slotType,
  onClick,
  disabled = false,
}: {
  slotType: SlotType;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const slotLabel = getSlotLabel(slotType);
  const slotIcon = getSlotIcon(slotType);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        disabled ? "" : "cursor-pointer"
      }`}
      aria-label={`Equip item to ${slotLabel}`}
      title={`Click to equip item to ${slotLabel} or drag from inventory`}
    >
      <div className="text-3xl">{slotIcon}</div>
      <div className="text-xs font-semibold text-gray-500">{slotLabel}</div>
      <div className="text-xs text-gray-400">Empty</div>
    </button>
  );
}

/**
 * EquipmentSlotSkeleton Component
 *
 * Loading skeleton for equipment slot
 */
export function EquipmentSlotSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-gray-300 bg-gray-100 p-4">
      <div className="h-8 w-8 animate-pulse rounded bg-gray-300" />
      <div className="h-4 w-16 animate-pulse rounded bg-gray-300" />
      <div className="h-10 w-full animate-pulse rounded bg-gray-300" />
    </div>
  );
}
