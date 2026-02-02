import React from "react";
import { formatModifier } from "@/services/attributeCalculator";

interface ModifierDisplayProps {
  /** Attribute name */
  attribute: string;
  /** Calculated modifier value */
  modifier: number;
  /** Optional size variant */
  size?: "small" | "medium" | "large";
  /** Optional className override */
  className?: string;
}

/**
 * Display badge for calculated attribute modifiers
 * T038: ModifierDisplay component
 *
 * Features:
 * - Color-coded display (green positive, red negative, gray zero)
 * - Multiple size variants
 * - 4.5:1 contrast ratio (WCAG AA compliant)
 * - Semantic HTML with aria-label
 */
export const ModifierDisplay: React.FC<ModifierDisplayProps> = ({
  attribute,
  modifier,
  size = "medium",
  className = "",
}) => {
  const sizeClasses = {
    small: "px-2 py-1 text-sm",
    medium: "px-3 py-2 text-base",
    large: "px-4 py-3 text-lg",
  };

  const colorClasses =
    modifier > 0
      ? "bg-green-100 text-green-800 border-green-300"
      : modifier < 0
        ? "bg-red-100 text-red-800 border-red-300"
        : "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <div
      className={`inline-flex items-center justify-center font-bold rounded-md border ${sizeClasses[size]} ${colorClasses} ${className}`}
      role="status"
      aria-label={`${attribute} modifier: ${formatModifier(modifier)}`}
    >
      {formatModifier(modifier)}
    </div>
  );
};
