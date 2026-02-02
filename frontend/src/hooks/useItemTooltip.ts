/**
 * useItemTooltip Hook
 *
 * Manages tooltip state with configurable delay for item hover interactions.
 * Provides show/hide state, position calculation, and mouse event handlers.
 *
 * @module hooks/useItemTooltip
 */

import { useState, useRef, useCallback } from "react";

/**
 * Position options for tooltip relative to the trigger element
 */
export type TooltipPosition = "top" | "bottom" | "left" | "right";

/**
 * Return type for useItemTooltip hook
 */
export interface UseItemTooltipReturn {
  /**
   * Whether the tooltip is currently visible
   */
  showTooltip: boolean;

  /**
   * Current tooltip position relative to trigger element
   */
  tooltipPosition: TooltipPosition;

  /**
   * Mouse position for tooltip placement calculations
   */
  mousePosition: { x: number; y: number };

  /**
   * Handle mouse enter event - starts delay timer
   */
  handleMouseEnter: () => void;

  /**
   * Handle mouse leave event - hides tooltip immediately
   */
  handleMouseLeave: () => void;

  /**
   * Handle mouse move event - updates position for auto-positioning
   */
  handleMouseMove: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for managing item tooltip state with delay
 *
 * Provides show/hide behavior with configurable delay, avoiding premature
 * tooltip display on quick mouse passes. Useful for hover tooltips in
 * inventory grids and lists.
 *
 * @param delayMs - Delay in milliseconds before showing tooltip (default: 300ms)
 * @returns Tooltip state and event handlers
 *
 * @example
 * ```tsx
 * const tooltip = useItemTooltip(300);
 *
 * return (
 *   <div
 *     onMouseEnter={tooltip.handleMouseEnter}
 *     onMouseLeave={tooltip.handleMouseLeave}
 *     onMouseMove={tooltip.handleMouseMove}
 *   >
 *     {tooltip.showTooltip && <ItemTooltip position={tooltip.tooltipPosition} />}
 *   </div>
 * );
 * ```
 */
export const useItemTooltip = (delayMs: number = 300): UseItemTooltipReturn => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] =
    useState<TooltipPosition>("top");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Timer ref for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Determine optimal tooltip position (currently always "top")
   * Future enhancement: detect boundaries and reposition as "bottom" if needed
   */
  const calculatePosition = useCallback((): TooltipPosition => {
    // Always use "top" for now
    return "top";
  }, []);

  /**
   * Handle mouse enter - schedule tooltip show with delay
   */
  const handleMouseEnter = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule tooltip display after delay
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, delayMs);
  }, [delayMs]);

  /**
   * Handle mouse leave - hide tooltip immediately and clear timer
   */
  const handleMouseLeave = useCallback(() => {
    // Clear pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Hide tooltip immediately
    setShowTooltip(false);
  }, []);

  /**
   * Handle mouse move - track position for potential tooltip repositioning
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // For "auto" positioning, recalculate position on move
      const position = calculatePosition();
      setTooltipPosition(position);
    },
    [calculatePosition],
  );

  return {
    showTooltip,
    tooltipPosition,
    mousePosition,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
  };
};
