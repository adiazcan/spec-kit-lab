/**
 * InventoryItem Component
 *
 * Shared item renderer that supports both grid and list view modes.
 * Displays item icons, names, quantities, rarity indicators, and tooltips.
 * Uses useItemTooltip hook for hover tooltip with 300ms delay.
 *
 * @module components/InventoryUI/InventoryItem
 */

import React from "react";
import { useItemTooltip } from "@/hooks/useItemTooltip";
import { ItemTooltip } from "@/components/ItemTooltip";
import { isEquippableItem } from "@/types/inventory";

export interface InventoryItemProps {
  /**
   * Inventory entry data
   */
  entry: any;

  /**
   * Whether this item is currently selected
   */
  isSelected: boolean;

  /**
   * View mode for rendering
   */
  viewMode: "grid" | "list";

  /**
   * Callback when item is clicked
   */
  onClick: () => void;

  /**
   * Optional drag start handler for drag-and-drop support
   */
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;

  /**
   * Optional drag end handler for drag-and-drop support
   */
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Rarity color mapping for visual indicators
 */
const rarityColors: Record<string, string> = {
  Common: "bg-gray-400 text-gray-900",
  Uncommon: "bg-green-500 text-white",
  Rare: "bg-blue-500 text-white",
  Epic: "bg-purple-500 text-white",
  Legendary: "bg-amber-500 text-white",
};

/**
 * Shared inventory item component for both grid and list views
 *
 * Features:
 * - Tooltip on hover (300ms delay)
 * - Rarity color coding
 * - Stack quantity display for stackable items
 * - Keyboard navigation support
 * - Drag-and-drop support (optional)
 *
 * @example
 * ```tsx
 * <InventoryItem
 *   entry={entry}
 *   isSelected={selectedId === entry.id}
 *   viewMode="grid"
 *   onClick={handleItemClick}
 * />
 * ```
 */
export const InventoryItem: React.FC<InventoryItemProps> = ({
  entry,
  isSelected,
  viewMode,
  onClick,
  onDragStart,
  onDragEnd,
  className = "",
}) => {
  const tooltip = useItemTooltip(300); // 300ms delay per spec requirement FR-009
  const { item, quantity } = entry;
  const canDrag = !!onDragStart && isEquippableItem(item);

  // Grid view rendering
  if (viewMode === "grid") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        onMouseEnter={tooltip.handleMouseEnter}
        onMouseLeave={tooltip.handleMouseLeave}
        onMouseMove={tooltip.handleMouseMove}
        draggable={canDrag}
        onDragStart={canDrag ? onDragStart : undefined}
        onDragEnd={canDrag ? onDragEnd : undefined}
        className={`
          relative p-3 rounded-lg border-2 cursor-pointer transition-all
          ${
            isSelected
              ? "border-blue-600 bg-blue-50 shadow-md"
              : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
          }
          ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}
          focus:outline-2 focus:outline-offset-2 focus:outline-blue-500
          ${className}
        `}
        aria-label={`${item.name}${quantity > 1 ? ` (${quantity})` : ""}, ${item.rarity} ${item.itemType}`}
      >
        {/* Item icon placeholder */}
        <div className="w-full aspect-square bg-gray-200 rounded flex items-center justify-center mb-2">
          <span className="text-3xl">📦</span>
        </div>

        {/* Item name */}
        <div className="text-xs font-medium text-gray-900 truncate text-center">
          {item.name}
        </div>

        {/* Rarity indicator (colored dot) */}
        <div
          className={`absolute top-1 left-1 w-2 h-2 rounded-full ${rarityColors[item.rarity] || "bg-gray-400"}`}
        />

        {/* Stack quantity badge */}
        {quantity > 1 && (
          <div className="absolute bottom-1 right-1 bg-black text-white text-xs rounded px-2 py-1 font-bold shadow">
            {quantity}
            {item.maxStackSize && quantity >= item.maxStackSize && (
              <span className="text-yellow-400 ml-1">MAX</span>
            )}
          </div>
        )}

        {/* Tooltip using hook and component */}
        {tooltip.showTooltip && (
          <ItemTooltip item={entry} position={tooltip.tooltipPosition} />
        )}
      </div>
    );
  }

  // List view rendering (handled by InventoryList component itself)
  // This component is primarily used in grid view, list view has inline rendering
  return null;
};
