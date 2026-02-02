/**
 * Equipment Slots Grid Component
 *
 * Displays all seven equipment slots in an organized layout.
 * Shows equipped items or empty states for each slot.
 */

import { useCallback, useMemo } from "react";
import type { EquippedItem } from "@/types/equipment";
import { EQUIPMENT_SLOTS } from "@/types/equipment";
import { EquipmentSlot } from "./EquipmentSlot";
import type { SlotType } from "@/types/inventory";

interface EquipmentSlotsProps {
  equippedItems: Record<SlotType, EquippedItem | null>;
  onUnequip?: (slotType: SlotType) => void;
  onDrop?: (itemId: string, slotType: SlotType) => void;
  onDragStart?: (
    e: React.DragEvent<HTMLDivElement>,
    slotType: SlotType,
    item: any,
  ) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  selectedSlot?: SlotType;
  onSelectSlot?: (slotType: SlotType) => void;
  isDragging?: boolean;
  draggedItemId?: string;
  hoverSlotType?: SlotType;
  validDropZones?: Set<SlotType>;
  onDragOverSlot?: (
    e: React.DragEvent<HTMLDivElement>,
    slotType: SlotType,
  ) => void;
  onDragLeaveSlot?: (
    e: React.DragEvent<HTMLDivElement>,
    slotType: SlotType,
  ) => void;
  isLoading?: boolean;
  disabled?: boolean;
  layout?: "grid" | "compact" | "horizontal";
}

/**
 * EquipmentSlots Component
 *
 * Renders all seven equipment slots with support for:
 * - Full grid layout (3 columns on desktop)
 * - Compact layout (2 columns mobile-friendly)
 * - Horizontal strip layout
 * - Drag-and-drop between inventory and equipment
 * - Selected slot highlighting
 * - Loading states
 *
 * @example
 * <EquipmentSlots
 *   equippedItems={equipment.equippedItems}
 *   onUnequip={(slotType) => equipment.unequipItem.mutate(slotType)}
 *   onDrop={(itemId, slotType) => equipment.equipItem.mutate({ itemId, slotType })}
 *   selectedSlot={equipment.selectedSlot}
 *   onSelectSlot={equipment.setSelectedSlot}
 * />
 */
