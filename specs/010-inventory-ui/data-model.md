# Phase 1 Design: Frontend Data Model

**Date**: 2026-02-02  
**Purpose**: Define React component types, hooks, and state structures for Inventory UI  
**Backend Contract**: Extends 004-inventory-system OpenAPI types

---

## Frontend State Model

### InventoryState

Represents the complete inventory display state managed by the `InventoryContainer` component.

```typescript
interface InventoryState {
  // View mode preference
  viewMode: "grid" | "list";

  // Pagination
  limit: number; // Default 50, from backend
  offset: number;

  // Filter and sort
  activeFilters: InventoryFilters;
  activeSorts: SortOption[];
  searchText?: string;

  // Selected item for detail view
  selectedItemId?: string;

  // UI state
  isLoading: boolean;
  error?: Error;
}

interface InventoryFilters {
  itemType?: string; // 'Stackable', 'Unique', 'Armor', 'Weapon', etc.
  rarity?: ItemRarity;
  slotCompatibility?: SlotType;
  includeEquipped?: boolean;
}

interface SortOption {
  field: "name" | "rarity" | "type" | "quantity" | "dateAdded";
  order: "asc" | "desc";
}
```

### EquipmentState

Represents the character's equipment display state.

```typescript
interface EquipmentState {
  // Current equipped items by slot
  equippedItems: Record<SlotType, EquippedItem | null>;

  // Selected slot for detail/interaction
  selectedSlotType?: SlotType;

  // Stat summary from all equipped items
  totalStatModifiers: StatModifierSummary;

  // UI state
  isLoading: boolean;
  error?: Error;
}

interface EquippedItem {
  itemId: string;
  item: UniqueItem; // From backend Item type
  equippedAt: Date;
}

interface StatModifierSummary {
  [statName: string]: number; // e.g., { "Attack": 5, "Defense": 3 }
}
```

### DragDropState

Represents active drag-and-drop operation state.

```typescript
interface DragDropState {
  isDragging: boolean;
  draggedItemId?: string; // Inventory item being dragged
  dragSource: "inventory" | "equipment";
  validDropZones: Set<string>; // Slot IDs or inventory areas
  hoverSlotId?: string; // Currently hovering over slot
}
```

---

## Component Type Definitions

### InventoryUI Component Hierarchy

```
<InventoryContainer> (Main container, manages InventoryState)
  ├─ <InventoryHeader>
  │  ├─ <ViewModeToggle> (Grid/List switcher)
  │  ├─ <SortMenu> (Sort dropdown)
  │  └─ <FilterMenu> (Filter dropdown)
  ├─ <InventoryGrid> OR <InventoryList> (Based on viewMode)
  │  └─ <InventoryItem> (Repeating, contains drag logic + tooltip)
  │     ├─ <ItemIcon>
  │     ├─ <StackQuantityBadge>
  │     ├─ <RarityIndicator>
  │     └─ <ItemTooltip> (On hover)
  ├─ <ItemDetailModal> (Conditional render)
  │  └─ <ItemDetailContent>
  │     ├─ <ItemStatsList>
  │     ├─ <ItemEffectsList>
  │     ├─ <EquipmentSlotInfo> (If equippable)
  │     ├─ <RequirementsList> (If has requirements)
  │     └─ <ActionButtons> (Equip, Use, Drop, etc.)
  └─ <InventoryStats> (Summary: total items, slots used, etc.)

<Equipment Container> (Manages EquipmentState)
  └─ <EquipmentSlots> (7 slots grid)
     └─ <EquipmentSlot> × 7 (Head, Chest, Hands, Legs, Feet, Main Hand, Off Hand)
        ├─ <SlotIcon> (Empty state icon)
        ├─ <EquippedItemDisplay> (If equipped)
        ├─ <EquipmentDropZone> (Drop target)
        └─ <UnequipButton> (Accessibility alternative)
```

### Component Props

