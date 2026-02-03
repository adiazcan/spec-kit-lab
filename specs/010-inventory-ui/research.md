# Phase 0: Research Findings

**Date**: 2026-02-02  
**Feature**: Inventory Management Interface (010-inventory-ui)  
**Status**: All research questions resolved ✅

---

## 1. React Component Architecture & State Management

### Decision: Use React Hooks + React Query for state management

**Rationale**:

- Project already integrated with React Query (v5.90) for server state
- Inventory data is backend-driven (GET /inventory, PUT /equip, etc.)
- React Query provides:
  - Automatic caching and background sync
  - Built-in pagination support (spec mentions limit/offset)
  - Mutation handling for equip/unequip/use operations
  - Real-time sync when items update

**Alternatives Considered**:

- Redux: Over-engineered for server-driven state (too much boilerplate)
- Context API alone: No caching, re-fetching on every mount (poor performance)
- Zustand: Lighter weight but React Query already available and integrated

**Implementation Pattern**:

```typescript
// Custom hook using React Query
const useInventory = (adventureId: string) => {
  return useQuery({
    queryKey: ["inventory", adventureId],
    queryFn: () => inventoryClient.getInventory(adventureId),
  });
};

const useEquipItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params) => equipmentClient.equipItem(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
};
```

---

## 2. Grid vs List View Implementation

### Decision: Component-based toggle with view preference persistence

**Rationale**:

- Spec requirement FR-003: "MUST remember the player's last selected view mode"
- Two separate components (InventoryGrid.tsx, InventoryList.tsx) allow independent optimization
- Grid view uses CSS Grid layout ideal for icon-based display
- List view uses table-like structure for detailed information
- Toggle state managed in InventoryContainer parent component

**Implementation Strategy**:

- Use localStorage to persist user preference: `localStorage.setItem('inventoryView', mode)`
- Toggle button in header switches between Grid ↔ List
- Both views consume same data from useInventory hook
- CSS Grid for gallery/card layout; CSS Table or flex for list layout

**Tailwind CSS Approach**:

```typescript
// Grid layout
<div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
  {items.map(item => <InventoryItem key={item.id} item={item} />)}
</div>

// List layout
<table className="w-full">
  <thead>
    <tr><th>Name</th><th>Type</th><th>Qty</th><th>Rarity</th></tr>
  </thead>
  <tbody>
    {items.map(item => <ItemRow key={item.id} item={item} />)}
  </tbody>
</table>
```

---

## 3. Drag-and-Drop Implementation

### Decision: HTML5 Drag-and-Drop API with react-beautiful-dnd alternative available

**Rationale**:

- Spec requirement FR-017: "Dragging an inventory item onto an equipment slot MUST equip the item"
- HTML5 native API sufficient for desktop use cases (target is 1024px+ devices)
- Touch device support: Can add touch gesture handlers or use react-beautiful-dnd later
- React Beautiful DnD not in current dependencies → Keep native API to avoid new dependency
- Visual feedback achievable with CSS classes (highlight valid drop zones)

**Core Implementation Pattern**:

```typescript
// Inventory item draggable
<div
  draggable={true}
  onDragStart={(e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('itemId', item.id);
  }}
  className="cursor-grab active:cursor-grabbing"
>
  {/* item content */}
</div>

// Equipment slot drop target
<div
  onDragOver={(e) => {
    e.preventDefault(); // Allow drop
    setIsValidDropZone(isCompatible(item, slot));
  }}
  onDrop={(e) => {
    const itemId = e.dataTransfer.getData('itemId');
    equipItem({ itemId, slotType: slot.type });
  }}
  className={`drop-zone ${isValidDropZone ? 'bg-green-100' : 'opacity-50'}`}
>
  {/* slot content */}
</div>
```

**Accessibility Alternative**:

- Provide "Equip to Slot" buttons alongside drag-and-drop
- Users unable to drag have button fallback (FR-047: "Drag-and-drop MUST have button alternatives")

---

## 4. Item Detail Modal Implementation

### Decision: Modal component with Portal pattern + keyboard support

**Rationale**:

