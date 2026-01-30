import type { paths, components } from "../types/api";

// Type helpers to extract API types
type GetAdventuresResponse =
  paths["/api/Adventures"]["get"]["responses"]["200"]["content"]["application/json"];
type CreateAdventureResponse = components["schemas"]["AdventureDto"];
type CreateAdventureRequest = components["schemas"]["CreateAdventureRequest"];

// Adventure type from schema component
export type Adventure = components["schemas"]["AdventureDto"] & {
  // Frontend-only extended fields (for display purposes, optional)
  name?: string;
  description?: string;
  progress?: number;
  status?: "active" | "completed" | "archived";
  lastPlayedAt?: string;
};

/**
 * API base URL from environment variables
 */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Get authentication token from localStorage
 * @returns JWT token or empty string
 */
export function getAuthToken(): string {
  return localStorage.getItem("authToken") || "";
}

/**
 * Parse and format API error response into user-friendly message
 * @param error - Error object from fetch
 * @returns User-friendly error message
 */
export async function parseErrorMessage(error: unknown): Promise<string> {
  if (error instanceof Response) {
    try {
      const errorData = await error.json();
      return (
        errorData.error?.message ||
        "An unexpected error occurred. Please try again."
      );
    } catch {
      return "Unable to connect. Check your internet connection.";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

/**
 * API client for Adventure Dashboard
 */
export const api = {
  adventures: {
    /**
     * List all adventures for authenticated player
     */
    list: async (params?: {
      status?: string;
      search?: string;
    }): Promise<Adventure[]> => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.search) queryParams.append("search", params.search);

      const url = `${API_URL}/api/Adventures${queryParams.toString() ? `?${queryParams}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw response;
      }

      const result = (await response.json()) as GetAdventuresResponse;
      return (result.adventures || []) as Adventure[];
    },

    /**
     * Create a new adventure
     */
    create: async (request: CreateAdventureRequest): Promise<Adventure> => {
      const response = await fetch(`${API_URL}/api/Adventures`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw response;
      }

      const result = (await response.json()) as CreateAdventureResponse;
      return result as Adventure;
    },

    /**
     * Delete an adventure by ID
     */
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/Adventures/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw response;
      }
    },
  },
};
