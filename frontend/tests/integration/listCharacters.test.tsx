/**
 * Character List Page Integration Tests
 * Tests the complete flow of viewing and managing a character list
 *
 * User Journey:
 * 1. User navigates to character list page
 * 2. System fetches characters from the adventure
 * 3. User sees list of characters with basic info
 * 4. User can search/filter characters
 * 5. User can click on a character to edit
 * 6. User can delete a character with confirmation
 * 7. List updates optimistically on deletion
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import CharacterListPage from "@/pages/CharacterListPage";
import { Character } from "@/types/character";

// ==================== Mocked API ====================

const mockCharacters: Character[] = [
  {
    id: "char-1",
    name: "Aragorn",
    adventureId: "adv-123",
    attributes: { str: 15, dex: 13, int: 12, con: 16, cha: 17 },
    modifiers: { str: 2, dex: 1, int: 1, con: 3, cha: 3 },
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "char-2",
    name: "Legolas",
    adventureId: "adv-123",
    attributes: { str: 12, dex: 18, int: 14, con: 13, cha: 12 },
    modifiers: { str: 1, dex: 4, int: 2, con: 1, cha: 1 },
    createdAt: "2026-01-15T14:30:00Z",
    updatedAt: "2026-01-15T14:30:00Z",
  },
  {
    id: "char-3",
    name: "Gimli",
    adventureId: "adv-123",
    attributes: { str: 17, dex: 10, int: 11, con: 18, cha: 10 },
    modifiers: { str: 3, dex: 0, int: 0, con: 4, cha: 0 },
    createdAt: "2026-01-10T09:15:00Z",
    updatedAt: "2026-01-10T09:15:00Z",
  },
];

let apiCharacters = [...mockCharacters];

const mockDeleteCharacter = vi.fn(async (id: string) => {
  apiCharacters = apiCharacters.filter((c) => c.id !== id);
});

vi.mock("@/services/characterApi", () => ({
  useAdventureCharacters: (adventureId: string) => {
    if (!adventureId) {
      return { data: [], isLoading: false, error: null };
    }
    return {
      data: apiCharacters,
      isLoading: false,
      error: null,
    };
  },
  useDeleteCharacter: () => ({
    mutate: vi.fn((id: string, { onError }: any) => {
      try {
        mockDeleteCharacter(id);
      } catch (err) {
        onError?.(err);
      }
    }),
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ adventureId: "adv-123" }),
    useNavigate: () => vi.fn(),
  };
});

// ==================== Helper Functions ====================

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

// ==================== Test Suite ====================

describe("Character List Page Integration Tests (T081)", () => {
  beforeEach(() => {
    apiCharacters = [...mockCharacters];
    vi.clearAllMocks();
  });

  describe("Page Load & List Display", () => {
    it("loads character list page with title and controls", () => {
      renderWithProviders(<CharacterListPage />);

      expect(
        screen.getByRole("heading", { name: /characters/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /create character/i }),
      ).toBeInTheDocument();
    });

    it("displays all characters from the adventure", async () => {
      renderWithProviders(<CharacterListPage />);

      await waitFor(() => {
        expect(screen.getByText("Aragorn")).toBeInTheDocument();
        expect(screen.getByText("Legolas")).toBeInTheDocument();
        expect(screen.getByText("Gimli")).toBeInTheDocument();
      });
    });

    it("shows empty state when no characters exist", async () => {
      apiCharacters = [];
      renderWithProviders(<CharacterListPage />);

      await waitFor(() => {
        expect(screen.getByText(/no characters found/i)).toBeInTheDocument();
      });
    });
  });

  describe("Character Item Display", () => {
    it("displays character name and primary attribute", async () => {
      renderWithProviders(<CharacterListPage />);

      await waitFor(() => {
        // Aragorn's highest is CHA: 17
        expect(screen.getByText(/CHA: 17/i)).toBeInTheDocument();
        // Legolas' highest is DEX: 18
        expect(screen.getByText(/DEX: 18/i)).toBeInTheDocument();
      });
    });

    it("shows creation date for each character", async () => {
      renderWithProviders(<CharacterListPage />);

      await waitFor(() => {
        // Check that dates are displayed
        const dateElements = screen.getAllByText(/created/i);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it("provides edit button for each character", async () => {
      renderWithProviders(<CharacterListPage />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole("link", { name: /edit/i });
        expect(editButtons.length).toBe(3);
      });
    });

    it("provides delete button for each character", async () => {
      renderWithProviders(<CharacterListPage />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole("button", {
          name: /delete/i,
        });
        expect(deleteButtons.length).toBe(3);
      });
    });
  });

  describe("Search & Filter Functionality", () => {
    it("filters characters by name as user types", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CharacterListPage />);

      const searchInput =
        await screen.findByPlaceholderText(/search characters/i);

      await user.type(searchInput, "Legolas");

      await waitFor(() => {
        expect(screen.getByText("Legolas")).toBeInTheDocument();
        expect(screen.queryByText("Aragorn")).not.toBeInTheDocument();
        expect(screen.queryByText("Gimli")).not.toBeInTheDocument();
      });
    });

    it("clears filter when search is cleared", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CharacterListPage />);

      const searchInput =
        await screen.findByPlaceholderText(/search characters/i);

      // Type search term
      await user.type(searchInput, "Gimli");
      await waitFor(() => {
        expect(screen.queryByText("Aragorn")).not.toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      // All should be visible again
      await waitFor(() => {
        expect(screen.getByText("Aragorn")).toBeInTheDocument();
        expect(screen.getByText("Legolas")).toBeInTheDocument();
        expect(screen.getByText("Gimli")).toBeInTheDocument();
      });
    });

    it("displays no results message when filter matches nothing", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CharacterListPage />);

      const searchInput =
        await screen.findByPlaceholderText(/search characters/i);

      await user.type(searchInput, "Nonexistent");

      await waitFor(() => {
        expect(screen.getByText(/no characters match/i)).toBeInTheDocument();
      });
    });

    it("is case-insensitive", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CharacterListPage />);

      const searchInput =
        await screen.findByPlaceholderText(/search characters/i);

      await user.type(searchInput, "LEGOLAS");

      await waitFor(() => {
        expect(screen.getByText("Legolas")).toBeInTheDocument();
      });
    });
  });

  describe("Character Navigation", () => {
    it("navigates to edit page when character name is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CharacterListPage />);

      const aragornLink = await screen.findByRole("link", {
        name: /Aragorn/i,
      });

      expect(aragornLink).toHaveAttribute("href", "/character/char-1/edit");
    });

    it("navigates to create when Create Character button is clicked", async () => {
      renderWithProviders(<CharacterListPage />);

      const createLink = screen.getByRole("link", {
        name: /create character/i,
      });

      expect(createLink).toHaveAttribute(
        "href",
        "/game/adv-123/character/create",
      );
    });

    it("navigates back to adventure when Back button is clicked", async () => {
      renderWithProviders(<CharacterListPage />);

      const backLink = screen.getByRole("link", {
        name: /back to adventure/i,
      });

      expect(backLink).toHaveAttribute("href", "/game/adv-123");
    });
  });

  describe("Character Deletion", () => {
    it("shows confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CharacterListPage />);

      const deleteButtons = await screen.findAllByRole("button", {
        name: /delete/i,
      });

      await user.click(deleteButtons[0]);

      // The dialog should appear after clicking delete
      await waitFor(() => {
        expect(screen.getByText(/delete character/i)).toBeInTheDocument();
      });
    });

    it("cancels deletion when cancel button is clicked in dialog", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CharacterListPage />);

      const deleteButtons = await screen.findAllByRole("button", {
        name: /delete/i,
      });
      await user.click(deleteButtons[0]);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText(/delete character/i)).toBeInTheDocument();
      });

      // Find and click cancel button in the dialog
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should be gone
      await waitFor(() => {
        expect(screen.queryByText(/delete character/i)).not.toBeInTheDocument();
      });

      // All characters should still be visible
      expect(screen.getByText("Aragorn")).toBeInTheDocument();
      expect(screen.getByText("Legolas")).toBeInTheDocument();
    });
  });
});
