import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * ErrorBoundary - Catches React errors and displays graceful fallback UI
 * T120: Enhanced error boundary with better error reporting and recovery
 *
 * Features:
 * - Catches rendering errors and displays user-friendly message
 * - Logs errors with stack traces for debugging
 * - Provides recovery actions (try again, go home)
 * - Tracks error count to prevent infinite loops
 * - Shows error details in development mode
 * - Optional custom fallback UI
 * - Distinguishes between common error types
 *
 * @component
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with timestamp for debugging
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] ErrorBoundary caught an error:`,
      error,
      errorInfo,
    );

    // Track error count - if we get >3 errors rapidly, help user recovery
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Send error to monitoring service if available
    if ((window as any).__ERROR_TRACKING__) {
      (window as any).__ERROR_TRACKING__.captureException(error, {
        contexts: { errorInfo },
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  /**
   * Determine if error is likely user-recoverable vs system error
   */
  isRecoverableError(error: Error | null): boolean {
    if (!error) return true;
    const message = error.message.toLowerCase();
    // Network errors and data fetch errors are usually recoverable
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("not found")
    );
  }

  /**
   * Get helpful recovery suggestion based on error type
   */
  getRecoverySuggestion(error: Error | null): string {
    if (!error) return "An unexpected error occurred.";
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return "Check your internet connection and try again.";
    }
    if (message.includes("not found")) {
      return "The requested resource was not found. Try returning to the dashboard.";
    }
    if (message.includes("unauthorized") || message.includes("permission")) {
      return "You don't have permission to access this resource. Try logging in again.";
    }
    return "Try refreshing the page or returning to the dashboard.";
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRecoverable = this.isRecoverableError(this.state.error);
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            {/* Error Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 text-2xl">
                ⚠️
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {isRecoverable ? "Oops! Something went wrong" : "System Error"}
            </h1>

            {/* Error Message */}
            <p className="text-center text-gray-600 mb-4">
              {this.getRecoverySuggestion(this.state.error)}
            </p>

            {/* Error Details (Development only) */}
            {isDevelopment && this.state.error && (
              <details className="mb-6 p-4 bg-gray-50 rounded border border-gray-200 text-xs">
                <summary className="font-mono text-gray-700 cursor-pointer hover:text-gray-900 mb-2">
                  Error details (dev only)
                </summary>
                <pre className="text-red-600 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Error Count Warning */}
            {this.state.errorCount > 2 && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>Multiple errors detected.</strong> Returning to
                dashboard may help.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isRecoverable && (
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={this.handleGoHome}
                className={`${
                  isRecoverable ? "flex-1" : "w-full"
                } px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}
              >
                Go to Dashboard
              </button>
            </div>

            {/* Support message */}
            <p className="mt-6 text-center text-xs text-gray-500">
              If the error persists, please{" "}
              <a
                href="mailto:support@example.com"
                className="text-blue-600 hover:underline"
              >
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
