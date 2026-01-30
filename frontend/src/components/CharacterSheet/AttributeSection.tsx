import React from "react";
import { formatModifier } from "@/services/attributeCalculator";
import type { Attributes, AttributeKey } from "@/types/character";

interface AttributeSectionProps {
  /** Character attributes (3-18 values) */
  attributes: Attributes;
  /** Calculated modifiers */
  modifiers: Attributes;
  /** Optional className for custom styling */
  className?: string;
}

const ATTRIBUTE_INFO: Record<
  AttributeKey,
  { name: string; description: string }
> = {
  str: { name: "Strength", description: "Physical power and melee attacks" },
  dex: {
    name: "Dexterity",
    description: "Agility, reflexes, and ranged attacks",
  },
  int: {
    name: "Intelligence",
    description: "Reasoning, memory, and spellcasting",
  },
  con: { name: "Constitution", description: "Health, stamina, and endurance" },
  cha: { name: "Charisma", description: "Force of personality and leadership" },
};

/**
 * AttributeSection - Display character attributes with modifiers
 * T045: AttributeSection component for CharacterSheet
 *
 * Features:
 * - Displays all 5 D&D attributes (STR, DEX, INT, CON, CHA)
 * - Shows base value and calculated modifier
 * - Color-coded modifiers (green positive, red negative, gray zero)
 * - Responsive grid layout
 * - Tooltip descriptions (optional)
 * - Semantic HTML for accessibility
 */
export const AttributeSection: React.FC<AttributeSectionProps> = ({
  attributes,
  modifiers,
  className = "",
}) => {
  return (
    <section
      className={`attribute-section ${className}`}
      aria-label="Character Attributes"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.keys(ATTRIBUTE_INFO) as AttributeKey[]).map((attr) => (
          <AttributeCard
            key={attr}
            attribute={attr}
            value={attributes[attr]}
            modifier={modifiers[attr]}
            name={ATTRIBUTE_INFO[attr].name}
            description={ATTRIBUTE_INFO[attr].description}
          />
        ))}
      </div>
    </section>
  );
};

interface AttributeCardProps {
  attribute: AttributeKey;
  value: number;
  modifier: number;
  name: string;
  description: string;
}

/**
 * Individual attribute card display
 */
const AttributeCard: React.FC<AttributeCardProps> = ({
  attribute,
  value,
  modifier,
  name,

  description,
}) => {
  const modifierColor =
    modifier > 0
      ? "text-green-700 bg-green-100 border-green-300"
      : modifier < 0
        ? "text-red-700 bg-red-100 border-red-300"
        : "text-gray-700 bg-gray-100 border-gray-300";

  return (
    <div
      className="attribute-card flex flex-col bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors"
      role="group"
      aria-label={`${name} attribute`}
    >
      {/* Attribute abbreviation and name */}
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {attribute.toUpperCase()}
        </h3>
        <p className="text-sm text-gray-600">{name}</p>
      </div>

      {/* Value and modifier */}
      <div className="flex items-baseline gap-3 mb-2">
        <span
          className="text-4xl font-bold text-gray-900"
          aria-label={`${name} score`}
        >
          {value}
        </span>
        <span
          className={`text-xl font-bold px-3 py-1 rounded-md border-2 ${modifierColor}`}
          aria-label={`${name} modifier`}
        >
          {formatModifier(modifier)}
        </span>
      </div>

      {/* Description (hidden on small screens, visible tooltip on hover) */}
      <p
        className="text-xs text-gray-500 mt-auto hidden md:block"
        title={description}
      >
        {description}
      </p>
    </div>
  );
};
