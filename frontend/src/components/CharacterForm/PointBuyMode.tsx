/**
 * PointBuyMode Component
 * T039: Point-buy attribute allocation interface
 *
 * Features:
 * - Visual attribute allocation using 27-point budget (D&D 5E standard)
 * - Real-time point spending calculation and validation
 * - Prevents overspending: validates budget constraint
 * - Prevents out-of-range attributes (enforces 3-18 bounds)
 * - Points remaining indicator with visual feedback
 * - Attribute increment/decrement controls for each attribute
 * - Clear visual feedback on budget status (green/red)
 * - Responsive design for mobile to desktop
 * - Accessible error messages for validation failures
 *
 * Props:
 * - attributes: Attributes - Current attribute values
 * - onAttributeChange: (key, value) => void - Called when attribute changes
 * - pointsRemaining: number - Points left to allocate
 * - errors?: Record<string, string> - Validation errors by field
 *
 * @component
 */

import React from "react";
import { AttributeInput } from "./AttributeInput";
import type { Attributes } from "@/types/character";

interface PointBuyModeProps {
  /** Current attribute values */
  attributes: Attributes;
  /** Callback when an attribute changes */
  onAttributeChange: (attribute: keyof Attributes, value: number) => void;
  /** Points remaining in the budget */
  pointsRemaining: number;
  /** Validation errors per attribute */
  errors?: Record<string, string>;
}

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  str: "Strength",
  dex: "Dexterity",
  int: "Intelligence",
  con: "Constitution",
  cha: "Charisma",
};

/**
 * Point-buy character creation mode
 * T039: PointBuyMode component
 *
 * Features:
 * - 27-point budget with D&D 5E cost table
 * - Real-time point calculation
 * - Visual feedback on remaining points
 * - Attribute range validation (3-18)
 * - Budget exceeded warning
 */
export const PointBuyMode: React.FC<PointBuyModeProps> = ({
  attributes,
  onAttributeChange,
  pointsRemaining,
  errors = {},
}) => {
  const isOverBudget = pointsRemaining < 0;

  return (
    <div className="space-y-4">
      {/* Point budget display */}
      <div
        className={`p-4 rounded-lg border-2 ${isOverBudget ? "bg-red-50 border-red-300" : "bg-blue-50 border-blue-300"}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Point-Buy Budget
          </span>
          <span
            className={`text-2xl font-bold ${isOverBudget ? "text-red-700" : "text-blue-700"}`}
          >
            {pointsRemaining} / 27
          </span>
        </div>
        {isOverBudget && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            You have exceeded the point budget. Reduce some attributes to
            continue.
          </p>
        )}
        {pointsRemaining > 0 && !isOverBudget && (
          <p className="mt-2 text-sm text-gray-600">
            You have {pointsRemaining} point{pointsRemaining !== 1 ? "s" : ""}{" "}
            remaining to allocate.
          </p>
        )}
      </div>

      {/* Information box */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-sm text-gray-700">
          <strong>Point-Buy Rules:</strong> All attributes start at 8 (free).
          Increasing costs points based on the D&D 5E cost table. Higher values
          cost more points.
        </p>
      </div>

      {/* Attribute inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(ATTRIBUTE_LABELS) as Array<keyof Attributes>).map(
          (attr) => (
            <AttributeInput
              key={attr}
              attribute={attr}
              label={ATTRIBUTE_LABELS[attr]}
              value={attributes[attr]}
              onChange={(value) => onAttributeChange(attr, value)}
              error={errors[attr]}
            />
          ),
        )}
      </div>

      {/* Cost reference table */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          Show Point Cost Table
        </summary>
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1 px-2 text-left">Score</th>
                <th className="py-1 px-2 text-right">Cost (from 8)</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr>
                <td className="py-1 px-2">8</td>
                <td className="py-1 px-2 text-right">0</td>
              </tr>
              <tr>
                <td className="py-1 px-2">9</td>
                <td className="py-1 px-2 text-right">1</td>
              </tr>
              <tr>
                <td className="py-1 px-2">10</td>
                <td className="py-1 px-2 text-right">2</td>
              </tr>
              <tr>
                <td className="py-1 px-2">11</td>
                <td className="py-1 px-2 text-right">3</td>
              </tr>
              <tr>
                <td className="py-1 px-2">12</td>
                <td className="py-1 px-2 text-right">4</td>
              </tr>
              <tr>
                <td className="py-1 px-2">13</td>
                <td className="py-1 px-2 text-right">5</td>
              </tr>
              <tr>
                <td className="py-1 px-2">14</td>
                <td className="py-1 px-2 text-right">7</td>
              </tr>
              <tr>
                <td className="py-1 px-2">15</td>
                <td className="py-1 px-2 text-right">9</td>
              </tr>
              <tr>
                <td className="py-1 px-2">16</td>
                <td className="py-1 px-2 text-right">12</td>
              </tr>
              <tr>
                <td className="py-1 px-2">17</td>
                <td className="py-1 px-2 text-right">15</td>
              </tr>
              <tr>
                <td className="py-1 px-2">18</td>
                <td className="py-1 px-2 text-right">19</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
