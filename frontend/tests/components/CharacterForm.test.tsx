import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterForm } from "@/components/CharacterForm";
import type { Character } from "@/types/character";

describe("CharacterForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const testAdventureId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Point-Buy Mode (T032)", () => {
    it("should render point-buy mode by default", () => {
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/point buy/i)).toBeChecked();
      expect(screen.getByText(/27.*points/i)).toBeInTheDocument();
    });

    it("should allow attribute allocation within point budget", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const strInput = screen.getByLabelText(/^STR\b/i);
      await user.clear(strInput);
      await user.type(strInput, "14");

      // Should update points remaining (14 costs 2 points from base 8)
      await waitFor(() => {
        expect(screen.getByText(/25.*points/i)).toBeInTheDocument();
      });
    });

    it("should prevent submission when name is empty", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(
        screen.getByText(/character name is required/i),
      ).toBeInTheDocument();
    });

    it("should show real-time modifier updates", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const strInput = screen.getByLabelText(/^STR/i);
      await user.clear(strInput);
      await user.type(strInput, "18");

      await waitFor(() => {
        expect(screen.getByText("+4")).toBeInTheDocument();
      });
    });

    it("should submit valid character data", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Gandalf");

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Gandalf",
            adventureId: testAdventureId,
            attributes: expect.objectContaining({
              str: expect.any(Number),
              dex: expect.any(Number),
              int: expect.any(Number),
              con: expect.any(Number),
              cha: expect.any(Number),
            }),
          }),
        );
      });
    });
  });

  describe("Dice Roll Mode (T033)", () => {
    it("should switch to dice roll mode", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const diceRollRadio = screen.getByLabelText(/dice roll/i);
      await user.click(diceRollRadio);

      expect(diceRollRadio).toBeChecked();
      expect(screen.queryByText(/points/i)).not.toBeInTheDocument();
    });

    it("should display roll buttons for each attribute", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const diceRollRadio = screen.getByLabelText(/dice roll/i);
      await user.click(diceRollRadio);

      expect(
        screen.getByRole("button", { name: /roll.*str/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /roll.*dex/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /roll.*int/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /roll.*con/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /roll.*cha/i }),
      ).toBeInTheDocument();
    });

    it("should show dice results after rolling", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      await user.click(screen.getByLabelText(/dice roll/i));
      const rollButton = screen.getByRole("button", { name: /roll.*str/i });
      await user.click(rollButton);

      await waitFor(() => {
        expect(screen.getByText(/rolled/i)).toBeInTheDocument();
      });
    });

    it("should prevent submission until all attributes rolled", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      await user.click(screen.getByLabelText(/dice roll/i));

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Frodo");

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/roll all attributes/i)).toBeInTheDocument();
    });
  });

  describe("Edit Mode (T059)", () => {
    const existingCharacter: Character = {
      id: "660e8400-e29b-41d4-a716-446655440000",
      name: "Gandalf",
      adventureId: testAdventureId,
      attributes: { str: 10, dex: 12, int: 18, con: 14, cha: 16 },
      modifiers: { str: 0, dex: 1, int: 4, con: 2, cha: 3 },
      createdAt: "2026-01-30T10:30:00Z",
      updatedAt: "2026-01-30T10:30:00Z",
    };

    it("should pre-populate form with existing character data", () => {
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByLabelText(/character name/i)).toHaveValue("Gandalf");
      expect(screen.getByLabelText(/^STR\b/i)).toHaveValue(10);
      expect(screen.getByLabelText(/^INT\b/i)).toHaveValue(18);
    });

    it("should allow editing attributes", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const strInput = screen.getByLabelText(/^STR\b/i);
      await user.clear(strInput);
      await user.type(strInput, "14");

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            attributes: expect.objectContaining({ str: 14 }),
          }),
        );
      });
    });
  });

  describe("Form Validation", () => {
    it("should validate attribute range (3-18)", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const strInput = screen.getByLabelText(/^STR\b/i);
      await user.clear(strInput);
      await user.type(strInput, "25");

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/must be 3-18/i)).toBeInTheDocument();
    });

    it("should validate name length", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "a".repeat(51));

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/50 characters or less/i)).toBeInTheDocument();
    });
  });

  describe("Cancel Action", () => {
    it("should call onCancel when cancel button clicked", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          adventureId={testAdventureId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Edit Mode (T059)", () => {
    const existingCharacter: Character = {
      id: "char-123",
      name: "Aragorn",
      adventureId: "adv-123",
      attributes: {
        str: 15,
        dex: 14,
        int: 13,
        con: 16,
        cha: 16,
      },
      modifiers: {
        str: 2,
        dex: 2,
        int: 1,
        con: 3,
        cha: 3,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should load and display existing character data", () => {
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByDisplayValue("Aragorn")).toBeInTheDocument();
      expect(screen.getByDisplayValue("15")).toBeInTheDocument(); // STR
      expect(screen.getByDisplayValue("16")).toBeInTheDocument(); // CON or CHA
    });

    it("should show 'Edit Character' header in edit mode", () => {
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/edit character/i)).toBeInTheDocument();
      expect(
        screen.getByText(/update your character's name and attributes/i),
      ).toBeInTheDocument();
    });

    it("should hide mode selection in edit mode", () => {
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const modeToggle = screen.queryByRole("radio", { name: /dice.roll/i });
      // Mode selection should not be visible in edit mode
      expect(modeToggle).not.toBeInTheDocument();
    });

    it("should allow attribute modification in edit mode", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const strInput = screen.getByDisplayValue("15");
      await user.clear(strInput);
      await user.type(strInput, "16");

      await waitFor(() => {
        expect(screen.getByDisplayValue("16")).toBeInTheDocument();
      });
    });

    it("should allow character name modification", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByDisplayValue("Aragorn");
      await user.clear(nameInput);
      await user.type(nameInput, "Aragorn the Great");

      expect(screen.getByDisplayValue("Aragorn the Great")).toBeInTheDocument();
    });

    it("should still validate attributes in edit mode", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const strInput = screen.getByDisplayValue("15");
      await user.clear(strInput);
      await user.type(strInput, "20"); // Above max

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/must be 3-18/i)).toBeInTheDocument();
    });

    it("should submit updated data on save", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByDisplayValue("Aragorn");
      await user.clear(nameInput);
      await user.type(nameInput, "Strider");

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Strider",
            attributes: {
              str: 15,
              dex: 14,
              int: 13,
              con: 16,
              cha: 16,
            },
          }),
        );
      });
    });

    it("should call onCancel when cancel button clicked in edit mode", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          character={existingCharacter}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
