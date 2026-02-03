import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuestTracking, useQuestStats } from "@/hooks/useQuestTracking";
import type { QuestProgress } from "@/types/quest";

// Mock the questService
vi.mock("@/services/questService", () => ({
  questService: {
    getActiveQuests: vi.fn(),
    getQuestProgress: vi.fn(),
    abandonQuest: vi.fn(),
  },
  getErrorMessage: vi.fn((error) => {
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object" && "detail" in error) {
      return (error as any).detail;
    }
    return "An unexpected error occurred";
  }),
}));

import { questService } from "@/services/questService";

const mockQuestData: QuestProgress[] = [
  {
    questProgressId: "progress-1",
    questId: "quest-1",
    playerId: "player-456",
    questName: "Find the Lost Amulet",
    questDescription: "A mysterious amulet has gone missing",
    status: "Active",
    progressPercentage: 50,
    acceptedAt: new Date("2026-02-01").toISOString(),
    completedAt: null,
    failedAt: null,
    abandonedAt: null,
    currentStageNumber: 1,
    totalStages: 1,
    currentStage: {
      stageNumber: 1,
      title: "Search the Forest",
      description: "Look for the amulet in the dark forest",
      isCompleted: false,
      completedAt: null,
      objectives: [
        {
          objectiveId: "obj-1",
          description: "Find three forest clues",
          conditionType: "Collect",
          targetAmount: 3,
          currentProgress: 1,
          isCompleted: false,
          progressPercentage: 33,
        },
      ],
    },
    rewards: [],
  },
  {
    questProgressId: "progress-2",
    questId: "quest-2",
    playerId: "player-456",
    questName: "Rescue the Princess",
    questDescription: "A princess has been captured",
    status: "Active",
    progressPercentage: 25,
    acceptedAt: new Date("2026-02-02").toISOString(),
    completedAt: null,
    failedAt: null,
    abandonedAt: null,
    currentStageNumber: 1,
    totalStages: 2,
    currentStage: {
      stageNumber: 1,
      title: "Travel to the Castle",
      description: "Journey to the dark castle",
      isCompleted: false,
      completedAt: null,
      objectives: [],
    },
    rewards: [],
  },
  {
    questProgressId: "progress-3",
    questId: "quest-3",
    playerId: "player-456",
    questName: "Complete the Training",
    questDescription: "Complete the warrior training",
    status: "Completed",
    progressPercentage: 100,
    acceptedAt: new Date("2026-01-15").toISOString(),
    completedAt: new Date("2026-02-01").toISOString(),
    failedAt: null,
    abandonedAt: null,
    currentStageNumber: 1,
    totalStages: 1,
    currentStage: {
      stageNumber: 1,
      title: "Final Test",
      description: "Pass the final combat test",
      isCompleted: true,
      completedAt: new Date("2026-02-01").toISOString(),
      objectives: [],
    },
    rewards: [],
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function renderWithQueryClient(hook: any) {
  const queryClient = createTestQueryClient();
  return renderHook(hook, {
    wrapper: ({ children }: any) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      ),
  });
}

describe("useQuestTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default filter state", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(
      mockQuestData.slice(0, 2),
    );

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    expect(result.current.filters).toEqual({
      statusFilters: ["Active"],
      searchText: "",
      sortBy: "name",
    });
  });

  it("should fetch active quests on mount", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(
      mockQuestData.slice(0, 2),
    );

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    expect(result.current.isLoadingQuests).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    expect(result.current.quests).toEqual(mockQuestData.slice(0, 2));
    expect(questService.getActiveQuests).toHaveBeenCalledWith(
      "adv-123",
      "player-456",
    );
  });

  it("should filter quests by status", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(mockQuestData);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    // Initial filter is "Active"
    expect(result.current.filteredQuests).toHaveLength(2);

    // Change filter to Completed
    act(() => {
      result.current.setStatusFilter(["Completed"]);
    });

    expect(result.current.filteredQuests).toHaveLength(1);
    expect(result.current.filteredQuests[0].status).toBe("Completed");
  });

  it("should filter quests by multiple statuses", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(mockQuestData);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    act(() => {
      result.current.setStatusFilter(["Active", "Completed"]);
    });

    expect(result.current.filteredQuests).toHaveLength(3);
  });

  it("should filter quests by search text", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(mockQuestData);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    act(() => {
      result.current.setSearchText("Princess");
    });

    expect(result.current.filteredQuests).toHaveLength(1);
    expect(result.current.filteredQuests[0].questName).toBe(
      "Rescue the Princess",
    );
  });

  it("should clear filters", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(mockQuestData);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    act(() => {
      result.current.setStatusFilter(["Completed"]);
      result.current.setSearchText("Training");
    });

    expect(result.current.filteredQuests).toHaveLength(1);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({
      statusFilters: ["Active"],
      searchText: "",
      sortBy: "name",
    });
    expect(result.current.filteredQuests).toHaveLength(2);
  });

  it("should select and fetch quest details", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(
      mockQuestData.slice(0, 2),
    );

    const detailedQuest: QuestProgress = {
      ...mockQuestData[0],
      currentStage: {
        stageNumber: 1,
        title: "Search the Forest",
        description: "Look for the amulet in the dark forest",
        isCompleted: false,
        completedAt: null,
        objectives: [
          {
            objectiveId: "obj-1",
            description: "Find three forest clues",
            conditionType: "Collect",
            targetAmount: 3,
            currentProgress: 2,
            isCompleted: false,
            progressPercentage: 67,
          },
        ],
      },
    };

    vi.mocked(questService.getQuestProgress).mockResolvedValue(detailedQuest);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    act(() => {
      result.current.selectQuest("progress-1");
    });

    expect(result.current.selectedQuestId).toBe("progress-1");
    expect(result.current.isLoadingDetail).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingDetail).toBe(false);
    });

    expect(result.current.selectedQuest).toEqual(detailedQuest);
  });

  it("should deselect quest", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(
      mockQuestData.slice(0, 2),
    );

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    act(() => {
      result.current.selectQuest("progress-1");
    });

    expect(result.current.selectedQuestId).toEqual("progress-1");

    act(() => {
      result.current.selectQuest(null);
    });

    expect(result.current.selectedQuestId).toBeNull();
    expect(result.current.selectedQuest).toBeNull();
  });

  it("should handle error when fetching quests", async () => {
    const error = new Error("Network error");
    vi.mocked(questService.getActiveQuests).mockRejectedValue(error);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.quests).toEqual([]);
  });

  it("should abandon a quest", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(
      mockQuestData.slice(0, 2),
    );
    vi.mocked(questService.abandonQuest).mockResolvedValue(undefined);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    act(() => {
      result.current.abandonQuest.mutate("progress-1");
    });

    await waitFor(() => {
      expect(questService.abandonQuest).toHaveBeenCalledWith(
        "adv-123",
        "progress-1",
        "player-456",
      );
    });
  });

  it("should handle abandon quest error", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(
      mockQuestData.slice(0, 2),
    );
    const error = new Error("Cannot abandon quest");
    vi.mocked(questService.abandonQuest).mockRejectedValue(error);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    act(() => {
      result.current.abandonQuest.mutate("progress-1");
    });

    await waitFor(() => {
      expect(result.current.abandonQuest.isPending).toBe(false);
    });

    expect(result.current.abandonQuest.isError).toBe(true);
    expect(result.current.abandonQuest.error).toBeTruthy();
  });

  it("should sort quests by name", async () => {
    vi.mocked(questService.getActiveQuests).mockResolvedValue(mockQuestData);

    const { result } = renderWithQueryClient(() =>
      useQuestTracking("adv-123", "player-456"),
    );

    await waitFor(() => {
      expect(result.current.isLoadingQuests).toBe(false);
    });

    // Default is already sorted by name
    act(() => {
      result.current.setStatusFilter(["Active", "Completed"]);
    });

    expect(result.current.filteredQuests[0].questName).toBe(
      "Complete the Training",
    );
  });
});

