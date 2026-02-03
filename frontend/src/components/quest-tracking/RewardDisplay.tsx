/**
 * RewardDisplay Component
 *
 * Displays quest rewards with clear type labels, amounts, and visual distinction.
 * Supports different reward types: Experience, Item, Currency, Achievement.
 *
 * @component
 * @example
 * ```tsx
 * <RewardDisplay rewards={rewardsData} />
 * ```
 *
 * **Accessibility**: Each reward type is clearly labeled with descriptive text.
 * Icons have aria-labels for screen reader users.
 */

import React from "react";
import type { Reward } from "@/types/quest";

export interface RewardDisplayProps {
  /** Array of rewards to display */
  rewards?: Reward[];
  /** Optional CSS class for styling */
  className?: string;
}

/**
 * Get icon component and color for reward type
 */
const getRewardIcon = (
  type: Reward["type"],
): { icon: React.ReactNode; color: string; label: string } => {
  switch (type) {
    case "Experience":
      return {
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        ),
        color: "text-yellow-600 dark:text-yellow-400",
        label: "Experience Points",
      };

    case "Item":
      return {
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
            <path d="M16 16H6v2h10v-2zM6.5 20a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm10 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
        ),
        color: "text-blue-600 dark:text-blue-400",
        label: "Item",
      };

    case "Currency":
      return {
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.16 5a.75.75 0 00-.712.513l-.5 1.5A2.5 2.5 0 006 9.5c0 .273.057.533.159.788l-.312.936A.75.75 0 006 12h.75a.75.75 0 00.712-.513l.5-1.5A2.5 2.5 0 0010 10.5c-.273 0-.533-.057-.788-.159l.312-.936A.75.75 0 0010 9H9.25a.75.75 0 00-.712.513l-.5 1.5A2.5 2.5 0 006 9.5c0 .273.057.533.159.788l-.312.936A.75.75 0 006 12h.75a.75.75 0 00.712-.513l.5-1.5A2.5 2.5 0 0010 10.5z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.5 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
              clipRule="evenodd"
            />
          </svg>
        ),
        color: "text-green-600 dark:text-green-400",
        label: "Gold",
      };

    case "Achievement":
      return {
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3.196 12.87l-.825.412a.5.5 0 00-.019.857l.006.003.13.065a8 8 0 1010.747-10.747l-.065-.13a.5.5 0 00-.857.02l-.412.824a6.5 6.5 0 11-8.718 8.718z" />
            <path d="M8.354 2.146a.5.5 0 00-.707 0l-2 2a.5.5 0 11-.707-.707L7.293 1l-2.353-2.353a.5.5 0 11.707-.707l2.353 2.353 2.353-2.353a.5.5 0 01.707.707z" />
          </svg>
        ),
        color: "text-purple-600 dark:text-purple-400",
        label: "Achievement",
      };

    default:
      return {
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        ),
        color: "text-gray-600 dark:text-gray-400",
        label: "Reward",
      };
  }
};

/**
 * Formats reward amount with proper label
 */
const formatRewardAmount = (reward: Reward): string => {
  switch (reward.type) {
    case "Item":
      return reward.itemName || `Item (${reward.amount})`;
    case "Experience":
      return `${reward.amount} XP`;
    case "Currency":
      return `${reward.amount} Gold`;
    case "Achievement":
      return reward.description || "Achievement Unlocked";
    default:
      return `${reward.amount}`;
  }
};

/**
 * RewardDisplay component - displays quest rewards with visual distinction
 */
const RewardDisplay: React.FC<RewardDisplayProps> = React.memo(
  ({ rewards, className = "" }) => {
    // Show empty state if no rewards
    if (!rewards || rewards.length === 0) {
      return (
        <div
          className={`rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-4 text-center ${className}`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No rewards for this quest
          </p>
        </div>
      );
    }

    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>Rewards</span>
          <span className="text-lg">🏆</span>
        </h3>
        <div className="space-y-2">
          {rewards.map((reward) => {
            const { icon, color, label } = getRewardIcon(reward.type);
            const formattedAmount = formatRewardAmount(reward);

            return (
              <div
                key={reward.rewardId}
                className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 border border-gray-200 dark:border-gray-600 transition-all hover:shadow-md dark:hover:shadow-lg"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 ${color}`} aria-label={label}>
                  {icon}
                </div>

                {/* Reward Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {formattedAmount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

RewardDisplay.displayName = "RewardDisplay";

export default RewardDisplay;
