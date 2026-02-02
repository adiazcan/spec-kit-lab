# Quickstart: Character Management Interface

**Feature**: 008-char-mgmt-ui  
**Date**: January 30, 2026  
**Target Audience**: Frontend developers implementing character creation, editing, and selection

---

## Overview

This quickstart guides you through implementing the character management interface for the Adventure Dashboard. The feature includes:

- Character creation form (point-buy and dice roll modes)
- Character sheet display
- Character editing
- Character list and selection for adventures

All endpoints integrate with the backend character management API (feature 003).

---

## Prerequisites

✅ Node.js 20 LTS installed  
✅ Frontend environment set up (`frontend/` directory)  
✅ Backend API running (feature 003-character-management)  
✅ OpenAPI spec generated at `/swagger-openapi.json`

```bash
cd /workspaces/spec-kit-lab/frontend

# Install dependencies (if not already done)
npm install

# Generate TypeScript types from OpenAPI
npm run generate:api

# Start dev server
npm run dev
```

---

## Project Structure

```
frontend/src/
├── components/
│   ├── CharacterForm.tsx           # Create/edit form component
│   ├── CharacterSheet.tsx          # Character display
│   ├── CharacterList.tsx           # Character list
│   └── CharacterSelector.tsx       # Adventure selection
├── pages/
│   ├── CharacterCreatePage.tsx     # Create route
│   ├── CharacterSheetPage.tsx      # View route
│   └── CharacterListPage.tsx       # List route
├── services/
│   ├── characterApi.ts             # HTTP client
│   ├── diceRoller.ts               # Dice logic
│   └── attributeCalculator.ts      # Modifier calculation
├── hooks/
│   ├── useCharacterForm.ts         # Form state
│   └── useDiceRoll.ts              # Dice roll state
└── types/
    ├── character.ts                # Type definitions
    └── api.ts                      # Generated (OpenAPI)
```

---

## Step 1: Create Type Definitions

Create `frontend/src/types/character.ts` with domain models:

```typescript
/**
 * Represents a player character with D&D 5E attributes.
 * Attributes range from 3-18, modifiers calculated as floor((value - 10) / 2)
 */
export interface Character {
  id: string;
  name: string;
  adventureId: string;

  attributes: {
    str: number;
    dex: number;
    int: number;
    con: number;
    cha: number;
  };

  modifiers: {
    str: number;
    dex: number;
    int: number;
    con: number;
    cha: number;
  };

  createdAt: string;
  updatedAt: string;
}

/** Form data during character creation or editing */
export interface CharacterFormData {
  name: string;
  adventureId: string;
  attributes: {
    str: number;
    dex: number;
    int: number;
    con: number;
    cha: number;
  };
}

/** Character summary for list views */
export interface CharacterListItem extends Character {}
```

---

## Step 2: Create Utility Functions

### Modifier Calculation

Create `frontend/src/services/attributeCalculator.ts`:

```typescript
/**
 * Calculate D&D 5E modifier from attribute value
 * Formula: floor((value - 10) / 2)
 * @param attributeValue - Attribute base value (3-18)
 * @returns Calculated modifier (-4 to +4)
 */
export function calculateModifier(attributeValue: number): number {
  if (attributeValue < 3 || attributeValue > 18) {
    throw new Error(`Attribute value must be 3-18, got: ${attributeValue}`);
  }
  return Math.floor((attributeValue - 10) / 2);
}

/**
 * Calculate all modifiers for a character
 * @param attributes - Character attributes object
 * @returns Modifiers object with same keys
 */
export function calculateAllModifiers(attributes: Record<string, number>) {
  const modifiers: Record<string, number> = {};
  for (const [key, value] of Object.entries(attributes)) {
    modifiers[key] = calculateModifier(value);
  }
  return modifiers;
}

/**
 * Format modifier for display with sign
 * @param modifier - Calculated modifier (-4 to +4)
 * @returns Formatted string ("+2", "-1", "+0")
 */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}
```

**Tests** (`frontend/tests/services/attributeCalculator.test.ts`):

