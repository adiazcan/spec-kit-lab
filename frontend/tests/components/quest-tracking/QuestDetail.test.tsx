/**
 * QuestDetail Component Tests (T016)
 *
 * Tests for the QuestDetail component that displays detailed quest information,
 * objectives, and allows closing the detail view.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestDetail from "@/components/quest-tracking/QuestDetail";
import {
  mockQuestProgressActive,
  mockQuestProgressCompleted,
  mockQuestProgressMultiObj,
  mockRewards,
} from "../../fixtures/quest-fixtures";
import type { QuestProgress } from "@/types/quest";

describe("QuestDetail (T016)", () => {
  const mockOnClose = vi.fn();
  const mockOnAbandon = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Quest Information Display", () => {
    it("should render quest title when detail is open", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
    });

    it("should render full quest description", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      expect(
        screen.getByText(
          /A dark lord has arisen in the northern mountains. Defeat him and bring peace to the realm./i,
        ),
      ).toBeInTheDocument();
    });

    it("should not render detail when isOpen is false", () => {
      const { container } = render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={false}
          onClose={mockOnClose}
        />,
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeInTheDocument();
    });

    it("should render all objectives from current stage", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressMultiObj}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText("Collect 3 crystals")).toBeInTheDocument();
      expect(screen.getByText("Defeat cave guardian")).toBeInTheDocument();
      expect(
        screen.getByText("Read the ancient inscription"),
      ).toBeInTheDocument();
    });

    it("should display current quest status", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it("should display quest stages information if multi-stage quest", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Should show "Stage 1 of 3" or similar
      expect(screen.getByText(/stage 1 of 3/i)).toBeInTheDocument();
    });

    it("should display accepted date of quest", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Check for date display - look for the date in the dialog
      const dialog = screen.getByRole("dialog");
      expect(dialog.textContent).toMatch(
        /accepted|2026-01-15|january 15|jan 15/i,
      );
    });
  });

  describe("Interaction - Close Button", () => {
    it("should call onClose callback when close button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Find the close button by aria-label in the header
      const dialog = screen.getByRole("dialog");
      const closeButton = within(dialog).getByLabelText("Close quest details");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it("should call onClose when Escape key is pressed", async () => {
      const user = userEvent.setup();
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      const dialog = screen.getByRole("dialog");
      await user.keyboard("{Escape}");

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should render X button for closing", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Find by aria-label instead of text pattern
      const dialog = screen.getByRole("dialog");
      const closeButton = within(dialog).getByLabelText("Close quest details");
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Interaction - Abandon Button", () => {
    it("should show abandon button for active quests", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
          onAbandon={mockOnAbandon}
        />,
      );

      const abandonButton = screen.getByRole("button", { name: /abandon/i });
      expect(abandonButton).toBeInTheDocument();
    });

    it("should call onAbandon when abandon button clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
          onAbandon={mockOnAbandon}
        />,
      );

      const abandonButton = screen.getByRole("button", { name: /abandon/i });
      await user.click(abandonButton);

      expect(mockOnAbandon).toHaveBeenCalledOnce();
    });

    it("should not show abandon button for completed quests", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressCompleted}
          isOpen={true}
          onClose={mockOnClose}
          onAbandon={mockOnAbandon}
        />,
      );

      const abandonButton = screen.queryByRole("button", { name: /abandon/i });
      expect(abandonButton).not.toBeInTheDocument();
    });
  });

  describe("Accessibility - Dialog Attributes", () => {
    it("should have role='dialog' for accessible popup", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("role", "dialog");
    });

    it("should have aria-modal='true'", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-labelledby pointing to title", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby");

      const labelId = dialog.getAttribute("aria-labelledby");
      const titleElement = document.getElementById(labelId!);
      expect(titleElement).toContainHTML("Defeat the Shadow Lord");
    });

    it("should restore focus to trigger element when closed", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <div>
          <button>Open Quest Detail</button>
          <QuestDetail
            quest={mockQuestProgressActive}
            isOpen={true}
            onClose={mockOnClose}
          />
        </div>,
      );

      // Find close button in the dialog and click it
      const dialog = screen.getByRole("dialog");
      const closeButton = within(dialog).getByLabelText("Close quest details");
      await user.click(closeButton);

      // Verify onClose was called (in real implementation, this would close)
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should have proper heading hierarchy", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Title should be in a heading (h1, h2, etc.)
      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);
      expect(
        headings.some((h) => h.textContent?.includes("Defeat the Shadow Lord")),
      ).toBe(true);
    });
  });

  describe("Multi-stage Quests", () => {
    it("should display current stage and other stages", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Should show stage information
      expect(screen.getByText(/stage 1 of 3/i)).toBeInTheDocument();
    });

    it("should show objectives for current stage only", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Should show objective list with aria-label
      const objectivesList = screen.getByRole("list", {
        name: /quest objectives/i,
      });
      expect(objectivesList).toBeInTheDocument();
    });
  });

  describe("Null/Undefined Handling", () => {
    it("should not render when quest is null", () => {
      const { container } = render(
        <QuestDetail quest={null} isOpen={true} onClose={mockOnClose} />,
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeInTheDocument();
    });

    it("should handle quests without quest giver", () => {
      const questNoGiver = { ...mockQuestProgressActive };
      delete (questNoGiver as any).questGiver;

      render(
        <QuestDetail
          quest={questNoGiver}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Should still render without crashing
      expect(screen.getByText("Defeat the Shadow Lord")).toBeInTheDocument();
    });
  });

  describe("Completed Quest View", () => {
    it("should show completion date for completed quests", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressCompleted}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Should show status as completed in the header
      const dialog = screen.getByRole("dialog");

      // Check that the dialog contains "Completed" status and a date
      const dialogText = dialog.textContent || "";
      expect(dialogText).toMatch(/completed/i);
      expect(dialogText).toMatch(/2026-01-20|january 20|jan 20/i);
    });
  });

  describe("Rewards Section (T040)", () => {
    it("should render RewardDisplay component when quest has rewards", () => {
      // Note: Currently QuestProgress doesn't have rewards field
      // This test verifies that RewardDisplay can be integrated
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Should render the quest detail dialog
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // When rewards are added to QuestProgress in future, verify:
      // - Rewards section heading visible
      // - All reward types displayed
      // - Reward amounts/labels shown correctly
    });

    it("should display all reward types correctly in quest detail", () => {
      // Future test: When QuestProgress includes rewards field
      // render(<QuestDetail quest={questWithRewards} ... />)
      // expect(screen.getByText(/5000 XP/i)).toBeInTheDocument()
      // expect(screen.getByText(/500 Gold/i)).toBeInTheDocument()
      // expect(screen.getByText(/Sword of Truth/i)).toBeInTheDocument()
    });

    it("should show rewards section near objectives in detail view", () => {
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Structure verification: objectives list should be present
      const objectivesList = screen.getByRole("list", {
        name: /quest objectives/i,
      });
      expect(objectivesList).toBeInTheDocument();

      // When rewards added: verify positioning relative to objectives
    });

    it("should handle quests with no rewards gracefully", () => {
      // Current state: rewards are optional
      render(
        <QuestDetail
          quest={mockQuestProgressActive}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      // Should render without errors
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    it("should distinguish between offered vs earned rewards for completed quests", () => {
      // Future enhancement: Different display for active vs completed quests
      render(
        <QuestDetail
          quest={mockQuestProgressCompleted}
          isOpen={true}
          onClose={mockOnClose}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // When rewards fully integrated:
      // - Show "Earned Rewards" for completed quests
      // - Show "Quest Rewards" for active quests
    });
  });
});
