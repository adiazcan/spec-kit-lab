/**
 * Format ISO8601 date string to human-readable format
 * @param isoString - ISO8601 date string (e.g., "2026-01-29T10:00:00Z")
 * @returns Formatted date string (e.g., "Jan 29, 2026")
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";

  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "Invalid date";
  }
}

/**
 * Format progress percentage for display
 * @param percentage - Progress as number 0-100
 * @returns Formatted progress string (e.g., "45%")
 */
export function formatProgress(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) return "0%";
  return `${Math.round(percentage)}%`;
}

/**
 * Truncate long strings with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}
