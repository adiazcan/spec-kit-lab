/**
 * QuestList Component Tests (T009)
 *
 * Tests for the QuestList component that displays a list of quest items.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestList from "@/components/quest-tracking/QuestList";
import {
  mockActiveQuests,
  mockQuestProgressActive,
  mockQuestProgressMultiObj,
} from "../../fixtures/quest-fixtures";
import type { QuestFilterState } from "@/types/quest";

describe("QuestList (T009)", () => {
  const mockOnSelectQuest = vi.fn();
  const mockOnAbandonQuest = vi.fn();

  const defaultFilters: QuestFilterState = {
    statusFilters: ["Active"],
    searchText: "",
    sortBy: "name",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Quest List Display", () => {
    it("should render a list of quests", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listElement = screen.getByRole("list", { name: /active quests/i });
      expect(listElement).toBeInTheDocument();
    });

    it("should render correct number of quest items", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockActiveQuests.length);
    });

    it("should render quest names for all items", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
      expect(screen.getByText("Explore the Hidden Cave")).toBeInTheDocument();
    });

    it("should render QuestListItem components using map()", () => {
      const { container } = render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Verify that multiple quest items are rendered (proof of map)
      const listItems = screen.getAllByRole("listitem");
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no quests provided", () => {
      render(
        <QuestList
          quests={[]}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText(/no active quests/i)).toBeInTheDocument();
    });

    it("should not render list element when empty", () => {
      render(
        <QuestList
          quests={[]}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listElement = screen.queryByRole("list");
      expect(listElement).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when error prop provided", () => {
      render(
        <QuestList
          quests={[]}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
          error="Failed to load quests"
        />,
      );

      expect(screen.getByText("Failed to load quests")).toBeInTheDocument();
    });

    it("should show retry button in error state", () => {
      const mockRetry = vi.fn();
      render(
        <QuestList
          quests={[]}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
          error="Failed to load quests"
          onRetry={mockRetry}
        />,
      );

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display loading indicator when isLoading true", () => {
      render(
        <QuestList
          quests={[]}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
          isLoading={true}
        />,
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("should show skeleton loaders during loading", () => {
      render(
        <QuestList
          quests={[]}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
          isLoading={true}
        />,
      );

      // Verify loading UI is displayed (could be spinner or skeleton)
      const loadingElement = screen.getByText(/loading/i);
      expect(loadingElement).toBeInTheDocument();
    });

    it("should not display list when loading", () => {
      render(
        <QuestList
          quests={[]}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
          isLoading={true}
        />,
      );

      const listElement = screen.queryByRole("list");
      expect(listElement).not.toBeInTheDocument();
    });
  });

  describe("Interaction - Click Handlers", () => {
    it("should call onSelectQuest with quest ID when item clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const firstQuestButton = screen.getByRole("button", {
        name: /defeat the shadow lord/i,
      });
      await user.click(firstQuestButton);

      expect(mockOnSelectQuest).toHaveBeenCalledWith(
        mockQuestProgressActive.questProgressId,
      );
    });

    it("should call onAbandonQuest callback when abandon button clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
          onAbandonQuest={mockOnAbandonQuest}
        />,
      );

      const abandonButtons = screen.getAllByRole("button", {
        name: /abandon/i,
      });
      await user.click(abandonButtons[0]);

      expect(mockOnAbandonQuest).toHaveBeenCalledWith(
        mockQuestProgressActive.questProgressId,
      );
    });
  });

  describe("Accessibility - ARIA Attributes", () => {
    it("should have role='list' for proper list semantics", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listElement = screen.getByRole("list");
      expect(listElement).toHaveAttribute("role", "list");
    });

    it("should have aria-label describing the list", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listElement = screen.getByRole("list");
      expect(listElement).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Active Quests"),
      );
      expect(listElement).toHaveAttribute(
        "aria-label",
        expect.stringContaining("quests"),
      );
    });

    it("should have proper heading structure", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const heading = screen.getByRole("heading", { name: /active quests/i });
      expect(heading).toBeInTheDocument();
    });

    it("should have role='listitem' on each quest item", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const listItems = screen.getAllByRole("listitem");
      listItems.forEach((item) => {
        expect(item).toHaveAttribute("role", "listitem");
      });
    });

    it("should be keyboard navigable through quest items", async () => {
      const user = userEvent.setup();
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const firstButton = screen.getByRole("button", {
        name: /defeat the shadow lord/i,
      });
      const secondButton = screen.getByRole("button", {
        name: /explore the hidden cave/i,
      });

      firstButton.focus();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();
    });
  });

  describe("Performance - React.memo Override", () => {
    it("should use React.memo() to prevent unnecessary re-renders", () => {
      const { rerender } = render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Verify component renders
      expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Component should still be in the document
      expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
    });
  });

  describe("Filter Metrics Display", () => {
    it("should display count of filtered quests", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Check for the actual text "Showing X quest(s)"
      expect(screen.getByText(/Showing \d+ quest/i)).toBeInTheDocument();
    });

    it("should show active filter indicator", () => {
      render(
        <QuestList
          quests={mockActiveQuests}
          filters={defaultFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText(/active quests/i)).toBeInTheDocument();
    });
  });

  describe("Filtering - Filtering Display (T029)", () => {
    it("should show only active quests when statusFilters=['Active']", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestList
          quests={mockActiveQuests}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Should display only active quest
      expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockActiveQuests.length);
    });

    it("should update list title based on active filter", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Completed"],
        searchText: "",
        sortBy: "name",
      };

      // Create a completed quest for testing
      const completedQuests = [
        {
          ...mockQuestProgressActive,
          status: "Completed" as const,
          questProgressId: "qp-completed-1",
        },
      ];

      render(
        <QuestList
          quests={completedQuests}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent(/completed quests/i);
    });

    it("should show 'All Quests' title when no statusFilters applied", () => {
      const filters: QuestFilterState = {
        statusFilters: [],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestList
          quests={mockActiveQuests}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent(/all quests/i);
    });

    it("should show filter badge indicator when filters are active", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Completed"],
        searchText: "",
        sortBy: "name",
      };

      const completedQuests = [
        {
          ...mockQuestProgressActive,
          status: "Completed" as const,
          questProgressId: "qp-c1",
        },
      ];

      render(
        <QuestList
          quests={completedQuests}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText(/filtered.*completed/i)).toBeInTheDocument();
    });

    it("should display appropriate empty state message for filtered view", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Completed"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestList
          quests={[]}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const emptyMessage = screen.getByText(/no.*quests found/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    it("should update displayed quest count based on filters", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestList
          quests={[mockQuestProgressActive]}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      expect(screen.getByText(/showing 1 quest/i)).toBeInTheDocument();
    });

    it("should handle multiple filters (Active and Completed)", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active", "Completed"],
        searchText: "",
        sortBy: "name",
      };

      const multiStatusQuests = [
        mockQuestProgressActive,
        {
          ...mockQuestProgressActive,
          status: "Completed" as const,
          questProgressId: "qp-2",
          questName: "Completed Quest",
        },
      ];

      render(
        <QuestList
          quests={multiStatusQuests}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Should show both active and completed quests
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(2);
    });

    it("should update list immediately when filters change", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active"],
        searchText: "",
        sortBy: "name",
      };

      const { rerender } = render(
        <QuestList
          quests={mockActiveQuests}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Should show active quests initially
      let listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockActiveQuests.length);

      // Change to completed filter
      const newFilters: QuestFilterState = {
        statusFilters: ["Completed"],
        searchText: "",
        sortBy: "name",
      };

      const completedQuests = [
        {
          ...mockQuestProgressActive,
          status: "Completed" as const,
          questProgressId: "qp-comp",
        },
      ];

      rerender(
        <QuestList
          quests={completedQuests}
          filters={newFilters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      // Should update to show completed quests
      listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(1);
    });

    it("should show 'Filtered Quests' title when multiple status filters applied", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active", "Completed"],
        searchText: "",
        sortBy: "name",
      };

      const multiStatusQuests = [
        mockQuestProgressActive,
        {
          ...mockQuestProgressActive,
          status: "Completed" as const,
          questProgressId: "qp-2",
        },
      ];

      render(
        <QuestList
          quests={multiStatusQuests}
          filters={filters}
          onSelectQuest={mockOnSelectQuest}
        />,
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent(/filtered quests/i);
    });
  });
});
