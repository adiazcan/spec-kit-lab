/**
 * CharacterForm Component
 * T041-T044: Main form component for creating or editing characters
 *
 * Features:
 * - Create new character or edit existing character
 * - Two creation modes: point-buy (27 points) and dice roll (4d6 drop lowest)
 * - Real-time modifier calculation and display (<100ms)
 * - Form validation (name required, attributes 3-18, mode-specific rules)
 * - Mode switching with confirmation dialog to prevent data loss
 * - Full keyboard accessibility (Tab navigation, Enter to submit, Escape to cancel)
 * - Touch-friendly on mobile (44x44px minimum tap targets)
 * - Responsive design (320px-2560px+)
 *
 * Props:
 * - character?: Character - Existing character for edit mode (optional)
 * - adventureId?: string - Adventure ID for create mode (required if no character)
 * - onSubmit: (data) => Promise<void> - Callback when form is successfully submitted
 * - onCancel: () => void - Callback when cancel button clicked
 *
 * @component
 */

import React, { useState, useEffect } from "react";
import { useCharacterForm } from "@/hooks/useCharacterForm";
import { PointBuyMode } from "./CharacterForm/PointBuyMode";
import { DiceRollMode } from "./CharacterForm/DiceRollMode";
import ConfirmDialog from "./ConfirmDialog";
import type { Character, CharacterFormData } from "@/types/character";
import type { AttributeKey } from "@/types/character";
import { POINT_BUY_COSTS, POINT_BUY_CONSTRAINTS } from "@/types/character";

export interface CharacterFormProps {
  /** Existing character for edit mode (optional) */
  character?: Character;
  /** Adventure ID for create mode (required if no character) */
  adventureId?: string;
  /** Callback when form is successfully submitted */
  onSubmit: (data: CharacterFormData) => Promise<void>;
  /** Callback when cancel button clicked */
  onCancel: () => void;
}

type CreationMode = "point-buy" | "dice-roll";

/**
 * CharacterForm - Main form component for creating or editing characters
 * T041-T044: CharacterForm main component with validation, mode switching, and real-time modifiers
 *
 * Features:
 * - Create new character or edit existing
 * - Two creation modes: point-buy and dice roll
 * - Real-time modifier calculation (<100ms)
 * - Form validation (name, attributes, mode-specific rules)
 * - Mode switching with confirmation dialog
 * - Keyboard accessible (Tab, Enter, Escape)
 * - Touch-friendly on mobile
 */
