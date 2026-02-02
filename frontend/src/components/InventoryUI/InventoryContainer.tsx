/**
 * InventoryContainer Component
 *
 * Main container component for the inventory UI system.
 * Manages state, data fetching, view modes, and item selection.
 * Integrates all inventory subcomponents into a cohesive interface.
 * Includes equipment panel alongside inventory management.
 *
 * @module components/InventoryUI/InventoryContainer
 */

import React, { useState, useCallback } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useEquipment } from "@/hooks/useEquipment";
import { useDragDrop } from "@/hooks/useDragDrop";
import { InventoryViewToggle } from "./InventoryViewToggle";
import { InventoryGrid } from "./InventoryGrid";
import { InventoryList } from "./InventoryList";
import { ItemDetailModal } from "@/components/ItemDetail";
import { EquipmentSlots } from "@/components/Equipment";

export interface InventoryContainerProps {
  /**
   * Adventure ID for which to load inventory
   */
  adventureId: string;

  /**
   * Optional callback when an item is selected
   */
  onItemSelected?: (entry: any) => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show equipment panel alongside inventory (default: true)
   */
  showEquipmentPanel?: boolean;

  /**
   * Layout mode for the container (default: "split")
   * "split": Side-by-side on desktop, stacked on mobile
   * "tabs": Tabbed interface between inventory and equipment
   * "inventory-only": Only show inventory
   */
  layoutMode?: "split" | "tabs" | "inventory-only";
}

/**
 * Main inventory container component
 *
 * Features:
 * - View mode toggle (grid/list) with persistence
 * - Real-time inventory data with React Query
 * - Equipment panel with all 7 slots
 * - Item selection and detail view
 * - Filter and sort controls (coming in Phase 10)
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <InventoryContainer
 *   adventureId="adventure-123"
 *   onItemSelected={(entry) => console.log('Selected:', entry)}
 *   showEquipmentPanel={true}
 * />
 * ```
 */
