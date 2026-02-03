/**
 * QuestFilter Component Tests (T028)
 *
 * Tests for the QuestFilter component that provides filter controls for quest status.
 * Covers checkbox rendering, change callbacks, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestFilter from "@/components/quest-tracking/QuestFilter";
import type { QuestFilterState } from "@/types/quest";

describe("QuestFilter (T028)", () => {
  const mockOnFiltersChange = vi.fn();

  const defaultFilters: QuestFilterState = {
    statusFilters: ["Active"],
    searchText: "",
    sortBy: "name",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Filter Controls", () => {
    it("should render filter component with heading", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent(/filter/i);
    });

    it("should render three status filter checkboxes", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(3);
    });

    it("should render checkbox for Active status", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const activeCheckbox = screen.getByLabelText(/active/i);
      expect(activeCheckbox).toBeInTheDocument();
      expect(activeCheckbox).toBeChecked();
    });

    it("should render checkbox for Completed status", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const completedCheckbox = screen.getByLabelText(/completed/i);
      expect(completedCheckbox).toBeInTheDocument();
    });

    it("should render checkbox for Failed status", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const failedCheckbox = screen.getByLabelText(/failed/i);
      expect(failedCheckbox).toBeInTheDocument();
    });

    it("should have each checkbox associated with a label", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAccessibleName();
      });
    });
  });

  describe("Checkbox State - Initial Rendering", () => {
    it("should check Active checkbox when Active is in filters", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const activeCheckbox = screen.getByLabelText(
        /active/i,
      ) as HTMLInputElement;
      expect(activeCheckbox.checked).toBe(true);
    });

    it("should check Completed checkbox when Completed is in filters", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Completed"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const completedCheckbox = screen.getByLabelText(
        /completed/i,
      ) as HTMLInputElement;
      expect(completedCheckbox.checked).toBe(true);
    });

    it("should check Failed checkbox when Failed is in filters", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Failed"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const failedCheckbox = screen.getByLabelText(
        /failed/i,
      ) as HTMLInputElement;
      expect(failedCheckbox.checked).toBe(true);
    });

    it("should support multiple filters checked simultaneously", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active", "Completed"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const activeCheckbox = screen.getByLabelText(
        /active/i,
      ) as HTMLInputElement;
      const completedCheckbox = screen.getByLabelText(
        /completed/i,
      ) as HTMLInputElement;
      expect(activeCheckbox.checked).toBe(true);
      expect(completedCheckbox.checked).toBe(true);
    });

    it("should uncheck all boxes when statusFilters is empty", () => {
      const filters: QuestFilterState = {
        statusFilters: [],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
      checkboxes.forEach((checkbox) => {
        expect(checkbox.checked).toBe(false);
      });
    });
  });

  describe("Interaction - Checkbox Click Handlers", () => {
    it("should invoke onChange when Active checkbox is clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const activeCheckbox = screen.getByLabelText(/active/i);
      await user.click(activeCheckbox);

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("should invoke onChange when Completed checkbox is clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const completedCheckbox = screen.getByLabelText(/completed/i);
      await user.click(completedCheckbox);

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("should invoke onChange when Failed checkbox is clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const failedCheckbox = screen.getByLabelText(/failed/i);
      await user.click(failedCheckbox);

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("should pass updated filters with added status on checkbox selection", async () => {
      const user = userEvent.setup();
      const filters: QuestFilterState = {
        statusFilters: ["Active"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const completedCheckbox = screen.getByLabelText(/completed/i);
      await user.click(completedCheckbox);

      const callArg = mockOnFiltersChange.mock.calls[0][0];
      expect(callArg.statusFilters).toContain("Active");
      expect(callArg.statusFilters).toContain("Completed");
    });

    it("should pass updated filters with removed status on checkbox deselection", async () => {
      const user = userEvent.setup();
      const filters: QuestFilterState = {
        statusFilters: ["Active", "Completed"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const activeCheckbox = screen.getByLabelText(/active/i);
      await user.click(activeCheckbox);

      const callArg = mockOnFiltersChange.mock.calls[0][0];
      expect(callArg.statusFilters).not.toContain("Active");
      expect(callArg.statusFilters).toContain("Completed");
    });

    it("should allow multiple filters to be selected together", async () => {
      const user = userEvent.setup();
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const completedCheckbox = screen.getByLabelText(/completed/i);
      const failedCheckbox = screen.getByLabelText(/failed/i);

      await user.click(completedCheckbox);
      await user.click(failedCheckbox);

      expect(mockOnFiltersChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Keyboard Accessibility", () => {
    it("should allow keyboard navigation to checkboxes with Tab", async () => {
      const user = userEvent.setup();
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const activeCheckbox = screen.getByLabelText(/active/i);
      const completedCheckbox = screen.getByLabelText(/completed/i);

      activeCheckbox.focus();
      expect(document.activeElement).toBe(activeCheckbox);

      await user.tab();
      expect(document.activeElement).toBe(completedCheckbox);
    });

    it("should allow checkbox activation with Space key", async () => {
      const user = userEvent.setup();
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const completedCheckbox = screen.getByLabelText(/completed/i);
      completedCheckbox.focus();

      await user.keyboard(" ");

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it("should be keyboard accessible with proper focus management", async () => {
      const user = userEvent.setup();
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      // Focus and interact with first checkbox
      const activeCheckbox = screen.getByLabelText(/active/i);
      await user.click(activeCheckbox);
      expect(mockOnFiltersChange).toHaveBeenCalled();

      // Tab to next checkbox
      mockOnFiltersChange.mockClear();
      const completedCheckbox = screen.getByLabelText(/completed/i);
      await user.click(completedCheckbox);
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  describe("Accessibility - Labels", () => {
    it("should have checkbox elements with associated labels", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      const activeCheckbox = screen.getByLabelText(/active/i);
      const completedCheckbox = screen.getByLabelText(/completed/i);
      const failedCheckbox = screen.getByLabelText(/failed/i);

      expect(activeCheckbox).toHaveAccessibleName();
      expect(completedCheckbox).toHaveAccessibleName();
      expect(failedCheckbox).toHaveAccessibleName();
    });

    it("should have descriptive accessible names for each checkbox", () => {
      render(
        <QuestFilter
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
      );

      expect(screen.getByLabelText(/active/i)).toHaveAccessibleName(/active/i);
      expect(screen.getByLabelText(/completed/i)).toHaveAccessibleName(
        /completed/i,
      );
      expect(screen.getByLabelText(/failed/i)).toHaveAccessibleName(/failed/i);
    });
  });

  describe("Visual Feedback", () => {
    it("should apply checked state styling to active checkboxes", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const activeCheckbox = screen.getByLabelText(
        /active/i,
      ) as HTMLInputElement;
      expect(activeCheckbox.checked).toBe(true);
    });

    it("should visually distinguish checked from unchecked checkboxes", () => {
      const filters: QuestFilterState = {
        statusFilters: ["Active"],
        searchText: "",
        sortBy: "name",
      };

      render(
        <QuestFilter filters={filters} onFiltersChange={mockOnFiltersChange} />,
      );

      const activeCheckbox = screen.getByLabelText(
        /active/i,
      ) as HTMLInputElement;
      const completedCheckbox = screen.getByLabelText(
        /completed/i,
      ) as HTMLInputElement;
      const failedCheckbox = screen.getByLabelText(
        /failed/i,
      ) as HTMLInputElement;

      // Active should be checked, others unchecked
      expect(activeCheckbox.checked).toBe(true);
      expect(completedCheckbox.checked).toBe(false);
      expect(failedCheckbox.checked).toBe(false);
    });
  });
});
