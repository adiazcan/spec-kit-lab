import { useEffect, useState, useCallback, useRef } from "react";

/**
 * useVirtualNarrativeScroll hook manages virtual scrolling for narrative messages.
 *
 * This implementation efficiently renders only visible messages plus a small buffer,
 * reducing DOM nodes and improving performance for 500+ message feeds.
 *
 * Features:
 * - Only renders messages in viewport + buffer zone
 * - Maintains accurate scroll position and scrollbar
 * - Supports dynamic message additions
 * - Estimates average message height for scroll calculations
 *
 * @param {any[]} messages - Array of narrative messages
 * @param {number} estimatedItemHeight - Estimated height of each message in pixels (default: 80)
 * @param {number} bufferSize - Number of items to render above/below viewport (default: 5)
 *
 * @returns {Object} Virtual scrolling state:
 *   - visibleRange: { start, end } indices of visible messages
 *   - offsetY: Pixel offset for the virtual scroll position
 *   - visibleMessages: Slice of messages to render
 *   - preprendHeight: Height of messages above viewport
 *   - appendHeight: Height of messages below viewport
 *
 * @example
 * const { visibleMessages, prependHeight, appendHeight } = useVirtualNarrativeScroll(messages);
 * return (
 *   <div ref={containerRef} onScroll={handleScroll}>
 *     <div style={{ height: prependHeight }} />
 *     {visibleMessages.map(msg => <Message key={msg.id} {...msg} />)}
 *     <div style={{ height: appendHeight }} />
 *   </div>
 * );
 */
export const useVirtualNarrativeScroll = (
  messages: any[],
  estimatedItemHeight = 80,
  bufferSize = 5,
) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  /**
   * Calculate which messages should be visible based on scroll position
   */
  const calculateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;

    // Calculate approximate start and end indices
    const startIndex = Math.max(
      0,
      Math.floor((scrollTop / estimatedItemHeight) * 0.95),
    ); // 95% to account for varying heights
    const endIndex = Math.min(
      messages.length,
      Math.ceil(((scrollTop + clientHeight) / estimatedItemHeight) * 1.05) +
        bufferSize,
    );

    setVisibleRange({
      start: Math.max(0, startIndex - bufferSize),
      end: Math.min(messages.length, endIndex + bufferSize),
    });

    lastScrollTopRef.current = scrollTop;
  }, [messages.length, estimatedItemHeight, bufferSize]);

  /**
   * Setup scroll listener
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial calculation
    calculateVisibleRange();

    // Debounced scroll handler for better performance
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(calculateVisibleRange, 50);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [calculateVisibleRange]);

  // Recalculate when messages change (especially when new ones are added)
  useEffect(() => {
    calculateVisibleRange();
  }, [messages.length, calculateVisibleRange]);

  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
  const prependHeight = visibleRange.start * estimatedItemHeight;
  const appendHeight = Math.max(
    0,
    (messages.length - visibleRange.end) * estimatedItemHeight,
  );

  return {
    containerRef,
    visibleRange,
    visibleMessages,
    prependHeight,
    appendHeight,
    startIndex: visibleRange.start,
  };
};