describe("useQuestStats", () => {
  it("should calculate quest statistics", () => {
    const { result } = renderHook(() => useQuestStats(mockQuestData));

    expect(result.current.totalQuests).toBe(3);
    expect(result.current.activeCount).toBe(2);
    expect(result.current.completedCount).toBe(1);
    expect(result.current.failedCount).toBe(0);
    expect(result.current.averageProgress).toBe(58); // (50 + 25 + 100) / 3 = 58.33 rounded to 58
  });

  it("should handle empty quest list", () => {
    const { result } = renderHook(() => useQuestStats([]));

    expect(result.current.totalQuests).toBe(0);
    expect(result.current.activeCount).toBe(0);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.averageProgress).toBe(0);
  });

  it("should count abandoned quests", () => {
    const questsWithAbandoned: QuestProgress[] = [
      ...mockQuestData,
      {
        questProgressId: "progress-4",
        questId: "quest-4",
        playerId: "player-456",
        questName: "Abandoned Quest",
        questDescription: "This quest was abandoned",
        currentStageNumber: 1,
        totalStages: 1,
        status: "Abandoned",
        progressPercentage: 10,
        acceptedAt: new Date("2026-01-01").toISOString(),
        completedAt: null,
        failedAt: null,
        abandonedAt: new Date("2026-01-02").toISOString(),
        currentStage: {
          stageNumber: 1,
          title: "Start",
          description: "Start the quest",
          isCompleted: false,
          completedAt: null,
          objectives: [],
        },
        rewards: [],
      },
    ];

    const { result } = renderHook(() => useQuestStats(questsWithAbandoned));

    expect(result.current.abandonedCount).toBe(1);
    expect(result.current.totalQuests).toBe(4);
  });

  it("should recalculate when quests change", () => {
    const { result, rerender } = renderHook(
      ({ quests }: { quests: QuestProgress[] }) => useQuestStats(quests),
      {
        initialProps: { quests: mockQuestData.slice(0, 1) },
      },
    );

    expect(result.current.totalQuests).toBe(1);

    rerender({ quests: mockQuestData });

    expect(result.current.totalQuests).toBe(3);
  });
});
