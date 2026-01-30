import React, { useState, useMemo } from "react";
import { Character } from "../../types/character";
import CharacterListItem from "./CharacterListItem";

interface CharacterListProps {
  characters: Character[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  onDelete,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCharacters = useMemo(() => {
    if (!searchTerm) return characters;
    const lowerTerm = searchTerm.toLowerCase();
    return characters.filter((char) =>
      char.name.toLowerCase().includes(lowerTerm),
    );
  }, [characters, searchTerm]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <h3 className="text-lg font-medium text-gray-900">
          No characters found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new character.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredCharacters.length > 0 ? (
          filteredCharacters.map((character) => (
            <CharacterListItem
              key={character.id}
              character={character}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No characters match "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterList;