```typescript
import {
  calculateModifier,
  calculateAllModifiers,
  formatModifier,
} from "@/services/attributeCalculator";

describe("attributeCalculator", () => {
  describe("calculateModifier", () => {
    it("should calculate correct modifiers", () => {
      expect(calculateModifier(3)).toBe(-4);
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(18)).toBe(4);
    });

    it("should throw on invalid input", () => {
      expect(() => calculateModifier(2)).toThrow();
      expect(() => calculateModifier(19)).toThrow();
    });
  });

  describe("formatModifier", () => {
    it("should format with sign", () => {
      expect(formatModifier(2)).toBe("+2");
      expect(formatModifier(0)).toBe("+0");
      expect(formatModifier(-1)).toBe("-1");
    });
  });
});
```

### Dice Roller

Create `frontend/src/services/diceRoller.ts`:

```typescript
/**
 * Represents result of a single d6 roll
 */
interface DiceRoll {
  dice: [number, number, number, number];
  sum: number;
  droppedIndex: number;
}

/**
 * Roll 4d6 and drop the lowest (D&D 5E standard)
 * @returns DiceRoll with individual results and sum
 */
export function roll4d6DropLowest(): DiceRoll {
  // Generate 4 random numbers 1-6
  const dice: [number, number, number, number] = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];

  // Find index of lowest die
  let minIndex = 0;
  for (let i = 1; i < 4; i++) {
    if (dice[i] < dice[minIndex]) {
      minIndex = i;
    }
  }

  // Sum the three highest
  const sum = dice.reduce((acc, val, idx) => {
    return idx === minIndex ? acc : acc + val;
  }, 0);

  return { dice, droppedIndex: minIndex, sum };
}
```

---

## Step 3: Create API Service