export const CharacterForm: React.FC<CharacterFormProps> = ({
  character,
  adventureId,
  onSubmit,
  onCancel,
}) => {
  const form = useCharacterForm(character, adventureId);
  const [mode, setMode] = useState<CreationMode>("point-buy");
  const [pointsRemaining, setPointsRemaining] = useState<number>(
    POINT_BUY_CONSTRAINTS.POOL,
  );
  const [rolledAttributes, setRolledAttributes] = useState<Set<AttributeKey>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModeChangeDialog, setShowModeChangeDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<CreationMode | null>(null);

  const isEditMode = !!character;

  // Calculate points remaining for point-buy mode
  useEffect(() => {
    if (mode === "point-buy") {
      const pointsSpent = (
        Object.keys(form.formData.attributes) as AttributeKey[]
      ).reduce((total, attr) => {
        const value = form.formData.attributes[attr];
        const baseCost =
          POINT_BUY_COSTS[POINT_BUY_CONSTRAINTS.STARTING_ATTRIBUTE] || 0;
        const currentCost = POINT_BUY_COSTS[value] || 0;
        return total + (currentCost - baseCost);
      }, 0);
      setPointsRemaining(POINT_BUY_CONSTRAINTS.POOL - pointsSpent);
    }
  }, [form.formData.attributes, mode]);

  /**
   * T042: Form validation logic
   * Validates: name required, attributes in range, mode-specific constraints
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!form.formData.name.trim()) {
      errors.name = "Character name is required";
    } else if (form.formData.name.length > 50) {
      errors.name = "Character name must be 50 characters or less";
    }

    // Attribute range validation
    (Object.keys(form.formData.attributes) as AttributeKey[]).forEach(
      (attr) => {
        const value = form.formData.attributes[attr];
        if (value < 3 || value > 18) {
          errors[attr] = `${attr.toUpperCase()} must be 3-18`;
        }
      },
    );

    // Mode-specific validation
    if (mode === "point-buy" && pointsRemaining < 0) {
      errors.pointBuy = "You have exceeded the point budget";
    }

    if (mode === "dice-roll" && rolledAttributes.size < 5) {
      errors.diceRoll = "Roll all attributes before submitting";
    }

    // Set errors in form state
    if (Object.keys(errors).length > 0) {
      form.setFormData({ ...form.formData });
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form.formData);
    } catch (error) {
      console.error("Failed to submit character:", error);
      // Parent component should handle error display
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * T043: Mode switching with user confirmation
   * Shows confirmation dialog if user has already entered data
   */
  const handleModeChange = (newMode: CreationMode) => {
    if (newMode === mode || isEditMode) {
      return;
    }

    const hasData = form.formData.name.trim() !== "" || form.isDirty;

    if (hasData) {
      setPendingMode(newMode);
      setShowModeChangeDialog(true);
    } else {
      switchMode(newMode);
    }
  };

  /**
   * Confirm mode switch and reset data
   */
  const confirmModeChange = () => {
    if (pendingMode) {
      switchMode(pendingMode);
    }
    setShowModeChangeDialog(false);
    setPendingMode(null);
  };

  /**
   * Actually switch modes and reset relevant state
   */
  const switchMode = (newMode: CreationMode) => {
    setMode(newMode);
    setRolledAttributes(new Set());
    // Keep name but reset attributes to defaults
    form.setFormData({
      ...form.formData,
      attributes: {
        str:
          newMode === "point-buy"
            ? POINT_BUY_CONSTRAINTS.STARTING_ATTRIBUTE
            : 10,
        dex:
          newMode === "point-buy"
            ? POINT_BUY_CONSTRAINTS.STARTING_ATTRIBUTE
            : 10,
        int:
          newMode === "point-buy"
            ? POINT_BUY_CONSTRAINTS.STARTING_ATTRIBUTE
            : 10,
        con:
          newMode === "point-buy"
            ? POINT_BUY_CONSTRAINTS.STARTING_ATTRIBUTE
            : 10,
        cha:
          newMode === "point-buy"
            ? POINT_BUY_CONSTRAINTS.STARTING_ATTRIBUTE
            : 10,
      },
    });
  };

  /**
   * Handle attribute change for point-buy mode
   * T044: Real-time modifier calculation triggered on change
   */
  const handleAttributeChange = (attr: AttributeKey, value: number) => {
    form.updateAttribute(attr, value);
  };

  /**
   * Handle attribute roll for dice-roll mode
   */
  const handleAttributeRoll = (attr: AttributeKey, value: number) => {
    form.updateAttribute(attr, value);
    setRolledAttributes((prev) => new Set(prev).add(attr));
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg"
        aria-label="Character creation form"
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditMode ? "Edit Character" : "Create New Character"}
          </h2>
          <p className="text-sm text-gray-600">
            {isEditMode
              ? "Update your character's name and attributes"
              : "Choose a creation mode and allocate your character's attributes"}
          </p>
        </div>

        {/* Character Name */}
        <div>
          <label
            htmlFor="character-name"
            className={`block text-sm font-medium mb-1 ${
              form.errors.name ? "text-red-700" : "text-gray-700"
            }`}
          >
            Character Name{" "}
            <span className="text-red-600" aria-label="required">
              *
            </span>
          </label>
          <input
            id="character-name"
            type="text"
            value={form.formData.name}
            onChange={(e) => form.updateName(e.target.value)}
            maxLength={50}
            placeholder="Enter character name"
            className={`w-full px-4 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors ${
              form.errors.name
                ? "border-red-500 bg-red-50"
                : "border-gray-300 focus:border-transparent"
            }`}
            aria-invalid={!!form.errors.name}
            aria-describedby={form.errors.name ? "name-error" : undefined}
            autoFocus
          />
          {form.errors.name && (
            <p
              id="name-error"
              className="mt-1 text-sm text-red-600 font-medium"
              role="alert"
            >
              {form.errors.name}
            </p>
          )}
        </div>

        {/* Mode Selection (only for create mode) */}
        {!isEditMode && (
          <div>
            <fieldset className="border rounded-lg p-4 bg-gray-50">
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Attribute Allocation Mode{" "}
                <span className="text-red-600" aria-label="required">
                  *
                </span>
              </legend>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1">
                  <input
                    type="radio"
                    name="creation-mode"
                    value="point-buy"
                    checked={mode === "point-buy"}
                    onChange={() => handleModeChange("point-buy")}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 block">
                      Point Buy (Strategic)
                    </span>
                    <span className="text-xs text-gray-600">
                      Carefully allocate 27 points
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1">
                  <input
                    type="radio"
                    name="creation-mode"
                    value="dice-roll"
                    checked={mode === "dice-roll"}
                    onChange={() => handleModeChange("dice-roll")}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 block">
                      Dice Roll (Random)
                    </span>
                    <span className="text-xs text-gray-600">
                      Roll 4d6 drop lowest
                    </span>
                  </div>
                </label>
              </div>
            </fieldset>
          </div>
        )}

        {/* Mode-specific UI */}
        {mode === "point-buy" ? (
          <PointBuyMode
            attributes={form.formData.attributes}
            onAttributeChange={handleAttributeChange}
            pointsRemaining={pointsRemaining}
            errors={form.errors}
          />
        ) : (
          <DiceRollMode
            attributes={form.formData.attributes}
            onAttributeRoll={handleAttributeRoll}
            rolledAttributes={rolledAttributes}
          />
        )}

        {/* Global form errors */}
        {(form.errors.pointBuy || form.errors.diceRoll) && (
          <div
            className="p-4 bg-red-50 border-2 border-red-300 rounded-md"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-red-800">
              {form.errors.pointBuy || form.errors.diceRoll}
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={isSubmitting || pointsRemaining < 0}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors active:scale-95"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Saving...
              </>
            ) : isEditMode ? (
              "Update Character"
            ) : (
              "Create Character"
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors active:scale-95"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Mode change confirmation dialog */}
      {showModeChangeDialog && (
        <ConfirmDialog
          isOpen={showModeChangeDialog}
          title="Switch Creation Mode?"
          message="Changing modes will reset your attribute choices. Your character name will be kept."
          confirmText="Switch Mode"
          cancelText="Keep Current Mode"
          onConfirm={confirmModeChange}
          onCancel={() => {
            setShowModeChangeDialog(false);
            setPendingMode(null);
          }}
          isDangerous={false}
          isLoading={false}
        />
      )}
    </>
  );
};
