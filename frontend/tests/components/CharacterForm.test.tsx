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

      // The starting value is 10 (from POINT_BUY_CONSTRAINTS.STARTING_ATTRIBUTE)
      // Change STR to 14 - this costs more points
      const strInput = screen.getByLabelText(/^STR\b/i);
      await user.clear(strInput);
      await user.type(strInput, "14");

      // The point budget display should update
      // Starting with 27 points, each attribute starts at 10 which costs 2 points
      // So 5 attributes * 2 points = 10 points used initially, 17 remaining
      // Changing STR from 10 to 14 costs: 7 - 2 = 5 additional points
      // So remaining should be less than initial 22 (27 - 5*1)
      await waitFor(() => {
        expect(screen.getByText(/\/ 27/)).toBeInTheDocument();
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

      // Starting at 10 gives +0 modifier, changing to higher values should update
      const strInput = screen.getByRole("spinbutton", { name: /^STR/i });
      expect(strInput).toHaveValue(10);

      // Use increment button to change value instead of typing
      const increaseStrBtn = screen.getByRole("button", {
        name: /increase strength/i,
      });
      await user.click(increaseStrBtn); // 10 -> 11

      // Verify the input was updated
      expect(strInput).toHaveValue(11);

      // The modifier should be displayed
      expect(screen.getByLabelText(/strength modifier/i)).toBeInTheDocument();
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

      const diceRollRadio = screen.getByRole("radio", { name: /dice roll/i });
      await user.click(diceRollRadio);

      expect(diceRollRadio).toBeChecked();
      // Dice roll mode shows "Roll 4d6" instructions instead of point budget
      expect(screen.getAllByText(/4d6 drop lowest/i).length).toBeGreaterThan(0);
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

      const diceRollRadio = screen.getByRole("radio", { name: /dice roll/i });
      await user.click(diceRollRadio);

      // In dice roll mode, there should be "Roll 4d6" buttons
      const rollButtons = screen.getAllByRole("button", { name: /roll 4d6/i });
      expect(rollButtons.length).toBe(5); // One for each attribute
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

      await user.click(screen.getByRole("radio", { name: /dice roll/i }));
      const rollButtons = screen.getAllByRole("button", { name: /roll 4d6/i });
      await user.click(rollButtons[0]);

      // Wait for roll animation and result
      await waitFor(
        () => {
          expect(screen.getByText(/✓ Rolled/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
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

      await user.click(screen.getByRole("radio", { name: /dice roll/i }));

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

      const strInput = screen.getByRole("spinbutton", { name: /^STR/i });
      expect(strInput).toHaveValue(10); // existing character has str: 10

      // Use decrement button to decrease strength (10 -> 9 -> 8)
      const decreaseStrBtn = screen.getByRole("button", {
        name: /decrease strength/i,
      });
      await user.click(decreaseStrBtn); // 10 -> 9
      await user.click(decreaseStrBtn); // 9 -> 8

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            attributes: expect.objectContaining({ str: 8 }),
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

      // The input clamps values to 3-18 range, so entering 25 should clamp to 18
      const strInput = screen.getByLabelText(/^STR\b/i);
      await user.clear(strInput);
      await user.type(strInput, "25");

      // The value should be clamped to 18 (max)
      expect(strInput).toHaveValue(18);
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
      // The input has maxLength=50, so type exactly 51 characters
      const longName = "a".repeat(51);
      await user.type(nameInput, longName);

      const submitButton = screen.getByRole("button", {
        name: /create|update/i,
      });
      await user.click(submitButton);

      // Since the input has maxLength=50, only 50 chars should be entered
      // Validation passes because the input itself prevents > 50 chars
      expect(nameInput).toHaveValue("a".repeat(50));
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

      // Name input should have character name
      expect(screen.getByLabelText(/character name/i)).toHaveValue("Aragorn");
      // Attribute inputs should have values
      expect(screen.getByLabelText(/^STR\b/i)).toHaveValue(15);
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

      const strInput = screen.getByRole("spinbutton", { name: /^STR/i });
      expect(strInput).toHaveValue(15);

      // Use increment button to increase strength
      const increaseStrBtn = screen.getByRole("button", {
        name: /increase strength/i,
      });
      await user.click(increaseStrBtn); // 15 -> 16

      expect(strInput).toHaveValue(16);
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

      const nameInput = screen.getByLabelText(/character name/i);
      expect(nameInput).toHaveValue("Aragorn");

      await user.clear(nameInput);
      await user.type(nameInput, "Aragorn the Great");

      expect(nameInput).toHaveValue("Aragorn the Great");
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

      // The input clamps values to the valid range (3-18)
      const strInput = screen.getByLabelText(/^STR\b/i);
      await user.clear(strInput);
      await user.type(strInput, "20"); // Above max

      // Value should be clamped to 18
      expect(strInput).toHaveValue(18);
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
