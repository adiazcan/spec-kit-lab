import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useCharacter, useDeleteCharacter } from "@/services/characterApi";
import { CharacterSheet } from "@/components/CharacterSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingSkeleton from "@/components/LoadingSkeleton";

/**
 * CharacterSheetPage - Page for viewing a character's complete details
 * T052-T054: CharacterSheetPage with loading states and error handling
 *
 * Features:
 * - Fetches character data via useCharacter query
 * - Displays CharacterSheet component
 * - Handles loading, error, and not-found states
 * - Edit and delete actions with navigation
 * - Success message display from navigation state
 * - Breadcrumb navigation
 */
export const CharacterSheetPage: React.FC = () => {
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId: string }>();
  const location = useLocation();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.message || null,
  );

  /**
   * T053: Wire to useCharacter query with loading states
   */
  const {
    data: character,
    isLoading,
    error,
    isError,
  } = useCharacter(characterId);

  const { mutateAsync: deleteCharacter, isPending: isDeleting } =
    useDeleteCharacter();

  /**
   * Handle edit button click
   */
  const handleEdit = () => {
    navigate(`/characters/${characterId}/edit`);
  };

  /**
   * Show delete confirmation dialog
   */
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  /**
   * Confirm and execute character deletion
   */
  const confirmDelete = async () => {
    if (!characterId) return;

    try {
      await deleteCharacter(characterId);

      // Navigate back to adventure or dashboard with success message
      const adventureId = character?.adventureId;
      if (adventureId) {
        navigate(`/adventures/${adventureId}`, {
          state: {
            message: `Character "${character.name}" deleted successfully`,
          },
        });
      } else {
        navigate("/dashboard", {
          state: { message: "Character deleted successfully" },
        });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setShowDeleteDialog(false);
      // Error will be handled by mutation error state
    }
  };

  /**
   * T054: Error handling for character not found
   */
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
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <LoadingSkeleton />
          <p className="mt-4 text-center text-gray-600">Loading character...</p>
        </div>
      </div>
    );
  }

  if (isError || !character) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load character";

    const isNotFound = errorMessage.includes("not found");

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div
            className={`p-6 border-2 rounded-lg ${
              isNotFound
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <h2
              className="text-xl font-bold mb-2"
              style={{
                color: isNotFound ? "#92400e" : "#991b1b",
              }}
            >
              {isNotFound ? "Character Not Found" : "Error Loading Character"}
            </h2>
            <p
              className="mb-4"
              style={{
                color: isNotFound ? "#78350f" : "#7f1d1d",
              }}
            >
              {errorMessage}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={`px-4 py-2 text-white font-medium rounded-md ${
                  isNotFound
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 rounded-md"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Dashboard
            </button>
          </li>
          <li className="text-gray-400">/</li>
          {character.adventureId && (
            <>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/adventures/${character.adventureId}`)
                  }
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Adventure
                </button>
              </li>
              <li className="text-gray-400">/</li>
            </>
          )}
          <li className="text-gray-700 font-medium">{character.name}</li>
        </ol>
      </nav>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 max-w-5xl mx-auto">
          <div
            className="p-4 bg-green-50 border-2 border-green-200 rounded-lg"
            role="status"
          >
            <p className="text-green-800 font-medium">{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="mt-2 text-sm text-green-700 hover:text-green-900 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Character Sheet */}
      <CharacterSheet
        character={character}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        isDeleting={isDeleting}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Character?"
          message={`Are you sure you want to permanently delete "${character.name}"? This action cannot be undone.`}
          confirmText="Delete Character"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isDangerous={true}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default CharacterSheetPage;
