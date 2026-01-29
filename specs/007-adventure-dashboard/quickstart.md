# Quickstart Guide: Adventure Dashboard Development

**Feature**: Adventure Dashboard  
**Phase**: Phase 1 Ready  
**Date**: 2026-01-29  
**Target Audience**: Frontend developers starting implementation

---

## Prerequisites

- Node.js 18+ and npm 9+
- TypeScript 5.9+ understanding
- Familiarity with React, Vite, Tailwind CSS
- Backend API running (local or staging)
- Access to OpenAPI specification file

---

## Development Environment Setup

### 1. Install Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install core dependencies
npm install react@18 react-dom@18 react-router-dom@6 @tanstack/react-query@5

# Install build tools
npm install -D vite@7 @vitejs/plugin-react typescript@5.9

# Install styling
npm install -D tailwindcss@4 postcss autoprefixer

# Install testing
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/dom

# Install accessibility
npm install react-focus-lock

# Install code generation
npm install -D openapi-typescript
```

### 2. Configure Environment Variables

Create `.env.development` in the root directory:

```env
# Backend API configuration
VITE_API_URL=http://localhost:5000

# Feature flags (optional)
VITE_DEBUG_API=true
VITE_MOCK_API=false
```

Create `.env.production`:

```env
VITE_API_URL=https://api.example.com
VITE_DEBUG_API=false
VITE_MOCK_API=false
```

**Never commit**: `.env.local`, `.env.*.local`  
**Reference file**: `.env.example` (commit this)

### 3. Generate TypeScript Types from OpenAPI

```bash
# Copy backend OpenAPI spec to frontend (or reference via URI)
# One-time generation:
npx openapi-typescript ../../swagger-openapi.json -o src/types/api.ts

# Or watch-mode for development:
npx openapi-typescript ../../swagger-openapi.json --watch src/types/api.ts
```

### 4. Start Development Server

```bash
# Install development dependencies
npm install -D tsx

# Run development server with HMR
npm run dev

# Output should show:
# > vite v7.x.x building for development...
# > ➜  Local:   http://localhost:5173/
```

Visit http://localhost:5173 in your browser.

---

## Project Structure Overview

```text
src/
├── main.tsx                 # React DOM render + app mount
├── App.tsx                  # Root router setup
├── index.css                # Tailwind CSS imports
│
├── pages/
│   └── DashboardPage.tsx    # Main dashboard page component
│
├── components/
│   ├── AdventureList.tsx        # Container: renders list of adventures
│   ├── AdventureCard.tsx        # Card: individual adventure with actions
│   ├── CreateAdventureForm.tsx  # Modal form: create new adventure
│   ├── ConfirmDialog.tsx        # Modal: delete confirmation
│   ├── LoadingSkeleton.tsx      # Placeholders while loading
│   └── ErrorBoundary.tsx        # Error fallback UI
│
├── hooks/
│   └── useAdventures.ts     # TanStack Query hooks for CRUD
│
├── services/
│   └── api.ts               # API client + fetch wrapper
│
├── types/
│   └── api.ts               # Generated types from OpenAPI
│
└── utils/
    └── formatters.ts        # Date/time/text formatting utilities

tests/
├── vitest.config.ts         # Test runner configuration
├── setup.ts                 # Global test setup (mocks, providers)
├── components/
│   ├── AdventureList.test.tsx
│   ├── AdventureCard.test.tsx
│   └── CreateAdventureForm.test.tsx
└── hooks/
    └── useAdventures.test.ts
```

---

## Key Files to Implement

### 1. API Service Layer (`src/services/api.ts`)

Wraps TanStack Query and fetches. Provides clean interface for components.

```typescript
import { paths } from "../types/api";

type GetAdventuresResponse =
  paths["/adventures"]["get"]["responses"]["200"]["content"]["application/json"];
type Adventure = GetAdventuresResponse["data"][number];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = {
  adventures: {
    list: async (params?: { status?: string; search?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.search) queryParams.append("search", params.search);

      const response = await fetch(`${API_URL}/api/adventures?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`Failed to fetch adventures: ${response.statusText}`);
      const { data } = await response.json();
      return data as Adventure[];
    },

    create: async (name: string) => {
      const response = await fetch(`${API_URL}/api/adventures`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create adventure");
      }
      const { data } = await response.json();
      return data as Adventure;
    },

    delete: async (id: string) => {
      const response = await fetch(`${API_URL}/api/adventures/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete adventure");
      }
    },
  },
};

function getAuthToken(): string {
  // Retrieve JWT from storage or cookie
  return localStorage.getItem("authToken") || "";
}
```

### 2. TanStack Query Hooks (`src/hooks/useAdventures.ts`)

Encapsulates CRUD logic and caching.

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export const useAdventures = () => {
  return useQuery({
    queryKey: ["adventures"],
    queryFn: () => api.adventures.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAdventure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.adventures.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adventures"] });
    },
  });
};

export const useDeleteAdventure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.adventures.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adventures"] });
    },
  });
};
```

### 3. Main Dashboard Component (`src/pages/DashboardPage.tsx`)

Orchestrates the dashboard UI and data flow.

