import { memo } from "react";

/**
 * LoadingSkeleton - Skeleton loader for adventure cards
 * @param count - Number of skeleton cards to display (default: 3)
 */
interface LoadingSkeletonProps {
  count?: number;
  variant?: "card" | "list" | "form";
  className?: string;
}

function LoadingSkeleton({
  count = 3,
  variant = "card",
  className = "",
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`bg-white border border-gray-200 rounded-lg p-6 animate-pulse ${className}`}
            data-testid="loading-skeleton"
          >
            {/* Title skeleton */}
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>

            {/* Date skeleton */}
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>

            {/* Progress bar skeleton */}
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </>
    );
  }

  if (variant === "list") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <LoadingSkeleton count={count} variant="card" />
      </div>
    );
  }

  // Form variant
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>
  );
}

export default memo(LoadingSkeleton);
