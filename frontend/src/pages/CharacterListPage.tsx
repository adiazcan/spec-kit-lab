import React from "react";
import { useParams, Link } from "react-router-dom";
import { CharacterList } from "../components/CharacterList";
import {
  useAdventureCharacters,
  useDeleteCharacter,
} from "../services/characterApi";
import { Character } from "../types/character";

const CharacterListPage: React.FC = () => {
  const { adventureId } = useParams<{ adventureId: string }>();

  const {
    data: characters = [],
    isLoading,
    error,
  } = useAdventureCharacters(adventureId);

  const { mutate: deleteCharacter } = useDeleteCharacter();

  const handleDelete = (id: string) => {
    deleteCharacter(id, {
      onError: (err) => {
        console.error("Failed to delete character:", err);
        alert("Failed to delete character. Please try again.");
      },
    });
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 text-xl font-bold mb-4">
          Error Loading Characters
        </div>
        <p className="text-gray-600 mb-4">{(error as Error).message}</p>
        <Link
          to={`/game/${adventureId}`}
          className="text-blue-600 hover:underline"
        >
          Return to Adventure
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Characters</h1>
          <p className="text-gray-500">Manage your party members</p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/game/${adventureId}`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Adventure
          </Link>
          <Link
            to={`/game/${adventureId}/character/create`}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
          >
            Create Character
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow min-h-[400px] p-6">
        <CharacterList
          characters={characters as Character[]}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default CharacterListPage;
