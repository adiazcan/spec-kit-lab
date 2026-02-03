/**
 * QuestFilter Component (T030)
 *
 * Filter control component that allows players to filter quests by status.
 * Provides checkboxes for Active, Completed, and Failed status filters.
 *
 * Features:
 * - Three status filters: Active, Completed, Failed
 * - Support for multiple simultaneous filters
 * - Fully keyboard accessible (Tab, Space, Enter)
 * - Clear labels for each filter option
 * - Accessible checkbox semantics
 * - Visual feedback for selected filters
 *
 * Props:
 * - filters: QuestFilterState - current filter state
 * - onFiltersChange: (filters: QuestFilterState) => void - callback when filters change
 *
 * Display:
 * - Heading "Filter Quests"
 * - Three checkboxes: Active, Completed, Failed
 * - Each checkbox with associated label
 * - Clear visual indicator of checked state
 *
 * Accessibility:
 * - Each checkbox has associated <label> via htmlFor
 * - Proper aria-label attributes
 * - Keyboard navigation with Tab, Space, Enter
 * - Focus visible outline
 * - Screen reader friendly
 *
 * @component
 * @example
 * <QuestFilter
 *   filters={filters}
 *   onFiltersChange={handleFiltersChange}
 * />
 */

import React, { useCallback } from "react";
import type { QuestFilterState, QuestFilterType } from "@/types/quest";

interface QuestFilterProps {
  /** Current filter state with active status filters */
  filters: QuestFilterState;
  /** Callback invoked when filter selection changes */
  onFiltersChange: (filters: QuestFilterState) => void;
}

/**
 * Quest filter component
 *
 * Provides interactive checkboxes to filter quests by status.
 * Supports selecting multiple status filters simultaneously.
 * Fully keyboard accessible for accessibility compliance.
 *
 * Implementation Details:
 * - Uses controlled checkboxes (checked state from props)
 * - Toggle logic: if unchecked, add to filter; if checked, remove from filter
 * - Preserves other filter state (searchText, sortBy) when toggling status filters
 *
 * @param props - Component props
 * @returns Rendered filter controls
 */
const QuestFilter: React.FC<QuestFilterProps> = React.memo(
  ({ filters, onFiltersChange }) => {
    const statusOptions: QuestFilterType[] = ["Active", "Completed", "Failed"];

    /**
     * Handle checkbox change event
     * Toggles the status filter on/off
     */
    const handleStatusChange = useCallback(
      (status: QuestFilterType) => {
        const isCurrentlyActive = filters.statusFilters.includes(status);
        const newStatusFilters = isCurrentlyActive
          ? filters.statusFilters.filter((s) => s !== status)
          : [...filters.statusFilters, status];

        onFiltersChange({
          ...filters,
          statusFilters: newStatusFilters,
        });
      },
      [filters, onFiltersChange],
    );

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        {/* Filter heading */}
        <h3 className="text-lg font-semibold text-gray-900">Filter Quests</h3>

        {/* Filter options */}
        <div className="space-y-3">
          {statusOptions.map((status) => {
            const isChecked = filters.statusFilters.includes(status);
            const checkboxId = `quest-filter-${status.toLowerCase()}`;

            return (
              <div key={status} className="flex items-center">
                {/* Checkbox input */}
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleStatusChange(status)}
                  className="h-4 w-4 text-blue-600 rounded border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 accent-blue-600"
                  aria-label={`Filter by ${status} quests`}
                />

                {/* Label for checkbox */}
                <label
                  htmlFor={checkboxId}
                  className="ml-3 cursor-pointer select-none"
                >
                  <span className="text-gray-700 font-medium">{status}</span>
                  <span className="text-gray-500 text-sm">
                    {status === "Active" && " (In Progress)"}
                    {status === "Completed" && " (Finished)"}
                    {status === "Failed" && " (Unsuccessful)"}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        {/* Filter summary */}
        {filters.statusFilters.length > 0 && (
          <div className="pt-2 border-t border-gray-200 text-sm text-gray-600">
            <p>
              Showing:{" "}
              <span className="font-medium">
                {filters.statusFilters.join(", ")}
              </span>
            </p>
          </div>
        )}

        {/* Clear filters option */}
        {filters.statusFilters.length > 0 && (
          <button
            onClick={() =>
              onFiltersChange({
                ...filters,
                statusFilters: [],
              })
            }
            className="w-full text-sm text-blue-600 hover:text-blue-700 py-2 rounded transition-colors font-medium"
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  },
);

QuestFilter.displayName = "QuestFilter";

export default QuestFilter;