export const InventoryContainer: React.FC<InventoryContainerProps> = ({
  adventureId,
  onItemSelected,
  className = "",
  showEquipmentPanel = true,
  layoutMode = "split",
}) => {
  // Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "equipment">(
    "inventory",
  );

  const {
    filteredItems,
    totalCount,
    viewMode,
    setViewMode,
    selectedItemId,
    setSelectedItemId,
    isLoading: isLoadingInventory,
    error: inventoryError,
    useItem,
  } = useInventory(adventureId);

  const {
    equippedItems,
    selectedSlot,
    setSelectedSlot,
    equipItem,
    unequipItem,
    isLoading: isLoadingEquipment,
    error: equipmentError,
  } = useEquipment(adventureId);

  const selectedItem =
    filteredItems.find((e: any) => e.id === selectedItemId) || null;

  const dragDrop = useDragDrop();

  const handleItemClick = useCallback(
    (itemId: string) => {
      setSelectedItemId(itemId);

      // Find the full entry for callbacks
      const entry = filteredItems.find((e: any) => e.id === itemId);
      if (entry) {
        onItemSelected?.(entry);
        // Phase 4: Open modal on item click
        setIsDetailModalOpen(true);
      }
    },
    [filteredItems, setSelectedItemId, onItemSelected],
  );

  const handleDetailModalClose = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  const handleDetailModalAction = useCallback(
    (action: "equip" | "use" | "drop", item: any) => {
      if (action === "equip") {
        const slotType = item?.item?.slotType;
        if (slotType) {
          equipItem.mutate({ itemId: item.id, slotType });
        }
        return;
      }

      if (action === "use") {
        // Call useItem mutation with the entry ID
        useItem.mutate(item.id);
        return;
      }

      if (action === "drop") {
        console.log(`Drop item requested: ${item.item?.name ?? "Unknown"}`);
      }
    },
    [equipItem, useItem],
  );

  const handleUnequipSlot = useCallback(
    (slotType: string) => {
      unequipItem.mutate(slotType as any);
    },
    [unequipItem],
  );

  const handleDropToSlot = useCallback(
    (itemId: string, slotType: string) => {
      if (!dragDrop.canDropOnSlot(slotType as any)) {
        return;
      }
      equipItem.mutate({ itemId, slotType: slotType as any });
      dragDrop.reset();
    },
    [equipItem, dragDrop],
  );

  const handleItemDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, entry: any) => {
      dragDrop.handleDragStart(event, entry, "inventory");
    },
    [dragDrop],
  );

  const handleItemDragEnd = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      dragDrop.handleDragEnd(event);
    },
    [dragDrop],
  );

  const handleDragOverSlot = useCallback(
    (event: React.DragEvent<HTMLDivElement>, slotType: any) => {
      dragDrop.handleDragOver(event, slotType);
    },
    [dragDrop],
  );

  const handleDragLeaveSlot = useCallback(
    (event: React.DragEvent<HTMLDivElement>, slotType: any) => {
      dragDrop.handleDragLeave(event, slotType);
    },
    [dragDrop],
  );

  const handleEquipmentDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, slotType: string, item: any) => {
      dragDrop.handleDragStartFromEquipment(event, slotType as any, item);
    },
    [dragDrop],
  );

  const handleEquipmentDragEnd = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      dragDrop.handleDragEnd(event);
    },
    [dragDrop],
  );

  const handleInventoryDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      dragDrop.handleDragOverInventory(event);
    },
    [dragDrop],
  );

  const handleInventoryDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      dragDrop.handleDragLeaveInventory(event);
    },
    [dragDrop],
  );

  const handleInventoryDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      // Only allow drops from equipment
      if (dragDrop.dragSource !== "equipment") {
        dragDrop.reset();
        return;
      }

      // Get the slot type from the drag data
      try {
        const data = JSON.parse(event.dataTransfer.getData("application/json"));
        if (data.slotType && dragDrop.canDropOnInventory()) {
          unequipItem.mutate(data.slotType as any);
        }
      } catch {
        // Silently fail if no valid data
      }

      dragDrop.reset();
    },
    [dragDrop, unequipItem],
  );

  const isLoading = isLoadingInventory || isLoadingEquipment;
  const error = inventoryError || equipmentError;

  if (error) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Failed to load inventory
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {error?.message ||
              "An error occurred while loading your inventory."}
          </p>
        </div>
      </div>
    );
  }

  // Split layout (side-by-side on desktop, stacked on mobile)
  if (layoutMode === "split" && showEquipmentPanel) {
    return (
      <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
        {/* Header with controls */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Inventory & Equipment
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    <>
                      {filteredItems.length}{" "}
                      {filteredItems.length === 1 ? "item" : "items"}
                      {totalCount !== filteredItems.length && (
                        <span className="text-gray-400">
                          {" "}
                          (of {totalCount} total)
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* View mode toggle */}
                <InventoryViewToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {/* Future: Sort and filter menus go here (Phase 10) */}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area - split layout */}
        <main className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 p-4">
          {/* Inventory section */}
          <div
            className={`flex-1 min-w-0 bg-white rounded-lg shadow overflow-y-auto transition-all duration-200 ${
              dragDrop.isHoveringInventory &&
              dragDrop.dragSource === "equipment"
                ? "ring-2 ring-green-400 ring-offset-2"
                : ""
            }`}
            onDragOver={handleInventoryDragOver}
            onDragLeave={handleInventoryDragLeave}
            onDrop={handleInventoryDrop}
          >
            <div className="p-4">
              {viewMode === "grid" ? (
                <InventoryGrid
                  items={filteredItems}
                  selectedItemId={selectedItemId}
                  onItemClick={handleItemClick}
                  onItemDragStart={handleItemDragStart}
                  onItemDragEnd={handleItemDragEnd}
                  isLoading={isLoadingInventory}
                />
              ) : (
                <InventoryList
                  items={filteredItems}
                  selectedItemId={selectedItemId}
                  onItemClick={handleItemClick}
                  isLoading={isLoadingInventory}
                />
              )}

              {/* Drop zone hint for equipment items */}
              {dragDrop.isDragging &&
                dragDrop.dragSource === "equipment" &&
                dragDrop.isHoveringInventory && (
                  <div className="mt-4 rounded-lg border-2 border-dashed border-green-400 bg-green-50 py-8 px-4 text-center">
                    <div className="text-sm font-semibold text-green-700">
                      ✨ Drop here to unequip item
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Equipment section */}
          <div className="w-full lg:w-96 bg-white rounded-lg shadow overflow-y-auto">
            <div className="p-4">
              <EquipmentSlots
                equippedItems={equippedItems}
                onUnequip={handleUnequipSlot}
                onDrop={handleDropToSlot}
                onDragStart={handleEquipmentDragStart}
                onDragEnd={handleEquipmentDragEnd}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                isDragging={dragDrop.isDragging}
                draggedItemId={dragDrop.draggedItemId}
                hoverSlotType={dragDrop.hoverSlotType}
                validDropZones={dragDrop.validDropZones}
                onDragOverSlot={handleDragOverSlot}
                onDragLeaveSlot={handleDragLeaveSlot}
                isLoading={isLoadingEquipment}
                layout="compact"
              />
            </div>
          </div>
        </main>

        {/* Footer with stats */}
        <footer className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              {selectedItemId ? (
                <span className="font-medium text-blue-600">
                  Item selected - Details modal open
                </span>
              ) : (
                <span>Select an item to view details</span>
              )}
            </div>
            <div>
              View: <span className="font-medium capitalize">{viewMode}</span>
            </div>
          </div>
        </footer>

        {/* Item detail modal (Phase 4: US2) */}
        <ItemDetailModal
          item={selectedItem}
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          onAction={handleDetailModalAction}
        />
      </div>
    );
  }

  // Tabbed layout
  if (layoutMode === "tabs" && showEquipmentPanel) {
    return (
      <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
        {/* Header with controls */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4">
            <div className="flex items-center justify-between py-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory & Equipment
              </h1>
              <InventoryViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {/* Tabs */}
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setActiveTab("inventory")}
                className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                  activeTab === "inventory"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setActiveTab("equipment")}
                className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                  activeTab === "equipment"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Equipment
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "inventory" ? (
            <div className="p-4">
              {viewMode === "grid" ? (
                <InventoryGrid
                  items={filteredItems}
                  selectedItemId={selectedItemId}
                  onItemClick={handleItemClick}
                  onItemDragStart={handleItemDragStart}
                  onItemDragEnd={handleItemDragEnd}
                  isLoading={isLoadingInventory}
                />
              ) : (
                <InventoryList
                  items={filteredItems}
                  selectedItemId={selectedItemId}
                  onItemClick={handleItemClick}
                  isLoading={isLoadingInventory}
                />
              )}
            </div>
          ) : (
            <div className="p-4">
              <EquipmentSlots
                equippedItems={equippedItems}
                onUnequip={handleUnequipSlot}
                onDrop={handleDropToSlot}
                onDragStart={handleEquipmentDragStart}
                onDragEnd={handleEquipmentDragEnd}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                isDragging={dragDrop.isDragging}
                draggedItemId={dragDrop.draggedItemId}
                hoverSlotType={dragDrop.hoverSlotType}
                validDropZones={dragDrop.validDropZones}
                onDragOverSlot={handleDragOverSlot}
                onDragLeaveSlot={handleDragLeaveSlot}
                isLoading={isLoadingEquipment}
                layout="grid"
              />
            </div>
          )}
        </main>

        {/* Footer with stats */}
        <footer className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div>
              {selectedItemId ? (
                <span className="font-medium text-blue-600">
                  Item selected - Details modal open
                </span>
              ) : (
                <span>Select an item to view details</span>
              )}
            </div>
            <div>
              View: <span className="font-medium capitalize">{viewMode}</span>
            </div>
          </div>
        </footer>

        {/* Item detail modal (Phase 4: US2) */}
        <ItemDetailModal
          item={selectedItem}
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          onAction={handleDetailModalAction}
        />
      </div>
    );
  }

  // Inventory only layout (default/fallback)
  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header with controls */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-600 mt-1">
                {isLoading ? (
                  <span className="inline-flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  <>
                    {filteredItems.length}{" "}
                    {filteredItems.length === 1 ? "item" : "items"}
                    {totalCount !== filteredItems.length && (
                      <span className="text-gray-400">
                        {" "}
                        (of {totalCount} total)
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View mode toggle */}
              <InventoryViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {/* Future: Sort and filter menus go here (Phase 10) */}
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        {viewMode === "grid" ? (
          <InventoryGrid
            items={filteredItems}
            selectedItemId={selectedItemId}
            onItemClick={handleItemClick}
            onItemDragStart={handleItemDragStart}
            onItemDragEnd={handleItemDragEnd}
            isLoading={isLoadingInventory}
          />
        ) : (
          <InventoryList
            items={filteredItems}
            selectedItemId={selectedItemId}
            onItemClick={handleItemClick}
            isLoading={isLoadingInventory}
          />
        )}
      </main>

      {/* Footer with stats */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>
            {selectedItemId ? (
              <span className="font-medium text-blue-600">
                Item selected - Details modal open
              </span>
            ) : (
              <span>Select an item to view details</span>
            )}
          </div>
          <div>
            View: <span className="font-medium capitalize">{viewMode}</span>
          </div>
        </div>
      </footer>

      {/* Item detail modal (Phase 4: US2) */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        onAction={handleDetailModalAction}
      />
    </div>
  );
};
