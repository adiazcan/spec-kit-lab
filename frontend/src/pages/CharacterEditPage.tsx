import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCharacter, useUpdateCharacter } from "@/services/characterApi";
import { CharacterForm } from "@/components/CharacterForm";
import { ToastContainer, useToast } from "@/components/ToastContainer";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { CharacterFormData } from "@/types/character";

/**
 * CharacterEditPage - Page for editing an existing character
 * T063-T064: Create CharacterEditPage with API integration for updates
 * T119: Toast notifications for success/error feedback
 *
 * Features:
 * - Fetches character data via useCharacter query
 * - Pre-populates CharacterForm with existing data
 * - Handles loading, error, and not-found states
 * - Updates character via useUpdateCharacter mutation
 * - Navigates back to sheet on success
 * - Toast notifications for user feedback
 * - Optimistic updates via React Query
 */
export const CharacterEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId: string }>();

  const { toasts, showToast, dismissToast } = useToast();

  /**
   * T064: Wire to useCharacter query for loading existing data
   */
  const {
    data: character,
    isLoading,
    error,
    isError,
  } = useCharacter(characterId);

  /**
   * T062: Wire to useUpdateCharacter mutation
   * Handles optimistic updates and cache invalidation
   */
  const { mutateAsync: updateCharacter, isPending: isUpdating } =
    useUpdateCharacter(characterId || "");

  /**
   * T061: Handle form submission (edit mode)
   * T119: Show toast notifications for feedback
   */
  const handleSubmit = async (formData: CharacterFormData) => {
    try {
      // Update character via API
      await updateCharacter(formData);

      // Show toast and navigate back to character sheet
      showToast("Character updated successfully", "success");
      navigate(`/characters/${characterId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update character";
      showToast(errorMessage, "error");
      console.error("Character update failed:", err);
    }
  };

  /**
   * T066: Handle cancel button - discard changes and return to sheet
   */
  const handleCancel = () => {
    // Simple navigation back to sheet (no confirmation needed if no changes made)
    navigate(`/characters/${characterId}`);
  };

  // ============ Render States ============

  // Missing character ID
  if (!characterId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Invalid Character ID
            </h2>
            <p className="text-red-800 mb-4">
              No character ID was provided in the URL.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading character data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Loading character...</p>
            <LoadingSkeleton variant="form" />
          </div>
        </div>
      </div>
    );
  }

  // Character not found
  if (
    isError &&
    error instanceof Error &&
    error.message.includes("not found")
  ) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">
              Character Not Found
            </h2>
            <p className="text-yellow-800 mb-4">
              The character you're trying to edit does not exist, or you don't
              have access to it.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Other error
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Error Loading Character
            </h2>
            <p className="text-red-800 mb-4">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred while loading the character."}
            </p>
            <button
              type="button"
              onClick={() => navigate(`/characters/${characterId}`)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
            >
              Back to Character
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No character loaded (shouldn't happen but safety check)
  if (!character) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Unable to Load Character
            </h2>
            <p className="text-red-800 mb-4">
              The character data could not be loaded. Please try again.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/characters/${characterId}`)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
            >
              Back to Character
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Successfully loaded character - show edit form
  return (
    <div className="container mx-auto px-4 py-8">
      {/* ToastContainer for notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb navigation */}
        <nav className="mb-6 flex items-center text-sm text-gray-600">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            Dashboard
          </button>
          <span className="mx-2">/</span>
          <button
            onClick={() => navigate(`/characters/${characterId}`)}
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            {character.name}
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-500">Edit</span>
        </nav>

        {/* Edit form - character prop enables edit mode */}
        <CharacterForm
          character={character}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        {/* Update in progress indicator */}
        {isUpdating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
                <p className="text-gray-700 font-medium">Saving changes...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterEditPage;
