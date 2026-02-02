/**
 * DeferredLoadingIndicator Component
 * T118: Loading indicators that appear after 500ms delay
 *
 * Features:
 * - Only shows loader if loading lasts >500ms
 * - Prevents flashing loader on fast operations
 * - Improves perceived performance for quick requests
 * - Customizable delay time
 *
 * @component
 */

import { useState, useEffect, ReactNode } from "react";
import LoadingSkeleton from "./LoadingSkeleton";

interface DeferredLoadingIndicatorProps {
  /** Whether operation is in progress */
  isLoading: boolean;
  /** Delay in milliseconds before showing loader (default: 500ms) */
  delay?: number;
  /** Number of skeleton items to show */
  count?: number;
  /** Skeleton variant type */
  variant?: "card" | "list" | "form";
  /** optional fallback content while loading */
  fallback?: ReactNode;
  /** Content to show when not loading */
  children?: ReactNode;
}

/**
 * Shows loading skeleton after specified delay
 * Prevents flashing loaders for fast operations
 *
 * @example
 * ```tsx
 * <DeferredLoadingIndicator
 *   isLoading={isLoading}
 *   delay={500}
 *   count={3}
 *   variant="list"
 * >
 *   <CharacterList characters={characters} />
 * </DeferredLoadingIndicator>
 * ```
 */
export function DeferredLoadingIndicator({
  isLoading,
  delay = 500,
  count = 3,
  variant = "list",
  fallback,
  children,
}: DeferredLoadingIndicatorProps) {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoader(false);
      return;
    }

    // Set timeout to show loader after delay
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  // Don't show anything if loading just started
  if (isLoading && !showLoader) {
    return fallback || null;
  }

  // Show loader if still loading after delay
  if (isLoading && showLoader) {
    return (
      <div className="w-full" role="status" aria-label="Loading...">
        <LoadingSkeleton count={count} variant={variant} />
      </div>
    );
  }

  // Show content when done loading
  return children;
}

export default DeferredLoadingIndicator;