```typescript
// Main inventory container
interface InventoryContainerProps {
  adventureId: string;
  onItemSelected?: (item: InventoryEntry) => void;
  onEquipmentChanged?: (equippedItems: Record<SlotType, EquippedItem>) => void;
}

// Grid view
interface InventoryGridProps {
  items: InventoryEntry[];
  selectedItemId?: string;
  onItemClick: (itemId: string) => void;
  isLoading: boolean;
}

// List view
interface InventoryListProps {
  items: InventoryEntry[];
  selectedItemId?: string;
  onItemClick: (itemId: string) => void;
  isLoading: boolean;
}

// Individual item in inventory
interface InventoryItemProps {
  entry: InventoryEntry;
  isSelected: boolean;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  viewMode: "grid" | "list";
}

// Item detail modal
interface ItemDetailModalProps {
  item: InventoryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: "equip" | "use" | "drop", item: InventoryEntry) => void;
}

// Equipment slots display
interface EquipmentSlotsProps {
  equippedItems: Record<SlotType, EquippedItem | null>;
  onSlotClick: (slotType: SlotType) => void;
  onDropItem?: (itemId: string, slotType: SlotType) => void;
}

// Individual equipment slot
interface EquipmentSlotProps {
  slotType: SlotType;
  equippedItem: EquippedItem | null;
  onDrop: (itemId: string) => void;
  isDragOver: boolean;
}

// Item tooltip (hover)
interface ItemTooltipProps {
  item: Item;
  quantity?: number;
  position?: "top" | "bottom" | "left" | "right";
}
```

---

## Hook Definitions

### useInventory

Primary hook for inventory state management and API calls.

```typescript
interface UseInventoryReturn {
  // Data
  items: InventoryEntry[];
  filteredItems: InventoryEntry[];
  totalCount: number;

  // Pagination
  limit: number;
  offset: number;
  setLimit: (limit: number) => void;
  setOffset: (offset: number) => void;

  // View and filtering
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  filters: InventoryFilters;
  setFilters: (filters: InventoryFilters) => void;
  sorts: SortOption[];
  setSorts: (sorts: SortOption[]) => void;

  // Detail view
  selectedItemId?: string;
  setSelectedItemId: (id?: string) => void;

  // Mutations
  addItem: UseMutationResult<void, Error, { itemId: string; quantity: number }>;
  removeItem: UseMutationResult<void, Error, string>;

  // State
  isLoading: boolean;
  error: Error | null;
}

// Usage: const inventory = useInventory(adventureId);
```

### useEquipment

Hook for equipment slot management and mutations.

```typescript
interface UseEquipmentReturn {
  // Data
  equippedItems: Record<SlotType, EquippedItem | null>;
  statModifiers: StatModifierSummary;

  // Selected slot
  selectedSlot?: SlotType;
  setSelectedSlot: (slot?: SlotType) => void;

  // Mutations
  equipItem: UseMutationResult<
    void,
    Error,
    { itemId: string; slotType: SlotType }
  >;
  unequipItem: UseMutationResult<void, Error, SlotType>;
  swapItem: UseMutationResult<
    void,
    Error,
    { itemId: string; slotType: SlotType }
  >;

  // State
  isLoading: boolean;
  error: Error | null;
}

// Usage: const equipment = useEquipment(adventureId);
```

### useDragDrop

Hook for drag-and-drop state and handlers.

```typescript
interface UseDragDropReturn {
  // Drag state
  isDragging: boolean;
  draggedItemId?: string;
  dragSource: "inventory" | "equipment";

  // Valid drop zones
  validDropZones: Set<SlotType>;

  // Event handlers
  handleDragStart: (
    e: React.DragEvent,
    itemId: string,
    source: "inventory" | "equipment",
  ) => void;
  handleDragOver: (e: React.DragEvent, slotType?: SlotType) => void;
  handleDrop: (e: React.DragEvent, slotType: SlotType) => Promise<void>;
  handleDragEnd: (e: React.DragEvent) => void;

  // Reset state
  reset: () => void;
}

// Usage: const dragDrop = useDragDrop(inventory, equipment);
```

### useItemTooltip

Hook for managing tooltip state with delay.

