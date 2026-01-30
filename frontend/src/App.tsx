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
import GamePage from "./pages/GamePage";
import CharacterListPage from "./pages/CharacterListPage";
import { CharacterCreatePage } from "./pages/CharacterCreatePage";
import CharacterEditPage from "./pages/CharacterEditPage";

// Lazy load DashboardPage to reduce initial bundle size
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:
        parseInt(
          import.meta.env.VITE_API_CACHE_DURATION || String(5 * 60 * 1000),
        ) || 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || "3") || 3,
      refetchOnWindowFocus: false,
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
        element: <GamePage />,
      },
      {
        path: "game/:adventureId/characters",
        element: <CharacterListPage />,
      },
      {
        path: "game/:adventureId/character/create",
        element: <CharacterCreatePage />,
      },
      {
        path: "character/:characterId/edit",
        element: <CharacterEditPage />,
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
