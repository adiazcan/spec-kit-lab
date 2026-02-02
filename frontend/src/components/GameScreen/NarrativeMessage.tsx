import React, { memo } from "react";
import type { NarrativeMessage as NarrativeMessageType } from "../../types/narrative";
import { formatDiceRoll, checkCritical } from "../../utils/diceAnimationHelper";

/**
 * NarrativeMessage component displays a single narrative message.
 * T081: Optimized with React.memo to prevent unnecessary re-renders
 *
 * The component re-renders only when the message object changes, improving
 * performance when displaying large numbers of narrative messages (500+).
 *
 * Message type colors:
 * - scene: Amber (location/transition)
 * - narration: Gray (ambient storytelling)
 * - action: Blue (player action result)
 * - combat: Red (combat log)
 * - system: Green (system messages)
 * - dialogue: Purple (NPC dialogue)
 *
 * Supports rich metadata display including dice roll results with
 * critical success/failure indicators.
 *
 * Features:
 * - Memoized for optimal performance with virtual scrolling
 * - Type-specific styling and icons
 * - Dice roll metadata with critical indicators
 * - Speaker attribution for dialogue messages
 * - Formatted timestamps
 * - Smooth fade-in animation via CSS classes
 *
 * @component
 * @param {Object} props - Component props
 * @param {NarrativeMessage} props.message - The narrative message to display
 * @example
 * ```tsx
 * const message: NarrativeMessage = {
 *   id: '1',
 *   timestamp: new Date(),
 *   type: 'action',
 *   content: 'You strike the goblin!',
 *   metadata: {
 *     diceRoll: { ... },
 *     speaker: 'Game Narrator'
 *   }
 * };
 *
 * <NarrativeMessage message={message} />
 * ```
 */
interface NarrativeMessageItemProps {
  message: NarrativeMessageType;
}

const getMessageStyles = (type: NarrativeMessageType["type"]) => {
  switch (type) {
    case "scene":
      return "border-l-4 border-amber-400 bg-amber-950 bg-opacity-20";
    case "narration":
      return "border-l-4 border-gray-400 bg-gray-800 bg-opacity-20";
    case "action":
      return "border-l-4 border-blue-400 bg-blue-950 bg-opacity-20";
    case "combat":
      return "border-l-4 border-red-400 bg-red-950 bg-opacity-20";
    case "system":
      return "border-l-4 border-green-400 bg-green-950 bg-opacity-20";
    case "dialogue":
      return "border-l-4 border-purple-400 bg-purple-950 bg-opacity-20";
    default:
      return "border-l-4 border-gray-400";
  }
};

const getMessageIcon = (type: NarrativeMessageType["type"]) => {
  switch (type) {
    case "scene":
      return "📍";
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
};

const getTextColor = (type: NarrativeMessageType["type"]) => {
  switch (type) {
    case "scene":
      return "text-amber-100";
    case "narration":
      return "text-gray-200";
    case "action":
      return "text-blue-100";
    case "combat":
      return "text-red-100";
    case "system":
      return "text-green-100";
    case "dialogue":
      return "text-purple-100";
    default:
      return "text-white";
  }
};

const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const NarrativeMessage: React.FC<NarrativeMessageItemProps> = memo(
  ({ message }) => {
    const diceRoll = message.metadata?.diceRoll;
    const critical = diceRoll ? checkCritical(diceRoll) : null;

    return (
      <div
        className={`narrative-message p-3 my-2 rounded ${getMessageStyles(message.type)}`}
      >
        <div className="flex gap-2">
          <span className="text-lg flex-shrink-0">
            {getMessageIcon(message.type)}
          </span>
          <div className="flex-1">
            <p className={`text-xs text-gray-400 mb-1`}>
              {formatTimestamp(message.timestamp)}
            </p>
            <p
              className={`${getTextColor(message.type)} whitespace-pre-wrap text-sm leading-relaxed`}
            >
              {message.content}
            </p>

            {/* Dice roll metadata display */}
            {diceRoll && (
              <div
                className={`
                  mt-2
                  pt-2
                  border-t
                  border-current
                  border-opacity-20
                  text-xs
                  font-mono
                  ${critical === "success" ? "text-green-300" : critical === "failure" ? "text-red-300" : "text-gray-300"}
                `}
              >
                <div className="font-semibold mb-1">
                  {diceRoll.context || "Roll"}
                </div>
                <div>{formatDiceRoll(diceRoll)}</div>
                {critical && (
                  <div className="mt-1 font-bold uppercase">
                    {critical === "success"
                      ? "✨ CRITICAL!"
                      : "⚠️ CRITICAL FAIL"}
                  </div>
                )}
              </div>
            )}

            {message.metadata?.speaker && (
              <p className="text-xs text-gray-500 mt-1">
                — {message.metadata.speaker}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if message content changed
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.type === nextProps.message.type &&
      JSON.stringify(prevProps.message.metadata) ===
        JSON.stringify(nextProps.message.metadata)
    );
  },
);
