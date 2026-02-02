/**
 * CharacterSelector Component
 * Allows users to select one character from their available characters
 * Features: character list display, preview modal, confirmation workflow
 *
 * Props:
 * - characters: Array of Character objects to display
 * - onSelect: Called with character ID when selection is confirmed
 * - onCreateNew: Called when user chooses to create a new character
 * - isLoading: Whether data is being fetched
 * - error: Error object if fetch failed
 * - onRetry: Called when user clicks retry on error
 */

import React, { useState } from "react";
import { Character } from "@/types/character";
import CharacterPreviewCard from "./CharacterSelector/CharacterPreviewCard";
import CharacterPreviewModal from "./CharacterSelector/CharacterPreviewModal";
import ConfirmDialog from "./ConfirmDialog";

interface CharacterSelectorProps {
  /** List of available characters to select from */
  characters: Character[];
  /** Callback when user confirms a character selection */
  onSelect: (characterId: string) => void;
  /** Callback when user wants to create a new character */
  onCreateNew?: () => void;
  /** Whether characters are being loaded */
  isLoading?: boolean;
  /** Error object if loading failed */
  error?: Error | null;
  /** Callback to retry loading */
  onRetry?: () => void;
}

/**
 * CharacterSelector Component
 *
 * Displays a list of characters with preview and selection capabilities.
 * Manages the selection workflow: list → preview (optional) → select → confirm → callback
 *
 * @example
 * ```tsx
 * const { data: characters } = useAdventureCharacters(adventureId);
 * <CharacterSelector
 *   characters={characters || []}
 *   onSelect={(id) => handleCharacterSelected(id)}
 *   onCreateNew={() => navigate('/create-character')}
 *   isLoading={isLoading}
 *   error={error}
 * />
 * ```
 */
export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  characters,
  onSelect,
  onCreateNew,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  // State Management
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [previewCharacterId, setPreviewCharacterId] = useState<string | null>(
    null,
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find character objects by ID
  const selectedCharacter = selectedCharacterId
    ? characters.find((c) => c.id === selectedCharacterId)
    : null;
  const previewCharacter = previewCharacterId
    ? characters.find((c) => c.id === previewCharacterId)
    : null;

  // Handle character selection (enables confirm button)
  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId);
  };

  // Handle preview modal open
  const handlePreviewCharacter = (characterId: string) => {
    setPreviewCharacterId(characterId);
  };

  // Handle preview modal close
  const handleClosePreview = () => {
    setPreviewCharacterId(null);
  };

  // Handle confirm button click - show confirmation dialog
  const handleConfirmClick = () => {
    if (!selectedCharacter) return;
    setShowConfirmDialog(true);
  };

  // Handle final confirmation
  const handleFinalConfirm = async () => {
    if (!selectedCharacter) return;

    try {
      setIsSubmitting(true);
      onSelect(selectedCharacter.id);
      // Don't close dialog here - parent will handle navigation
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle confirmation cancel
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Select a Character</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-gray-200"
              role="status"
              aria-label="Loading character"
            />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="text-lg font-bold text-red-900">
          Error Loading Characters
        </h2>
        <p className="text-red-700">{error.message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Render empty state
  if (characters.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          No Characters Available
        </h2>
        <p className="text-gray-600">
          You don't have any characters yet. Create one to get started!
        </p>
        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
            aria-label="Create a new character"
          >
            Create New Character
          </button>
        )}
      </div>
    );
  }

  // Render main selection UI
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Select a Character
          </h2>
          <p className="mt-1 text-gray-600">
            Choose one of your characters for this adventure.
            {characters.length > 1 &&
              ` You have ${characters.length} characters available.`}
          </p>
        </div>
        {selectedCharacter && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Currently Selected:</p>
            <p className="text-lg font-bold text-blue-600">
              {selectedCharacter.name}
            </p>
          </div>
        )}
      </div>

      {/* Character List Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => (
          <CharacterPreviewCard
            key={character.id}
            character={character}
            isSelected={selectedCharacterId === character.id}
            isDisabled={isLoading || isSubmitting}
            onSelect={() => handleSelectCharacter(character.id)}
            onPreview={() => handlePreviewCharacter(character.id)}
          />
        ))}
      </div>

      {/* Create New Character Option */}
      {onCreateNew && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onCreateNew}
            disabled={isSubmitting}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
            aria-label="Create another character"
          >
            Create New Character
          </button>
        </div>
      )}

      {/* Selection Actions Footer */}
      {selectedCharacter && (
        <div className="flex gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Selected:</p>
            <p className="text-lg font-bold text-gray-900">
              {selectedCharacter.name}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedCharacterId(null)}
              disabled={isSubmitting}
              className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isSubmitting}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Confirming..." : "Confirm Selection"}
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewCharacter && (
        <CharacterPreviewModal
          character={previewCharacter}
          isOpen={!!previewCharacterId}
          onClose={handleClosePreview}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedCharacter && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title="Confirm Character Selection"
          message={`You are about to select "${selectedCharacter.name}" for this adventure. Is this correct?`}
          confirmText="Yes, Select This Character"
          cancelText="No, Go Back"
          onConfirm={handleFinalConfirm}
          onCancel={handleCancelConfirm}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};

export default CharacterSelector;
