/**
 * CharacterSelectPage
 * Page for selecting a character to participate in an adventure
 *
 * Workflow:
 * 1. User navigates to adventure character selection page
 * 2. Component fetches available characters for the adventure
 * 3. User selects and previews characters
 * 4. User confirms selection
 * 5. Component navigates to adventure page
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdventureCharacters } from "@/services/characterApi";
import CharacterSelector from "@/components/CharacterSelector";

/**
 * CharacterSelectPage Component
 *
 * Handles character selection flow for adventure participation.
 * Manages loading, error states, and navigation.
 *
 * Routes to: /adventures/:adventureId/select-character
 *
 * @example
 * In routing:
 * ```tsx
 * <Route path="/adventures/:adventureId/select-character" element={<CharacterSelectPage />} />
 * ```
 */
export const CharacterSelectPage: React.FC = () => {
  // Get adventure ID from route params
  const { adventureId } = useParams<{ adventureId: string }>();
  const navigate = useNavigate();

  // Fetch characters for this adventure
  const {
    data: characters = [],
    isLoading,
    error,
    refetch,
  } = useAdventureCharacters(adventureId);

  // Handle character selection confirmation
  const handleCharacterSelected = (characterId: string) => {
    // Navigate to adventure page with selected character
    // In a real app, this might also make an API call to associate the character with the adventure
    navigate(`/adventures/${adventureId}`, {
      state: { selectedCharacterId: characterId },
    });
  };

  // Handle create new character
  const handleCreateNewCharacter = () => {
    // Navigate to character creation page, passing adventureId as search param
    // User will be returned to this page after creation
    navigate("/characters/create", {
      state: {
        returnTo: `/adventures/${adventureId}/select-character`,
        adventureId,
      },
    });
  };

  // Handle retry on error
  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(`/adventures/${adventureId}`)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Adventure</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Prepare for Adventure
          </h1>
          <p className="mt-2 text-gray-600">
            Choose a character from your roster to embark on this new adventure.
          </p>
        </div>

        {/* Main Content */}
        <div className="rounded-lg bg-white p-8 shadow">
          <CharacterSelector
            characters={characters}
            onSelect={handleCharacterSelected}
            onCreateNew={handleCreateNewCharacter}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
          />
        </div>

        {/* Help Text */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold">💡 Tip:</p>
          <p>
            You can create a new character if you don't have one suitable for
            this adventure. Click "Create New Character" above or navigate to
            the Character Management section.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectPage;