- Spec requirement FR-008: Item detail view opens on click with full information
- Modal ensures focus management and prevents accidental background interaction
- Portal prevents z-index stacking issues with existing UI
- Keyboard support (Esc to close) required for accessibility

**Implementation Pattern**:

```typescript
// Modal with Portal and focus lock
<Modal isOpen={selectedItem !== null} onClose={closeModal}>
  <FocusLock>
    <div role="dialog" aria-modal="true" aria-labelledby="item-name">
      <ItemDetailContent item={selectedItem} />
      <button onClick={closeModal}>Close (Esc)</button>
    </div>
  </FocusLock>
</Modal>

// Global click handler for Esc
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && selectedItem) closeModal();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedItem]);
```

**Backend Integration**:

- Item detail data comes from backend item definition (Item struct from 004 spec)
- No additional API call needed if full item data returned with inventory items
- Verify backend GET /inventory returns all needed fields: description, stats, effects, slotType

---

## 5. Equipment Slots Visualization

### Decision: 7-slot grid layout with slot-specific icons and empty state indicators

**Rationale**:

- Spec requirement FR-014 to FR-024: Implement 7 slots (head, chest, hands, legs, feet, main hand, off hand)
- 004-inventory backend defines SlotType enum with these 7 values
- Layout: 2x4 grid layout or 1x7 row depending on screen size
- Empty slots show placeholder icon (helmet for head, sword for main hand, etc.)
- Equipped items show item icon/name in slot

**Implementation Strategy**:

```typescript
const EQUIPMENT_SLOTS = [
  { type: 'Head', icon: '🎩' },
  { type: 'Chest', icon: '🛡️' },
  { type: 'Hands', icon: '🧤' },
  { type: 'Legs', icon: '👖' },
  { type: 'Feet', icon: '👢' },
  { type: 'MainHand', icon: '⚔️' },
  { type: 'OffHand', icon: '🗡️' },
];

// Layout responsive: 1 column on mobile, 2 rows of 4 on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {EQUIPMENT_SLOTS.map(slot => <EquipmentSlot key={slot.type} slot={slot} />)}
</div>
```

---

## 6. Item Tooltip on Hover

### Decision: Tooltip component with 300ms delay using Radix UI or custom implementation

**Rationale**:

- Spec requirement FR-009: "Hovering over an item MUST show a tooltip... within 300ms"
- Keep lightweight: radix/ui not in dependencies → Custom tooltip using CSS/React
- Tooltip shows: name, quantity, rarity color, item type
- Positioned relative to item to avoid viewport overflow

**Implementation Approach**:

```typescript
const [showTooltip, setShowTooltip] = useState(false);
const tooltipTimeoutRef = useRef<NodeJS.Timeout>();

const handleMouseEnter = () => {
  tooltipTimeoutRef.current = setTimeout(() => setShowTooltip(true), 300);
};

const handleMouseLeave = () => {
  clearTimeout(tooltipTimeoutRef.current);
  setShowTooltip(false);
};

// Custom positioned tooltip
<div
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  className="relative"
>
  {/* item */}
  {showTooltip && (
    <Tooltip item={item} position="top-right" />
  )}
</div>
```

---

## 7. Sort and Filter Implementation

### Decision: Filter state object + useMemo for client-side filtering (backend fallback if needed)

**Rationale**:

- Spec requirement FR-031 to FR-037: Sort by name/rarity/type/quantity; filter by type/rarity/slot
- Spec requirement FR-050: "Sort and filter operations MUST complete within 200ms for inventories up to 100 items"
- For 100 items, client-side filtering is fast enough (useMemo prevents re-computation)
- Alternative: Send filter params to backend `/inventory?type=armor&rarity=rare` (more scalable for large inventories)

**Implementation Pattern**:

