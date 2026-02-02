import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterSheet } from "@/components/CharacterSheet";
import type { Character } from "@/types/character";

describe("CharacterSheet (T034)", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const testCharacter: Character = {
    id: "660e8400-e29b-41d4-a716-446655440000",
    name: "Gandalf the Grey",
    adventureId: "550e8400-e29b-41d4-a716-446655440000",
    attributes: {
      str: 10,
      dex: 12,
      int: 18,
      con: 14,
      cha: 16,
    },
    modifiers: {
      str: 0,
      dex: 1,
      int: 4,
      con: 2,
      cha: 3,
    },
    createdAt: "2026-01-30T10:30:00Z",
    updatedAt: "2026-01-30T10:30:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Display", () => {
    it("should render character name", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Gandalf the Grey")).toBeInTheDocument();
    });

    it("should display all attributes with values", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      // Use getAllByText for attribute abbreviations that may appear multiple times
      expect(screen.getAllByText(/STR/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Strength score").textContent).toBe("10");
      expect(screen.getAllByText(/DEX/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Dexterity score").textContent).toBe("12");
      expect(screen.getAllByText(/INT/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Intelligence score").textContent).toBe(
        "18",
      );
      expect(screen.getAllByText(/CON/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Constitution score").textContent).toBe(
        "14",
      );
      expect(screen.getAllByText(/CHA/i).length).toBeGreaterThan(0);
      expect(screen.getByLabelText("Charisma score").textContent).toBe("16");
    });

    it("should display all modifiers with correct formatting", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("+0")).toBeInTheDocument(); // STR modifier
      expect(screen.getByText("+1")).toBeInTheDocument(); // DEX modifier
      expect(screen.getByText("+4")).toBeInTheDocument(); // INT modifier
      expect(screen.getByText("+2")).toBeInTheDocument(); // CON modifier
      expect(screen.getByText("+3")).toBeInTheDocument(); // CHA modifier
    });

    it("should display creation date", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText(/created/i)).toBeInTheDocument();
      // Date is formatted as "January 30, 2026" not "1/30/2026"
      expect(screen.getByText(/January 30, 2026/)).toBeInTheDocument();
    });

    it("should display negative modifiers correctly", () => {
      const weakCharacter: Character = {
        ...testCharacter,
        attributes: { str: 8, dex: 8, int: 8, con: 8, cha: 8 },
        modifiers: { str: -1, dex: -1, int: -1, con: -1, cha: -1 },
      };

      render(
        <CharacterSheet
          character={weakCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const negativeModifiers = screen.getAllByText("-1");
      expect(negativeModifiers).toHaveLength(5);
    });
  });

  describe("Actions", () => {
    it("should render edit button", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    it("should call onEdit when edit button clicked", async () => {
      const user = userEvent.setup();
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("should render delete button", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });

    it("should call onDelete when delete button clicked", async () => {
      const user = userEvent.setup();
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it("should disable delete button when deleting", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          isDeleting={true}
        />,
      );

      const deleteButton = screen.getByRole("button", { name: /deleting/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic HTML structure", () => {
      const { container } = render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(container.querySelector("h1")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toBeInTheDocument();
    });

    it("should have appropriate button labels", () => {
      render(
        <CharacterSheet
          character={testCharacter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(
        screen.getByRole("button", { name: /edit/i }),
      ).toHaveAccessibleName();
      expect(
        screen.getByRole("button", { name: /delete/i }),
      ).toHaveAccessibleName();
    });
  });
});
