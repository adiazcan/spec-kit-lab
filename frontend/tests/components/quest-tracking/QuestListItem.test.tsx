/**
 * QuestListItem Component Tests (T010)
 *
 * Tests for the QuestListItem component that displays individual quest items
 * in the quest list view.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestListItem from "@/components/quest-tracking/QuestListItem";
import {
  mockQuestProgressActive,
  mockQuestProgressCompleted,
} from "../../fixtures/quest-fixtures";

describe("QuestListItem (T010)", () => {
  const mockOnSelect = vi.fn();
  const mockOnAbandon = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Quest Information", () => {
    it("should display quest name", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
    });

    it("should display status badge for active quest", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should display status badge for completed quest", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressCompleted}
          onSelect={mockOnSelect}
        />,
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should display quest progress percentage", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      // Should display progress percentage (40%)
      const progressText = screen.getByText(/40%/);
      expect(progressText).toBeInTheDocument();
    });
  });

  describe("Interaction - Click Handler", () => {
    it("should call onSelect callback when quest item is clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const questItem = screen.getByRole("button", {
        name: /defeat the shadow lord/i,
      });
      await user.click(questItem);

      expect(mockOnSelect).toHaveBeenCalledOnce();
    });

    it("should call onAbandon callback when abandon button clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
          onAbandon={mockOnAbandon}
        />,
      );

      const abandonButton = screen.getByRole("button", { name: /abandon/i });
      await user.click(abandonButton);

      expect(mockOnAbandon).toHaveBeenCalledOnce();
    });

    it("should not show abandon button for completed quests", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressCompleted}
          onSelect={mockOnSelect}
          onAbandon={mockOnAbandon}
        />,
      );

      const abandonButton = screen.queryByRole("button", { name: /abandon/i });
      expect(abandonButton).not.toBeInTheDocument();
    });
  });

  describe("Accessibility - ARIA Attributes", () => {
    it("should have role='button' for keyboard navigation", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const questItem = screen.getByRole("button", {
        name: /defeat the shadow lord/i,
      });
      expect(questItem).toHaveAttribute("role", "button");
    });

    it("should have descriptive aria-label", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const questItem = screen.getByRole("button");
      expect(questItem).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Defeat the Shadow Lord"),
      );
      expect(questItem).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Active"),
      );
    });

    it("should have focus ring for keyboard navigation", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const questItem = screen.getByRole("button");
      expect(questItem).toHaveClass("focus:ring-2");
    });

    it("should be Tab-keyboard navigable", async () => {
      const user = userEvent.setup();
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const questItem = screen.getByRole("button");
      await user.tab();

      expect(questItem).toHaveFocus();
    });

    it("should activate on Enter key press", async () => {
      const user = userEvent.setup();
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const questItem = screen.getByRole("button");
      questItem.focus();
      await user.keyboard("{Enter}");

      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe("Visual Display - Progress Bar", () => {
    it("should display progress bar component", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });

    it("should pass correct percentage to progress bar", () => {
      render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "40");
    });
  });

  describe("Styling - Status-based CSS Classes", () => {
    it("should apply active quest styling", () => {
      const { container } = render(
        <QuestListItem
          quest={mockQuestProgressActive}
          onSelect={mockOnSelect}
        />,
      );

      const statusBadge = screen.getByText("Active");
      expect(statusBadge).toHaveClass("bg-blue-100");
    });

    it("should apply completed quest styling", () => {
      const { container } = render(
        <QuestListItem
          quest={mockQuestProgressCompleted}
          onSelect={mockOnSelect}
        />,
      );

      const statusBadge = screen.getByText("Completed");
      expect(statusBadge).toHaveClass("bg-green-100");
    });
  });
});