```typescript
interface UseItemTooltipReturn {
  showTooltip: boolean;
  tooltipPosition: "top" | "bottom" | "left" | "right";
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseMove: (e: React.MouseEvent) => void;
}

// Usage: const tooltip = useItemTooltip(300 /* delay ms */);
```

---

## API Types (Auto-generated from Backend OpenAPI)

Generated via `npm run generate:api` from backend 004-inventory-system OpenAPI spec.

```typescript
// From backend spec: Item base entity
type Item = StackableItem | UniqueItem;

interface StackableItem {
  id: string;
  name: string;
  description?: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  itemType: "Stackable";
  maxStackSize: number;
}

interface UniqueItem {
  id: string;
  name: string;
  description?: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  itemType: "Unique";
  slotType?:
    | "Head"
    | "Chest"
    | "Hands"
    | "Legs"
    | "Feet"
    | "MainHand"
    | "OffHand";
  modifiers?: StatModifier[];
  level?: number;
  requirementsMet?: boolean;
}

interface StatModifier {
  statName: string;
  value: number;
}

// Inventory entry (backend response)
interface InventoryEntry {
  id: string;
  item: Item;
  quantity: number;
  addedAt: Date;
}

interface InventoryResponse {
  adventureId: string;
  entries: InventoryEntry[];
  totalEntries: number;
  limit: number;
  offset: number;
}

// Equipment slot types
type SlotType =
  | "Head"
  | "Chest"
  | "Hands"
  | "Legs"
  | "Feet"
  | "MainHand"
  | "OffHand";
type ItemRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
```

---

## Service Interfaces

### InventoryClient

REST client for inventory API calls (wraps auto-generated types).

```typescript
interface InventoryClient {
  // Queries
  getInventory(
    adventureId: string,
    limit?: number,
    offset?: number,
  ): Promise<InventoryResponse>;
  getItem(itemId: string): Promise<InventoryEntry>;

  // Mutations
  addItem(
    adventureId: string,
    itemId: string,
    quantity: number,
  ): Promise<InventoryEntry>;
  removeItem(adventureId: string, itemId: string): Promise<void>;
  useItem(
    adventureId: string,
    itemId: string,
  ): Promise<{ result: boolean; error?: string }>;
  dropItem(adventureId: string, itemId: string): Promise<void>;
}
```

### EquipmentClient

REST client for equipment API calls.

```typescript
interface EquipmentClient {
  // Queries
  getEquippedItems(
    adventureId: string,
  ): Promise<Record<SlotType, EquippedItem | null>>;

  // Mutations
  equipItem(
    adventureId: string,
    itemId: string,
    slotType: SlotType,
  ): Promise<void>;
  unequipItem(adventureId: string, slotType: SlotType): Promise<void>;
  swapItem(
    adventureId: string,
    itemId: string,
    slotType: SlotType,
  ): Promise<void>;
}
```

---

## Validation Rules for Frontend

```typescript
// Inventory-level rules
const inventoryValidation = {
  maxItemsPerView: 100,
  maxStackQuantity: 100,
  filterResponseTime: 200, // ms
  tooltipDelayMs: 300,
  dragDropFeedbackMs: 50,

  isValidQuantity: (q: number) => q > 0 && q <= 100,
  isValidSlot: (slot: string) =>
    ["Head", "Chest", "Hands", "Legs", "Feet", "MainHand", "OffHand"].includes(
      slot,
    ),
  isEquippable: (item: Item) => "slotType" in item && item.slotType != null,
  isStackable: (item: Item) => item.itemType === "Stackable",
};
```

---

## User Preferences (localStorage)

```typescript
interface UserInventoryPreferences {
  viewMode: "grid" | "list";
  sortOption?: SortOption;
  filters?: InventoryFilters;
  lastSelectedItemId?: string;
}

// Persistence helpers
const savePreferences = (prefs: UserInventoryPreferences) => {
  localStorage.setItem("inventory_preferences", JSON.stringify(prefs));
};

const loadPreferences = (): UserInventoryPreferences | null => {
  const stored = localStorage.getItem("inventory_preferences");
  return stored ? JSON.parse(stored) : null;
};
```
