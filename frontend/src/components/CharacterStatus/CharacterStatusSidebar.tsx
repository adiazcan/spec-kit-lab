import React from "react";
import type { CharacterStatus } from "../../types/character";
import { HealthDisplay } from "./HealthDisplay";
import { ConditionsList } from "./ConditionsList";
import { EquipmentList } from "./EquipmentList";

/**
 * CharacterStatusSidebar component is the main character status panel.
 * Displays health, conditions, and equipment in a vertical sidebar layout.
 *
 * Sections (top to bottom):
 * 1. Health Display - HP bar and current/max values
 * 2. Conditions List - Active status effects (buffs/debuffs)
 * 3. Equipment List - Equipped items with stat impacts
 *
 * @component
 */
interface CharacterStatusSidebarProps {
  /** Character status data */
  character: CharacterStatus;
}

export const CharacterStatusSidebar: React.FC<CharacterStatusSidebarProps> = ({
  character,
}) => {
  return (
    <div className="flex flex-col h-full divide-y divide-gray-700">
      {/* Health Section */}
      <HealthDisplay
        currentHp={character.currentHp}
        maxHp={character.maxHp}
        name={character.name}
      />

      {/* Conditions Section */}
      <ConditionsList conditions={character.conditions} />

      {/* Equipment Section */}
      <EquipmentList equipment={character.equipment} />

      {/* Attributes (if available) - Read-only display */}
      {character.attributes && (
        <div className="bg-gray-900 p-4 flex-1">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            ATTRIBUTES
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: "STR", value: character.attributes.strength },
              { label: "DEX", value: character.attributes.dexterity },
              { label: "CON", value: character.attributes.constitution },
              { label: "INT", value: character.attributes.intelligence },
              { label: "WIS", value: character.attributes.wisdom },
              { label: "CHA", value: character.attributes.charisma },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800 p-2 rounded text-center">
                <div className="text-gray-400 font-semibold">{label}</div>
                <div className="text-white text-lg font-bold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