Create `frontend/src/services/characterApi.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Character, CharacterFormData } from "@/types/character";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Character API service - handles HTTP communication with backend
 */
export class CharacterApiService {
  async createCharacter(data: CharacterFormData): Promise<Character> {
    const response = await fetch(`${API_BASE}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create character");
    }

    return response.json();
  }

  async getCharacter(characterId: string): Promise<Character> {
    const response = await fetch(`${API_BASE}/api/characters/${characterId}`);

    if (!response.ok) {
      throw new Error("Failed to load character");
    }

    return response.json();
  }

  async updateCharacter(
    characterId: string,
    data: CharacterFormData,
  ): Promise<Character> {
    const response = await fetch(`${API_BASE}/api/characters/${characterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update character");
    }

    return response.json();
  }

  async deleteCharacter(characterId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/characters/${characterId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete character");
    }
  }

  async getAdventureCharacters(adventureId: string): Promise<Character[]> {
    const response = await fetch(
      `${API_BASE}/api/adventures/${adventureId}/characters`,
    );

    if (!response.ok) {
      throw new Error("Failed to load characters");
    }

    return response.json();
  }
}

export const api = new CharacterApiService();

// React Query hooks
export function useCharacter(characterId: string | undefined) {
  return useQuery({
    queryKey: ["character", characterId],
    queryFn: () => api.getCharacter(characterId!),
    enabled: !!characterId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CharacterFormData) => api.createCharacter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useUpdateCharacter(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CharacterFormData) =>
      api.updateCharacter(characterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (characterId: string) => api.deleteCharacter(characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useAdventureCharacters(adventureId: string | undefined) {
  return useQuery({
    queryKey: ["adventure-characters", adventureId],
    queryFn: () => api.getAdventureCharacters(adventureId!),
    enabled: !!adventureId,
  });
}
```

---

## Step 4: Create Custom Hooks

Create `frontend/src/hooks/useCharacterForm.ts`:

```typescript
import { useState, useCallback } from "react";
import { Character, CharacterFormData } from "@/types/character";
import { calculateAllModifiers } from "@/services/attributeCalculator";

export function useCharacterForm(character?: Character, adventureId?: string) {
  const [formData, setFormData] = useState<CharacterFormData>({
    name: character?.name || "",
    adventureId: adventureId || character?.adventureId || "",
    attributes: character?.attributes || {
      str: 10,
      dex: 10,
      int: 10,
      con: 10,
      cha: 10,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Validate form data */
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Character name is required";
    } else if (formData.name.length > 50) {
      newErrors.name = "Character name must be 50 characters or less";
    }

    for (const [key, value] of Object.entries(formData.attributes)) {
      if (value < 3 || value > 18) {
        newErrors[key] = `${key.toUpperCase()} must be 3-18`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /** Update attribute value */
  const updateAttribute = useCallback(
    (attr: keyof typeof formData.attributes, value: number) => {
      setFormData((prev) => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attr]: Math.max(3, Math.min(18, value)),
        },
      }));
    },
    [],
  );

  /** Update name */
  const updateName = useCallback((name: string) => {
    setFormData((prev) => ({ ...prev, name }));
  }, []);

  return {
    formData,
    errors,
    validate,
    updateAttribute,
    updateName,
    setFormData,
  };
}
```

---

## Step 5: Create React Components

### CharacterForm Component

Create `frontend/src/components/CharacterForm.tsx`:

```typescript
import React, { useState } from 'react';
import { Character, CharacterFormData } from '@/types/character';
import { formatModifier, calculateModifier } from '@/services/attributeCalculator';
import { roll4d6DropLowest } from '@/services/diceRoller';
import { useCharacterForm } from '@/hooks/useCharacterForm';

interface CharacterFormProps {
  character?: Character;
  adventureId?: string;
  onSubmit: (data: CharacterFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Form for creating or editing a character
 * Supports point-buy and dice-roll attribute allocation modes
 */
export const CharacterForm: React.FC<CharacterFormProps> = ({
  character,
  adventureId,
  onSubmit,
  onCancel,
}) => {
  const { formData, errors, validate, updateAttribute, updateName } = useCharacterForm(
    character,
    adventureId,
  );
  const [mode, setMode] = useState<'point-buy' | 'dice-roll'>('point-buy');
  const [pointsRemaining, setPointsRemaining] = useState(27);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Character Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Character Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateName(e.target.value)}
          maxLength={50}
          className="w-full px-3 py-2 border rounded-md"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      {/* Mode Selection */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="point-buy"
            checked={mode === 'point-buy'}
            onChange={(e) => setMode(e.target.value as 'point-buy' | 'dice-roll')}
          />
          Point Buy
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="dice-roll"
            checked={mode === 'dice-roll'}
            onChange={(e) => setMode(e.target.value as 'point-buy' | 'dice-roll')}
          />
          Dice Roll
        </label>
      </div>

      {/* Attributes */}
      <div className="grid md:grid-cols-2 gap-4">
        {(['str', 'dex', 'int', 'con', 'cha'] as const).map((attr) => (
          <AttributeInput
            key={attr}
            attribute={attr}
            value={formData.attributes[attr]}
            modifier={calculateModifier(formData.attributes[attr])}
            onChange={(value) => updateAttribute(attr, value)}
            error={errors[attr]}
            mode={mode}
          />
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Character'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

interface AttributeInputProps {
  attribute: string;
  value: number;
  modifier: number;
  onChange: (value: number) => void;
  error?: string;
  mode: 'point-buy' | 'dice-roll';
}

/**
 * Single attribute input field with modifier display
 */
const AttributeInput: React.FC<AttributeInputProps> = ({
  attribute,
  value,
  modifier,
  onChange,
  error,
  mode,
}) => {
  const names: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    int: 'Intelligence',
    con: 'Constitution',
    cha: 'Charisma',
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {attribute.toUpperCase()} ({names[attribute]})
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="3"
          max="18"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 px-3 py-2 border rounded-md"
          aria-invalid={!!error}
          aria-describedby={error ? `${attribute}-error` : undefined}
        />
        <div className="px-3 py-2 bg-gray-100 rounded-md min-w-12 text-center font-medium">
          {formatModifier(modifier)}
        </div>
      </div>
      {error && (
        <p id={`${attribute}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
```

---

## Step 6: Create Character Sheet Component

Create `frontend/src/components/CharacterSheet.tsx`:

```typescript
import React from 'react';
import { Character } from '@/types/character';
import { formatModifier } from '@/services/attributeCalculator';

interface CharacterSheetProps {
  character: Character;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

/**
 * Displays complete character information in a card format
 */
export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const attributes = [
    { key: 'str', label: 'Strength' },
    { key: 'dex', label: 'Dexterity' },
    { key: 'int', label: 'Intelligence' },
    { key: 'con', label: 'Constitution' },
    { key: 'cha', label: 'Charisma' },
  ] as const;

  return (
    <div className="max-w-2xl bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
        <p className="text-gray-600">Created {new Date(character.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Attributes */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {attributes.map(({ key, label }) => (
          <div key={key} className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              {key.toUpperCase()} ({label})
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{character.attributes[key]}</span>
              <span className="text-lg font-semibold text-blue-600">
                {formatModifier(character.modifiers[key])}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};
```

---

## Step 7: Create Pages and Routes

### Character Creation Page

Create `frontend/src/pages/CharacterCreatePage.tsx`:

```typescript
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CharacterForm } from '@/components/CharacterForm';
import { useCreateCharacter } from '@/services/characterApi';

export const CharacterCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const adventureId = searchParams.get('adventureId') || '';
  const { mutateAsync: createCharacter } = useCreateCharacter();

  const handleSubmit = async (formData) => {
    const character = await createCharacter(formData);
    navigate(`/characters/${character.id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Character</h1>
      <CharacterForm adventureId={adventureId} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
};
```

---

## Step 8: Add Routes to App

Update `frontend/src/App.tsx`:

```typescript
import { CharacterCreatePage } from '@/pages/CharacterCreatePage';
import { CharacterSheetPage } from '@/pages/CharacterSheetPage';
import { CharacterListPage } from '@/pages/CharacterListPage';

export function App() {
  return (
    <Routes>
      <Route path="/characters/create" element={<CharacterCreatePage />} />
      <Route path="/characters/:characterId" element={<CharacterSheetPage />} />
      <Route path="/characters" element={<CharacterListPage />} />
      {/* ... other routes */}
    </Routes>
  );
}
```

---

## Step 9: Test Your Implementation

```bash
# Run tests
npm run test

# Start dev server
npm run dev

# Build for production
npm run build

# Check types
npm run lint
```

---

## Common Tasks

### Add a New Attribute Display Format

Update `frontend/src/services/attributeCalculator.ts`:

```typescript
export function formatAttributeSummary(
  attributes: Record<string, number>,
): string {
  const top3 = Object.entries(attributes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([attr, val]) => `${attr.toUpperCase()} ${val}`)
    .join(", ");
  return top3;
}
```

### Add Point-Buy Cost Validation

Create `frontend/src/utils/pointBuy.ts`:

```typescript
const POINT_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 1,
  11: 1,
  12: 1,
  13: 1,
  14: 2,
  15: 2,
  16: 3,
  17: 3,
  18: 4,
};

export function calculatePointSpent(
  attributes: Record<string, number>,
): number {
  return Object.values(attributes).reduce((total, value) => {
    return total + (POINT_COSTS[value] || 0);
  }, 0);
}

export function getPointsRemaining(attributes: Record<string, number>): number {
  return 27 - calculatePointSpent(attributes);
}
```

---

## Troubleshooting

**Modifier not displaying correctly?**

- Check `calculateModifier` function handles floor rounding
- Verify attribute value is 3-18 range

**Form validation failing?**

- Ensure all errors are cleared before resubmitting
- Check error state is properly updated

**API requests failing?**

- Verify backend is running on correct port (`VITE_API_URL`)
- Check OpenAPI types were generated (`npm run generate:api`)
- Review network tab in browser DevTools

---

## Next Steps

1. ✅ Complete all components from this quickstart
2. ✅ Run tests to verify functionality
3. ⬜ Style components with Tailwind CSS
4. ⬜ Add accessibility features (WCAG AA compliance)
5. ⬜ Performance testing and optimization
6. ⬜ E2E testing with Playwright

---

**Ready to implement!** Start with Step 1 and follow through to Step 9.

For detailed component documentation, see the `/specs/008-char-mgmt-ui/` directory.
