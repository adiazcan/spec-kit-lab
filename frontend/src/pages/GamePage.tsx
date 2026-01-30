import { useParams, useNavigate } from "react-router-dom";

/**
 * GamePage - Placeholder for game screen
 * This page will load the adventure and display the game interface
 */
export default function GamePage() {
  const { adventureId } = useParams<{ adventureId: string }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Game Screen (Placeholder)
        </h1>
        <p className="text-gray-600 mb-6">
          Loading adventure ID:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">{adventureId}</code>
        </p>
        <p className="text-gray-600 mb-6">
          This is a placeholder for the game screen. The actual game
          implementation is handled by a different feature.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-secondary"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
