/**
 * Performance Monitoring Utility
 * T082: Performance monitoring for API response times
 *
 * Features:
 * - Track API response times
 * - Log slow requests (>1000ms)
 * - Aggregate performance metrics
 * - Export metrics for debugging
 * - Console logging in development mode
 *
 * @module performanceMonitor
 */

/**
 * Performance metric entry
 */
interface PerformanceMetric {
  /** Endpoint URL or identifier */
  endpoint: string;

  /** Response time in milliseconds */
  duration: number;

  /** Timestamp when request completed */
  timestamp: Date;

  /** Whether the request succeeded */
  success: boolean;

  /** Optional error message if failed */
  error?: string;
}

/**
 * Performance statistics for an endpoint
 */
interface EndpointStats {
  /** Total number of requests */
  count: number;

  /** Average response time in ms */
  avgDuration: number;

  /** Minimum response time in ms */
  minDuration: number;

  /** Maximum response time in ms */
  maxDuration: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Count of slow requests (>1000ms) */
  slowRequestCount: number;
}

/**
 * In-memory performance metrics storage
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly slowThreshold = 1000; // 1 second

  /**
   * Record a performance metric for an API call
   *
   * @param endpoint - API endpoint identifier
   * @param duration - Response time in milliseconds
   * @param success - Whether request succeeded
   * @param error - Optional error message
   */
  recordMetric(
    endpoint: string,
    duration: number,
    success: boolean,
    error?: string,
  ): void {
    const metric: PerformanceMetric = {
      endpoint,
      duration,
      timestamp: new Date(),
      success,
      error,
    };

    this.metrics.push(metric);

    // Trim old metrics if exceeding max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests in development
    if (import.meta.env.DEV && duration > this.slowThreshold) {
      console.warn(
        `[Performance] Slow request detected: ${endpoint} took ${duration}ms`,
      );
    }

    // Log failed requests in development
    if (import.meta.env.DEV && !success) {
      console.error(
        `[Performance] Request failed: ${endpoint} - ${error || "Unknown error"}`,
      );
    }
  }

  /**
   * Get performance statistics for a specific endpoint
   *
   * @param endpoint - API endpoint identifier
   * @returns Statistics object or null if no metrics
   */
  getEndpointStats(endpoint: string): EndpointStats | null {
    const endpointMetrics = this.metrics.filter((m) => m.endpoint === endpoint);

    if (endpointMetrics.length === 0) {
      return null;
    }

    const durations = endpointMetrics.map((m) => m.duration);
    const avgDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    const successCount = endpointMetrics.filter((m) => m.success).length;
    const successRate = successCount / endpointMetrics.length;

    const slowRequestCount = endpointMetrics.filter(
      (m) => m.duration > this.slowThreshold,
    ).length;

    return {
      count: endpointMetrics.length,
      avgDuration: Math.round(avgDuration),
      minDuration,
      maxDuration,
      successRate,
      slowRequestCount,
    };
  }

  /**
   * Get performance statistics for all endpoints
   *
   * @returns Map of endpoint to statistics
   */
  getAllStats(): Map<string, EndpointStats> {
    const statsMap = new Map<string, EndpointStats>();
    const endpoints = Array.from(new Set(this.metrics.map((m) => m.endpoint)));

    for (const endpoint of endpoints) {
      const stats = this.getEndpointStats(endpoint);
      if (stats) {
        statsMap.set(endpoint, stats);
      }
    }

    return statsMap;
  }

  /**
   * Get all metrics within a time range
   *
   * @param startTime - Start of time range
   * @param endTime - End of time range (default: now)
   * @returns Array of metrics within range
   */
  getMetricsInRange(
    startTime: Date,
    endTime: Date = new Date(),
  ): PerformanceMetric[] {
    return this.metrics.filter(
      (m) => m.timestamp >= startTime && m.timestamp <= endTime,
    );
  }

  /**
   * Get recent slow requests (>1000ms)
   *
   * @param limit - Maximum number of metrics to return (default: 10)
   * @returns Array of slow request metrics
   */
  getSlowRequests(limit: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter((m) => m.duration > this.slowThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Export metrics for debugging or reporting
   *
   * @returns JSON-serializable metrics object
   */
  exportMetrics(): {
    totalRequests: number;
    metrics: PerformanceMetric[];
    stats: Record<string, EndpointStats>;
  } {
    const stats: Record<string, EndpointStats> = {};
    this.getAllStats().forEach((value, key) => {
      stats[key] = value;
    });

    return {
      totalRequests: this.metrics.length,
      metrics: this.metrics,
      stats,
    };
  }

  /**
   * Print performance summary to console
   */
  printSummary(): void {
    if (!import.meta.env.DEV) return;

    console.group("🔍 Performance Monitor Summary");

    const allStats = this.getAllStats();

    if (allStats.size === 0) {
      console.log("No metrics recorded yet.");
      console.groupEnd();
      return;
    }

    console.table(
      Array.from(allStats.entries()).map(([endpoint, stats]) => ({
        Endpoint: endpoint,
        Requests: stats.count,
        "Avg (ms)": stats.avgDuration,
        "Min (ms)": stats.minDuration,
        "Max (ms)": stats.maxDuration,
        "Success Rate": `${(stats.successRate * 100).toFixed(1)}%`,
        "Slow Requests": stats.slowRequestCount,
      })),
    );

    const slowRequests = this.getSlowRequests(5);
    if (slowRequests.length > 0) {
      console.warn("⚠️ Recent slow requests (>1000ms):");
      console.table(
        slowRequests.map((m) => ({
          Endpoint: m.endpoint,
          "Duration (ms)": m.duration,
          Time: m.timestamp.toLocaleTimeString(),
        })),
      );
    }

    console.groupEnd();
  }

  /**
   * Clear all recorded metrics
   */
  clear(): void {
    this.metrics = [];
    if (import.meta.env.DEV) {
      console.log("[Performance] Metrics cleared");
    }
  }
}

/**
 * Singleton instance of PerformanceMonitor
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to wrap API calls with performance tracking
 *
 * @param endpoint - API endpoint identifier
 * @param fetchFn - Async function to execute and monitor
 * @returns Result of fetchFn with performance tracking
 *
 * @example
 * ```typescript
 * const data = await withPerformanceTracking(
 *   'GET /api/adventures',
 *   async () => {
 *     const response = await fetch('/api/adventures');
 *     return response.json();
 *   }
 * );
 * ```
 */
export async function withPerformanceTracking<T>(
  endpoint: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fetchFn();
    const duration = Math.round(performance.now() - startTime);

    performanceMonitor.recordMetric(endpoint, duration, true);

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : String(error);

    performanceMonitor.recordMetric(endpoint, duration, false, errorMessage);

    throw error;
  }
}

/**
 * React hook to access performance monitor instance
 * Can be used in DevTools or debug components
 *
 * @example
 * ```tsx
 * function PerformanceDebugger() {
 *   const monitor = usePerformanceMonitor();
 *   return (
 *     <button onClick={() => monitor.printSummary()}>
 *       Show Performance Stats
 *     </button>
 *   );
 * }
 * ```
 */
export function usePerformanceMonitor() {
  return performanceMonitor;
}

// Expose performance monitor globally in development for debugging
if (import.meta.env.DEV) {
  (window as any).__performanceMonitor__ = performanceMonitor;
  console.log(
    "🔍 Performance Monitor enabled. Use window.__performanceMonitor__.printSummary() to view stats.",
  );
}

export default performanceMonitor;