```typescript
type FilterState = {
  sorts: { field: string; order: "asc" | "desc" }[];
  filters: { type?: string; rarity?: string; slotType?: string };
  searchText?: string;
};

const [filter, setFilter] = useState<FilterState>({ sorts: [], filters: {} });

const filteredItems = useMemo(() => {
  let result = [...items];

  // Apply filters
  if (filter.filters.type) {
    result = result.filter((item) => item.itemType === filter.filters.type);
  }

  // Apply sorts
  result.sort((a, b) => {
    for (const { field, order } of filter.sorts) {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal !== bVal) {
        return order === "asc" ? (aVal > bVal ? 1 : -1) : bVal > aVal ? 1 : -1;
      }
    }
    return 0;
  });

  return result;
}, [items, filter]);
```

**Save Filter Preference**:

- Store active filter/sort in localStorage
- Restore on inventory open for persistence

---

## 8. Stack Quantity Display

### Decision: Badge component in corner of grid items, quantity column in list view

**Rationale**:

- Spec requirement FR-005 and FR-036: Display stack quantities "5/20" format
- Must work for both grid and list views
- Badge positioned in corner (bottom-right) to not obscure item icon
- Special styling for "MAX" items: gold border or different color
- Quantity = 1 still displayed (don't hide singleton items)

**Implementation**:

```typescript
// Grid item with quantity badge
<div className="relative rounded-lg border border-gray-300 p-3">
  <img src={item.icon} alt={item.name} className="w-12 h-12" />
  {item.quantity && (
    <div className="absolute bottom-1 right-1 bg-black text-white text-xs rounded px-2 py-1 font-bold">
      {item.quantity}/{item.maxStackSize}
    </div>
  )}
</div>

// List view quantity column
<td className="text-center font-mono">
  {item.quantity > 1 ? `${item.quantity}/${item.maxStackSize}` : '1'}
</td>
```

---

## 9. Rarity Color Coding

### Decision: Map ItemRarity enum to Tailwind color palette

**Rationale**:

- Spec requirement FR-038: "Rarity levels MUST be indicated with consistent color coding"
- Common: gray, Uncommon: green, Rare: blue, Epic: purple, Legendary: orange/gold
- Tailwind has consistent color palette (use 500 or 600 shade for rarity backgrounds)
- Text labels alongside colors for accessibility (FR-046)

**Color Mapping**:

```typescript
const rarityColors: Record<ItemRarity, string> = {
  Common: 'bg-gray-400 text-gray-900',
  Uncommon: 'bg-green-500 text-white',
  Rare: 'bg-blue-500 text-white',
  Epic: 'bg-purple-500 text-white',
  Legendary: 'bg-amber-500 text-white'
};

// Usage
<div className={`px-3 py-1 rounded ${rarityColors[item.rarity]}`}>
  {item.rarity}
</div>
```

---

## 10. Real-time Inventory Updates

### Decision: React Query auto-invalidation on mutations + polling as backup

**Rationale**:

- Spec requirement FR-004: "Inventory MUST update display in real-time (within 100ms)"
- When user equips/unequips/uses item → Mutation triggers → Invalidate query cache
- React Query re-fetches inventory automatically
- Polling backup: `refetchInterval: 5000` for multi-tab scenarios

**Implementation**:

```typescript
const equipItemMutation = useMutation({
  mutationFn: (params) => equipmentClient.equipItem(params),
  onSuccess: () => {
    // Invalidate inventory and equipment queries
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
  },
});

// Query with stale time and polling
useQuery({
  queryKey: ["inventory", adventureId],
  queryFn: () => inventoryClient.getInventory(adventureId),
  staleTime: 1000, // 1 second
  refetchInterval: 5000, // 5 second polling
  refetchOnWindowFocus: true, // Re-fetch when window regains focus
});
```

---

## 11. Accessibility: Keyboard Navigation

### Decision: Semantic HTML + ARIA attributes + keyboard event handlers

**Rationale**:

- Spec requirement FR-044 and VI from Constitution: "All interactive elements MUST be keyboard navigable"
- Tab: Move focus between items
- Enter: Open detail view for focused item
- Esc: Close modal/detail view
- Arrow keys: Navigate in grid view (optional enhancement)

**Implementation**:

```typescript
// Inventory item keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={() => openDetail(item)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDetail(item);
    }
  }}
  className="focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
>
  {/* item content */}
</div>

// Equipment slot keyboard support for drag alternative
<button
  onClick={() => openEquipmentMenu(slot)}
  aria-label={`Equip to ${slot.name}`}
>
  Edit Slot
</button>
```

---

## 12. Performance Optimization: Virtualization

### Decision: React Window for large inventories (100+ items)

**Rationale**:

- Spec requirement FR-049: "MUST render with less than 100 items without noticeable lag"
- For 100 items in grid view (4-8 columns): manageable without virtualization
- If inventory exceeds 100 items in future: implement virtualization with react-window
- Initial implementation: No virtualization needed, add later if performance degrades

**Future Enhancement**:

```typescript
import { FixedSizeGrid } from 'react-window';

// Defer until performance testing shows need
<FixedSizeGrid
  columnCount={columnCount}
  columnWidth={itemWidth}
  height={containerHeight}
  rowCount={rows}
  rowHeight={itemHeight}
  width={containerWidth}
>
  {({ columnIndex, rowIndex, style }) => <InventoryItem ... />}
</FixedSizeGrid>
```

---

## 13. Backend API Contract Verification

### Decision: Use auto-generated TypeScript types from OpenAPI spec

**Rationale**:

- Backend 004-inventory-system spec provides OpenAPI 3.0.1 schema
- Frontend has npm script: `npm run generate:api` → generates types via openapi-typescript
- Ensures frontend types stay synchronized with backend changes
- Constitution §VIII: "Frontend types MUST be generated from OpenAPI specification"

**Existing Setup**:

```json
{
  "scripts": {
    "generate:api": "openapi-typescript ../swagger-openapi.json -o src/types/api.ts"
  }
}
```

**Usage**:

```typescript
// Autogenerated types from backend spec
import type { InventoryResponse, InventoryEntry, Item } from '@/types/api';

// Type-safe API calls
const useInventory = (adventureId: string) => {
  return useQuery<InventoryResponse>({...});
};
```

---

## 14. Touch Device Support

### Decision: Fallback button mode for drag-and-drop + touch gesture detection

**Rationale**:

- Spec explicitly covers drag-and-drop and mentions mobile compatibility
- HTML5 drag-and-drop works poorly on touch (mobile) devices
- Solution: Detect touch devices → Show alternate "Equip" button UI
- Long-press alternative for selecting items

**Implementation**:

```typescript
const isTouchDevice = () => {
  return (
    (typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        navigator.maxTouchPoints > 0)) ||
    false
  );
};

// On touch: render select + button instead of drag
{isTouchDevice() ? (
  <button onClick={() => equipItem(item)}>Equip</button>
) : (
  <div draggable={true}>...</div>
)}
```

---

## Summary of Decisions

| Question          | Decision                           | Rationale                               | Dependency Impact           |
| ----------------- | ---------------------------------- | --------------------------------------- | --------------------------- |
| State Management  | React Query hooks                  | Already integrated, server-driven state | None (existing)             |
| View Toggle       | Separate components + localStorage | Performance, clean code                 | None (built-in)             |
| Drag-and-Drop     | HTML5 native API + button fallback | Spec-compliant, no dependencies         | None (built-in)             |
| Detail View       | Modal + Portal + FocusLock         | Accessibility, focus management         | react-focus-lock (existing) |
| Equipment Slots   | 7-slot grid with icons             | Clear visualization                     | None (Tailwind)             |
| Tooltips          | Custom React implementation        | Lightweight, no new dependency          | None (built-in)             |
| Sort/Filter       | Client-side useMemo + localStorage | <200ms for 100 items                    | None (built-in)             |
| Rarity Colors     | Tailwind color palette             | Consistent design system                | None (existing)             |
| Real-time Updates | React Query invalidation           | Automatic cache sync                    | None (React Query)          |
| Accessibility     | Keyboard + ARIA                    | Constitution §VI compliance             | None (built-in)             |
| Virtualization    | Defer until needed                 | Not needed for <100 items               | Future: react-window        |
| API Types         | Auto-generated from OpenAPI        | Type safety, sync with backend          | Existing npm script         |
| Touch Support     | Button alternative mode            | Mobile device support                   | Conditional rendering       |
