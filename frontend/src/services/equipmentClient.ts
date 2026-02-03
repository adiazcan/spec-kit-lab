/**
 * Equipment API Client
 *
 * REST client for managing character equipment slots and operations.
 * Handles equip, unequip, and equipment status queries.
 */

import type { SlotType } from "@/types/inventory";
import type { EquippedItem } from "@/types/equipment";

/**
 * Base API URL for backend services
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

/**
 * Response type for equipment operations
 */
export interface EquipmentOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Response type for equipment query
 */
export interface EquipmentResponse {
  adventureId: string;
  equippedItems: Record<SlotType, EquippedItem | null>;
  totalStatModifiers: Record<string, number>;
}

/**
 * Equipment API client with methods for all equipment operations
 */
export const equipmentClient = {
  /**
   * Get all currently equipped items for a character
   */
  async getEquippedItems(adventureId: string): Promise<EquipmentResponse> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Adventure not found");
      }
      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in");
      }
      throw new Error(`Failed to fetch equipped items: ${response.statusText}`);
    }

    return response.json() as Promise<EquipmentResponse>;
  },

  /**
   * Get equipped item in a specific slot
   */
  async getSlotItem(
    adventureId: string,
    slotType: SlotType,
  ): Promise<EquippedItem | null> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/${slotType}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Slot is empty
      }
      throw new Error(`Failed to fetch slot item: ${response.statusText}`);
    }

    return response.json() as Promise<EquippedItem>;
  },

  /**
   * Equip an item to a specific slot
   *
   * If a slot is already occupied, the existing item is unequipped first.
   * The unequipped item is returned to inventory.
   */
  async equipItem(
    adventureId: string,
    itemId: string,
    slotType: SlotType,
  ): Promise<EquipmentOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/${slotType}/equip`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;

      // Handle specific error cases
      if (response.status === 400) {
        return {
          success: false,
          error: message || "Invalid item for this equipment slot",
        };
      }
      if (response.status === 409) {
        return {
          success: false,
          error: message || "Inventory full: Cannot equip - will not fit",
        };
      }

      return {
        success: false,
        error: `Failed to equip item: ${message}`,
      };
    }

    return {
      success: true,
      message: "Item equipped successfully",
    };
  },

  /**
   * Unequip an item from a specific slot
   *
   * The unequipped item is returned to inventory.
   * Fails if inventory is full.
   */
  async unequipItem(
    adventureId: string,
    slotType: SlotType,
  ): Promise<EquipmentOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/${slotType}/unequip`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;

      // Handle specific error cases
      if (response.status === 409) {
        return {
          success: false,
          error:
            message || "Inventory full: Cannot unequip - nowhere to put item",
        };
      }

      return {
        success: false,
        error: `Failed to unequip item: ${message}`,
      };
    }

    return {
      success: true,
      message: "Item unequipped successfully",
    };
  },

  /**
   * Swap an item from inventory with equipped item
   *
   * Equips the inventory item to the slot and returns equipped item to inventory.
   * More efficient than separate unequip/equip operations.
   */
  async swapItem(
    adventureId: string,
    itemId: string,
    slotType: SlotType,
  ): Promise<EquipmentOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/${slotType}/swap`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;

      return {
        success: false,
        error: `Failed to swap item: ${message}`,
      };
    }

    return {
      success: true,
      message: "Item swapped successfully",
    };
  },

  /**
   * Get total stat modifiers from all equipped items
   */
  async getTotalStatModifiers(
    adventureId: string,
  ): Promise<Record<string, number>> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/stats`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch stat modifiers: ${response.statusText}`);
    }

    return response.json() as Promise<Record<string, number>>;
  },

  /**
   * Bulk equip multiple items at once
   *
   * Useful for loading equipment presets or character builds.
   */
  async bulkEquip(
    adventureId: string,
    items: Array<{ itemId: string; slotType: SlotType }>,
  ): Promise<EquipmentOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/bulk`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;
      return {
        success: false,
        error: `Failed to bulk equip items: ${message}`,
      };
    }

    return {
      success: true,
      message: "Items equipped successfully",
    };
  },

  /**
   * Unequip all items
   */
  async unequipAll(adventureId: string): Promise<EquipmentOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/unequip-all`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;
      return {
        success: false,
        error: `Failed to unequip all items: ${message}`,
      };
    }

    return {
      success: true,
      message: "All items unequipped successfully",
    };
  },

  /**
   * Save equipment as a preset/template
   */
  async savePreset(
    adventureId: string,
    presetName: string,
  ): Promise<EquipmentOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/presets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: presetName }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;
      return {
        success: false,
        error: `Failed to save preset: ${message}`,
      };
    }

    return {
      success: true,
      message: "Equipment preset saved successfully",
    };
  },

  /**
   * Load equipment from a saved preset
   */
  async loadPreset(
    adventureId: string,
    presetId: string,
  ): Promise<EquipmentOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/presets/${presetId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;
      return {
        success: false,
        error: `Failed to load preset: ${message}`,
      };
    }

    return {
      success: true,
      message: "Equipment preset loaded successfully",
    };
  },

  /**
   * Validate if an item can be equipped to a slot
   */
  async validateEquip(
    adventureId: string,
    itemId: string,
    slotType: SlotType,
  ): Promise<{ valid: boolean; reason?: string }> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/equipment/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, slotType }),
      },
    );

    if (!response.ok) {
      return {
        valid: false,
        reason: "Validation failed",
      };
    }

    return response.json() as Promise<{ valid: boolean; reason?: string }>;
  },
};

/**
 * Helper function to get API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE;
}

/**
 * Helper function to construct full API URL
 */
export function getFullApiUrl(endpoint: string): string {
  return `${API_BASE}${endpoint}`;
}
