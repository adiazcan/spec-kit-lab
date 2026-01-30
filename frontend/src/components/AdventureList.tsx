import { memo } from "react";
import type { Adventure } from "../services/api";
import AdventureCard from "./AdventureCard";
import LoadingSkeleton from "./LoadingSkeleton";

interface AdventureListProps {
  adventures: Adventure[];
  isLoading?: boolean;
  error?: Error | null;
  onSelectAdventure: (adventure: Adventure) => void;
  onDeleteAdventure: (id: string) => void;
}

/**
 * AdventureList - Container component for displaying adventure cards
 * Memoized to prevent unnecessary re-renders when parent re-renders with same props
 */
function AdventureList({
  adventures,
  isLoading = false,
  error = null,
  onSelectAdventure,
  onDeleteAdventure,
}: AdventureListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Loading adventures"
      >
        <LoadingSkeleton count={6} variant="card" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">
            Failed to load adventures
          </h2>
          <p className="text-red-600 mb-4">
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (adventures.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Adventures Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first adventure to begin exploring!
          </p>
        </div>
      </div>
    );
  }

  // Adventure list
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Adventures list"
    >
      {adventures.map((adventure) => (
        <AdventureCard
          key={adventure.id}
          adventure={adventure}
          onSelect={onSelectAdventure}
          onDelete={onDeleteAdventure}
        />
      ))}
    </div>
  );
}

export default memo(AdventureList);