export function EquipmentSlots({
  equippedItems,
  onUnequip,
  onDrop,
  onDragStart,
  onDragEnd,
  selectedSlot,
  onSelectSlot,
  isDragging = false,
  draggedItemId,
  hoverSlotType,
  validDropZones,
  onDragOverSlot,
  onDragLeaveSlot,
  isLoading = false,
  disabled = false,
  layout = "grid",
}: EquipmentSlotsProps) {
  // Memoize the slots to avoid unnecessary re-renders
  const slots = useMemo(() => EQUIPMENT_SLOTS, []);

  // Handle equip action
  const handleUnequip = useCallback(
    (slotType: SlotType) => {
      onUnequip?.(slotType);
    },
    [onUnequip],
  );

  // Handle drop action
  const handleDrop = useCallback(
    (itemId: string, slotType: SlotType) => {
      onDrop?.(itemId, slotType);
    },
    [onDrop],
  );

  // Handle slot selection
  const handleSelectSlot = useCallback(
    (slotType: SlotType) => {
      onSelectSlot?.(slotType);
    },
    [onSelectSlot],
  );

  // Determine grid class based on layout
  const gridClass = {
    grid: "grid grid-cols-3 gap-4 max-w-2xl",
    compact: "grid grid-cols-2 gap-3 max-w-lg sm:grid-cols-3",
    horizontal: "flex flex-wrap gap-3 justify-center",
  }[layout];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Equipment</h3>
        <div className="text-sm text-gray-600">
          {Object.values(equippedItems).filter((item) => item !== null).length}{" "}
          / {slots.length} slots
        </div>
      </div>

      {/* Equipment Grid */}
      <div className={gridClass} role="region" aria-label="Equipment slots">
        {slots.map((slot) => (
          <button
            key={slot.type}
            onClick={() => handleSelectSlot(slot.type)}
            className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all ${
              selectedSlot === slot.type
                ? "ring-2 ring-blue-500 ring-offset-2"
                : ""
            }`}
            disabled={isLoading || disabled}
          >
            <EquipmentSlot
              slotType={slot.type}
              equippedItem={equippedItems[slot.type] ?? null}
              onUnequip={() => handleUnequip(slot.type)}
              onDrop={(itemId) => handleDrop(itemId, slot.type)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOverSlot={onDragOverSlot}
              onDragLeaveSlot={onDragLeaveSlot}
              isDragOver={isDragging && hoverSlotType === slot.type}
              isDropAllowed={
                isDragging &&
                draggedItemId !== undefined &&
                (validDropZones?.has(slot.type) ?? false)
              }
              isLoading={isLoading}
              disabled={disabled}
            />
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <EquipmentSummary equippedItems={equippedItems} />

      {/* Drag Hint */}
      {isDragging && (
        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
          ✨ Drag an inventory item over any slot to equip it
        </div>
      )}
    </div>
  );
}

/**
 * Equipment Summary Component
 *
 * Shows aggregate information about equipped items and stat modifiers
 */
export function EquipmentSummary({
  equippedItems,
}: {
  equippedItems: Record<SlotType, EquippedItem | null>;
}) {
  // Calculate stats
  const stats = useMemo(() => {
    const equipped = Object.values(equippedItems).filter(
      (item) => item !== null,
    ) as EquippedItem[];

    const modifiers: Record<string, number> = {};

    equipped.forEach((equippedItem) => {
      if (
        "modifiers" in equippedItem.item &&
        Array.isArray(equippedItem.item.modifiers)
      ) {
        (
          equippedItem.item.modifiers as Array<{
            statName: string;
            value: number;
          }>
        ).forEach((mod) => {
          modifiers[mod.statName] = (modifiers[mod.statName] ?? 0) + mod.value;
        });
      }
    });

    return {
      equippedCount: equipped.length,
      totalValue: equipped.reduce((sum, item) => {
        return sum + (("value" in item.item && (item.item as any).value) || 0);
      }, 0),
      modifiers,
    };
  }, [equippedItems]);

  // No stats to show
  if (stats.equippedCount === 0 || Object.keys(stats.modifiers).length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-4">
      <h4 className="text-sm font-semibold text-gray-900">
        Stat Modifiers from Equipment
      </h4>

      {Object.entries(stats.modifiers).length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {Object.entries(stats.modifiers).map(([stat, value]) => (
            <div
              key={stat}
              className="rounded bg-white px-3 py-2 text-sm text-gray-700"
            >
              <div className="font-medium">{stat}</div>
              <div
                className={`text-lg font-bold ${
                  value > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {value > 0 ? "+" : ""}
                {value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-600">No stat modifiers active</div>
      )}
    </div>
  );
}

/**
 * Equipment Slots Compact Component
 *
 * Minimal equipment slots display for sidebars or compact layouts
 */
export function EquipmentSlotsCompact({
  equippedItems,
  onSelectSlot,
  selectedSlot,
}: {
  equippedItems: Record<SlotType, EquippedItem | null>;
  onSelectSlot?: (slotType: SlotType) => void;
  selectedSlot?: SlotType;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">Equipment</h4>

      <div className="space-y-2">
        {EQUIPMENT_SLOTS.map((slot) => {
          const item = equippedItems[slot.type];
          const isSelected = selectedSlot === slot.type;

          return (
            <button
              key={slot.type}
              onClick={() => onSelectSlot?.(slot.type)}
              className={`w-full rounded px-3 py-2 text-left text-sm transition-all ${
                isSelected
                  ? "bg-blue-100 text-blue-900 ring-1 ring-blue-300"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{slot.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{slot.label}</div>
                  {item ? (
                    <div className="truncate text-xs text-gray-600">
                      {item.item.name}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Empty</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Equipment Slots Skeleton Component
 *
 * Loading skeleton for equipment slots grid
 */
export function EquipmentSlotsSkeleton({
  layout = "grid",
}: {
  layout?: "grid" | "compact" | "horizontal";
}) {
  const gridClass = {
    grid: "grid grid-cols-3 gap-4 max-w-2xl",
    compact: "grid grid-cols-2 gap-3 max-w-lg",
    horizontal: "flex flex-wrap gap-3",
  }[layout];

  return (
    <div className={gridClass}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-300" />
      ))}
    </div>
  );
}
