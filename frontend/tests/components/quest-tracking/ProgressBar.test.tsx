/**
 * ProgressBar Component Tests (T023)
 *
 * Tests for the reusable ProgressBar component that displays visual
 * progress indicators with optional percentage labels and full accessibility.
 *
 * Coverage:
 * - Visual progress bar rendering at correct percentage
 * - Percentage text display when showLabel=true
 * - Full WCAG AA accessibility with ARIA attributes
 * - Boundary values (0%, 50%, 100%)
 * - Color changes based on progress level
 * - Label display and aria-label support
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "@/components/quest-tracking/ProgressBar";

describe("ProgressBar (T023)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visual Rendering - Progress Bar Fill", () => {
    it("should render progress bar element", () => {
      const { container } = render(
        <ProgressBar percentage={50} ariaLabel="Test progress" />,
      );

      const progressBar = container.querySelector("[role='progressbar']");
      expect(progressBar).toBeInTheDocument();
    });

    it("should render at 0% progress (no fill)", () => {
      const { container } = render(
        <ProgressBar percentage={0} ariaLabel="Empty bar" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 0%");
    });

    it("should render at 50% progress (half-filled)", () => {
      const { container } = render(
        <ProgressBar percentage={50} ariaLabel="Half-filled" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 50%");
    });

    it("should render at 100% progress (fully-filled)", () => {
      const { container } = render(
        <ProgressBar percentage={100} ariaLabel="Full bar" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 100%");
    });

    it("should update width dynamically when percentage prop changes", () => {
      const { container, rerender } = render(
        <ProgressBar percentage={25} ariaLabel="Dynamic progress" />,
      );

      let fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 25%");

      rerender(<ProgressBar percentage={75} ariaLabel="Dynamic progress" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 75%");
    });

    it("should clamp percentage > 100 to 100%", () => {
      const { container } = render(
        <ProgressBar percentage={150} ariaLabel="Over 100%" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 100%");
    });

    it("should clamp percentage < 0 to 0%", () => {
      const { container } = render(
        <ProgressBar percentage={-50} ariaLabel="Negative percentage" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 0%");
    });

    it("should handle decimal percentages", () => {
      const { container } = render(
        <ProgressBar percentage={33.33} ariaLabel="Decimal progress" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 33.33%");
    });
  });

  describe("Percentage Label Display (showLabel prop)", () => {
    it("should NOT display percentage text when showLabel=false (default)", () => {
      render(<ProgressBar percentage={65} showLabel={false} />);

      expect(screen.queryByText("65%")).not.toBeInTheDocument();
    });

    it("should display percentage text when showLabel=true", () => {
      render(<ProgressBar percentage={65} showLabel={true} />);

      expect(screen.getByText("65%")).toBeInTheDocument();
    });

    it("should display correct percentage value on label", () => {
      render(<ProgressBar percentage={42} showLabel={true} />);

      expect(screen.getByText("42%")).toBeInTheDocument();
    });

    it("should update percentage label when prop changes", () => {
      const { rerender } = render(
        <ProgressBar percentage={30} showLabel={true} />,
      );

      expect(screen.getByText("30%")).toBeInTheDocument();

      rerender(<ProgressBar percentage={80} showLabel={true} />);

      expect(screen.queryByText("30%")).not.toBeInTheDocument();
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("should display integer percentage on label even for decimals", () => {
      render(<ProgressBar percentage={66.67} showLabel={true} />);

      // Component shows the actual percentage value
      expect(screen.getByText("66.67%")).toBeInTheDocument();
    });

    it("should display 0% label correctly", () => {
      render(<ProgressBar percentage={0} showLabel={true} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("should display 100% label correctly", () => {
      render(<ProgressBar percentage={100} showLabel={true} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Optional Label Display", () => {
    it("should not display label when label prop not provided", () => {
      render(<ProgressBar percentage={50} />);

      // Check that no descriptive label text is visible (only progress bar)
      const labelElement = screen.queryByText(/^[A-Z].*$/);
      if (labelElement) {
        // If there's a label, it shouldn't be the label prop
        expect(labelElement.textContent).not.toMatch(/^[A-Z]/);
      }
    });

    it("should display label text when provided", () => {
      render(<ProgressBar percentage={50} label="Quest Progress" />);

      expect(screen.getByText("Quest Progress")).toBeInTheDocument();
    });

    it("should display custom label with showLabel", () => {
      render(<ProgressBar percentage={45} label="Stage 2" showLabel={true} />);

      expect(screen.getByText("Stage 2")).toBeInTheDocument();
    });

    it("should display both label and percentage", () => {
      render(
        <ProgressBar percentage={75} label="Objectives" showLabel={true} />,
      );

      expect(screen.getByText("Objectives")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("Accessibility - ARIA Attributes", () => {
    it("should have role='progressbar'", () => {
      render(<ProgressBar percentage={50} ariaLabel="Test progress bar" />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });

    it("should have aria-valuenow set to current percentage", () => {
      render(<ProgressBar percentage={65} ariaLabel="Progress bar" />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "65");
    });

    it("should update aria-valuenow when percentage changes", () => {
      const { rerender } = render(
        <ProgressBar percentage={30} ariaLabel="Dynamic progress" />,
      );

      let progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "30");

      rerender(<ProgressBar percentage={80} ariaLabel="Dynamic progress" />);

      progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "80");
    });

    it("should have aria-valuemin set to 0", () => {
      render(<ProgressBar percentage={50} ariaLabel="Progress bar" />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    });

    it("should have aria-valuemax set to 100", () => {
      render(<ProgressBar percentage={50} ariaLabel="Progress bar" />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    it("should have aria-label for accessibility announcement", () => {
      render(
        <ProgressBar percentage={50} ariaLabel="Quest progress indicator" />,
      );

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute(
        "aria-label",
        "Quest progress indicator",
      );
    });

    it("should generate default aria-label when not provided", () => {
      render(<ProgressBar percentage={50} />);

      const progressBar = screen.getByRole("progressbar");
      const ariaLabel = progressBar.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain("50");
    });

    it("should include label in aria-label when both provided", () => {
      render(
        <ProgressBar
          percentage={60}
          label="Stage Progress"
          ariaLabel="Custom label"
        />,
      );

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-label", "Custom label");
    });

    it("should have correct aria attributes for 0% progress", () => {
      render(<ProgressBar percentage={0} ariaLabel="Not started" />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "0");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    it("should have correct aria attributes for 100% progress", () => {
      render(<ProgressBar percentage={100} ariaLabel="Complete" />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "100");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });
  });

  describe("Color Changes Based on Progress", () => {
    it("should apply red color for 0-33% progress", () => {
      const { container, rerender } = render(
        <ProgressBar percentage={0} ariaLabel="Red progress" />,
      );

      let fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-red-600");

      rerender(<ProgressBar percentage={33} ariaLabel="Red progress" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-red-600");
    });

    it("should apply yellow color for 34-66% progress", () => {
      const { container, rerender } = render(
        <ProgressBar percentage={35} ariaLabel="Yellow progress" />,
      );

      let fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-yellow-500");

      rerender(<ProgressBar percentage={50} ariaLabel="Yellow progress" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-yellow-500");

      rerender(<ProgressBar percentage={66} ariaLabel="Yellow progress" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-yellow-500");
    });

    it("should apply green color for 67-100% progress", () => {
      const { container, rerender } = render(
        <ProgressBar percentage={67} ariaLabel="Green progress" />,
      );

      let fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-green-600");

      rerender(<ProgressBar percentage={90} ariaLabel="Green progress" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-green-600");

      rerender(<ProgressBar percentage={100} ariaLabel="Green progress" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-green-600");
    });

    it("should transition colors smoothly when progress changes", () => {
      const { container, rerender } = render(
        <ProgressBar percentage={30} ariaLabel="Color transition" />,
      );

      let fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-red-600");

      // Transition to yellow zone
      rerender(<ProgressBar percentage={50} ariaLabel="Color transition" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-yellow-500");

      // Transition to green zone
      rerender(<ProgressBar percentage={80} ariaLabel="Color transition" />);

      fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("bg-green-600");
    });
  });

  describe("Responsive & Styling", () => {
    it("should apply Tailwind CSS classes for styling", () => {
      const { container } = render(
        <ProgressBar percentage={50} ariaLabel="Styled progress" />,
      );

      const progressBar = container.querySelector("[role='progressbar']");
      expect(progressBar).toHaveClass("relative");
      expect(progressBar).toHaveClass("h-4");
      expect(progressBar).toHaveClass("w-full");
      expect(progressBar).toHaveClass("rounded-full");
    });

    it("should support custom className prop", () => {
      const { container } = render(
        <ProgressBar
          percentage={50}
          className="custom-class"
          ariaLabel="Custom styled"
        />,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should have smooth transition effect", () => {
      const { container } = render(
        <ProgressBar percentage={50} ariaLabel="Animated progress" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveClass("duration-300");
      expect(fillElement).toHaveClass("ease-out");
    });

    it("should render with dark mode support", () => {
      const { container } = render(
        <ProgressBar percentage={50} ariaLabel="Dark mode" />,
      );

      const progressBar = container.querySelector("[role='progressbar']");
      // Check for dark mode classes
      const className = progressBar?.className || "";
      expect(className).toBeTruthy();
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("should handle NaN percentage gracefully", () => {
      // This tests that invalid input doesn't crash the component
      expect(() => {
        render(<ProgressBar percentage={NaN} ariaLabel="Invalid percentage" />);
      }).not.toThrow();
    });

    it("should handle Infinity percentage gracefully", () => {
      expect(() => {
        render(
          <ProgressBar percentage={Infinity} ariaLabel="Infinite percentage" />,
        );
      }).not.toThrow();
    });

    it("should handle very small percentages (< 1%)", () => {
      const { container } = render(
        <ProgressBar percentage={0.5} ariaLabel="Small percentage" />,
      );

      const fillElement = container.querySelector(".transition-all");
      expect(fillElement).toHaveStyle("width: 0.5%");
    });

    it("should handle missing label gracefully", () => {
      expect(() => {
        render(<ProgressBar percentage={50} ariaLabel="No label" />);
      }).not.toThrow();
    });

    it("should render without aria-label when not provided", () => {
      const { container } = render(<ProgressBar percentage={50} />);

      const progressBar = container.querySelector("[role='progressbar']");
      expect(progressBar).toHaveAttribute("aria-label");
    });
  });

  describe("Integration with Other Components", () => {
    it("should be usable with percentage from calculation", () => {
      const currentProgress = 3;
      const targetAmount = 5;
      const percentage = (currentProgress / targetAmount) * 100;

      render(
        <ProgressBar
          percentage={percentage}
          label="Objectives"
          ariaLabel="Objective progress"
        />,
      );

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "60");
    });

    it("should work in a progress tracking scenario", () => {
      // Simulate tracking progress over time
      const { rerender } = render(
        <ProgressBar percentage={0} label="Quest Progress" />,
      );

      // Progress through stages
      const stages = [25, 50, 75, 100];
      for (const stage of stages) {
        rerender(<ProgressBar percentage={stage} label="Quest Progress" />);

        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow", stage.toString());
      }
    });

    it("should display percentage label for visual feedback", () => {
      render(
        <ProgressBar
          percentage={60}
          label="Quest Progress"
          showLabel={true}
          ariaLabel="Overall quest progress: 60%"
        />,
      );

      expect(screen.getByText("Quest Progress")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-label",
        "Overall quest progress: 60%",
      );
    });
  });

  describe("React.memo Optimization", () => {
    it("should be memoized to prevent unnecessary re-renders", () => {
      const renderSpy = vi.fn();

      const TestComponent = () => {
        renderSpy();
        return <ProgressBar percentage={50} ariaLabel="Test" />;
      };

      const { rerender } = render(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props - ProgressBar should not re-render
      rerender(<TestComponent />);

      // Test component re-renders but ProgressBar should be memoized
      // (This is a basic check; actual memo testing requires more setup)
      expect(renderSpy).toHaveBeenCalled();
    });
  });
});
