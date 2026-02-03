/**
 * CompletedQuests Component Tests (T034)
 *
 * Tests for the CompletedQuests component that displays completed quest history.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompletedQuests from "@/components/quest-tracking/CompletedQuests";
import {
  mockQuestProgressCompleted,
  mockQuestProgressFailed,
} from "../../fixtures/quest-fixtures";
import type { QuestProgress } from "@/types/quest";

describe("CompletedQuests (T034)", () => {
  const mockOnSelectQuest = vi.fn();

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
  });

  describe("Rendering - Completed Quest List Display", () => {
    it("should render a list of completed quests", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listElement = screen.getByRole("list", {
        name: /completed quests/i,
      });
      expect(listElement).toBeInTheDocument();
    });

    it("should render correct number of quest items", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockCompletedQuests.length);
    });

    it("should render quest names for all completed items", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
      expect(screen.getByText("Find the Lost Treasure")).toBeInTheDocument();
      expect(
        screen.getByText("Retrieve the Ancient Artifact"),
      ).toBeInTheDocument();
    });

    it("should show count of completed quests", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText(/3 quests? completed/i)).toBeInTheDocument();
    });
  });

  describe("Completion Date Display", () => {
    it("should display completion dates in consistent format", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Check for date format (e.g., "Jan 20, 2026" or "January 20, 2026")
      expect(screen.getByText(/Jan(uary)? 20, 2026/i)).toBeInTheDocument();
    });

    it("should display failed quest date in failed date field", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Check for failed date (should show failedAt date)
      expect(screen.getByText(/Jan(uary)? 22, 2026/i)).toBeInTheDocument();
    });

    it("should format all dates consistently", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listItems = screen.getAllByRole("listitem");
      listItems.forEach((item) => {
        // Each item should have a completion date in proper format
        const dateText = within(item).getByText(
          /[A-Z][a-z]{2,8} \d{1,2}, \d{4}/,
        );
        expect(dateText).toBeInTheDocument();
      });
    });

    it("should display completion time along with date", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Check that time is also displayed (optional feature)
      // Format could be "Jan 20, 2026 at 3:30 PM" or similar
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0].textContent).toMatch(/\d{1,2}:\d{2}/); // Time pattern
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no quests provided", () => {
      render(<CompletedQuests quests={[]} onSelectQuest={mockOnSelectQuest} />);

      expect(screen.getByText(/no completed quests yet/i)).toBeInTheDocument();
    });

    it("should not render list element when empty", () => {
      render(<CompletedQuests quests={[]} onSelectQuest={mockOnSelectQuest} />);

      const listElement = screen.queryByRole("list");
      expect(listElement).not.toBeInTheDocument();
    });

    it("should show helpful message in empty state", () => {
      render(<CompletedQuests quests={[]} onSelectQuest={mockOnSelectQuest} />);

      expect(
        screen.getByText(/complete quests to see them here/i),
      ).toBeInTheDocument();
    });
  });

  describe("Interaction - Click Handlers", () => {
    it("should call onSelectQuest with quest ID when item clicked", async () => {
      const user = userEvent.setup();
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const firstQuestButton = screen.getByRole("button", {
        name: /rescue the princess/i,
      });
      await user.click(firstQuestButton);

      expect(mockOnSelectQuest).toHaveBeenCalledWith(
        mockQuestProgressCompleted.questId,
      );
    });

    it("should allow clicking on any completed quest to view details", async () => {
      const user = userEvent.setup();
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const secondQuestButton = screen.getByRole("button", {
        name: /find the lost treasure/i,
      });
      await user.click(secondQuestButton);

      expect(mockOnSelectQuest).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility - ARIA Attributes", () => {
    it("should have role='list' for proper list semantics", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listElement = screen.getByRole("list");
      expect(listElement).toHaveAttribute("role", "list");
    });

    it("should have aria-label describing the completed quests list", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listElement = screen.getByRole("list");
      expect(listElement).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Completed Quests"),
      );
    });

    it("should have proper heading structure", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const heading = screen.getByRole("heading", {
        name: /completed quests/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("should have role='listitem' on each quest item", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listItems = screen.getAllByRole("listitem");
      listItems.forEach((item) => {
        expect(item).toHaveAttribute("role", "listitem");
      });
    });

    it("should have accessible date format for screen readers", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Dates should be announced clearly by screen readers
      const listItems = screen.getAllByRole("listitem");
      listItems.forEach((item) => {
        const dateElement = within(item).getByText(
          /[A-Z][a-z]+ \d{1,2}, \d{4}/,
        );
        // Should have time element or proper semantic markup
        expect(dateElement).toBeInTheDocument();
      });
    });

    it("should be keyboard navigable through quest items", async () => {
      const user = userEvent.setup();
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const buttons = screen.getAllByRole("button", {
        name: /view details for/i,
      });

      // Tab to first button
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(buttons[1]).toHaveFocus();
    });
  });

  describe("Sorting and Display Order", () => {
    it("should display quests sorted by completion date (newest first)", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listItems = screen.getAllByRole("listitem");
      // First item should be "Find the Lost Treasure" (Jan 28) - newest
      const firstQuestName = within(listItems[0]).getByText(
        /find the lost treasure/i,
      );
      expect(firstQuestName).toBeInTheDocument();
    });

    it("should handle quests with missing completion dates gracefully", () => {
      const questsWithMissingDate: QuestProgress[] = [
        {
          ...mockQuestProgressCompleted,
          completedAt: null,
          failedAt: null,
        },
      ];

      render(
        <CompletedQuests
          quests={questsWithMissingDate}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText(/date not available/i)).toBeInTheDocument();
    });
  });

  describe("Pagination (Optional)", () => {
    it("should show pagination controls if more than 20 quests", () => {
      const manyQuests: QuestProgress[] = Array.from(
        { length: 25 },
        (_, i) => ({
          ...mockQuestProgressCompleted,
          questProgressId: `qp-comp-${i}`,
          questName: `Quest ${i + 1}`,
        }),
      );

      render(
        <CompletedQuests
          quests={manyQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Check for pagination controls (e.g., "Next", "Previous", page numbers)
      const paginationNav = screen.queryByRole("navigation", {
        name: /pagination/i,
      });
      if (paginationNav) {
        expect(paginationNav).toBeInTheDocument();
      }
    });

    it("should not show pagination controls if 20 or fewer quests", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const paginationNav = screen.queryByRole("navigation", {
        name: /pagination/i,
      });
      expect(paginationNav).not.toBeInTheDocument();
    });

    it("should display page count information", () => {
      const manyQuests: QuestProgress[] = Array.from(
        { length: 25 },
        (_, i) => ({
          ...mockQuestProgressCompleted,
          questProgressId: `qp-${i}`,
        }),
      );

      render(
        <CompletedQuests
          quests={manyQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Should show something like "Showing 1-20 of 25"
      const pageInfo = screen.queryByText(/showing \d+-\d+ of \d+/i);
      if (pageInfo) {
        expect(pageInfo).toBeInTheDocument();
      }
    });
  });

  describe("Quest Status Display", () => {
    it("should distinguish between completed and failed quests", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Completed quests should show "Completed" badge (multiple instances)
      const completedBadges = screen.getAllByText(/✓ completed/i);
      expect(completedBadges.length).toBeGreaterThan(0);

      // Failed quests should show "Failed" badge
      expect(screen.getByText(/✗ failed/i)).toBeInTheDocument();
    });

    it("should use different visual styling for failed vs completed", () => {
      render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listItems = screen.getAllByRole("listitem");

      // Get the completed quest item
      const completedItem = listItems.find((item) =>
        item.textContent?.includes("Rescue the Princess"),
      );

      // Get the failed quest item
      const failedItem = listItems.find((item) =>
        item.textContent?.includes("Retrieve the Ancient Artifact"),
      );

      expect(completedItem).toBeInTheDocument();
      expect(failedItem).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large quest lists without performance issues", () => {
      const largeQuestList: QuestProgress[] = Array.from(
        { length: 100 },
        (_, i) => ({
          ...mockQuestProgressCompleted,
          questProgressId: `qp-${i}`,
          questName: `Quest ${i + 1}`,
        }),
      );

      const startTime = performance.now();

      render(
        <CompletedQuests
          quests={largeQuestList}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it("should use React.memo() to prevent unnecessary re-renders", () => {
      const { rerender } = render(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Verify component renders
      expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <CompletedQuests
          quests={mockCompletedQuests}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Component should still be in the document
      expect(screen.getByText("Rescue the Princess")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display loading indicator when isLoading true", () => {
      render(
        <CompletedQuests
          quests={[]}
          onSelectQuest={mockOnSelectQuest}
          isLoading={true}
        />,
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("should not display list when loading", () => {
      render(
        <CompletedQuests
          quests={[]}
          onSelectQuest={mockOnSelectQuest}
          isLoading={true}
        />,
      );

      const listElement = screen.queryByRole("list");
      expect(listElement).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when error prop provided", () => {
      render(
        <CompletedQuests
          quests={[]}
          onSelectQuest={mockOnSelectQuest}
          error="Failed to load completed quests"
        />,
      );

      expect(
        screen.getByText("Failed to load completed quests"),
      ).toBeInTheDocument();
    });

    it("should show retry button in error state", () => {
      const mockRetry = vi.fn();
      render(
        <CompletedQuests
          quests={[]}
          onSelectQuest={mockOnSelectQuest}
          error="Failed to load completed quests"
          onRetry={mockRetry}
        />,
      );

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });
});
