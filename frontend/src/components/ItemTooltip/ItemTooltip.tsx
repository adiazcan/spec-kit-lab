/**
 * ItemTooltip Component
 *
 * Quick-info tooltip displayed on hover over inventory items.
 * Shows essential item information: name, type, rarity, quantity, and key stats.
 * Positioned relative to the item element with automatic edge avoidance.
 *
 * @module components/ItemTooltip/ItemTooltip
 */

import React, { useMemo } from "react";
import type { InventoryEntry } from "@/types/inventory";

/**
 * Position options for tooltip relative to the trigger element
 */
export type TooltipPosition = "top" | "bottom" | "left" | "right";

/**
 * Props for ItemTooltip component
 */
export interface ItemTooltipProps {
  /**
   * The inventory entry to display in the tooltip
   */
  item: InventoryEntry;

  /**
   * Position relative to the trigger element
   * @default "top"
   */
  position?: "top" | "bottom" | "left" | "right";

  /**
   * Additional CSS classes for styling
   */
  className?: string;
}

/**
 * Rarity color mapping for visual distinction
 */
const RARITY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Common: {
    bg: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-300",
  },
  Uncommon: {
    bg: "bg-green-50",
    text: "text-green-900",
    border: "border-green-300",
  },
  Rare: {
    bg: "bg-blue-50",
    text: "text-blue-900",
    border: "border-blue-300",
  },
  Epic: {
    bg: "bg-purple-50",
    text: "text-purple-900",
    border: "border-purple-300",
  },
  Legendary: {
    bg: "bg-yellow-50",
    text: "text-yellow-900",
    border: "border-yellow-300",
  },
};

/**
 * Get position classes for tooltip placement
 */
const getPositionClasses = (position: string): string => {
  const baseClasses =
    "absolute z-50 pointer-events-none transform -translate-x-1/2";

  switch (position) {
    case "bottom":
      return `${baseClasses} top-full left-1/2 mt-2`;
    case "left":
      return `${baseClasses} top-1/2 right-full -translate-y-1/2 mr-2 -translate-x-0 translate-x-0`;
    case "right":
      return `${baseClasses} top-1/2 left-full -translate-y-1/2 ml-2 translate-x-0`;
    case "top":
    default:
      return `${baseClasses} bottom-full left-1/2 mb-2`;
  }
};

/**
 * Arrow position for tooltip pointer
 */
const getArrowClasses = (position: string): string => {
  const baseClasses = "absolute w-0 h-0 border-4 border-transparent";

  switch (position) {
    case "bottom":
      return `${baseClasses} -top-2 left-1/2 -translate-x-1/2 border-b-gray-800`;
    case "left":
      return `${baseClasses} top-1/2 -right-2 -translate-y-1/2 border-l-gray-800`;
    case "right":
      return `${baseClasses} top-1/2 -left-2 -translate-y-1/2 border-r-gray-800`;
    case "top":
    default:
      return `${baseClasses} -bottom-2 left-1/2 -translate-x-1/2 border-t-gray-800`;
  }
};

/**
 * ItemTooltip Component
 *
 * Displays a quick information tooltip with:
 * - Item name and rarity badge
 * - Item type and description
 * - Quantity information (for stackable items)
 * - Key stats and modifiers (for equippable items)
 * - Slot compatibility (for equippable items)
 *
 * @example
 * ```tsx
 * {showTooltip && (
 *   <ItemTooltip
 *     item={inventoryEntry}
 *     position="top"
 *     mousePosition={{ x: 100, y: 200 }}
 *   />
 * )}
 * ```
 */
export const ItemTooltip: React.FC<ItemTooltipProps> = ({
  item,
  position = "top",
  className = "",
}) => {
  const { itemData, rarityColor } = useMemo(() => {
    const itemObj = (item as any)?.item || (item as any);
    const rarity = itemObj?.rarity || "Common";
    return {
      itemData: itemObj,
      rarityColor: RARITY_COLORS[rarity] || RARITY_COLORS.Common,
    };
  }, [item]);

  if (!itemData) {
    return null;
  }

  const isStackable = itemData.itemType === "Stackable";
  const isEquippable = itemData.slotType != null;
  const hasDescription =
    itemData.description && itemData.description.length > 0;
  const quantity = (item as any)?.quantity || 1;
  const maxStackSize = itemData.maxStackSize || 0;

  return (
    <div
      className={`${getPositionClasses(position)} ${className}`}
      role="tooltip"
    >
      <div
        className={`
          ${rarityColor.bg}
          ${rarityColor.border}
          rounded-lg border px-3 py-2
          shadow-lg min-w-max max-w-xs
          text-sm
        `}
      >
        {/* Header: Name and Rarity Badge */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={`font-semibold ${rarityColor.text}`}>
            {itemData.name || "Unknown Item"}
          </h4>
          <span
            className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${rarityColor.bg} ${rarityColor.text} ${rarityColor.border} border
            `}
          >
            {itemData.rarity || "Common"}
          </span>
        </div>

        {/* Item Type */}
        <p className="text-xs text-gray-600 mb-2">
          {itemData.itemType || "Unknown"}
          {isEquippable && itemData.slotType && <> • {itemData.slotType}</>}
        </p>

        {/* Description */}
        {hasDescription && (
          <p className="text-xs text-gray-700 mb-2 line-clamp-2">
            {itemData.description}
          </p>
        )}

        {/* Quantity (for stackable items) */}
        {isStackable && (
          <div className="text-xs text-gray-600 mb-2 pt-1 border-t border-gray-300">
            Quantity: <span className="font-semibold">{quantity}</span>
            {maxStackSize > 0 && <> / {maxStackSize}</>}
          </div>
        )}

        {/* Stats/Modifiers (for equippable items) */}
        {isEquippable &&
          itemData.modifiers &&
          (itemData.modifiers as any[]).length > 0 && (
            <div className="text-xs text-gray-600 pt-1 border-t border-gray-300">
              <p className="font-semibold text-gray-700 mb-0.5">Stats:</p>
              <ul className="space-y-0.5">
                {(itemData.modifiers as any[])
                  .slice(0, 3)
                  .map((mod: any, idx: number) => (
                    <li key={idx}>
                      {mod.statName}:{" "}
                      <span className="font-semibold text-green-700">
                        +{mod.value}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

        {/* Arrow pointer */}
        <div className={getArrowClasses(position)} />
      </div>
    </div>
  );
};

export default ItemTooltip;
