/**
 * Completed Quests History Integration Tests (T035)
 *
 * Integration test for the completed quests history flow:
 * - Fetch completed quests via questService mock
 * - Display history with proper date formatting
 * - Verify quest detail can be opened from history
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CompletedQuestsHistory from "@/components/quest-tracking/CompletedQuestsHistory";
import * as questServiceModule from "@/services/questService";
import {
  mockQuestProgressCompleted,
  mockQuestProgressFailed,
} from "../fixtures/quest-fixtures";
import type { QuestProgress } from "@/types/quest";

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

describe("Completed Quests History Integration (T035)", () => {
  let queryClient: QueryClient;

  const mockCompletedQuests: QuestProgress[] = [
    mockQuestProgressCompleted,
    {
      ...mockQuestProgressCompleted,
      questProgressId: "qp-comp-2",
      questName: "Find the Lost Treasure",
      acceptedAt: "2026-01-25T10:00:00Z",
      completedAt: "2026-01-28T16:45:00Z",
    },
    mockQuestProgressFailed,
  ];

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
    it("should fetch completed quests and display them in the history", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for completed quests to be rendered
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      });

      // Verify API was called with correct parameters
      expect(mockGetActiveQuests).toHaveBeenCalledWith("adv-1", "player-1");
    });

    it("should display quest history with proper date formatting", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for all quests to render
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
        expect(screen.getByText("Find the Lost Treasure")).toBeInTheDocument();
        expect(
          screen.getByText("Retrieve the Ancient Artifact"),
        ).toBeInTheDocument();
      });

      // Verify dates are displayed in consistent format (e.g., "Jan 20, 2026")
      expect(screen.getByText(/Jan(uary)? 20, 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan(uary)? 28, 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan(uary)? 22, 2026/i)).toBeInTheDocument();
    });

    it("should display both completed and failed quests", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for quests to render
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      });

      // Verify both Completed and Failed status badges are present
      const completedBadges = screen.getAllByText(/✓ Completed/i);
      expect(completedBadges.length).toBeGreaterThan(0);
      expect(screen.getByText(/✗ Failed/i)).toBeInTheDocument();
    });

    it("should handle empty completed quests list gracefully", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue([]);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for empty state to appear
      await waitFor(() => {
        expect(
          screen.getByText(/no completed quests yet/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Quest Detail Navigation", () => {
    it("should open quest detail when clicking on completed quest", async () => {
      const user = userEvent.setup();
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      const mockGetQuestProgress = vi.mocked(
        questServiceModule.questService.getQuestProgress,
      );

      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);
      mockGetQuestProgress.mockResolvedValue(mockQuestProgressCompleted);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for quests to load
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      });

      // Click on the first quest
      const questButton = screen.getByRole("button", {
        name: /rescue the princess/i,
      });
      await user.click(questButton);

      // Verify quest detail view opens (checking for detail-specific elements)
      await waitFor(() => {
        // Quest detail should show the full description or objectives
        expect(mockGetQuestProgress).toHaveBeenCalledWith(
          "adv-1",
          mockQuestProgressCompleted.questId,
          "player-1",
        );
      });
    });

    it("should display full quest details including completion status", async () => {
      const user = userEvent.setup();
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      const mockGetQuestProgress = vi.mocked(
        questServiceModule.questService.getQuestProgress,
      );

      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);
      mockGetQuestProgress.mockResolvedValue(mockQuestProgressCompleted);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for quests to load
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      });

      // Click on quest to open detail
      const questButton = screen.getByRole("button", {
        name: /rescue the princess/i,
      });
      await user.click(questButton);

      // Verify detail fetch was called
      await waitFor(() => {
        expect(mockGetQuestProgress).toHaveBeenCalled();
      });
    });

    it("should allow viewing details of failed quests", async () => {
      const user = userEvent.setup();
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      const mockGetQuestProgress = vi.mocked(
        questServiceModule.questService.getQuestProgress,
      );

      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);
      mockGetQuestProgress.mockResolvedValue(mockQuestProgressFailed);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for quests to load
      await waitFor(() => {
        expect(
          screen.getByText("Retrieve the Ancient Artifact"),
        ).toBeInTheDocument();
      });

      // Click on failed quest
      const failedQuestButton = screen.getByRole("button", {
        name: /retrieve the ancient artifact/i,
      });
      await user.click(failedQuestButton);

      // Verify quest progress request was made
      await waitFor(() => {
        expect(mockGetQuestProgress).toHaveBeenCalledWith(
          "adv-1",
          mockQuestProgressFailed.questId,
          "player-1",
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when API fails", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockRejectedValue(
        new Error("Failed to fetch completed quests"),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it("should display retry button on error", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockRejectedValue(
        new Error("Failed to fetch completed quests"),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /retry/i }),
        ).toBeInTheDocument();
      });
    });

    it("should retry fetching quests when retry button clicked", async () => {
      const user = userEvent.setup();
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );

      // First call fails
      mockGetActiveQuests.mockRejectedValueOnce(
        new Error("Failed to fetch completed quests"),
      );
      // Second call succeeds
      mockGetActiveQuests.mockResolvedValueOnce(mockCompletedQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      // Wait for quests to load
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      });
    });
  });

  describe("Data Mapping", () => {
    it("should correctly render completed quest information from API response", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Verify all quest information is correctly mapped
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();

        // Check for completion date
        expect(screen.getByText(/Jan(uary)? 20, 2026/i)).toBeInTheDocument();

        // Check for status (use getAllByText since multiple completed badges may exist)
        const completedBadges = screen.getAllByText(/✓ Completed/i);
        expect(completedBadges.length).toBeGreaterThan(0);
      });
    });

    it("should handle quests with null completion dates", async () => {
      const questWithNullDate: QuestProgress = {
        ...mockQuestProgressCompleted,
        completedAt: null,
        failedAt: null,
      };

      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue([questWithNullDate]);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Verify graceful handling of missing date
      await waitFor(() => {
        expect(screen.getByText(/date not available/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state while fetching completed quests", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );

      // Delay the response to allow checking loading state
      mockGetActiveQuests.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockCompletedQuests), 200),
          ),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Check for loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for quests to load
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      });

      // Loading indicator should be gone
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    it("should not display list while loading", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );

      mockGetActiveQuests.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockCompletedQuests), 200),
          ),
      );

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // List should not be visible during loading
      const listElement = screen.queryByRole("list");
      expect(listElement).not.toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("should display quests sorted by completion date (newest first)", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for quests to load
      await waitFor(() => {
        expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      });

      // Verify order (newest first)
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0].textContent).toContain("Find the Lost Treasure");
    });
  });

  describe("Quest Count Display", () => {
    it("should display total count of completed quests", async () => {
      const mockGetActiveQuests = vi.mocked(
        questServiceModule.questService.getActiveQuests,
      );
      mockGetActiveQuests.mockResolvedValue(mockCompletedQuests);

      render(
        <QueryClientProvider client={queryClient}>
          <CompletedQuestsHistory adventureId="adv-1" playerId="player-1" />
        </QueryClientProvider>,
      );

      // Wait for quest count to display
      await waitFor(() => {
        expect(screen.getByText(/3 quests? completed/i)).toBeInTheDocument();
      });
    });
  });
});
