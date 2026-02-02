import React from "react";

/**
 * SceneDescription component displays the current scene title and description.
 * Provides context for the player's current location or situation.
 *
 * @component
 * @example
 * <SceneDescription
 *   title="Dark Cavern Entrance"
 *   description="You stand at the mouth of a dark cavern. Cold air emanates from within..."
 * />
 */
interface SceneDescriptionProps {
  /** Scene title */
  title: string;

  /** Scene description text */
  description: string;
}

export const SceneDescription: React.FC<SceneDescriptionProps> = ({
  title,
  description,
}) => {
  return (
    <div className="p-6 bg-gray-800">
      <h1 className="text-2xl font-bold text-amber-400 mb-3">{title}</h1>
      <p className="text-white leading-relaxed whitespace-pre-wrap">
        {description}
      </p>
    </div>
  );
};
