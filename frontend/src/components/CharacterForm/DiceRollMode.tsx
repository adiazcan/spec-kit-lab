import React from "react";
import { useDiceRoll } from "@/hooks/useDiceRoll";
import { ModifierDisplay } from "./ModifierDisplay";
import { calculateModifier } from "@/services/attributeCalculator";
import type { Attributes } from "@/types/character";

interface DiceRollModeProps {
  /** Current attribute values */
  attributes: Attributes;
  /** Callback when an attribute is rolled */
  onAttributeRoll: (attribute: keyof Attributes, value: number) => void;
  /** Track which attributes have been rolled */
  rolledAttributes: Set<keyof Attributes>;
}

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  str: "Strength",
  dex: "Dexterity",
  int: "Intelligence",
  con: "Constitution",
  cha: "Charisma",
};

/**
 * Dice roll character creation mode (4d6 drop lowest)
 * T040: DiceRollMode component
 *
 * Features:
 * - 4d6 drop lowest mechanic (D&D 5E standard)
 * - Visual dice display with animation
 * - Re-roll capability per attribute
 * - Progress tracking (which attributes rolled)
 * - Exciting visual feedback
 */
export const DiceRollMode: React.FC<DiceRollModeProps> = ({
  attributes,
  onAttributeRoll,
  rolledAttributes,
}) => {
  const allAttributesRolled = rolledAttributes.size === 5;

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">
          Dice Roll Mode (4d6 Drop Lowest)
        </h3>
        <p className="text-sm text-blue-800">
          Click "Roll" for each attribute. Four 6-sided dice will be rolled, the
          lowest discarded, and the remaining three summed (range: 3-18).
        </p>
        {!allAttributesRolled && (
          <p className="mt-2 text-sm font-medium text-blue-900">
            Rolled {rolledAttributes.size} / 5 attributes
          </p>
        )}
        {allAttributesRolled && (
          <p className="mt-2 text-sm font-medium text-green-700">
            ✓ All attributes rolled! You can re-roll any attribute before
            submitting.
          </p>
        )}
      </div>

      {/* Attribute roll inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(ATTRIBUTE_LABELS) as Array<keyof Attributes>).map(
          (attr) => (
            <AttributeRollInput
              key={attr}
              attribute={attr}
              label={ATTRIBUTE_LABELS[attr]}
              value={attributes[attr]}
              isRolled={rolledAttributes.has(attr)}
              onRoll={onAttributeRoll}
            />
          ),
        )}
      </div>
    </div>
  );
};

interface AttributeRollInputProps {
  attribute: keyof Attributes;
  label: string;
  value: number;
  isRolled: boolean;
  onRoll: (attribute: keyof Attributes, value: number) => void;
}

/**
 * Individual attribute dice roller
 */
const AttributeRollInput: React.FC<AttributeRollInputProps> = ({
  attribute,
  label,
  value,
  isRolled,
  onRoll,
}) => {
  const { currentRoll, isRolling, rollAttribute } = useDiceRoll();
  const modifier = isRolled ? calculateModifier(value) : 0;

  const handleRoll = async () => {
    await rollAttribute(attribute);
    onRoll(attribute, currentRoll?.sum || 0);
  };

  return (
    <div className="p-4 border-2 border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            {attribute.toUpperCase()} ({label})
          </h4>
          {isRolled && (
            <span className="text-xs text-green-600 font-medium">✓ Rolled</span>
          )}
        </div>
        {isRolled && (
          <ModifierDisplay
            attribute={attribute}
            modifier={modifier}
            size="small"
          />
        )}
      </div>

      {/* Roll button or result */}
      {!isRolled ? (
        <button
          type="button"
          onClick={handleRoll}
          disabled={isRolling}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {isRolling ? "Rolling..." : "Roll 4d6"}
        </button>
      ) : (
        <div>
          {/* Dice display */}
          {currentRoll && (
            <div className="flex gap-2 mb-2">
              {currentRoll.dice.map((die: number, index: number) => (
                <div
                  key={index}
                  className={`flex-1 aspect-square flex items-center justify-center text-lg font-bold rounded-md border-2 ${
                    index === currentRoll.dropped
                      ? "bg-gray-100 text-gray-400 border-gray-300 line-through"
                      : "bg-white text-gray-900 border-gray-400"
                  }`}
                >
                  {die}
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span className="text-sm text-gray-600">Result:</span>
            <span className="text-2xl font-bold text-gray-900">{value}</span>
          </div>

          {/* Re-roll button */}
          <button
            type="button"
            onClick={handleRoll}
            disabled={isRolling}
            className="w-full mt-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors"
          >
            {isRolling ? "Rolling..." : "Re-roll"}
          </button>
        </div>
      )}
    </div>
  );
};
