# Quickstart: Inventory UI Implementation

**Date**: 2026-02-02  
**Target**: Frontend developers implementing Inventory UI components  
**Time to First Component**: ~15 minutes  
**Prerequisites**: Node.js 18+, React 18 knowledge, TypeScript basics

---

## 1. Quick Setup (5 minutes)

### Install dependencies (if not already installed)

```bash
cd frontend
npm install
```

All dependencies are already in `package.json`:

- React 18.3.1 ✅
- React Query 5.90 ✅
- React Router 6.30 ✅
- Tailwind CSS 4.1 ✅
- Vitest 4.0 ✅

### Generate API types from backend

```bash
npm run generate:api
```

This creates `src/types/api.ts` with TypeScript types generated from backend OpenAPI spec.

---

## 2. File Structure Overview (3 minutes)

Create the following new directories and files:

```
frontend/src/
├── components/
│   ├── InventoryUI/              # NEW
│   │   ├── InventoryContainer.tsx
│   │   ├── InventoryGrid.tsx
│   │   ├── InventoryItem.tsx
│   │   ├── InventoryViewToggle.tsx
│   │   └── ItemDetailModal.tsx
│   └── Equipment/                # NEW
│       ├── EquipmentSlots.tsx
│       └── EquipmentSlot.tsx
├── hooks/
│   ├── useInventory.ts           # NEW
│   └── useEquipment.ts           # NEW
└── services/
    └── inventoryClient.ts        # NEW
```

---

## 3. Start Simple: Create InventoryClient (5 minutes)

**File: `frontend/src/services/inventoryClient.ts`**

```typescript
import type { InventoryResponse, InventoryEntry } from "@/types/api";

const API_BASE = "http://localhost:5000/api";

export const inventoryClient = {
  async getInventory(adventureId: string, limit = 50, offset = 0) {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory?limit=${limit}&offset=${offset}`,
    );
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json() as Promise<InventoryResponse>;
  },

  async removeItem(adventureId: string, entryId: string) {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/${entryId}`,
      { method: "DELETE" },
    );
    if (!response.ok) throw new Error("Failed to remove item");
  },

  async useItem(adventureId: string, entryId: string) {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/${entryId}/use`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
    );
    if (!response.ok) throw new Error("Failed to use item");
    return response.json();
  },
};
```

---

## 4. Create useInventory Hook

**File: `frontend/src/hooks/useInventory.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryResponse } from "@/types/api";
import { inventoryClient } from "@/services/inventoryClient";

export const useInventory = (adventureId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery<InventoryResponse>({
    queryKey: ["inventory", adventureId],
    queryFn: () => inventoryClient.getInventory(adventureId, 50, 0),
    staleTime: 1000, // 1 second
    refetchInterval: 5000, // Polling fallback
  });

  const removeItemMutation = useMutation({
    mutationFn: (entryId: string) =>
      inventoryClient.removeItem(adventureId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", adventureId] });
    },
  });

  return {
    ...query,
    items: query.data?.entries ?? [],
    removeItem: removeItemMutation,
  };
};
```

---

## 5. Build Grid Component (Step-by-step)

### 5a. Create InventoryItem Component

**File: `frontend/src/components/InventoryUI/InventoryItem.tsx`**

```typescript
import React, { useState } from 'react';
import type { InventoryEntry } from '@/types/api';

const rarityColors: Record<string, string> = {
  'Common': 'bg-gray-400',
  'Uncommon': 'bg-green-500',
  'Rare': 'bg-blue-500',
  'Epic': 'bg-purple-500',
  'Legendary': 'bg-amber-500',
};

