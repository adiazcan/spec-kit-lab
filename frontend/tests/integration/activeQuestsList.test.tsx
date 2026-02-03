/**
 * Active Quests List Integration Tests (T011)
 *
 * Integration test for the complete active quests listing flow:
 * - Fetch active quests via questService mock
 * - Display list with proper data mapping
 * - Verify error handling if API fails
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ActiveQuestsList from "@/components/quest-tracking/ActiveQuestsList";
import * as questServiceModule from "@/services/questService";
import { mockActiveQuests } from "../fixtures/quest-fixtures";

// Mock the questService module functions
vi.mock("@/services/questService", async () => {
  return {
    questService: {
      getActiveQuests: vi.fn(),
      getQuestProgress: vi.fn(),
      abandonQuest: vi.fn(),
    },
    getErrorMessage: (error: Error) => error.message,
  };
});

describe("Active Quests List Integration (T011)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Fetching and Display", () => {
    it("should fetch active quests and display them in the list", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockActiveQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <ActiveQuestsList adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for quests to be rendered
      await waitFor(() => {
        expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
      });

      // Verify API was called with correct parameters
      expect(mockGetActiveQuests).toHaveBeenCalledWith("adv-1", "player-1");
    });

    it("should display quest details with proper data mapping", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockActiveQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <ActiveQuestsList adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for all quests to render
      await waitFor(() => {
        expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
        expect(screen.getByText("Explore the Hidden Cave")).toBeInTheDocument();
      });

      // Verify status badges show correctly (check for the specific badge elements, not buttons)
      const statusBadges = screen.getAllByText("Active");
      // Should have at least one status badge (from the quest items)
      expect(statusBadges.length).toBeGreaterThan(0);

      // Verify progress is displayed
      expect(screen.getByText(/40%/)).toBeInTheDocument();
      expect(screen.getByText(/60%/)).toBeInTheDocument();
    });

    it("should handle empty quest list gracefully", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue([]);

      render(
        <QueryClientProvider client={queryClient}>
          <ActiveQuestsList adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for empty state to appear
      await waitFor(() => {
        expect(screen.getByText(/no active quests/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when API fails", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockRejectedValue(
        new Error("Failed to fetch quests"),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <ActiveQuestsList adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Data Mapping", () => {
    it("should correctly render quest information from API response", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockActiveQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <ActiveQuestsList adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Verify all quest information is displayed
      await waitFor(() => {
        expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
        // Check for status badge (not button which is filter)
        const questItems = screen.getAllByRole("button", {
          name: /defeat the shadow lord/i,
        });
        expect(questItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state while fetching quests", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );

      // Delay the response to allow checking loading state
      mockGetActiveQuests.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockActiveQuests), 200),
          ),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <ActiveQuestsList adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Check for loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for quests to load
      await waitFor(() => {
        expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
      });

      // Loading indicator should be gone
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
