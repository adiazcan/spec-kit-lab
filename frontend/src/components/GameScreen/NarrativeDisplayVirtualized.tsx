import React from "react";
import type { NarrativeMessage as NarrativeMessageType } from "../../types/narrative";
import { NarrativeMessage } from "./NarrativeMessage";
import { useNarrativeScroll } from "../../hooks/useNarrativeScroll";
import { useVirtualNarrativeScroll } from "../../hooks/useVirtualNarrativeScroll";

/**
 * NarrativeDisplayVirtualized component displays a scrollable list of narrative messages.
 * Automatically switches between normal and virtual rendering based on message count.
 *
 * Features:
 * - Auto-scroll when near bottom of the feed
 * - Scroll position preservation when manually scrolled up
 * - "New messages" indicator when content is below viewport
 * - Smooth scrolling behavior
 * - Virtual scrolling for 300+ messages (performance optimization)
 * - Automatic rendering strategy selection
 *
 * @component
 */
interface NarrativeDisplayVirtualizedProps {
  /** Array of narrative messages to display */
  messages: NarrativeMessageType[];

  /** Whether data is currently loading */
  isLoading: boolean;

  /** Enable virtual scrolling for 300+ messages (default: true) */
  enableVirtualScrolling?: boolean;
}

// Threshold for switching to virtual scrolling
const VIRTUAL_SCROLL_THRESHOLD = 300;

/**
 * Regular rendering for smaller message lists
 */
const NarrativeDisplayRegular: React.FC<{
  messages: NarrativeMessageType[];
  isLoading: boolean;
}> = ({ messages, isLoading }) => {
  const { containerRef, endRef, hasNewMessages, scrollToBottom } =
    useNarrativeScroll(messages);

  return (
    <div className="relative flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 flex flex-col overflow-y-auto p-4 gap-1 scroll-smooth"
        role="log"
        aria-label="Narrative message feed"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-center">
              <p className="text-lg font-semibold mb-2">Loading game...</p>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2 w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <NarrativeMessage key={message.id} message={message} />
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* New messages indicator */}
      {hasNewMessages && (
        <div className="flex justify-center py-2">
          <button
            onClick={scrollToBottom}
            className="animate-fade-in px-4 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
            aria-label="Scroll to new messages"
          >
            New messages below
            <span className="text-lg">↓</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Virtual rendering for large message lists (300+ messages)
 * Renders only visible messages plus a small buffer for better performance
 */
const NarrativeDisplayVirtual: React.FC<{
  messages: NarrativeMessageType[];
  isLoading: boolean;
}> = ({ messages, isLoading }) => {
  const { containerRef, visibleMessages, prependHeight, appendHeight } =
    useVirtualNarrativeScroll(messages, 85, 5);

  const { hasNewMessages, scrollToBottom } = useNarrativeScroll(messages);

  return (
    <div className="relative flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 flex flex-col overflow-y-auto p-4 gap-1 scroll-smooth"
        role="log"
        aria-label="Narrative message feed (virtualized)"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-center">
              <p className="text-lg font-semibold mb-2">Loading game...</p>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2 w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet...</p>
          </div>
        ) : (
          <>
            {/* Spacer for scrolled-off messages above viewport */}
            {prependHeight > 0 && (
              <div style={{ height: `${prependHeight}px` }} />
            )}

            {/* Visible messages */}
            <div>
              {visibleMessages.map((message) => (
                <NarrativeMessage key={message.id} message={message} />
              ))}
            </div>

            {/* Spacer for scrolled-off messages below viewport */}
            {appendHeight > 0 && (
              <div style={{ height: `${appendHeight}px` }} />
            )}
          </>
        )}
      </div>

      {/* New messages indicator */}
      {hasNewMessages && (
        <div className="flex justify-center py-2">
          <button
            onClick={scrollToBottom}
            className="animate-fade-in px-4 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
            aria-label="Scroll to new messages"
          >
            New messages below
            <span className="text-lg">↓</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Main component that intelligently selects rendering strategy based on message count
 */
export const NarrativeDisplayVirtualized: React.FC<
  NarrativeDisplayVirtualizedProps
> = ({ messages, isLoading, enableVirtualScrolling = true }) => {
  // Use virtual scrolling for large lists, regular rendering for smaller lists
  const shouldUseVirtualScroll =
    enableVirtualScrolling && messages.length > VIRTUAL_SCROLL_THRESHOLD;

  return shouldUseVirtualScroll ? (
    <NarrativeDisplayVirtual messages={messages} isLoading={isLoading} />
  ) : (
    <NarrativeDisplayRegular messages={messages} isLoading={isLoading} />
  );
};

// Export both versions for flexibility
export { NarrativeDisplayRegular, NarrativeDisplayVirtual };
