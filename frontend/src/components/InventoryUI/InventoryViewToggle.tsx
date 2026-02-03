/**
 * InventoryViewToggle Component
 *
 * Provides a toggle button to switch between grid and list views.
 * Displays the current view mode and allows users to switch modes.
 *
 * @module components/InventoryUI/InventoryViewToggle
 */

import React from "react";

export interface InventoryViewToggleProps {
  /**
   * Current view mode
   */
  viewMode: "grid" | "list";

  /**
   * Callback when view mode changes
   */
  onViewModeChange: (mode: "grid" | "list") => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Toggle component for switching between grid and list inventory views
 *
 * @example
 * ```tsx
 * <InventoryViewToggle
 *   viewMode={viewMode}
 *   onViewModeChange={setViewMode}
 * />
 * ```
 */
export const InventoryViewToggle: React.FC<InventoryViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  className = "",
}) => {
  return (
    <div
      className={`inline-flex rounded-lg border border-gray-300 bg-white ${className}`}
    >
      <button
        type="button"
        onClick={() => onViewModeChange("grid")}
        className={`
          px-4 py-2 text-sm font-medium rounded-l-lg transition-colors
          ${
            viewMode === "grid"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }
        `}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
          />
        </svg>
        <span className="sr-only">Grid View</span>
      </button>

      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        className={`
          px-4 py-2 text-sm font-medium rounded-r-lg transition-colors border-l
          ${
            viewMode === "list"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
          }
        `}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <span className="sr-only">List View</span>
      </button>
    </div>
  );
};
