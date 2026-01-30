import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { CharacterCreatePage } from "@/pages/CharacterCreatePage";
import * as characterApi from "@/services/characterApi";

// Mock the API module
vi.mock("@/services/characterApi", () => ({
  useCreateCharacter: vi.fn(),
  api: {
    createCharacter: vi.fn(),
  },
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [
      new URLSearchParams("?adventureId=550e8400-e29b-41d4-a716-446655440000"),
    ],
  };
});

describe("Character Creation Integration Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>,
    );
  };

  describe("Point-Buy Character Creation (T035)", () => {
    it("should complete full character creation flow", async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn().mockResolvedValue({
        id: "660e8400-e29b-41d4-a716-446655440000",
        name: "Gandalf",
        adventureId: "550e8400-e29b-41d4-a716-446655440000",
        attributes: { str: 10, dex: 12, int: 18, con: 14, cha: 16 },
        modifiers: { str: 0, dex: 1, int: 4, con: 2, cha: 3 },
        createdAt: "2026-01-30T10:30:00Z",
        updatedAt: "2026-01-30T10:30:00Z",
      });

      vi.mocked(characterApi.useCreateCharacter).mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<CharacterCreatePage />);

      // Enter character name
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Gandalf");

      // Allocate attributes (point-buy mode is default)
      const intInput = screen.getByLabelText(/^INT\b/i);
      await user.clear(intInput);
      await user.type(intInput, "18");

      const chaInput = screen.getByLabelText(/^CHA\b/i);
      await user.clear(chaInput);
      await user.type(chaInput, "16");

      const conInput = screen.getByLabelText(/^CON\b/i);
      await user.clear(conInput);
      await user.type(conInput, "14");

      const dexInput = screen.getByLabelText(/^DEX\b/i);
      await user.clear(dexInput);
      await user.type(dexInput, "12");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save/i });
      await user.click(submitButton);

      // Verify API called with correct data
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Gandalf",
            adventureId: "550e8400-e29b-41d4-a716-446655440000",
            attributes: expect.objectContaining({
              int: 18,
              cha: 16,
              con: 14,
              dex: 12,
            }),
          }),
        );
      });

      // Verify navigation to character sheet
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/characters/660e8400-e29b-41d4-a716-446655440000",
        );
      });
    });

    it("should show validation errors for invalid data", async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      vi.mocked(characterApi.useCreateCharacter).mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<CharacterCreatePage />);

      // Try to submit without name
      const submitButton = screen.getByRole("button", { name: /save/i });
      await user.click(submitButton);

      // Should show error and not call API
      expect(
        screen.getByText(/character name is required/i),
      ).toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should display API errors to user", async () => {
      const user = userEvent.setup();
      const mockMutate = vi
        .fn()
        .mockRejectedValue(new Error("Character name already exists"));

      vi.mocked(characterApi.useCreateCharacter).mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
        isError: true,
        error: new Error("Character name already exists"),
      } as any);

      renderWithProviders(<CharacterCreatePage />);

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Gandalf");

      const submitButton = screen.getByRole("button", { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe("Dice Roll Character Creation (T036)", () => {
    it("should complete character creation with dice rolls", async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn().mockResolvedValue({
        id: "770e8400-e29b-41d4-a716-446655440111",
        name: "Frodo",
        adventureId: "550e8400-e29b-41d4-a716-446655440000",
        attributes: { str: 8, dex: 14, int: 12, con: 12, cha: 14 },
        modifiers: { str: -1, dex: 2, int: 1, con: 1, cha: 2 },
        createdAt: "2026-01-30T10:35:00Z",
        updatedAt: "2026-01-30T10:35:00Z",
      });

      vi.mocked(characterApi.useCreateCharacter).mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<CharacterCreatePage />);

      // Enter name
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Frodo");

      // Switch to dice roll mode
      const diceRollRadio = screen.getByLabelText(/dice roll/i);
      await user.click(diceRollRadio);

      // Roll for each attribute
      const rollButtons = screen.getAllByRole("button", { name: /roll/i });
      for (const button of rollButtons) {
        await user.click(button);
      }

      // Submit
      const submitButton = screen.getByRole("button", { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Frodo",
            adventureId: "550e8400-e29b-41d4-a716-446655440000",
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

      expect(mockNavigate).toHaveBeenCalledWith(
        "/characters/770e8400-e29b-41d4-a716-446655440111",
      );
    });

    it("should prevent submission until all attributes are rolled", async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      vi.mocked(characterApi.useCreateCharacter).mockReturnValue({
        mutateAsync: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderWithProviders(<CharacterCreatePage />);

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Frodo");

      // Switch to dice roll mode
      const diceRollRadio = screen.getByLabelText(/dice roll/i);
      await user.click(diceRollRadio);

      // Roll only one attribute
      const firstRollButton = screen.getAllByRole("button", {
        name: /roll/i,
      })[0];
      await user.click(firstRollButton);

      // Try to submit
      const submitButton = screen.getByRole("button", { name: /save/i });
      await user.click(submitButton);

      // Should show error
      expect(screen.getByText(/roll all attributes/i)).toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });
});
