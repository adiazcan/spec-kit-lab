/**
 * T117: User-friendly error messages for all API operations
 * Maps HTTP status codes and API responses to clear, actionable messages
 */

/**
 * Map HTTP error codes to user-friendly messages
 */
export const errorMessages: Record<number, string> = {
  400: "Invalid request. Please check your input and try again.",
  401: "Authentication required. Please log in.",
  403: "Access denied. You do not have permission.",
  404: "Character not found. It may have been deleted.",
  409: "A character with this name already exists.",
  422: "Invalid character data. Check that attributes are 3-18.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Server error occurred. Please try again in a moment.",
  503: "Service temporarily unavailable. Please try again later.",
};

/**
 * Character-specific error messages for common operations
 */
export const characterErrorMessages: Record<string, string> = {
  CREATE_FAILED:
    "Failed to create character. Check your internet and try again.",
  CREATE_INVALID:
    "Character data is invalid. Verify name is provided and attributes are 3-18.",
  UPDATE_FAILED: "Failed to update character. Your changes were not saved.",
  UPDATE_NOT_FOUND: "Character no longer exists. It may have been deleted.",
  DELETE_FAILED: "Failed to delete character. Check your internet connection.",
  DELETE_CONFIRMATION: "This will permanently delete this character.",
  LOAD_FAILED: "Failed to load character. Please try again.",
  LIST_FAILED: "Failed to load character list. Please refresh the page.",
  NETWORK_ERROR: "Unable to connect to server. Check your internet connection.",
  RETRY_MAX:
    "Unable to reach server after multiple attempts. Please try again later.",
};

/**
 * Get user-friendly error message from HTTP status code
 * @param statusCode - HTTP status code
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(statusCode: number): string {
  return (
    errorMessages[statusCode] ||
    "An unexpected error occurred. Please try again."
  );
}

/**
 * Parse error response and extract user-friendly message
 * @param error - Error from API call
 * @returns User-friendly error message
 */
export async function parseError(error: unknown): Promise<string> {
  if (error instanceof Response) {
    try {
      const data = await error.json();
      // Try to get specific error message from response
      if (data.error?.message) return data.error.message;
      if (data.message) return data.message;
      if (typeof data.error === "string") return data.error;
    } catch {
      // Fall through to status code handling
    }
    return getUserFriendlyErrorMessage(error.status);
  }

  if (error instanceof Error) {
    // Network errors
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("fetch failed")
    ) {
      return characterErrorMessages.NETWORK_ERROR;
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
