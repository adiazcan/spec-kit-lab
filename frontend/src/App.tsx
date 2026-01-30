import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import RootLayout from "./components/RootLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSkeleton from "./components/LoadingSkeleton";

/**
 * T101: Code splitting with React.lazy()
 * Lazy load all route pages to reduce initial bundle size
 * Each page loads on-demand when navigated to
 */
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GamePage_Lazy = lazy(() => import("./pages/GamePage"));
const CharacterListPage_Lazy = lazy(() => import("./pages/CharacterListPage"));
const CharacterCreatePage_Lazy = lazy(
  () => import("./pages/CharacterCreatePage"),
);
const CharacterEditPage_Lazy = lazy(() => import("./pages/CharacterEditPage"));
const CharacterSheetPage_Lazy = lazy(
  () => import("./pages/CharacterSheetPage"),
);

/**
 * T121: Network error retry logic with exponential backoff
 * Retries failed requests with increasing delays: 1s, 2s, 4s, etc.
 */
const retryDelay = (attemptIndex: number) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000); // Max 30s delay
};

const shouldRetry = (failureCount: number, error: any) => {
  // Don't retry client errors (4xx) except 408 (timeout), 429 (rate limit)
  if (error instanceof Error && error.message) {
    const status = (error as any).status;
    if (status && status >= 400 && status < 500) {
      if (status !== 408 && status !== 429) return false;
    }
  }
  // Retry on network errors and 5xx server errors
  return failureCount < 3;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:
        parseInt(
          import.meta.env.VITE_API_CACHE_DURATION || String(5 * 60 * 1000),
        ) || 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Mutations don't retry by default, but allow retries
      retry: (failureCount: number) => failureCount < 2,
      retryDelay,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">404</h1>
            <p className="text-gray-600 mb-4">Page not found</p>
            <a href="/dashboard" className="btn-primary">
              Go to Dashboard
            </a>
          </div>
        </div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: (
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto mt-8">
                <LoadingSkeleton count={6} variant="list" />
              </div>
            }
          >
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "game/:adventureId",
        element: (
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto mt-8">
                <LoadingSkeleton count={1} variant="list" />
              </div>
            }
          >
            <GamePage_Lazy />
          </Suspense>
        ),
      },
      {
        path: "game/:adventureId/characters",
        element: (
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto mt-8">
                <LoadingSkeleton count={3} variant="list" />
              </div>
            }
          >
            <CharacterListPage_Lazy />
          </Suspense>
        ),
      },
      {
        path: "game/:adventureId/character/create",
        element: (
          <Suspense
            fallback={
              <div className="max-w-2xl mx-auto mt-8">
                <LoadingSkeleton count={6} variant="form" />
              </div>
            }
          >
            <CharacterCreatePage_Lazy />
          </Suspense>
        ),
      },
      {
        path: "character/:characterId/edit",
        element: (
          <Suspense
            fallback={
              <div className="max-w-2xl mx-auto mt-8">
                <LoadingSkeleton count={6} variant="form" />
              </div>
            }
          >
            <CharacterEditPage_Lazy />
          </Suspense>
        ),
      },
      {
        path: "character/:characterId",
        element: (
          <Suspense
            fallback={
              <div className="max-w-2xl mx-auto mt-8">
                <LoadingSkeleton count={4} variant="list" />
              </div>
            }
          >
            <CharacterSheetPage_Lazy />
          </Suspense>
        ),
      },
    ],
  },
]);

/**
 * Root application component with QueryClient provider and Router
 * Supports feature flags via environment variables for configuration
 */
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
