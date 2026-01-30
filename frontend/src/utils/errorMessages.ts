/**
 * Map HTTP error codes to user-friendly messages
 */
export const errorMessages: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Authentication required. Please log in.",
  403: "Access denied. You do not have permission.",
  404: "Adventure not found.",
  409: "An adventure with this name already exists.",
  500: "Something went wrong. Please try again later.",
  503: "Service temporarily unavailable. Please try again later.",
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
      return data.error?.message || getUserFriendlyErrorMessage(error.status);
    } catch {
      return getUserFriendlyErrorMessage(error.status);
    }
  }

  if (error instanceof Error) {
    // Network errors
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      return "Unable to connect. Check your internet connection.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
