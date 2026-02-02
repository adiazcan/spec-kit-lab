/**
 * InventoryGrid Component
 *
 * Displays inventory items in a responsive grid layout.
 * Optimized for visual browsing with item icons and basic info.
 *
 * @module components/InventoryUI/InventoryGrid
 */

import React from "react";
import { InventoryItem } from "./InventoryItem";

export interface InventoryGridProps {
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
   * Optional drag start handler for inventory items
   */
  onItemDragStart?: (e: React.DragEvent<HTMLDivElement>, entry: any) => void;

  /**
   * Optional drag end handler for inventory items
   */
  onItemDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;

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
 * Grid layout component for inventory items
 *
 * Renders items in a responsive grid (4 columns on mobile, up to 8 on desktop).
 * Each item is rendered using the InventoryItem component passed as children.
 *
 * @example
 * ```tsx
 * <InventoryGrid
 *   items={filteredItems}
 *   selectedItemId={selectedId}
 *   onItemClick={handleItemClick}
 *   isLoading={isLoading}
 * />
 * ```
 */
export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  selectedItemId,
  onItemClick,
  onItemDragStart,
  onItemDragEnd,
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
    <div
      className={`
        grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-4
        ${className}
      `}
      role="grid"
      aria-label="Inventory items grid"
    >
      {items.map((entry) => (
        <div key={entry.id} role="gridcell">
          <InventoryItem
            entry={entry}
            isSelected={selectedItemId === entry.id}
            viewMode="grid"
            onClick={() => onItemClick(entry.id)}
            onDragStart={
              onItemDragStart
                ? (event) => onItemDragStart(event, entry)
                : undefined
            }
            onDragEnd={onItemDragEnd}
          />
        </div>
      ))}
    </div>
  );
};
