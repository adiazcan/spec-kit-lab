import React from "react";
import { AttributeSection } from "./CharacterSheet/AttributeSection";
import type { Character } from "@/types/character";

export interface CharacterSheetProps {
  /** Character data to display */
  character: Character;
  /** Callback when edit button clicked */
  onEdit: () => void;
  /** Callback when delete button clicked */
  onDelete: () => void;
  /** Whether delete operation is in progress */
  isDeleting?: boolean;
}

/**
 * CharacterSheet - Complete character display component
 * T046-T048: CharacterSheet component with attributes, edit, and delete
 *
 * Features:
 * - Displays character name and creation date
 * - Shows all attributes with modifiers
 * - Edit and Delete action buttons
 * - Loading state for delete operation
 * - Responsive layout (mobile to desktop)
 * - Semantic HTML for screen readers
 * - Print-friendly styles
 */
export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const createdDate = new Date(character.createdAt);
  const updatedDate = new Date(character.updatedAt);
  const wasUpdated = createdDate.getTime() !== updatedDate.getTime();

  return (
    <article className="character-sheet max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <header className="mb-8 border-b-2 border-gray-200 pb-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {character.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <p>
            <span className="font-medium">Created:</span>{" "}
            {createdDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {wasUpdated && (
            <p>
              <span className="font-medium">Last Updated:</span>{" "}
              {updatedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          <p className="text-xs text-gray-500 ml-auto">ID: {character.id}</p>
        </div>
      </header>

      {/* Attributes */}
      <section aria-labelledby="attributes-heading" className="mb-8">
        <h2
          id="attributes-heading"
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Attributes & Modifiers
        </h2>
        <AttributeSection
          attributes={character.attributes}
          modifiers={character.modifiers}
        />
      </section>

      {/* Divider */}
      <div className="border-t-2 border-gray-200 my-6" />

      {/* Actions */}
      <footer className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={isDeleting}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors print:hidden"
        >
          Edit Character
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors print:hidden"
        >
          {isDeleting ? "Deleting..." : "Delete Character"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors ml-auto print:hidden"
        >
          Print Sheet
        </button>
      </footer>

      {/* Print-only styles */}
      <style>{`
        @media print {
          .character-sheet {
            box-shadow: none;
            max-width: 100%;
            padding: 0;
          }
          .print:hidden {
            display: none !important;
          }
        }
      `}</style>
    </article>
  );
};
