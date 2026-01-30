/**
 * CharacterPreviewModal Component
 * Modal dialog displaying the full character sheet for preview
 *
 * Triggered when user clicks "Preview" on a character card
 * Shows all attributes, modifiers, and character details
 * Can be closed via close button or Escape key
 */

import React, { useEffect } from "react";
import { Character, ATTRIBUTE_NAMES, AttributeKey } from "@/types/character";

interface CharacterPreviewModalProps {
  /** Character to display in modal */
  character: Character;
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when user closes the modal */
  onClose: () => void;
}

/**
 * CharacterPreviewModal Component
 *
 * Displays full character details in a modal overlay.
 * Supports keyboard navigation (Escape to close).
 *
 * @example
 * ```tsx
 * <CharacterPreviewModal
 *   character={selectedCharacter}
 *   isOpen={showPreview}
 *   onClose={() => setShowPreview(false)}
 * />
 * ```
 */
export const CharacterPreviewModal: React.FC<CharacterPreviewModalProps> = ({
  character,
  isOpen,
  onClose,
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format creation date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const attributeKeys: AttributeKey[] = ["str", "dex", "int", "con", "cha"];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-lg">
          {/* Header */}
          <div className="sticky top-0 flex items-start justify-between border-b border-gray-200 bg-gray-50 p-6">
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                {character.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Created: {formatDate(character.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Close preview modal"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Attributes and Modifiers Section */}
            <section>
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Attributes & Modifiers
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {attributeKeys.map((key) => (
                  <div
                    key={key}
                    className="rounded-lg border border-gray-200 bg-white p-4 text-center"
                  >
                    <div className="text-xl font-bold text-blue-600 mb-2">
                      {character.attributes[key]}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {ATTRIBUTE_NAMES[key]}
                    </div>
                    <div className="flex items-center justify-center rounded-full bg-gray-100 py-1">
                      <span
                        className={`text-sm font-bold ${
                          character.modifiers[key] > 0
                            ? "text-green-600"
                            : character.modifiers[key] < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {character.modifiers[key] > 0 ? "+" : ""}
                        {character.modifiers[key]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Statistics Section */}
            <section className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Character Details
              </h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Character ID:</dt>
                  <dd className="font-mono text-sm text-gray-900">
                    {character.id}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Adventure ID:</dt>
                  <dd className="font-mono text-sm text-gray-900">
                    {character.adventureId}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Created:</dt>
                  <dd className="text-gray-900">
                    {formatDate(character.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Last Updated:</dt>
                  <dd className="text-gray-900">
                    {formatDate(character.updatedAt)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Summary Stats */}
            <section className="border-t border-gray-200 pt-6">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Summary</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-xs font-semibold text-blue-600 uppercase">
                    Highest Attribute
                  </div>
                  <div className="mt-1 text-lg font-bold text-blue-900">
                    {Math.max(...Object.values(character.attributes))}
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-xs font-semibold text-green-600 uppercase">
                    Highest Modifier
                  </div>
                  <div className="mt-1 text-lg font-bold text-green-900">
                    +{Math.max(...Object.values(character.modifiers))}
                  </div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="text-xs font-semibold text-purple-600 uppercase">
                    Avg Attribute
                  </div>
                  <div className="mt-1 text-lg font-bold text-purple-900">
                    {(
                      Object.values(character.attributes).reduce(
                        (a, b) => a + b,
                        0,
                      ) / 5
                    ).toFixed(1)}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-400"
              aria-label="Close preview modal"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CharacterPreviewModal;
