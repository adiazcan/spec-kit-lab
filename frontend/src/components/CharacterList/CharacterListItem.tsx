import React, { useState, memo } from "react";
import { Link } from "react-router-dom";
import { Character } from "../../types/character";
import ConfirmDialog from "../ConfirmDialog";

interface CharacterListItemProps {
  character: Character;
  onDelete: (id: string) => void;
}

const CharacterListItem: React.FC<CharacterListItemProps> = memo(
  ({ character, onDelete }) => {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleDeleteClick = () => {
      setShowConfirmDelete(true);
    };

    const handleConfirmDelete = () => {
      onDelete(character.id);
      setShowConfirmDelete(false);
    };

    const handleCancelDelete = () => {
      setShowConfirmDelete(false);
    };

    // Determine primary attribute for a quick hint
    const attributes = character.attributes;
    const entries = Object.entries(attributes);
    const maxAttr = entries.reduce(
      (max, curr) => (curr[1] > max[1] ? curr : max),
      entries[0],
    );

    return (
      <>
        <div
          data-testid="character-item"
          className="bg-white border rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow"
        >
          <Link
            to={`/character/${character.id}/edit`}
            className="flex-grow group"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {character.name}
              </h3>
              <div className="text-sm text-gray-500 mt-1">
                <span className="uppercase font-medium mr-2">
                  {maxAttr[0]}: {maxAttr[1]}
                </span>
                <span>
                  Created {new Date(character.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Link>

          <div className="flex gap-2 ml-4">
            <Link
              to={`/character/${character.id}/edit`}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Edit
            </Link>
            <button
              onClick={handleDeleteClick}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
              aria-label={`Delete ${character.name}`}
            >
              Delete
            </button>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showConfirmDelete}
          title="Delete Character"
          message={`Are you sure you want to delete ${character.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDangerous={true}
          isLoading={false}
        />
      </>
    );
  },
);

export default CharacterListItem;
