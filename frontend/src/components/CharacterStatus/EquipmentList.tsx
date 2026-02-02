import React from "react";
import type { EquippedItem } from "../../types/combat";

/**
 * EquipmentList component displays equipped items and their stat impacts.
 * Shows items organized by slot with associated bonuses/impacts.
 *
 * Equipment slots:
 * - mainHand: Weapon in main hand
 * - offHand: Weapon/shield in off hand
 * - armor: Body armor
 * - accessory: Rings, amulets, etc.
 *
 * @component
 */
interface EquipmentListProps {
  /** Array of equipped items */
  equipment: EquippedItem[];
}

const getSlotLabel = (
  slot: EquippedItem["slot"],
): { label: string; icon: string } => {
  switch (slot) {
    case "mainHand":
      return { label: "Main Hand", icon: "⚔️" };
    case "offHand":
      return { label: "Off Hand", icon: "🛡️" };
    case "armor":
      return { label: "Armor", icon: "🧥" };
    case "accessory":
      return { label: "Accessory", icon: "💍" };
    default:
      return { label: slot, icon: "📦" };
  }
};

export const EquipmentList: React.FC<EquipmentListProps> = ({ equipment }) => {
  if (equipment.length === 0) {
    return (
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">EQUIPMENT</h4>
        <p className="text-xs text-gray-500">No items equipped</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 border-b border-gray-700">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">EQUIPMENT</h4>
      <div className="space-y-2">
        {equipment.map((item) => {
          const { label, icon } = getSlotLabel(item.slot);
          return (
            <div
              key={`${item.slot}-${item.name}`}
              className="bg-gray-800 p-2 rounded text-xs"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-white">
                  {item.icon || icon} {item.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="text-amber-300 font-semibold">
                  {item.statImpact}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
