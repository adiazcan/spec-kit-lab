/**
 * InventorySortMenu Component
 *
 * Menu for sorting inventory items by various criteria.
 * Allows users to select sort field and order (ascending/descending).
 *
 * @module components/InventoryUI/InventorySortMenu
 */

import type { SortOption } from "@/hooks/useInventory";

interface InventorySortMenuProps {
  /**
   * Current sort options
   */
  sorts: SortOption[];

  /**
   * Callback when sorts change
   */
  onSortsChange: (sorts: SortOption[]) => void;

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
 * Sort field options
 */
const SORT_FIELDS: Array<{
  field: SortOption["field"];
  label: string;
  icon: string;
}> = [
  { field: "name", label: "Item Name", icon: "📝" },
  { field: "rarity", label: "Rarity", icon: "✨" },
  { field: "type", label: "Item Type", icon: "📦" },
  { field: "quantity", label: "Quantity", icon: "📊" },
  { field: "dateAdded", label: "Date Added", icon: "📅" },
];

/**
 * InventorySortMenu Component
 *
 * Features:
 * - Select sort field (name, rarity, type, quantity, date added)
 * - Toggle sort order (ascending/descending)
 * - Add multiple sort levels
 * - Clear sort options
 * - Visual indicators for current sort
 *
 * @example
 * ```tsx
 * <InventorySortMenu
 *   sorts={inventory.sorts}
 *   onSortsChange={inventory.setSorts}
 *   onClose={() => setMenuOpen(false)}
 * />
 * ```
 */
export function InventorySortMenu({
  sorts,
  onSortsChange,
  onClose,
  className = "",
}: InventorySortMenuProps) {
  const handlePrimarySortChange = (field: SortOption["field"]) => {
    // If clicking the same field, toggle order
    if (sorts[0]?.field === field) {
      const newSort = {
        ...sorts[0],
        order: sorts[0].order === "asc" ? "desc" : "asc",
      } as SortOption;
      onSortsChange([newSort, ...sorts.slice(1)]);
    } else {
      // New field selected
      onSortsChange([{ field, order: "asc" }, ...sorts.slice(1)]);
    }
  };

  const handleClearSort = () => {
    onSortsChange([]);
  };

  const primarySort = sorts[0];

  return (
    <div className={`rounded-lg shadow-lg bg-white p-4 min-w-max ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Sort By</h3>
        {sorts.length > 0 && (
          <button
            onClick={handleClearSort}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Primary Sort */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-600 mb-2">
          Primary Sort
        </div>
        <div className="space-y-2">
          {SORT_FIELDS.map((option) => (
            <button
              key={option.field}
              onClick={() => handlePrimarySortChange(option.field)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg
                text-sm transition-all text-left
                ${
                  primarySort?.field === option.field
                    ? "bg-blue-100 text-blue-900 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="flex-1">{option.label}</span>
              {primarySort?.field === option.field && (
                <span className="text-sm">
                  {primarySort.order === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Order Toggle (if sort is active) */}
      {primarySort && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">Order</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onSortsChange([
                  { ...primarySort, order: "asc" as const },
                  ...sorts.slice(1),
                ]);
              }}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium
                transition-all
                ${
                  primarySort.order === "asc"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }
              `}
            >
              Ascending ↑
            </button>
            <button
              onClick={() => {
                onSortsChange([
                  { ...primarySort, order: "desc" as const },
                  ...sorts.slice(1),
                ]);
              }}
              className={`
                flex-1 px-3 py-2 rounded-lg text-sm font-medium
                transition-all
                ${
                  primarySort.order === "desc"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }
              `}
            >
              Descending ↓
            </button>
          </div>
        </div>
      )}

      {/* Current Sort Status */}
      {sorts.length > 0 && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <div className="font-medium mb-1">Applied:</div>
          {sorts.map((sort, idx) => {
            const field = SORT_FIELDS.find((f) => f.field === sort.field);
            return (
              <div key={idx} className="text-gray-700">
                {field?.icon} {field?.label}
                <span className="ml-1 text-gray-500">
                  {sort.order === "asc" ? "↑" : "↓"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-4 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}

export default InventorySortMenu;
