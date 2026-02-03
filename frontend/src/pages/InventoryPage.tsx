/**
 * Inventory Page
 *
 * Standalone inventory management page for an adventure.
 * Displays the full inventory interface with all features.
 *
 * Route: /game/:adventureId/inventory
 *
 * @module pages/InventoryPage
 */

import { useParams, useNavigate } from "react-router-dom";
import { InventoryContainer } from "@/components/InventoryUI";

/**
 * InventoryPage component - Full-screen inventory interface
 *
 * Features:
 * - Full inventory display (grid/list views)
 * - Item selection and details
 * - Filter and sort controls (Phase 10)
 * - Equipment management (Phase 5+)
 * - Navigation back to game
 *
 * @example Route
 * /game/adventure-123/inventory
 */
export default function InventoryPage() {
  const { adventureId } = useParams<{ adventureId: string }>();
  const navigate = useNavigate();

  // Validate adventureId
  if (!adventureId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Invalid</h1>
          <p className="text-gray-600 mb-4">No adventure ID provided</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventory Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your adventure inventory and equipment
            </p>
          </div>
          <button
            onClick={() => navigate(`/game/${adventureId}`)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition font-medium"
          >
            ← Back to Game
          </button>
        </div>
      </header>

      {/* Main Content - Inventory Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto overflow-hidden">
        <InventoryContainer
          adventureId={adventureId}
          onItemSelected={(entry: any) => {
            console.log("Item selected:", entry);
            // Future: Open detail modal or side panel
          }}
        />
      </main>

      {/* Footer with help text */}
      <footer className="bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-gray-500 text-center">
            Use the view toggle to switch between grid and list views. Click
            items for details.
          </p>
        </div>
      </footer>
    </div>
  );
}
