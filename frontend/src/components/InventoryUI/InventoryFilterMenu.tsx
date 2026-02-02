/**
 * InventoryFilterMenu Component
 *
 * Menu for filtering inventory items by type, rarity, and compatibility.
 * Allows users to select multiple filter criteria.
 *
 * @module components/InventoryUI/InventoryFilterMenu
 */

import { useState, useMemo } from "react";
import type { InventoryFilters } from "@/hooks/useInventory";
import {
  getUniqueItemTypes,
  getUniqueRarities,
  getUniqueSlotTypes,
} from "@/utils/inventoryFilters";

interface InventoryFilterMenuProps {
  /**
   * Current filter options
   */
  filters: InventoryFilters;

  /**
   * Callback when filters change
   */
  onFiltersChange: (filters: InventoryFilters) => void;

  /**
   * All inventory items (for extracting unique values)
   */
  items: any[];

  /**
   * Callback to close menu
   */
  onClose?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * InventoryFilterMenu Component
 *
 * Features:
 * - Filter by item type (Stackable, Unique, etc.)
 * - Filter by rarity (Common, Uncommon, Rare, Epic, Legendary)
 * - Filter by slot compatibility (for equipment)
 * - Include/exclude equipped items
 * - Visual badges showing active filters
 * - Clear all filters
 *
 * @example
 * ```tsx
 * <InventoryFilterMenu
 *   filters={inventory.filters}
 *   onFiltersChange={inventory.setFilters}
 *   items={inventory.items}
 *   onClose={() => setMenuOpen(false)}
 * />
 * ```
 */
export function InventoryFilterMenu({
  filters,
  onFiltersChange,
  items,
  onClose,
  className = "",
}: InventoryFilterMenuProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    type: true,
    rarity: true,
    slot: false,
  });

  // Extract unique values from items
  const itemTypes = useMemo(() => getUniqueItemTypes(items), [items]);
  const rarities = useMemo(() => getUniqueRarities(items), [items]);
  const slots = useMemo(() => getUniqueSlotTypes(items), [items]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleItemTypeChange = (type: string) => {
    onFiltersChange({
      ...filters,
      itemType: filters.itemType === type ? undefined : type,
    });
  };

  const handleRarityChange = (rarity: string) => {
    onFiltersChange({
      ...filters,
      rarity:
        filters.rarity === rarity
          ? undefined
          : (rarity as InventoryFilters["rarity"]),
    });
  };

  const handleSlotChange = (slot: string) => {
    onFiltersChange({
      ...filters,
      slotCompatibility: filters.slotCompatibility === slot ? undefined : slot,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== false,
  ).length;

  return (
    <div className={`rounded-lg shadow-lg bg-white p-4 min-w-max ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-block px-2 py-1 text-xs font-bold bg-blue-100 text-blue-900 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Item Type Filter */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <button
          onClick={() => toggleSection("type")}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span className="font-medium text-gray-900">Item Type</span>
          </div>
          <span className="text-gray-400">
            {expandedSections.type ? "−" : "+"}
          </span>
        </button>

        {expandedSections.type && (
          <div className="mt-2 space-y-2 ml-2">
            {itemTypes.length > 0 ? (
              itemTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.itemType === type}
                    onChange={() => handleItemTypeChange(type)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))
            ) : (
              <div className="text-sm text-gray-500">No items to filter</div>
            )}
          </div>
        )}
      </div>

      {/* Rarity Filter */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <button
          onClick={() => toggleSection("rarity")}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="font-medium text-gray-900">Rarity</span>
          </div>
          <span className="text-gray-400">
            {expandedSections.rarity ? "−" : "+"}
          </span>
        </button>

        {expandedSections.rarity && (
          <div className="mt-2 space-y-2 ml-2">
            {rarities.length > 0 ? (
              rarities.map((rarity) => {
                const rarityColors: Record<string, string> = {
                  Common: "bg-gray-100 text-gray-900",
                  Uncommon: "bg-green-100 text-green-900",
                  Rare: "bg-blue-100 text-blue-900",
                  Epic: "bg-purple-100 text-purple-900",
                  Legendary: "bg-yellow-100 text-yellow-900",
                };
                return (
                  <label
                    key={rarity}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.rarity === rarity}
                      onChange={() => handleRarityChange(rarity)}
                      className="rounded"
                    />
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${rarityColors[rarity]}`}
                    >
                      {rarity}
                    </span>
                  </label>
                );
              })
            ) : (
              <div className="text-sm text-gray-500">No rarities available</div>
            )}
          </div>
        )}
      </div>

      {/* Slot Compatibility Filter */}
      {slots.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <button
            onClick={() => toggleSection("slot")}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-medium text-gray-900">Equipment Slot</span>
            </div>
            <span className="text-gray-400">
              {expandedSections.slot ? "−" : "+"}
            </span>
          </button>

          {expandedSections.slot && (
            <div className="mt-2 space-y-2 ml-2">
              {slots.map((slot) => (
                <label
                  key={slot}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.slotCompatibility === slot}
                    onChange={() => handleSlotChange(slot)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{slot}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-3">
          <div className="font-medium mb-1">Active Filters:</div>
          <div className="space-y-1">
            {filters.itemType && (
              <div className="text-gray-700">📦 Type: {filters.itemType}</div>
            )}
            {filters.rarity && (
              <div className="text-gray-700">✨ Rarity: {filters.rarity}</div>
            )}
            {filters.slotCompatibility && (
              <div className="text-gray-700">
                🎯 Slot: {filters.slotCompatibility}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}

export default InventoryFilterMenu;
