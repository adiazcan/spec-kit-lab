/**
 * CharacterPreviewCard Component
 * Displays a character in a compact card format for list and preview contexts
 * Shows character name, creation date, and key attribute summary
 *
 * Used in: CharacterSelector for list display and preview modal
 */

import React from "react";
import { Character, ATTRIBUTE_NAMES, AttributeKey } from "@/types/character";

interface CharacterPreviewCardProps {
  /** Character data to display */
  character: Character;
  /** Called when user clicks preview button */
  onPreview?: () => void;
  /** Called when user clicks select button */
  onSelect?: () => void;
  /** Whether the card is currently selected */
  isSelected?: boolean;
  /** Whether card interactions are disabled (during loading/submission) */
  isDisabled?: boolean;
  /** Optional CSS class for styling */
  className?: string;
}

/**
 * Component for displaying character summary in a card layout
 *
 * @example
 * ```tsx
 * <CharacterPreviewCard
 *   character={character}
 *   onSelect={() => handleSelect(character.id)}
 *   onPreview={() => handlePreview(character)}
 *   isSelected={selectedId === character.id}
 * />
 * ```
 */
export const CharacterPreviewCard: React.FC<CharacterPreviewCardProps> = ({
  character,
  onPreview,
  onSelect,
  isSelected = false,
  isDisabled = false,
  className = "",
}) => {
  // Get top 3 attributes by value for summary display
  const getTopAttributes = (): Array<{ key: AttributeKey; value: number }> => {
    return (
      Object.entries(character.attributes) as Array<[AttributeKey, number]>
    )
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };

  // Format creation date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const topAttributes = getTopAttributes();

  return (
    <div
      className={`
        relative rounded-lg border-2 p-4 transition-all
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 shadow-lg"
            : "border-gray-200 bg-white hover:shadow-md"
        }
        ${isDisabled ? "pointer-events-none opacity-50" : ""}
        ${className}
      `}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`Character: ${character.name}`}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      {/* Header: Name and Creation Date */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{character.name}</h3>
          <p className="text-sm text-gray-500">
            Created: {formatDate(character.createdAt)}
          </p>
        </div>
        {isSelected && (
          <div className="flex items-center justify-center rounded-full bg-blue-500 px-3 py-1">
            <span className="text-xs font-semibold text-white">Selected</span>
          </div>
        )}
      </div>

      {/* Summary: Top 3 Attributes */}
      <div className="mb-4 space-y-1">
        {topAttributes.map(({ key, value }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {ATTRIBUTE_NAMES[key]}:
            </span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onPreview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            disabled={isDisabled}
            className="flex-1 rounded bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
            aria-label={`Preview ${character.name}`}
          >
            Preview
          </button>
        )}
        {onSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            disabled={isDisabled}
            className={`
              flex-1 rounded px-3 py-2 text-sm font-medium transition-colors
              ${
                isSelected
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }
              disabled:opacity-50
            `}
            aria-label={`Select this character: ${character.name}`}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CharacterPreviewCard;
