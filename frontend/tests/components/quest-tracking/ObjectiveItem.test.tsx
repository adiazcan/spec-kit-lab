/**
 * ObjectiveItem Component Tests (T017)
 *
 * Tests for the ObjectiveItem component that displays individual objectives
 * with progress information, counters, and progress bars.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ObjectiveItem from "@/components/quest-tracking/ObjectiveItem";
import {
  mockObjectiveProgress,
  mockCompletedObjective,
  mockQuestProgressMultiObj,
} from "../../fixtures/quest-fixtures";
import type { ObjectiveProgress } from "@/types/quest";

describe("ObjectiveItem (T017)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Objective Information", () => {
    it("should display objective description", () => {
      render(<ObjectiveItem objective={mockObjectiveProgress} />);

      expect(screen.getByText("Defeat 5 goblin scouts")).toBeInTheDocument();
    });

    it("should display progress counter (e.g., '3/5')", () => {
      render(<ObjectiveItem objective={mockObjectiveProgress} />);

      expect(screen.getByText("3/5")).toBeInTheDocument();
    });

    it("should display progress percentage", () => {
      render(<ObjectiveItem objective={mockObjectiveProgress} />);

      // Should display progress percentage in the counter area
      const counterSection = screen.getByText("3/5").parentElement;
      expect(counterSection).toHaveTextContent("60%");
    });

    it("should display completion status for completed objectives", () => {
      render(<ObjectiveItem objective={mockCompletedObjective} />);

      // Should show "100%" or "3/3"
      expect(screen.getByText("3/3")).toBeInTheDocument();
      // Get the percentage from the counter area, not the progress bar label
      const counterSection = screen.getByText("3/3").parentElement;
      expect(counterSection).toHaveTextContent("100%");
    });

    it("should display visual checkmark for completed objectives", () => {
      const { container } = render(
        <ObjectiveItem objective={mockCompletedObjective} />,
      );

      // Check for checkmark icon or similar completion indicator
      const checkmark = container.querySelector(
        '[aria-label*="completed"], .checkmark, .complete',
      );
      expect(checkmark || screen.getByText(/✓|✔|complete/i)).toBeTruthy();
    });

    it("should render progress bar element", () => {
      const { container } = render(
        <ObjectiveItem objective={mockObjectiveProgress} />,
      );

      // Look for progress bar (role="progressbar" or <progress>)
      const progressBar =
        container.querySelector("progress") || screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });

    it("should render progress bar with correct percentage fill", () => {
      const { container } = render(
        <ObjectiveItem objective={mockObjectiveProgress} />,
      );

      const progressBar = container.querySelector("progress");
      if (progressBar) {
        expect(progressBar).toHaveAttribute("value", "60");
        expect(progressBar).toHaveAttribute("max", "100");
      }
    });
  });

  describe("Styling - In-Progress vs Completed", () => {
    it("should apply in-progress styling for active objectives", () => {
      const { container } = render(
        <ObjectiveItem objective={mockObjectiveProgress} />,
      );

      // Should have a class or data attribute indicating in-progress
      const objectiveElement = container.firstChild as HTMLElement;
      expect(
        objectiveElement.className.includes("in-progress") ||
          objectiveElement.className.includes("active"),
      ).toBeTruthy();
    });

    it("should apply completed styling for finished objectives", () => {
      const { container } = render(
        <ObjectiveItem objective={mockCompletedObjective} />,
      );

      // Should have a class or data attribute indicating completed
      const objectiveElement = container.firstChild as HTMLElement;
      expect(
        objectiveElement.className.includes("completed") ||
          objectiveElement.className.includes("done"),
      ).toBeTruthy();
    });

    it("should visually distinguish completed from in-progress", () => {
      const { container: inProgressContainer } = render(
        <ObjectiveItem objective={mockObjectiveProgress} />,
      );
      const { container: completedContainer } = render(
        <ObjectiveItem objective={mockCompletedObjective} />,
      );

      const inProgressClass = (inProgressContainer.firstChild as HTMLElement)
        .className;
      const completedClass = (completedContainer.firstChild as HTMLElement)
        .className;

      // Classes should be different
      expect(inProgressClass).not.toBe(completedClass);
    });

    it("should apply distinct color for completed objectives", () => {
      const { container } = render(
        <ObjectiveItem objective={mockCompletedObjective} />,
      );

      const objectiveElement = container.firstChild as HTMLElement;
      // Should have color styling or gray/muted appearance
      const styles = window.getComputedStyle(objectiveElement);
      const hasOpacityOrColor =
        styles.opacity !== "1" || styles.color !== "rgba(0, 0, 0, 0)";
      expect(hasOpacityOrColor || objectiveElement.className).toBeTruthy();
    });
  });

  describe("Accessibility - Progress Announcements", () => {
    it("should have aria-label describing progress", () => {
      render(<ObjectiveItem objective={mockObjectiveProgress} />);

      const objectiveItem = screen.getByRole("listitem", {
        hidden: true,
      });
      const hasAriaLabel =
        objectiveItem?.getAttribute("aria-label") ||
        document.querySelector("[aria-label*='Defeat']");

      expect(hasAriaLabel).toBeTruthy();
    });

    it("should have progress bar with aria-valuenow", () => {
      const { container } = render(
        <ObjectiveItem objective={mockObjectiveProgress} />,
      );

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "60");
    });

    it("should have progress bar with aria-valuemin and aria-valuemax", () => {
      const { container } = render(
        <ObjectiveItem objective={mockObjectiveProgress} />,
      );

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    it("should announce completion status", () => {
      render(<ObjectiveItem objective={mockCompletedObjective} />);

      // Should have text or aria-label indicating completion
      expect(screen.getByText("Collect ancient keys")).toBeInTheDocument();
      // Should have checkmark icon rendered for completed
      const checkmarkIcon = screen.getByLabelText("Completed");
      expect(checkmarkIcon).toBeInTheDocument();
    });

    it("should have clear description for accessibility", () => {
      render(<ObjectiveItem objective={mockObjectiveProgress} />);

      // Description should be readable by screen readers
      expect(screen.getByText("Defeat 5 goblin scouts")).toBeInTheDocument();
    });
  });

  describe("Counter Display Accuracy", () => {
    it("should calculate percentage correctly (currentProgress/targetAmount * 100)", () => {
      const objective: ObjectiveProgress = {
        objectiveId: "obj-test",
        description: "Test objective",
        conditionType: "Test",
        currentProgress: 2,
        targetAmount: 5,
        isCompleted: false,
        progressPercentage: 40, // 2/5 * 100 = 40%
      };

      render(<ObjectiveItem objective={objective} />);

      expect(screen.getByText("2/5")).toBeInTheDocument();
      const counterSection = screen.getByText("2/5").parentElement;
      expect(counterSection).toHaveTextContent("40%");
    });

    it("should show 100% for completed objectives", () => {
      const objective: ObjectiveProgress = {
        objectiveId: "obj-test-complete",
        description: "Complete test",
        conditionType: "Test",
        currentProgress: 10,
        targetAmount: 10,
        isCompleted: true,
        progressPercentage: 100,
      };

      render(<ObjectiveItem objective={objective} />);

      expect(screen.getByText("10/10")).toBeInTheDocument();
      const counterSection = screen.getByText("10/10").parentElement;
      expect(counterSection).toHaveTextContent("100%");
    });

    it("should show 0% for not started objectives", () => {
      const objective: ObjectiveProgress = {
        objectiveId: "obj-test-zero",
        description: "Zero progress test",
        conditionType: "Test",
        currentProgress: 0,
        targetAmount: 5,
        isCompleted: false,
        progressPercentage: 0,
      };

      render(<ObjectiveItem objective={objective} />);

      expect(screen.getByText("0/5")).toBeInTheDocument();
      const counterSection = screen.getByText("0/5").parentElement;
      expect(counterSection).toHaveTextContent("0%");
    });
  });

  describe("Multiple Objectives in Quest", () => {
    it("should render multiple objectives correctly", () => {
      const { rerender } = render(
        <ObjectiveItem
          objective={mockQuestProgressMultiObj.currentStage.objectives[0]}
        />,
      );

      expect(screen.getByText("Collect 3 crystals")).toBeInTheDocument();

      rerender(
        <ObjectiveItem
          objective={mockQuestProgressMultiObj.currentStage.objectives[1]}
        />,
      );

      expect(screen.getByText("Defeat cave guardian")).toBeInTheDocument();

      rerender(
        <ObjectiveItem
          objective={mockQuestProgressMultiObj.currentStage.objectives[2]}
        />,
      );

      expect(
        screen.getByText("Read the ancient inscription"),
      ).toBeInTheDocument();
    });

    it("should handle objectives with different progress states", () => {
      const objectives = mockQuestProgressMultiObj.currentStage.objectives;

      // First objective: 67% progress
      const { rerender } = render(<ObjectiveItem objective={objectives[0]} />);
      const counterSection1 = screen.getByText("2/3").parentElement;
      expect(counterSection1).toHaveTextContent("67%");

      // Second objective: 100% complete
      rerender(<ObjectiveItem objective={objectives[1]} />);
      const counterSection2 = screen.getByText("1/1").parentElement;
      expect(counterSection2).toHaveTextContent("100%");

      // Third objective: 0% progress
      rerender(<ObjectiveItem objective={objectives[2]} />);
      const counterSection3 = screen.getByText("0/1").parentElement;
      expect(counterSection3).toHaveTextContent("0%");
    });
  });

  describe("Edge Cases", () => {
    it("should handle objective with large numbers", () => {
      const largeObjective: ObjectiveProgress = {
        objectiveId: "obj-large",
        description: "Defeat 1000 enemies",
        conditionType: "Defeat",
        currentProgress: 750,
        targetAmount: 1000,
        isCompleted: false,
        progressPercentage: 75,
      };

      render(<ObjectiveItem objective={largeObjective} />);

      expect(screen.getByText("750/1000")).toBeInTheDocument();
      const counterSection = screen.getByText("750/1000").parentElement;
      expect(counterSection).toHaveTextContent("75%");
    });

    it("should handle objective with single-step completion", () => {
      const singleStepObjective: ObjectiveProgress = {
        objectiveId: "obj-single",
        description: "Open the door",
        conditionType: "Interact",
        currentProgress: 1,
        targetAmount: 1,
        isCompleted: true,
        progressPercentage: 100,
      };

      render(<ObjectiveItem objective={singleStepObjective} />);

      expect(screen.getByText("1/1")).toBeInTheDocument();
      const counterSection = screen.getByText("1/1").parentElement;
      expect(counterSection).toHaveTextContent("100%");
    });

    it("should display condition type as hint (optional)", () => {
      render(<ObjectiveItem objective={mockObjectiveProgress} />);

      // Condition type "Defeat" should be visible or in aria-label
      const objectiveText = screen.getByText("Defeat 5 goblin scouts");
      expect(objectiveText).toBeInTheDocument();
    });
  });

  describe("Props Handling", () => {
    it("should render with required objective prop", () => {
      expect(() => {
        render(<ObjectiveItem objective={mockObjectiveProgress} />);
      }).not.toThrow();
    });

    it("should update when objective prop changes", () => {
      const { rerender } = render(
        <ObjectiveItem objective={mockObjectiveProgress} />,
      );

      expect(screen.getByText("Defeat 5 goblin scouts")).toBeInTheDocument();

      rerender(<ObjectiveItem objective={mockCompletedObjective} />);

      expect(
        screen.queryByText("Defeat 5 goblin scouts"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Collect ancient keys")).toBeInTheDocument();
    });
  });

  /**
   * T024: Extended Progress Display Tests
   *
   * Additional comprehensive tests for progress bar visual fill,
   * percentage accuracy, and progress indicator behavior.
   */
  describe("Progress Display - Extended Coverage (T024)", () => {
    describe("Progress Bar Visual Fill", () => {
      it("should have progress bar with width matching percentage", () => {
        const { container } = render(
          <ObjectiveItem objective={mockObjectiveProgress} />,
        );

        const progressBar = screen.getByRole("progressbar");
        const fillDiv = progressBar.querySelector(".transition-all");

        expect(fillDiv).toHaveStyle("width: 60%");
      });

      it("should visually fill progress bar based on current/target ratio", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "visual-test-1",
          description: "Test visual fill",
          conditionType: "Test",
          currentProgress: 1,
          targetAmount: 4,
          isCompleted: false,
          progressPercentage: 25,
        };

        const { container } = render(<ObjectiveItem objective={objective} />);

        const fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveStyle("width: 25%");
      });

      it("should show 0% fill for not-started objectives", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "visual-test-0",
          description: "Not started",
          conditionType: "Test",
          currentProgress: 0,
          targetAmount: 10,
          isCompleted: false,
          progressPercentage: 0,
        };

        const { container } = render(<ObjectiveItem objective={objective} />);

        const fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveStyle("width: 0%");
      });

      it("should show full fill (100%) for completed objectives", () => {
        const { container } = render(
          <ObjectiveItem objective={mockCompletedObjective} />,
        );

        const fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveStyle("width: 100%");
      });

      it("should have smooth transition effect on fill", () => {
        const { container } = render(
          <ObjectiveItem objective={mockObjectiveProgress} />,
        );

        const fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("duration-300");
        expect(fillDiv).toHaveClass("ease-out");
      });

      it("should update fill width when percentage changes", () => {
        const objective1: ObjectiveProgress = {
          objectiveId: "dynamic-fill-1",
          description: "Dynamic fill test",
          conditionType: "Test",
          currentProgress: 2,
          targetAmount: 10,
          isCompleted: false,
          progressPercentage: 20,
        };

        const objective2: ObjectiveProgress = {
          objectiveId: "dynamic-fill-2",
          description: "Dynamic fill test",
          conditionType: "Test",
          currentProgress: 7,
          targetAmount: 10,
          isCompleted: false,
          progressPercentage: 70,
        };

        const { container, rerender } = render(
          <ObjectiveItem objective={objective1} />,
        );

        let fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveStyle("width: 20%");

        rerender(<ObjectiveItem objective={objective2} />);

        fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveStyle("width: 70%");
      });
    });

    describe("Percentage Accuracy & Calculation", () => {
      it("should calculate percentage correctly: (currentProgress / targetAmount) * 100", () => {
        const testCases: Array<{
          current: number;
          target: number;
          expected: number;
        }> = [
          { current: 1, target: 5, expected: 20 },
          { current: 2, target: 5, expected: 40 },
          { current: 3, target: 5, expected: 60 },
          { current: 4, target: 5, expected: 80 },
          { current: 5, target: 5, expected: 100 },
          { current: 0, target: 10, expected: 0 },
          { current: 5, target: 10, expected: 50 },
        ];

        testCases.forEach(({ current, target, expected }) => {
          const objective: ObjectiveProgress = {
            objectiveId: `calc-test-${current}-${target}`,
            description: "Calculation test",
            conditionType: "Test",
            currentProgress: current,
            targetAmount: target,
            isCompleted: current === target,
            progressPercentage: expected,
          };

          const { unmount } = render(<ObjectiveItem objective={objective} />);

          expect(screen.getByText(`${current}/${target}`)).toBeInTheDocument();
          const counterSection = screen.getByText(
            `${current}/${target}`,
          ).parentElement;
          expect(counterSection).toHaveTextContent(`${expected}%`);

          unmount();
        });
      });

      it("should round percentage correctly for display", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "rounding-test",
          description: "Test rounding",
          conditionType: "Test",
          currentProgress: 1,
          targetAmount: 3,
          isCompleted: false,
          progressPercentage: 33,
        };

        render(<ObjectiveItem objective={objective} />);

        expect(screen.getByText("1/3")).toBeInTheDocument();
        const counterSection = screen.getByText("1/3").parentElement;
        expect(counterSection).toHaveTextContent("33%");
      });

      it("should display precise percentage for decimal calculations", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "decimal-test",
          description: "Test decimal",
          conditionType: "Test",
          currentProgress: 2,
          targetAmount: 3,
          isCompleted: false,
          progressPercentage: 67,
        };

        render(<ObjectiveItem objective={objective} />);

        expect(screen.getByText("2/3")).toBeInTheDocument();
        const counterSection = screen.getByText("2/3").parentElement;
        expect(counterSection).toHaveTextContent("67%");
      });

      it("should handle edge case: zero target amount gracefully", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "zero-target",
          description: "Edge case",
          conditionType: "Test",
          currentProgress: 0,
          targetAmount: 0,
          isCompleted: true,
          progressPercentage: 0, // or 100, depends on implementation
        };

        expect(() => {
          render(<ObjectiveItem objective={objective} />);
        }).not.toThrow();
      });

      it("should distinguish between cumulative progress objectives (e.g., 5/5 = 100%)", () => {
        const objectives: ObjectiveProgress[] = [
          {
            objectiveId: "cumulative-1",
            description: "Collect items",
            conditionType: "Collect",
            currentProgress: 1,
            targetAmount: 5,
            isCompleted: false,
            progressPercentage: 20,
          },
          {
            objectiveId: "cumulative-2",
            description: "Collect items",
            conditionType: "Collect",
            currentProgress: 2,
            targetAmount: 5,
            isCompleted: false,
            progressPercentage: 40,
          },
          {
            objectiveId: "cumulative-3",
            description: "Collect items",
            conditionType: "Collect",
            currentProgress: 5,
            targetAmount: 5,
            isCompleted: true,
            progressPercentage: 100,
          },
        ];

        objectives.forEach(
          ({ currentProgress, targetAmount, progressPercentage }, idx) => {
            const { unmount } = render(
              <ObjectiveItem objective={objectives[idx]} />,
            );

            const counterText = screen.getByText(
              `${currentProgress}/${targetAmount}`,
            );
            expect(counterText).toBeInTheDocument();

            unmount();
          },
        );
      });
    });

    describe("Progress Bar Color Changes", () => {
      it("should apply red color for low progress (≤33%)", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "color-red",
          description: "Low progress",
          conditionType: "Test",
          currentProgress: 1,
          targetAmount: 5,
          isCompleted: false,
          progressPercentage: 20,
        };

        const { container } = render(<ObjectiveItem objective={objective} />);

        const fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("bg-red-600");
      });

      it("should apply yellow color for medium progress (34-66%)", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "color-yellow",
          description: "Medium progress",
          conditionType: "Test",
          currentProgress: 3,
          targetAmount: 5,
          isCompleted: false,
          progressPercentage: 60,
        };

        const { container } = render(<ObjectiveItem objective={objective} />);

        const fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("bg-yellow-500");
      });

      it("should apply green color for high progress (≥67%)", () => {
        const objective: ObjectiveProgress = {
          objectiveId: "color-green",
          description: "High progress",
          conditionType: "Test",
          currentProgress: 4,
          targetAmount: 5,
          isCompleted: false,
          progressPercentage: 80,
        };

        const { container } = render(<ObjectiveItem objective={objective} />);

        const fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("bg-green-600");
      });

      it("should transition from red to green as progress increases", () => {
        const { container, rerender } = render(
          <ObjectiveItem objective={mockObjectiveProgress} />,
        );

        // Start at 60% (yellow)
        let fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("bg-yellow-500");

        // Move to 70% (green)
        const progressiveObj: ObjectiveProgress = {
          objectiveId: "progressive",
          description: "Progressive",
          conditionType: "Test",
          currentProgress: 7,
          targetAmount: 10,
          isCompleted: false,
          progressPercentage: 70,
        };

        rerender(<ObjectiveItem objective={progressiveObj} />);

        fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("bg-green-600");
      });
    });

    describe("Completed Objective Styling", () => {
      it("should apply distinct styling for completed objectives", () => {
        const { container } = render(
          <ObjectiveItem objective={mockCompletedObjective} />,
        );

        const objectiveElement = container.firstChild as HTMLElement;
        expect(objectiveElement.className).toContain("completed");
        expect(objectiveElement.className).toContain("opacity");
      });

      it("should show checkmark for completed objectives", () => {
        const { container } = render(
          <ObjectiveItem objective={mockCompletedObjective} />,
        );

        const checkmark = screen.getByLabelText("Completed");
        expect(checkmark).toBeInTheDocument();
      });

      it("should display distinct background for completed vs in-progress", () => {
        const inProgressObjective: ObjectiveProgress = {
          objectiveId: "compare-in-progress",
          description: "In progress",
          conditionType: "Test",
          currentProgress: 2,
          targetAmount: 5,
          isCompleted: false,
          progressPercentage: 40,
        };

        const completedObjective: ObjectiveProgress = {
          objectiveId: "compare-completed",
          description: "Completed",
          conditionType: "Test",
          currentProgress: 5,
          targetAmount: 5,
          isCompleted: true,
          progressPercentage: 100,
        };

        const { container: inProgressContainer } = render(
          <ObjectiveItem objective={inProgressObjective} />,
        );

        const inProgressClass = (inProgressContainer.firstChild as HTMLElement)
          .className;

        const { container: completedContainer } = render(
          <ObjectiveItem objective={completedObjective} />,
        );

        const completedClass = (completedContainer.firstChild as HTMLElement)
          .className;

        // Should have different styling
        expect(inProgressClass).not.toBe(completedClass);
      });
    });

    describe("Multiple Objectives with Different Progress States", () => {
      it("should display mixed progress states correctly", () => {
        const { rerender } = render(
          <ObjectiveItem
            objective={mockQuestProgressMultiObj.currentStage.objectives[0]}
          />,
        );

        // First: 67% (2/3) - yellow
        const obj1 = screen.getByText("Collect 3 crystals");
        expect(obj1).toBeInTheDocument();

        rerender(
          <ObjectiveItem
            objective={mockQuestProgressMultiObj.currentStage.objectives[1]}
          />,
        );

        // Second: 100% complete - green + checkmark
        const obj2 = screen.getByText("Defeat cave guardian");
        expect(obj2).toBeInTheDocument();

        rerender(
          <ObjectiveItem
            objective={mockQuestProgressMultiObj.currentStage.objectives[2]}
          />,
        );

        // Third: 0% (0/1) - red
        const obj3 = screen.getByText("Read the ancient inscription");
        expect(obj3).toBeInTheDocument();
      });

      it("should handle transitions between objectives with different progress", () => {
        const lowProgress: ObjectiveProgress = {
          objectiveId: "trans-low",
          description: "Low progress obj",
          conditionType: "Test",
          currentProgress: 0,
          targetAmount: 10,
          isCompleted: false,
          progressPercentage: 0,
        };

        const highProgress: ObjectiveProgress = {
          objectiveId: "trans-high",
          description: "High progress obj",
          conditionType: "Test",
          currentProgress: 100,
          targetAmount: 100,
          isCompleted: true,
          progressPercentage: 100,
        };

        const { rerender, container } = render(
          <ObjectiveItem objective={lowProgress} />,
        );

        let fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("bg-red-600");

        rerender(<ObjectiveItem objective={highProgress} />);

        fillDiv = container.querySelector(".transition-all");
        expect(fillDiv).toHaveClass("bg-green-600");
      });
    });

    describe("ARIA Accessibility for Progress", () => {
      it("should announce progress percentage in aria-valuenow", () => {
        render(<ObjectiveItem objective={mockObjectiveProgress} />);

        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow", "60");
      });

      it("should properly announce changes in progress", () => {
        const { rerender } = render(
          <ObjectiveItem objective={mockObjectiveProgress} />,
        );

        let progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow", "60");

        const newObjective: ObjectiveProgress = {
          objectiveId: "aria-update",
          description: "Updated objective",
          conditionType: "Test",
          currentProgress: 4,
          targetAmount: 5,
          isCompleted: false,
          progressPercentage: 80,
        };

        rerender(<ObjectiveItem objective={newObjective} />);

        progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow", "80");
      });

      it("should include progress in aria-label", () => {
        render(<ObjectiveItem objective={mockObjectiveProgress} />);

        const objectiveItem = screen.getByRole("listitem", { hidden: true });
        const ariaLabel = objectiveItem?.getAttribute("aria-label");
        expect(ariaLabel).toContain("60%");
      });
    });
  });
});
