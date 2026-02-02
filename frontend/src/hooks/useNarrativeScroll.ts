import { useRef, useEffect, useState, useCallback } from "react";

/**
 * useNarrativeScroll hook manages auto-scroll behavior for narrative message containers.
 *
 * Features:
 * - Automatically scrolls to bottom when new messages arrive
 * - Preserves user scroll position when manually scrolled up
 * - Detects when user is scrolled away from bottom
 * - Provides "new messages" indicator when content is below viewport
 *
 * @returns {Object} Hook state and refs:
 *   - containerRef: React ref to attach to the scroll container
 *   - endRef: React ref to attach to the end sentinel element
 *   - isNearBottom: Whether the container is scrolled near the bottom
 *   - hasNewMessages: Whether there are unread messages below viewport
 *   - scrollToBottom: Function to programmatically scroll to bottom
 *
 * @example
 * const { containerRef, endRef, hasNewMessages, scrollToBottom } = useNarrativeScroll(messages);
 * return (
 *   <div ref={containerRef} className="overflow-y-auto">
 *     {messages.map(msg => <div key={msg.id}>{msg.text}</div>)}
 *     <div ref={endRef} />
 *     {hasNewMessages && <button onClick={() => scrollToBottom()}>New messages ↓</button>}
 *   </div>
 * );
 */
export const useNarrativeScroll = (messages: any[]) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const previousLengthRef = useRef(messages.length);

  /**
   * Scrolls to the bottom of the container smoothly
   */
  const scrollToBottom = useCallback(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
      setHasNewMessages(false);
      setIsNearBottom(true);
    }
  }, []);

  /**
   * Checks if the container is scrolled near the bottom (within 100px)
   */
  const checkIfNearBottom = useCallback(() => {
    if (containerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      return distanceFromBottom < 100;
    }
    return true;
  }, []);

  /**
   * Handles scroll events to detect user's scroll position
   */
  const handleScroll = useCallback(() => {
    const near = checkIfNearBottom();
    setIsNearBottom(near);

    // Clear "new messages" indicator when user scrolls to bottom
    if (near) {
      setHasNewMessages(false);
    }
  }, [checkIfNearBottom]);

  /**
   * Auto-scroll when new messages arrive (if user was near bottom)
   */
  useEffect(() => {
    const messageCountIncreased = messages.length > previousLengthRef.current;
    previousLengthRef.current = messages.length;

    if (messageCountIncreased) {
      const near = checkIfNearBottom();

      if (near) {
        // Auto-scroll if user was near bottom
        if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        // Show "new messages" indicator if user scrolled up
        setHasNewMessages(true);
      }
    }
  }, [messages, checkIfNearBottom]);

  /**
   * Attach scroll listener to container
   */
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return {
    containerRef,
    endRef,
    isNearBottom,
    hasNewMessages,
    scrollToBottom,
  };
};
