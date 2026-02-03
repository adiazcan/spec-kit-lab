/**
 * ItemDetailContent Component
 *
 * Displays full item details including name, stats, requirements, and action buttons.
 * Used within ItemDetailModal or can be rendered standalone.
 * Includes equip/use/drop buttons with appropriate enable/disable states.
 *
 * @module components/ItemDetail/ItemDetailContent
 */

import React, { useMemo } from "react";
import type { InventoryEntry } from "@/types/inventory";

/**
 * Props for ItemDetailContent component
 */
export interface ItemDetailContentProps {
  /**
   * The inventory entry to display
   */
  item: InventoryEntry;

  /**
   * Optional callback for item actions
   */
  onAction?: (action: "equip" | "use" | "drop", item: InventoryEntry) => void;

  /**
   * Optional callback to close parent modal
   */
  onClose?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Rarity color mapping for visual styling
 */
const RARITY_COLORS: Record<
  string,
  { text: string; light: string; badge: string }
> = {
  Common: {
    text: "text-gray-800",
    light: "bg-gray-100",
    badge: "bg-gray-200 text-gray-800",
  },
  Uncommon: {
    text: "text-green-800",
    light: "bg-green-50",
    badge: "bg-green-200 text-green-800",
  },
  Rare: {
    text: "text-blue-800",
    light: "bg-blue-50",
    badge: "bg-blue-200 text-blue-800",
  },
  Epic: {
    text: "text-purple-800",
    light: "bg-purple-50",
    badge: "bg-purple-200 text-purple-800",
  },
  Legendary: {
    text: "text-yellow-800",
    light: "bg-yellow-50",
    badge: "bg-yellow-200 text-yellow-800",
  },
};

/**
 * ItemDetailContent Component
 *
 * Renders comprehensive item information:
 * - Header: Icon, name, type, rarity badge
 * - Description and lore text
 * - Stats/modifiers grid (for equipment)
 * - Stack quantity info (for stackable items)
 * - Slot compatibility (for equipment)
 * - Requirements validation (level, stat requirements)
 * - Action buttons with appropriate states
 *
 * @example
 * ```tsx
 * <ItemDetailContent
 *   item={selectedItem}
 *   onAction={(action, item) => handleAction(action, item)}
 *   onClose={() => setModalOpen(false)}
 * />
 * ```
 */
export const ItemDetailContent: React.FC<ItemDetailContentProps> = ({
  item,
  onAction,
  onClose,
  className = "",
}) => {
  const { itemData, rarity, rarityColor } = useMemo(() => {
    const itemObj = (item as any)?.item || (item as any);
    const r = itemObj?.rarity || "Common";
    return {
      itemData: itemObj,
      rarity: r,
      rarityColor: RARITY_COLORS[r] || RARITY_COLORS.Common,
    };
  }, [item]);

  if (!itemData) {
    return null;
  }

  const isStackable = itemData.itemType === "Stackable";
  const isEquippable = itemData.slotType != null;
  const hasModifiers =
    isEquippable &&
    itemData.modifiers &&
    (itemData.modifiers as any[]).length > 0;
  const level = itemData.level || 1;
  const maxStackSize = itemData.maxStackSize || 1;
  const quantity = (item as any)?.quantity || 1;

  /**
   * Check if item requirements are met
   */
  const requirementsMet = useMemo(() => {
    return itemData.requirementsMet !== false;
  }, [itemData.requirementsMet]);

  /**
   * Handle action button clicks
   */
  const handleAction = (action: "equip" | "use" | "drop") => {
    onAction?.(action, item);
    // Close modal after action (user can re-open if needed)
    onClose?.();
  };

  return (
    <div className={`${rarityColor.light} ${className}`} id="item-detail-title">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start gap-4">
          {/* Item Icon Placeholder */}
          <div
            className={`
              flex-shrink-0 w-20 h-20 rounded-lg
              ${rarityColor.light} border-2 border-gray-300
              flex items-center justify-center
            `}
          >
            <span className="text-3xl">📦</span>
          </div>

          {/* Header Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className={`text-2xl font-bold ${rarityColor.text}`}>
                {itemData.name || "Unknown Item"}
              </h2>
              <span
                className={`
                  inline-flex items-center px-3 py-1 rounded-full
                  text-sm font-semibold
                  ${rarityColor.badge}
                `}
              >
                {rarity}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">
                {itemData.itemType || "Unknown"}
              </span>
              {isEquippable && itemData.slotType && (
                <>
                  {" "}
                  • <span className="font-medium">{itemData.slotType}</span>
                </>
              )}
            </p>

            {/* Quantity Info */}
            {isStackable && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Quantity:</span> {quantity} /{" "}
                {maxStackSize}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      {itemData.description && (
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            {itemData.description}
          </p>
        </div>
      )}

      {/* Stats Section */}
      {hasModifiers && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Stats</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {(itemData.modifiers as any[]).map((modifier: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
              >
                <span className="text-sm font-medium text-gray-700">
                  {modifier.statName}
                </span>
                <span className="text-sm font-bold text-green-600">
                  +{modifier.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirements Section */}
      {isEquippable && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
          <div className="space-y-2">
            <div
              className={`text-sm flex items-center gap-2 ${
                requirementsMet ? "text-green-700" : "text-red-700"
              }`}
            >
              <span className="text-lg">{requirementsMet ? "✓" : "✗"}</span>
              <span>Level {level}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="px-6 py-4 flex gap-3">
        {/* Equip Button (for equipment) */}
        {isEquippable && (
          <button
            onClick={() => handleAction("equip")}
            disabled={!requirementsMet}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium
              transition-colors
              ${
                requirementsMet
                  ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
            type="button"
          >
            Equip
          </button>
        )}

        {/* Use Button (for consumables) */}
        {isStackable && (
          <button
            onClick={() => handleAction("use")}
            className={`
              flex-1 px-4 py-2 rounded-lg font-medium
              bg-green-600 text-white hover:bg-green-700
              transition-colors
              focus:ring-2 focus:ring-green-500 focus:ring-offset-2
            `}
            type="button"
          >
            Use ({quantity} available)
          </button>
        )}

        {/* Drop Button */}
        <button
          onClick={() => handleAction("drop")}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium
            bg-red-600 text-white hover:bg-red-700
            transition-colors
            focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          `}
          type="button"
        >
          Drop
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`
            px-4 py-2 rounded-lg font-medium
            bg-gray-200 text-gray-700 hover:bg-gray-300
            transition-colors
            focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          `}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ItemDetailContent;
