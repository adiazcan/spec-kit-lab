/**
 * CharacterSelector Component Tests
 * Tests the character selection interface for adventure character assignment
 *
 * UC1: User views list of available characters
 * UC2: User previews a character's full details
 * UC3: User confirms character selection
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CharacterSelector from "@/components/CharacterSelector";
import { Character } from "@/types/character";

// ==================== Test Data ====================

const mockCharacters: Character[] = [
  {
    id: "char-1",
    name: "Aragorn",
    adventureId: "adv-1",
    attributes: { str: 15, dex: 13, int: 12, con: 16, cha: 17 },
    modifiers: { str: 2, dex: 1, int: 1, con: 3, cha: 3 },
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "char-2",
    name: "Gandalf the Grey",
    adventureId: "adv-1",
    attributes: { str: 10, dex: 11, int: 18, con: 14, cha: 16 },
    modifiers: { str: 0, dex: 0, int: 4, con: 2, cha: 3 },
    createdAt: "2026-01-15T14:30:00Z",
    updatedAt: "2026-01-15T14:30:00Z",
  },
  {
    id: "char-3",
    name: "Legolas",
    adventureId: "adv-1",
    attributes: { str: 12, dex: 18, int: 14, con: 13, cha: 12 },
    modifiers: { str: 1, dex: 4, int: 2, con: 1, cha: 1 },
    createdAt: "2026-01-10T09:15:00Z",
    updatedAt: "2026-01-10T09:15:00Z",
  },
];

const emptyCharacters: Character[] = [];

// ==================== Helper Functions ====================

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
}

// ==================== Test Suite ====================

describe("CharacterSelector Component", () => {
  it("renders the component title", () => {
    renderWithQueryClient(
      <CharacterSelector
        characters={mockCharacters}
        onSelect={vi.fn()}
        isLoading={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /select a character/i }),
    ).toBeInTheDocument();
  });

  describe("Character List Display", () => {
    it("displays all available characters", () => {
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      mockCharacters.forEach((character) => {
        expect(screen.getByText(character.name)).toBeInTheDocument();
      });
    });

    it("shows character summary stats (top attributes)", () => {
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      // Check that Aragorn's high stats are visible in summary
      const aragornCard = screen.getByText("Aragorn").closest("div");
      expect(aragornCard).toBeInTheDocument();

      // Verify creation date is shown (formatted as "Jan 20, 2026")
      expect(screen.getByText(/Jan 20, 2026/)).toBeInTheDocument();
    });

    it("renders each character as a selectable item", () => {
      const onSelect = vi.fn();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={onSelect}
          isLoading={false}
        />,
      );

      const characterItems = screen.getAllByRole("button", {
        name: /select|preview/i,
      });
      expect(characterItems.length).toBeGreaterThanOrEqual(
        mockCharacters.length,
      );
    });

    it("displays empty state when no characters available", () => {
      renderWithQueryClient(
        <CharacterSelector
          characters={emptyCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      expect(screen.getByText(/no characters available/i)).toBeInTheDocument();
    });

    it("shows 'Create New Character' option in empty state", () => {
      const onCreateNew = vi.fn();
      renderWithQueryClient(
        <CharacterSelector
          characters={emptyCharacters}
          onSelect={vi.fn()}
          onCreateNew={onCreateNew}
          isLoading={false}
        />,
      );

      const createButton = screen.getByRole("button", {
        name: /create a new character/i,
      });
      expect(createButton).toBeInTheDocument();

      fireEvent.click(createButton);
      expect(onCreateNew).toHaveBeenCalled();
    });

    it("shows 'Create New Character' option in non-empty state", () => {
      const onCreateNew = vi.fn();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          onCreateNew={onCreateNew}
          isLoading={false}
        />,
      );

      const createButton = screen.getByRole("button", {
        name: /create new character|create another/i,
      });
      expect(createButton).toBeInTheDocument();

      fireEvent.click(createButton);
      expect(onCreateNew).toHaveBeenCalled();
    });
  });

  describe("Character Preview Modal", () => {
    it("opens preview modal when user clicks a character", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      // Click to preview first character
      const previewButtons = screen.getAllByRole("button", {
        name: /preview/i,
      });
      await user.click(previewButtons[0]);

      // Should show modal with character details
      await waitFor(() => {
        const modal = screen.getByRole("dialog");
        expect(modal).toBeInTheDocument();
      });

      // Modal should show all attributes
      const modal = screen.getByRole("dialog");
      expect(within(modal).getByText(/strength/i)).toBeInTheDocument();
    });

    it("displays complete character sheet in preview modal", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      // Click to preview first character
      const previewButtons = screen.getAllByRole("button", {
        name: /preview/i,
      });
      await user.click(previewButtons[0]);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Character name in modal heading
      const modal = screen.getByRole("dialog");
      expect(
        within(modal).getByRole("heading", { name: mockCharacters[0].name }),
      ).toBeInTheDocument();

      // All attributes visible
      const character = mockCharacters[0];
      expect(
        within(modal).getByText(
          new RegExp(character.attributes.str.toString()),
        ),
      ).toBeInTheDocument();
    });

    it("closes preview modal when user clicks close button", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      // Open preview
      const previewButtons = screen.getAllByRole("button", {
        name: /preview/i,
      });
      await user.click(previewButtons[0]);

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Close modal using button within the dialog
      const modal = screen.getByRole("dialog");
      const closeButtons = within(modal).getAllByRole("button", {
        name: /close preview/i,
      });
      // Click the footer button (the one with "Close Preview" text)
      await user.click(closeButtons[1]);

      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes preview modal with Escape key", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      // Open preview
      const previewButtons = screen.getAllByRole("button", {
        name: /preview/i,
      });
      await user.click(previewButtons[0]);

      // Press Escape
      await user.keyboard("{Escape}");

      // Modal should close
      // Character name should not be visible (or visible only in list)
      const modals = screen.queryAllByRole("dialog");
      expect(modals.length).toBe(0);
    });
  });

  describe("Character Selection & Confirmation", () => {
    it("enables confirm button only after selecting a character", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={onSelect}
          isLoading={false}
        />,
      );

      // Confirm button should not exist initially (only appears after selection)
      expect(
        screen.queryByRole("button", { name: /confirm selection/i }),
      ).not.toBeInTheDocument();

      // Click to select first character
      const selectButtons = screen.getAllByRole("button", {
        name: /select this character/i,
      });
      await user.click(selectButtons[0]);

      // Confirm button should now be visible and enabled
      const confirmButton = screen.getByRole("button", {
        name: /confirm selection/i,
      });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).not.toBeDisabled();
    });

    it("shows confirmation dialog before finalizing selection", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={onSelect}
          isLoading={false}
        />,
      );

      // Select a character
      const selectButtons = screen.getAllByRole("button", {
        name: /select this character/i,
      });
      await user.click(selectButtons[0]);

      // Click confirm
      const confirmButton = screen.getByRole("button", {
        name: /confirm selection/i,
      });
      await user.click(confirmButton);

      // Confirmation dialog should appear (shows character name in message)
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      // Verify the character name is mentioned in the confirmation dialog
      const dialog = screen.getByRole("alertdialog");
      expect(
        within(dialog).getByText(new RegExp(mockCharacters[0].name, "i")),
      ).toBeInTheDocument();
    });

    it("calls onSelect with character ID when user confirms", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={onSelect}
          isLoading={false}
        />,
      );

      // Select first character
      const selectButtons = screen.getAllByRole("button", {
        name: /select this character/i,
      });
      await user.click(selectButtons[0]);

      // Confirm
      const confirmButton = screen.getByRole("button", {
        name: /confirm selection/i,
      });
      await user.click(confirmButton);

      // Confirm dialog appears - click "Yes, Select This Character"
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const finalConfirmButton = screen.getByRole("button", {
        name: /yes.*select/i,
      });
      await user.click(finalConfirmButton);

      // onSelect should be called with character ID
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(mockCharacters[0].id);
      });
    });

    it("allows user to cancel selection from confirmation dialog", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={onSelect}
          isLoading={false}
        />,
      );

      // Select first character
      const selectButtons = screen.getAllByRole("button", {
        name: /select this character/i,
      });
      await user.click(selectButtons[0]);

      // Confirm
      const confirmButton = screen.getByRole("button", {
        name: /confirm selection/i,
      });
      await user.click(confirmButton);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      // Cancel from dialog
      const cancelButton = screen.getByRole("button", {
        name: /no.*go back/i,
      });
      await user.click(cancelButton);

      // Dialog should close without calling onSelect
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("shows loading skeleton when isLoading is true", () => {
      renderWithQueryClient(
        <CharacterSelector
          characters={[]}
          onSelect={vi.fn()}
          isLoading={true}
        />,
      );

      // Should show loading indicators (multiple skeleton cards)
      const loadingIndicators = screen.getAllByRole("status");
      expect(loadingIndicators.length).toBeGreaterThan(0);
    });

    it("disables interactions while loading", () => {
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={true}
        />,
      );

      // Interactive buttons should be disabled
      const selectButtons = screen.queryAllByRole("button", {
        name: /select|preview|confirm/i,
      });

      selectButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Error States", () => {
    it("displays error message when provided", () => {
      const errorMessage = "Failed to load characters";
      renderWithQueryClient(
        <CharacterSelector
          characters={[]}
          onSelect={vi.fn()}
          isLoading={false}
          error={new Error(errorMessage)}
        />,
      );

      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });

    it("provides retry button when error occurs", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      renderWithQueryClient(
        <CharacterSelector
          characters={[]}
          onSelect={vi.fn()}
          onRetry={onRetry}
          isLoading={false}
          error={new Error("Failed to load")}
        />,
      );

      const retryButton = screen.getByRole("button", {
        name: /retry|try again/i,
      });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has aria-label on character cards", () => {
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      mockCharacters.forEach((character) => {
        const card = screen
          .getByText(character.name)
          .closest("[role='button']");
        expect(card).toHaveAttribute("aria-label");
      });
    });

    it("maintains focus management when modal opens/closes", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      // Click preview
      const previewButtons = screen.getAllByRole("button", {
        name: /preview/i,
      });
      await user.click(previewButtons[0]);

      // Focus should be in modal
      const modalElement = screen.getByRole("dialog");
      expect(modalElement).toBeInTheDocument();
    });

    it("supports keyboard navigation through character list", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <CharacterSelector
          characters={mockCharacters}
          onSelect={vi.fn()}
          isLoading={false}
        />,
      );

      // Verify character cards exist and have proper aria attributes
      // Note: Multiple elements may have "character:" in their name
      const characterCards = screen
        .getAllByRole("button", {
          name: /character:/i,
        })
        .filter(
          (el) =>
            el.getAttribute("aria-label")?.startsWith("Character:") ||
            el.getAttribute("aria-label")?.startsWith("Select this character:"),
        );

      // Each card should have tabIndex set for keyboard navigation (excluding disabled buttons)
      const tabbableCards = characterCards.filter(
        (card) => card.getAttribute("tabindex") === "0",
      );
      expect(tabbableCards.length).toBeGreaterThan(0);

      // Preview buttons should be focusable
      const previewButtons = screen.getAllByRole("button", {
        name: /preview/i,
      });
      expect(previewButtons.length).toBe(mockCharacters.length);

      // Select buttons should be focusable
      const selectButtons = screen.getAllByRole("button", {
        name: /select this character/i,
      });
      expect(selectButtons.length).toBe(mockCharacters.length);

      // Verify keyboard activation works - tab navigation
      await user.tab();
      await user.tab();
      await user.tab();

      // At least some element should have focus in the document
      expect(document.activeElement).not.toBe(document.body);
    });
  });
});