interface InventoryItemProps {
  entry: InventoryEntry;
  onSelect: () => void;
  isSelected?: boolean;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({
  entry,
  onSelect,
  isSelected,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { item, quantity } = entry;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setTimeout(() => setShowTooltip(true), 300)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`
        relative p-3 rounded-lg border-2 cursor-pointer
        ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        transition-colors
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
    >
      {/* Placeholder icon */}
      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
        📦
      </div>

      {/* Quantity badge for stackable */}
      {quantity > 1 && (
        <div className="absolute bottom-1 right-1 bg-black text-white text-xs rounded px-2 py-1 font-bold">
          {quantity}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 bg-gray-900 text-white p-2 rounded text-sm z-10 whitespace-nowrap">
          <div>{item.name}</div>
          <div className="text-xs">{item.rarity}</div>
        </div>
      )}
    </div>
  );
};
```

### 5b. Create InventoryGrid Component

**File: `frontend/src/components/InventoryUI/InventoryGrid.tsx`**

```typescript
import React from 'react';
import type { InventoryEntry } from '@/types/api';
import { InventoryItem } from './InventoryItem';

interface InventoryGridProps {
  items: InventoryEntry[];
  selectedItemId?: string;
  onItemSelect: (entry: InventoryEntry) => void;
  isLoading?: boolean;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  selectedItemId,
  onItemSelect,
  isLoading,
}) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-4">
      {items.map((entry) => (
        <InventoryItem
          key={entry.id}
          entry={entry}
          isSelected={selectedItemId === entry.id}
          onSelect={() => onItemSelect(entry)}
        />
      ))}
    </div>
  );
};
```

### 5c. Create ItemDetailModal

**File: `frontend/src/components/InventoryUI/ItemDetailModal.tsx`**

```typescript
import React, { useEffect } from 'react';
import type { InventoryEntry } from '@/types/api';

interface ItemDetailModalProps {
  entry: InventoryEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !entry) return null;

  const { item, quantity } = entry;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-xl font-bold mb-2">{item.name}</h2>
        <p className="text-gray-600 mb-4">{item.description}</p>

        <div className="space-y-2 mb-4 text-sm">
          <div>
            <strong>Rarity:</strong> {item.rarity}
          </div>
          {quantity && (
            <div>
              <strong>Quantity:</strong> {quantity}
            </div>
          )}
          {'slotType' in item && item.slotType && (
            <div>
              <strong>Slot:</strong> {item.slotType}
            </div>
          )}
          {'modifiers' in item && item.modifiers && item.modifiers.length > 0 && (
            <div>
              <strong>Bonuses:</strong>
              <ul className="ml-4">
                {item.modifiers.map((mod, i) => (
                  <li key={i}>+{mod.value} {mod.statName}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
};
```

### 5d. Create Main Container

**File: `frontend/src/components/InventoryUI/InventoryContainer.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { useInventory } from '@/hooks/useInventory';
import type { InventoryEntry } from '@/types/api';
import { InventoryGrid } from './InventoryGrid';
import { ItemDetailModal } from './ItemDetailModal';

interface InventoryContainerProps {
  adventureId: string;
}

export const InventoryContainer: React.FC<InventoryContainerProps> = ({
  adventureId,
}) => {
  const { items, isLoading, error } = useInventory(adventureId);
  const [selectedEntry, setSelectedEntry] = useState<InventoryEntry | null>(null);

  // Load preferences from localStorage
  const [viewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('inventoryViewMode') as 'grid' | 'list') ?? 'grid';
  });

  if (error) {
    return <div className="text-red-600 p-4">Failed to load inventory</div>;
  }

  return (
    <div className="w-full h-full bg-gray-50">
      <div className="border-b bg-white px-4 py-3">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-gray-600">{items.length} items</p>
      </div>

      {viewMode === 'grid' && (
        <InventoryGrid
          items={items}
          selectedItemId={selectedEntry?.id}
          onItemSelect={setSelectedEntry}
          isLoading={isLoading}
        />
      )}

      <ItemDetailModal
        entry={selectedEntry}
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};
```

---

## 6. Test Your Component

**File: `frontend/tests/components/__inventory/InventoryContainer.test.tsx`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryContainer } from '@/components/InventoryUI/InventoryContainer';

describe('InventoryContainer', () => {
  it('renders inventory header', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryContainer adventureId="test-123" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });
});
```

Run test:

```bash
npm run test -- InventoryContainer.test.tsx
```

---

## 7. Add to Main App

**File: `frontend/src/App.tsx`** (add to route):

```typescript
import { InventoryContainer } from '@/components/InventoryUI/InventoryContainer';
import { useParams } from 'react-router-dom';

function AppRoutes() {
  const { adventureId } = useParams<{ adventureId: string }>();

  return (
    <div className="flex gap-4 p-4">
      <div className="flex-1">
        <InventoryContainer adventureId={adventureId!} />
      </div>
    </div>
  );
}
```

---

## 8. Next Steps: Equipment Slots

Once grid view works, create Equipment Slots similarly:

1. Create `useEquipment` hook (similar to useInventory)
2. Create `EquipmentSlots.tsx` component (7 slots grid)
3. Add drag-and-drop handlers
4. Connect mutations for equip/unequip

```typescript
// Hook skeleton - add to src/hooks/useEquipment.ts
export const useEquipment = (adventureId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["equipment", adventureId],
    queryFn: () => equipmentClient.getEquipped(adventureId),
  });

  const equipMutation = useMutation({
    mutationFn: ({ itemId, slotType }) =>
      equipmentClient.equipItem(adventureId, itemId, slotType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });

  return { ...query, equipItem: equipMutation };
};
```

---

## 9. Development Server

```bash
npm run dev
```

Navigate to `http://localhost:5173` and test your inventory UI.

---

## Checklist

- [ ] Run `npm install` (all deps available)
- [ ] Run `npm run generate:api` (generate types)
- [ ] Create `inventoryClient.ts` service
- [ ] Create `useInventory.ts` hook
- [ ] Create `InventoryItem.tsx` component
- [ ] Create `InventoryGrid.tsx` component
- [ ] Create `ItemDetailModal.tsx` component
- [ ] Create `InventoryContainer.tsx` component
- [ ] Add inventory route to App.tsx
- [ ] Test in browser: `npm run dev`
- [ ] Run tests: `npm test`
- [ ] Verify localStorage persistence of view mode
- [ ] Add keyboard navigation (Enter, Esc)

---

## Troubleshooting

### "Cannot find module '@/types/api'"

```bash
npm run generate:api  # Regenerate types from backend OpenAPI
```

### "Backend returns 500"

- Check backend is running on localhost:5000
- Verify adventureId is valid UUID
- Check backend logs for errors

### "React Query stale-time warnings"

Normal - staleTime: 1000 means data refreshes after 1 second of inactivity.

### "Tailwind classes not applying"

Ensure `frontend/tailwind.config.ts` includes `src/` in content paths.

---

## Performance Tips

1. **Memoize components**: Use `React.memo()` for InventoryItem (renders many times)
2. **Lazy load details**: Only fetch full item details on click (not in list)
3. **Virtual scrolling**: If inventory exceeds 100 items, add react-window
4. **Cache API responses**: React Query handles this automatically

---

## What's Next?

After basic inventory works:

1. Unit tests for hooks and components
2. Equipment slots drag-and-drop
3. Sort and filter functionality
4. Accessibility audit (keyboard nav, screen readers)
5. Performance testing (100+ items)
6. Mobile responsiveness

See `/specs/010-inventory-ui/tasks.md` for detailed task breakdown (generated in Phase 2).
