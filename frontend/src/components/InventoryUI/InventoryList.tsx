/**
 * InventoryList Component
 *
 * Displays inventory items in a table/list layout.
 * Optimized for detailed information viewing with multiple columns.
 *
 * @module components/InventoryUI/InventoryList
 */

import React from "react";

export interface InventoryListProps {
  /**
   * Array of inventory entries to display
   */
  items: any[];

  /**
   * ID of the currently selected item
   */
  selectedItemId?: string;

  /**
   * Callback when an item is clicked
   */
  onItemClick: (itemId: string) => void;

  /**
   * Whether the inventory is currently loading
   */
  isLoading?: boolean;

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
 * List/table layout component for inventory items
 *
 * Renders items in a table with columns for icon, name, type, quantity, and rarity.
 * Provides detailed information at a glance.
 *
 * @example
 * ```tsx
 * <InventoryList
 *   items={filteredItems}
 *   selectedItemId={selectedId}
 *   onItemClick={handleItemClick}
 *   isLoading={isLoading}
 * />
 * ```
 */
export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  selectedItemId,
  onItemClick,
  isLoading = false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
          <p className="mt-1 text-sm text-gray-500">Your inventory is empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200" role="table">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"
            >
              Icon
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
            >
              Quantity
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32"
            >
              Rarity
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => onItemClick(entry.id)}
              className={`
                cursor-pointer transition-colors
                ${
                  selectedItemId === entry.id
                    ? "bg-blue-50 border-l-4 border-blue-600"
                    : "hover:bg-gray-50"
                }
              `}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onItemClick(entry.id);
                }
              }}
              aria-label={`${entry.item.name}, ${entry.item.rarity}`}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded">
                  <span className="text-lg">📦</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {entry.item.name}
                </div>
                {entry.item.description && (
                  <div className="text-xs text-gray-500 truncate max-w-md">
                    {entry.item.description}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-700">
                  {entry.item.itemType}
                </div>
                {"slotType" in entry.item && entry.item.slotType && (
                  <div className="text-xs text-gray-500">
                    {entry.item.slotType}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                <div className="text-sm font-mono text-gray-900">
                  {entry.quantity > 1
                    ? `${entry.quantity}${entry.item.maxStackSize ? `/${entry.item.maxStackSize}` : ""}`
                    : "1"}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`
                    inline-flex px-2 py-1 text-xs font-semibold rounded
                    ${rarityColors[entry.item.rarity] || "bg-gray-300 text-gray-900"}
                  `}
                >
                  {entry.item.rarity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
