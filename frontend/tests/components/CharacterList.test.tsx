import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterList } from "@/components/CharacterList";
import type { Character } from "@/types/character";
import { BrowserRouter } from "react-router-dom";

// Mock child components to isolate list testing
vi.mock("@/components/CharacterList/CharacterListItem", () => ({
  default: ({
    character,
    onDelete,
  }: {
    character: Character;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="character-item">
      <span>{character.name}</span>
      <button onClick={() => onDelete(character.id)}>Delete</button>
    </div>
  ),
}));

describe("CharacterList (T079, T080)", () => {
  const mockCharacters: Character[] = [
    {
      id: "char-1",
      name: "Aragorn",
      adventureId: "adv-1",
      attributes: { str: 16, dex: 14, int: 12, con: 15, cha: 17 },
      modifiers: { str: 3, dex: 2, int: 1, con: 2, cha: 3 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "char-2",
      name: "Legolas",
      adventureId: "adv-1",
      attributes: { str: 12, dex: 19, int: 14, con: 12, cha: 13 },
      modifiers: { str: 1, dex: 4, int: 2, con: 1, cha: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a list of characters", () => {
    render(
      <BrowserRouter>
        <CharacterList characters={mockCharacters} onDelete={mockOnDelete} />
      </BrowserRouter>,
    );

    expect(screen.getAllByTestId("character-item")).toHaveLength(2);
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
    expect(screen.getByText("Legolas")).toBeInTheDocument();
  });

  it("renders empty state when no characters provided (T089)", () => {
    render(
      <BrowserRouter>
        <CharacterList characters={[]} onDelete={mockOnDelete} />
      </BrowserRouter>,
    );

    expect(screen.getByText(/no characters found/i)).toBeInTheDocument();
    expect(screen.queryByTestId("character-item")).not.toBeInTheDocument();
  });

  it("handles delete action from list item", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <CharacterList characters={mockCharacters} onDelete={mockOnDelete} />
      </BrowserRouter>,
    );

    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith("char-1");
  });

  it("filters characters based on search term (T093)", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <CharacterList characters={mockCharacters} onDelete={mockOnDelete} />
      </BrowserRouter>,
    );

    // Initial state: shows all
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
    expect(screen.getByText("Legolas")).toBeInTheDocument();

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search characters/i);
    await user.type(searchInput, "Legolas");

    // Should filter
    expect(screen.queryByText("Aragorn")).not.toBeInTheDocument();
    expect(screen.getByText("Legolas")).toBeInTheDocument();

    // Clear filter
    await user.clear(searchInput);
    expect(screen.getByText("Aragorn")).toBeInTheDocument();
    expect(screen.getByText("Legolas")).toBeInTheDocument();
  });
});
