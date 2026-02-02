import React from "react";
import type { NarrativeMessage as NarrativeMessageType } from "../../types/narrative";
import { NarrativeMessage } from "./NarrativeMessage";
import { useNarrativeScroll } from "../../hooks/useNarrativeScroll";

/**
 * NarrativeDisplay component displays a scrollable list of narrative messages.
 * Automatically scrolls to the bottom when new messages are added.
 * Preserves scroll position when user is scrolled up.
 *
 * Features:
 * - Auto-scroll when near bottom of the feed
 * - Scroll position preservation when manually scrolled up
 * - "New messages" indicator when content is below viewport
 * - Smooth scrolling behavior
 * - Support for 500+ messages with performance optimization
 *
 * @component
 */
interface NarrativeDisplayProps {
  /** Array of narrative messages to display */
  messages: NarrativeMessageType[];

  /** Whether data is currently loading */
  isLoading: boolean;
}

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({
  messages,
  isLoading,
}) => {
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
