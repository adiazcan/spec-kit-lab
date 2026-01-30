import React from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { CharacterForm } from "@/components/CharacterForm";
import { useCreateCharacter } from "@/services/characterApi";
import { ToastContainer, useToast } from "@/components/ToastContainer";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { CharacterFormData } from "@/types/character";

/**
 * CharacterCreatePage - Page for creating a new character
 * T049-T051: CharacterCreatePage with API wiring and navigation
 * T119: Toast notifications for success/error feedback
 *
 * Features:
 * - Renders CharacterForm in create mode
 * - Wired to useCreateCharacter mutation
 * - Navigates to character sheet on success
 * - Toast notifications for user feedback
 * - Gets adventureId from query params
 * - Back navigation support
 */
export const CharacterCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { adventureId: paramAdventureId } = useParams<{
    adventureId: string;
  }>();
  const adventureId = paramAdventureId || searchParams.get("adventureId") || "";

  const { toasts, showToast, dismissToast } = useToast();
  const { mutateAsync: createCharacter, isPending } = useCreateCharacter();

  /**
   * T050: Wire to useCreateCharacter mutation
   * T051: Navigate to character sheet on success
   * T119: Show toast notifications for feedback
   */
  const handleSubmit = async (formData: CharacterFormData) => {
    try {
      const character = await createCharacter(formData);

      // Success! Show toast and navigate to character sheet
      showToast("Character created successfully!", "success");
      navigate(`/characters/${character.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create character";
      showToast(message, "error");
      console.error("Character creation failed:", error);
    }
  };

  const handleCancel = () => {
    // Go back to previous page or adventure dashboard
    if (adventureId) {
      navigate(`/adventures/${adventureId}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (!adventureId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <h2 className="text-xl font-bold text-red-900 mb-2">
              Missing Adventure ID
            </h2>
            <p className="text-red-800 mb-4">
              Character creation requires an adventure ID. Please select an
              adventure first.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ToastContainer for notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-700 font-medium mb-2 inline-flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Create New Character
        </h1>
        <p className="text-gray-600 mt-2">
          Design your character using point-buy or dice roll mode
        </p>
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <LoadingSkeleton />
            <p className="mt-4 text-center text-gray-700 font-medium">
              Creating character...
            </p>
          </div>
        </div>
      )}

      {/* Character Form */}
      <CharacterForm
        adventureId={adventureId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CharacterCreatePage;
