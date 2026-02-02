/**
 * AttributeInput Component
 * T037: Single attribute input field with real-time modifier display
 *
 * Features:
 * - Numeric input (3-18 range) with increment/decrement buttons
 * - Real-time modifier calculation and display (<100ms)
 * - Input validation with error message display
 * - Disabled state support for read-only modes
 * - Keyboard accessible (arrow keys adjust values, tab navigation)
 * - Touch-friendly buttons (44x44px minimum)
 * - Clear ARIA labels for screen readers
 * - Shows calculated D&D 5E modifier alongside value
 *
 * Props:
 * - attribute: string - Attribute key (str, dex, int, con, cha)
 * - label: string - Full attribute name (Strength, Dexterity, etc.)
 * - value: number - Current attribute value (3-18)
 * - onChange: (value) => void - Called when value changes
 * - error?: string - Validation error message to display
 * - disabled?: boolean - Whether input is disabled
 *
 * @component
 */

import React from "react";
import {
  formatModifier,
  calculateModifier,
} from "@/services/attributeCalculator";

interface AttributeInputProps {
  /** Attribute key (str, dex, int, con, cha) */
  attribute: string;
  /** Full attribute name (Strength, Dexterity, etc.) */
  label: string;
  /** Current attribute value (3-18) */
  value: number;
  /** onChange handler */
  onChange: (value: number) => void;
  /** Validation error message */
  error?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * Individual attribute input field with real-time modifier display
 * T037: AttributeInput component
 *
 * Features:
 * - Numeric input with increment/decrement buttons
 * - Real-time modifier calculation and display
 * - Validation feedback
 * - Keyboard accessible (arrow keys, tab navigation)
 * - Touch-friendly buttons (44x44px minimum)
 */
export const AttributeInput: React.FC<AttributeInputProps> = React.memo(
  ({ attribute, label, value, onChange, error, disabled = false }) => {
    const modifier = calculateModifier(value);
    const inputId = `attribute-${attribute}`;
    const errorId = `${inputId}-error`;

    const handleIncrement = () => {
      if (value < 18) {
        onChange(value + 1);
      }
    };

    const handleDecrement = () => {
      if (value > 3) {
        onChange(value - 1);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue)) {
        onChange(Math.max(3, Math.min(18, newValue)));
      }
    };

    return (
      <div className="attribute-input-container">
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-2 ${
            error ? "text-red-700" : "text-gray-700"
          }`}
        >
          {attribute.toUpperCase()} ({label})
        </label>

        <div className="flex items-center gap-2">
          {/* Decrement button */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || value <= 3}
            className="w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            aria-label={`Decrease ${label}`}
          >
            <span className="text-lg font-bold">&minus;</span>
          </button>

          {/* Numeric input */}
          <input
            id={inputId}
            type="number"
            min="3"
            max="18"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`flex-1 px-3 py-2 border rounded-md text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? "border-red-500" : "border-gray-300"
            } ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />

          {/* Increment button */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || value >= 18}
            className="w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            aria-label={`Increase ${label}`}
          >
            <span className="text-lg font-bold">+</span>
          </button>

          {/* Modifier display */}
          <div
            className={`min-w-16 px-3 py-2 rounded-md text-center font-bold text-lg ${
              modifier > 0
                ? "bg-green-100 text-green-800"
                : modifier < 0
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
            aria-label={`${label} modifier`}
          >
            {formatModifier(modifier)}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