```typescript
import { useState } from 'react';
import { useAdventures, useCreateAdventure, useDeleteAdventure } from '../hooks/useAdventures';
import AdventureList from '../components/AdventureList';
import CreateAdventureForm from '../components/CreateAdventureForm';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DashboardPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: adventures, isLoading, error } = useAdventures();
  const createMutation = useCreateAdventure();
  const deleteMutation = useDeleteAdventure();

  const handleCreate = async (name: string) => {
    try {
      await createMutation.mutateAsync(name);
      setShowCreateForm(false);
    } catch (err) {
      // Error handling in form component
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (err) {
      // Error handling in dialog
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Adventures</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Adventure
          </button>
        </div>

        <AdventureList
          adventures={adventures || []}
          isLoading={isLoading}
          error={error}
          onSelectAdventure={(adv) => {
            // Navigate to game with adventure
            window.location.href = `/game/${adv.id}`;
          }}
          onDeleteAdventure={(id) => setDeleteConfirm(id)}
        />

        {showCreateForm && (
          <CreateAdventureForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isLoading={createMutation.isPending}
          />
        )}

        {deleteConfirm && (
          <ConfirmDialog
            title="Delete Adventure"
            message="Are you sure? This cannot be undone."
            onConfirm={() => handleDelete(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
            isLoading={deleteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**AdventureList Component Test**:

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdventureList from './AdventureList';

const queryClient = new QueryClient();

test('renders adventure list with items', () => {
  const adventures = [
    { id: '1', name: 'Adventure 1', progress: 50, createdAt: '2026-01-29T10:00:00Z' },
  ];

  render(
    <QueryClientProvider client={queryClient}>
      <AdventureList
        adventures={adventures}
        isLoading={false}
        onSelectAdventure={vi.fn()}
        onDeleteAdventure={vi.fn()}
      />
    </QueryClientProvider>
  );

  expect(screen.getByText('Adventure 1')).toBeInTheDocument();
});

test('shows loading state while fetching', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <AdventureList
        adventures={[]}
        isLoading={true}
        onSelectAdventure={vi.fn()}
        onDeleteAdventure={vi.fn()}
      />
    </QueryClientProvider>
  );

  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Common Development Tasks

### Add a New Component

1. Create component file: `src/components/MyComponent.tsx`
2. Add JSDoc comments (required per constitution):
   ```typescript
   /**
    * MyComponent - Displays X with Y behavior
    * @param props - Component props
    * @returns React component
    */
   export default function MyComponent(props: MyComponentProps) { ... }
   ```
3. Create test file: `tests/components/MyComponent.test.tsx`
4. Import in parent component

### Update API Types

When backend OpenAPI spec changes:

```bash
# Regenerate types
npx openapi-typescript ../../swagger-openapi.json -o src/types/api.ts

# TypeScript will highlight breaking changes
# Update API service and components accordingly
```

### Debug API Calls

Enable debug mode:

```env
VITE_DEBUG_API=true
```

Then monitor network requests in browser DevTools → Network tab

### Access TanStack Query DevTools (Optional)

```bash
npm install -D @tanstack/react-query-devtools
```

```typescript
// App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV && <ReactQueryDevtools />}
      </QueryClientProvider>
    </>
  );
}
```

---

## Debugging Checklist

| Issue                                     | Solution                                                            |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Components don't re-render after API call | Check TanStack Query devtools caching strategy                      |
| Environment variables undefined           | Prefix with `VITE_` and restart dev server                          |
| "Cannot find module" errors               | Ensure TypeScript path aliases match `tsconfig.json`                |
| Tests fail with "Provider not found"      | Wrap components in `QueryClientProvider` in tests                   |
| API calls hang/timeout                    | Check network tab, verify backend API running, check `VITE_API_URL` |
| Accessibility issues                      | Use axe DevTools browser extension, run `npm run test:a11y`         |

---

## Performance Tips

1. **Memoize Components**: Use `React.memo()` for adventure cards

   ```typescript
   export default React.memo(AdventureCard);
   ```

2. **Lazy Load Routes**: Use `React.lazy()` for dashboard page

   ```typescript
   const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
   ```

3. **Optimize Images**: Use WebP with JPEG fallback for future avatars
4. **Virtual Scrolling**: For 100+ adventures, use `react-window`
5. **Bundle Analysis**:
   ```bash
   npm install -D rollup-plugin-visualizer
   # Then check dist/stats.html
   ```

---

## Deployment Checklist

- [ ] All tests pass: `npm run test`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No console errors/warnings
- [ ] Accessibility audit passed: `npm run test:a11y`
- [ ] Performance budget met: bundle < 100KB gzipped
- [ ] Environment variables configured for production
- [ ] API contract validated against backend
- [ ] Error handling covers all failure scenarios

---

## Production Build

```bash
# Build optimized bundle
npm run build

# Output in dist/ directory
# Serve with: npx http-server dist

# Preview production build locally
npm run preview
```

---

## Next Steps

1. **Set up local development environment** (prerequisites above)
2. **Generate OpenAPI types** from backend spec
3. **Implement API service layer** (api.ts)
4. **Create main components** with clean data flow
5. **Add comprehensive tests** before merging to main
6. **Validate with real backend** before deployment

---

## Resources

- [React 18 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library Recipes](https://testing-library.com/docs/react-testing-library/example-intro)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Status**: Ready to begin Phase 2 implementation. Follow component development order: API service → Hooks → Components → Tests
