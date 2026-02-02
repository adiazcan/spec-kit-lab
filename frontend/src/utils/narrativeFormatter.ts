/**
 * Narrative Message Formatting Utilities
 *
 * Utilities for formatting narrative messages for display:
 * - formatTimestamp: Convert Date to display format
 * - getMessageIcon: Get icon for message type
 * - getMessageClass: Get CSS class for message type styling
 */

import type { NarrativeMessage } from "../types/narrative";

/**
 * Format a timestamp for display in narrative
 *
 * @param date - Date object to format
 * @returns Formatted time string (e.g., "14:32:15" or "2 minutes ago")
 *
 * Uses relative time format (e.g., "just now", "5 minutes ago") if within last hour,
 * otherwise uses absolute time format (HH:MM:SS).
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 5) {
    return "just now";
  }

  if (diffMin === 0) {
    return `${diffSec} second${diffSec !== 1 ? "s" : ""} ago`;
  }

  if (diffHour === 0) {
    return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  }

  // Absolute time format for older messages
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get icon/emoji for narrative message type
 *
 * @param type - Message type
 * @returns Icon string or emoji character
 */
export function getMessageIcon(type: NarrativeMessage["type"]): string {
  switch (type) {
    case "scene":
      return "🏛️";
    case "narration":
      return "📖";
    case "action":
      return "⚔️";
    case "combat":
      return "💥";
    case "system":
      return "⚙️";
    case "dialogue":
      return "💬";
    default:
      return "•";
  }
}

/**
 * Get CSS class for narrative message type styling
 *
 * @param type - Message type
 * @returns Tailwind CSS class string
 *
 * Classes control text color, background, and styling per message type.
 */
export function getMessageClass(type: NarrativeMessage["type"]): string {
  switch (type) {
    case "scene":
      return "text-blue-400 font-bold";
    case "narration":
      return "text-gray-300";
    case "action":
      return "text-yellow-300";
    case "combat":
      return "text-red-400 font-semibold";
    case "system":
      return "text-gray-500 italic";
    case "dialogue":
      return "text-green-300";
    default:
      return "text-gray-200";
  }
}

/**
 * Format a single narrative message for display
 *
 * @param message - NarrativeMessage object
 * @returns Formatted message object with display properties
 */
export function formatNarrativeMessage(message: NarrativeMessage) {
  return {
    ...message,
    displayTime: formatTimestamp(message.timestamp),
    icon: getMessageIcon(message.type),
    className: getMessageClass(message.type),
  };
}

/**
 * Batch format multiple narrative messages
 *
 * @param messages - Array of NarrativeMessage objects
 * @returns Array of formatted messages
 */
export function formatNarrativeMessages(messages: NarrativeMessage[]) {
  return messages.map(formatNarrativeMessage);
}
