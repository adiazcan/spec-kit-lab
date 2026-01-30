import { memo } from "react";
import type { Adventure } from "../services/api";
import { formatDate, formatProgress } from "../utils/formatters";

interface AdventureCardProps {
  adventure: Adventure;
  isLoading?: boolean;
  onSelect: (adventure: Adventure) => void;
  onDelete: (id: string) => void;
}

/**
 * AdventureCard - Individual adventure card with metadata and actions
 * Memoized to prevent unnecessary re-renders when parent re-renders with same props
 */
function AdventureCard({
  adventure,
  isLoading = false,
  onSelect,
  onDelete,
}: AdventureCardProps) {
  // Use defaults for missing backend fields
  const displayName =
    adventure.name || `Adventure ${adventure.id?.substring(0, 8) || "Unknown"}`;
  const progress = adventure.progress ?? 0;
  const lastPlayed = adventure.lastPlayedAt || adventure.lastUpdatedAt;
  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer"
      onClick={() => onSelect(adventure)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(adventure);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Select adventure: ${displayName}`}
    >
      {/* Adventure Name */}
      <h2 className="text-xl font-bold text-gray-900 mb-2">{displayName}</h2>

      {/* Created Date */}
      <time
        dateTime={adventure.createdAt}
        className="text-sm text-gray-600 block mb-4"
      >
        Created: {formatDate(adventure.createdAt)}
      </time>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">
            {formatProgress(progress)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${formatProgress(progress)}`}
          />
        </div>
      </div>

      {/* Last Played */}
      {lastPlayed && (
        <p className="text-sm text-gray-500 mb-4">
          Last played: {formatDate(lastPlayed)}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(adventure.id || "");
          }}
          disabled={isLoading}
          aria-label={`Delete adventure: ${displayName}`}
          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
        >
          {isLoading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

export default memo(AdventureCard);
