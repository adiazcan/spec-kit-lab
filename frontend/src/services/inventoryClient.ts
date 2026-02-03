/**
 * Inventory API Client
 *
 * REST client for communicating with the backend inventory system.
 * Wraps the auto-generated types from OpenAPI spec.
 */

import type { components } from "@/types/api";

// Type aliases for cleaner usage
export type InventoryResponse = components["schemas"]["InventoryResult"];
export type InventoryEntry = components["schemas"]["InventoryEntryResult"];
export type Item = components["schemas"]["ItemResult"];

/**
 * Base API URL for backend services
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

/**
 * Response type for item operations
 */
export interface ItemOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Response type for item usage
 */
export interface UseItemResult {
  success: boolean;
  result?: boolean;
  error?: string;
  message?: string;
}

/**
 * Inventory API client with methods for all inventory operations
 */
export const inventoryClient = {
  /**
   * Fetch complete inventory for an adventure
   */
  async getInventory(
    adventureId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<InventoryResponse> {
    const url = new URL(`${API_BASE}/adventures/${adventureId}/inventory`);
    url.searchParams.append("limit", String(limit));
    url.searchParams.append("offset", String(offset));

    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Adventure not found");
      }
      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in");
      }
      throw new Error(`Failed to fetch inventory: ${response.statusText}`);
    }

    return response.json() as Promise<InventoryResponse>;
  },

  /**
   * Fetch a single item from inventory
   */
  async getItem(adventureId: string, entryId: string): Promise<InventoryEntry> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/${entryId}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Item not found in inventory");
      }
      throw new Error(`Failed to fetch item: ${response.statusText}`);
    }

    return response.json() as Promise<InventoryEntry>;
  },

  /**
   * Add item to inventory
   */
  async addItem(
    adventureId: string,
    itemId: string,
    quantity: number = 1,
  ): Promise<InventoryEntry> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          quantity,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;
      throw new Error(`Failed to add item: ${message}`);
    }

    return response.json() as Promise<InventoryEntry>;
  },

  /**
   * Remove item from inventory completely
   */
  async removeItem(
    adventureId: string,
    entryId: string,
  ): Promise<ItemOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/${entryId}`,
      {
        method: "DELETE",
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
        error: `Failed to remove item: ${message}`,
      };
    }

    return {
      success: true,
      message: "Item removed from inventory",
    };
  },

  /**
   * Use/consume an item from inventory
   *
   * This decrements the quantity and triggers item effects.
   * If stack quantity reaches 0, item is automatically removed.
   */
  async useItem(adventureId: string, entryId: string): Promise<UseItemResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/${entryId}/use`,
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
        error: message,
      };
    }

    const result = (await response.json()) as UseItemResult;
    return {
      success: true,
      result: result.result ?? true,
      message: "Item used successfully",
    };
  },

  /**
   * Drop item from inventory completely
   */
  async dropItem(
    adventureId: string,
    entryId: string,
  ): Promise<ItemOperationResult> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/${entryId}/drop`,
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
        error: `Failed to drop item: ${message}`,
      };
    }

    return {
      success: true,
      message: "Item dropped from inventory",
    };
  },

  /**
   * Update quantity of inventory entry
   */
  async updateQuantity(
    adventureId: string,
    entryId: string,
    quantity: number,
  ): Promise<InventoryEntry> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/${entryId}/quantity`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message =
        (error as { message?: string }).message || response.statusText;
      throw new Error(`Failed to update quantity: ${message}`);
    }

    return response.json() as Promise<InventoryEntry>;
  },

  /**
   * Search inventory items by name or type
   */
  async searchItems(
    adventureId: string,
    query: string,
    limit: number = 50,
  ): Promise<InventoryResponse> {
    const url = new URL(
      `${API_BASE}/adventures/${adventureId}/inventory/search`,
    );
    url.searchParams.append("q", query);
    url.searchParams.append("limit", String(limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to search items: ${response.statusText}`);
    }

    return response.json() as Promise<InventoryResponse>;
  },

  /**
   * Get inventory statistics
   */
  async getStatistics(adventureId: string): Promise<{
    totalItems: number;
    totalStackeable: number;
    totalUnique: number;
    slotUsage: Record<string, number>;
    rarityDistribution: Record<string, number>;
  }> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/statistics`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Bulk add items to inventory
   */
  async bulkAddItems(
    adventureId: string,
    items: Array<{ itemId: string; quantity: number }>,
  ): Promise<InventoryResponse> {
    const response = await fetch(
      `${API_BASE}/adventures/${adventureId}/inventory/bulk`,
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
      throw new Error(`Failed to add items: ${message}`);
    }

    return response.json() as Promise<InventoryResponse>;
  },

  /**
   * Get item details by item ID (not inventory entry ID)
   */
  async getItemDetails(itemId: string): Promise<Item> {
    const response = await fetch(`${API_BASE}/items/${itemId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Item not found");
      }
      throw new Error(`Failed to fetch item details: ${response.statusText}`);
    }

    return response.json() as Promise<Item>;
  },

  /**
   * Health check for inventory service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};

/**
 * Helper function to check if inventory is available
 */
export async function isInventoryServiceAvailable(): Promise<boolean> {
  return inventoryClient.healthCheck();
}

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
