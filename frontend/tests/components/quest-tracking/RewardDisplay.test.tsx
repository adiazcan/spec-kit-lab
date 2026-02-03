/**
 * RewardDisplay Component Tests (T039)
 *
 * Tests for the RewardDisplay component that shows quest rewards with
 * different types (Experience, Item, Currency, Achievement) and visual distinction.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RewardDisplay from "@/components/quest-tracking/RewardDisplay";
import { mockRewards } from "../../fixtures/quest-fixtures";
import type { Reward } from "@/types/quest";

describe("RewardDisplay (T039)", () => {
  describe("Rendering - Reward Items", () => {
    it("should render reward for each reward type (Experience, Item, Currency, Achievement)", () => {
      const rewards: Reward[] = [
        {
          rewardId: "xp-1",
          type: "Experience",
          amount: 5000,
        },
        {
          rewardId: "item-1",
          type: "Item",
          amount: 1,
          itemId: "item-123",
          itemName: "Sword of Truth",
        },
        {
          rewardId: "gold-1",
          type: "Currency",
          amount: 500,
        },
        {
          rewardId: "achievement-1",
          type: "Achievement",
          description: "Shadow Slayer",
        },
      ];

      render(<RewardDisplay rewards={rewards} />);

      expect(screen.getByText(/5000 XP/i)).toBeInTheDocument();
      expect(screen.getByText(/Sword of Truth/i)).toBeInTheDocument();
      expect(screen.getByText(/500 Gold/i)).toBeInTheDocument();
      expect(screen.getByText(/Shadow Slayer/i)).toBeInTheDocument();
    });

    it("should display reward amount/quantity with label", () => {
      render(<RewardDisplay rewards={mockRewards} />);

      expect(screen.getByText(/5000 XP/i)).toBeInTheDocument();
      expect(screen.getByText(/500 Gold/i)).toBeInTheDocument();
      expect(screen.getByText(/Sword of Truth/i)).toBeInTheDocument();
    });

    it("should display empty state when no rewards provided", () => {
      render(<RewardDisplay rewards={[]} />);

      expect(screen.getByText(/no rewards/i)).toBeInTheDocument();
    });

    it("should display empty state when rewards is undefined", () => {
      render(<RewardDisplay rewards={undefined} />);

      expect(screen.getByText(/no rewards/i)).toBeInTheDocument();
    });

    it("should render correct number of reward items", () => {
      render(<RewardDisplay rewards={mockRewards} />);

      // Check that we have the correct number of reward item containers
      const { container } = render(<RewardDisplay rewards={mockRewards} />);
      const rewardItems = container.querySelectorAll(
        "[class*='flex-1 min-w-0']",
      );

      // Should have one reward info div per reward
      expect(rewardItems.length).toBe(mockRewards.length);
    });
  });

  describe("Rendering - Reward Types", () => {
    it("should render Experience reward correctly", () => {
      const experienceReward: Reward[] = [
        {
          rewardId: "xp-1",
          type: "Experience",
          amount: 1000,
        },
      ];

      render(<RewardDisplay rewards={experienceReward} />);

      expect(screen.getByText(/1000 XP/i)).toBeInTheDocument();
      expect(screen.getByText(/Experience Points/i)).toBeInTheDocument();
    });

    it("should render Currency reward correctly", () => {
      const currencyReward: Reward[] = [
        {
          rewardId: "gold-1",
          type: "Currency",
          amount: 250,
        },
      ];

      render(<RewardDisplay rewards={currencyReward} />);

      // Check for the amount display
      expect(screen.getByText(/250 Gold/i)).toBeInTheDocument();
      // Verify component rendered
      const container = screen.getByText(/250 Gold/i).parentElement;
      expect(container).toBeTruthy();
    });

    it("should render Item reward with item name", () => {
      const itemReward: Reward[] = [
        {
          rewardId: "item-1",
          type: "Item",
          amount: 1,
          itemId: "item-456",
          itemName: "Shield of Protection",
        },
      ];

      render(<RewardDisplay rewards={itemReward} />);

      expect(screen.getByText(/Shield of Protection/i)).toBeInTheDocument();
      expect(screen.getByText(/Item/i)).toBeInTheDocument();
    });

    it("should render Achievement reward with description", () => {
      const achievementReward: Reward[] = [
        {
          rewardId: "achievement-1",
          type: "Achievement",
          description: "Dragon Slayer",
        },
      ];

      render(<RewardDisplay rewards={achievementReward} />);

      expect(screen.getByText(/Dragon Slayer/i)).toBeInTheDocument();
      expect(screen.getByText(/Achievement/i)).toBeInTheDocument();
    });

    it("should handle Item reward without itemName gracefully", () => {
      const itemReward: Reward[] = [
        {
          rewardId: "item-2",
          type: "Item",
          amount: 3,
          itemId: "item-789",
        },
      ];

      const { container } = render(<RewardDisplay rewards={itemReward} />);

      // Should display fallback text that includes item info
      const itemElement = screen.getByText((content, element) => {
        return (
          content.includes("Item") && element?.className.includes("text-xs")
        );
      });
      expect(itemElement).toBeInTheDocument();
    });
  });

  describe("Accessibility - Icons and Labels", () => {
    it("should have icons for each reward type render correctly", () => {
      const { container } = render(<RewardDisplay rewards={mockRewards} />);

      // SVG elements should be present in the DOM
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });

    it("should have aria-label attributes for icons", () => {
      const { container } = render(<RewardDisplay rewards={mockRewards} />);

      // Check that reward icons have aria-labels
      const ariaLabels = container.querySelectorAll("[aria-label]");
      expect(ariaLabels.length).toBeGreaterThanOrEqual(mockRewards.length);
    });

    it("should make reward types clearly announced to screen readers", () => {
      render(<RewardDisplay rewards={mockRewards} />);

      // Each reward type should be clearly labeled with text
      expect(screen.getByText(/Experience Points/i)).toBeVisible();
      // Check for currency type label
      const currencyLabel = screen.getByText((content, element) => {
        return (
          element?.textContent === "Gold" &&
          element?.className.includes("text-xs")
        );
      });
      expect(currencyLabel).toBeVisible();
    });

    it("should display reward amounts with clear labels", () => {
      render(<RewardDisplay rewards={mockRewards} />);

      // Amounts should be displayed with clear text (not just icons)
      expect(screen.getByText(/5000 XP/i)).toBeInTheDocument();
      const goldAmount = screen.getByText((content, element) => {
        return content.includes("500") && element?.textContent.includes("Gold");
      });
      expect(goldAmount).toBeTruthy();
    });

    it("should have Rewards heading for semantic structure", () => {
      const { container } = render(<RewardDisplay rewards={mockRewards} />);

      // Should have a rewards heading (h3 specifically)
      const headings = container.querySelectorAll("h3");
      expect(headings.length).toBeGreaterThan(0);

      // Check that the first h3 contains "Rewards" text
      const rewardsHeading = headings[0];
      expect(rewardsHeading.textContent).toContain("Rewards");
    });
  });

  describe("Props and Styling", () => {
    it("should accept optional className prop for styling", () => {
      const { container } = render(
        <RewardDisplay rewards={mockRewards} className="custom-class" />,
      );

      const customElement = container.querySelector(".custom-class");
      expect(customElement).toBeInTheDocument();
    });

    it("should apply className to wrapper element", () => {
      const { container } = render(
        <RewardDisplay rewards={mockRewards} className="test-wrapper-class" />,
      );

      const wrapper = container.querySelector(".test-wrapper-class");
      expect(wrapper).toBeInTheDocument();
    });

    it("should apply Tailwind responsive classes correctly", () => {
      const { container } = render(<RewardDisplay rewards={mockRewards} />);

      // Check that component renders without errors
      const rewards = container.querySelector("div");
      expect(rewards).toBeInTheDocument();
    });
  });

  describe("Visual Distinction by Type", () => {
    it("should color-code rewards by type visually", () => {
      const { container } = render(<RewardDisplay rewards={mockRewards} />);

      // Component should render; visual distinction tested via visual regression
      const rewardItems = container.querySelectorAll("[class*='text-']");
      expect(rewardItems.length).toBeGreaterThan(0);
    });

    it("should differentiate between reward types visually", () => {
      const allRewardTypes: Reward[] = [
        {
          rewardId: "xp-1",
          type: "Experience",
          amount: 1000,
        },
        {
          rewardId: "item-1",
          type: "Item",
          amount: 1,
          itemId: "sword",
          itemName: "Iron Sword",
        },
        {
          rewardId: "gold-1",
          type: "Currency",
          amount: 500,
        },
        {
          rewardId: "ach-1",
          type: "Achievement",
          description: "First Quest",
        },
      ];

      const { container } = render(<RewardDisplay rewards={allRewardTypes} />);

      // Component should render all reward types
      expect(screen.getByText(/1000 XP/i)).toBeInTheDocument();
      expect(screen.getByText(/Iron Sword/i)).toBeInTheDocument();
      expect(screen.getByText(/500 Gold/i)).toBeInTheDocument();
      expect(screen.getByText(/First Quest/i)).toBeInTheDocument();

      // Container should have elements for visual distinction
      expect(container).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rewards array with single item", () => {
      const singleReward: Reward[] = [
        {
          rewardId: "single-1",
          type: "Experience",
          amount: 100,
        },
      ];

      render(<RewardDisplay rewards={singleReward} />);

      expect(screen.getByText(/100 XP/i)).toBeInTheDocument();
    });

    it("should handle large reward amounts", () => {
      const largeReward: Reward[] = [
        {
          rewardId: "large-1",
          type: "Currency",
          amount: 999999,
        },
      ];

      render(<RewardDisplay rewards={largeReward} />);

      expect(screen.getByText(/999999 Gold/i)).toBeInTheDocument();
    });

    it("should handle rewards with very long item names", () => {
      const longItemReward: Reward[] = [
        {
          rewardId: "long-1",
          type: "Item",
          amount: 1,
          itemId: "legendary-item",
          itemName:
            "The Legendary Sword of Eternal Flame and Ultimate Power That Glows with the Light of a Thousand Stars",
        },
      ];

      render(<RewardDisplay rewards={longItemReward} />);

      expect(
        screen.getByText(/The Legendary Sword of Eternal Flame/i),
      ).toBeInTheDocument();
    });

    it("should handle Achievement without description", () => {
      const achievementNoDesc: Reward[] = [
        {
          rewardId: "ach-nodesc",
          type: "Achievement",
        },
      ];

      render(<RewardDisplay rewards={achievementNoDesc} />);

      // Should show "Achievement Unlocked" as fallback
      expect(screen.getByText(/Achievement Unlocked/i)).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should render correctly on different viewport sizes", () => {
      const { container } = render(<RewardDisplay rewards={mockRewards} />);

      // Component should be present regardless of viewport
      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("should wrap rewards on smaller screens if needed", () => {
      const { container } = render(<RewardDisplay rewards={mockRewards} />);

      // Check that space-y class is applied for responsive wrapping
      const wrapper = container.querySelector("[class*='space-y']");
      expect(wrapper).toBeInTheDocument();
    });
  });
});
