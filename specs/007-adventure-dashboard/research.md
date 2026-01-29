# Research Findings: Adventure Dashboard Frontend

**Feature**: Adventure Dashboard  
**Phase**: Phase 0  
**Date**: 2026-01-29  
**Status**: Complete

## Overview

This document contains detailed research on the technology stack, library choices, and best practices for implementing the Adventure Dashboard as a React 18 SPA using Vite.

---

## 1. React 18 + Vite + TypeScript Stack

### Decision

Use **Vite v7** as the build tool with React 18 JSX transform and TypeScript 5.9+ for type safety. Project structure follows a feature-based organization with collocated components, tests, and styles.

### Rationale

- **Vite**: Native ESM development, sub-100ms HMR, optimized build output; faster than Create React App or Webpack configs
- **React 18**: New JSX transform (no `import React` needed), automatic batching, concurrent features; stable and production-ready
- **TypeScript 5.9+**: Latest const type parameters, satisfies operator; better error messages and autocomplete

### Implementation Details

**Vite Configuration** (`vite.config.ts`):

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"],
  },
});
```

**Folder Structure** (Feature-Based):

```
src/
├── pages/
│   └── DashboardPage.tsx
├── components/
│   ├── AdventureList.tsx
│   ├── AdventureCard.tsx
│   ├── CreateAdventureForm.tsx
│   ├── ConfirmDialog.tsx
│   └── LoadingSkeleton.tsx
├── hooks/
│   └── useAdventures.ts
├── services/
│   └── api.ts
├── types/
│   └── api.ts (generated)
└── utils/
    └── formatters.ts
```

**TypeScript Setup** (`tsconfig.json`):

- `"jsx": "react-jsx"` (new JSX transform)
- `"strict": true` (strict type checking)
- `"target": "ES2020"` (modern JavaScript features)
- `"moduleResolution": "bundler"` (Vite-optimized resolution)

### Alternatives Considered

| Alternative                | Why Rejected                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Create React App (CRA)     | Slower startup times, black-box Webpack config, not actively maintained; Vite is faster and more flexible |
| Next.js                    | Overkill for SPA; adds unnecessary complexity for server-side rendering not needed here                   |
| Remix                      | Server-centric routing; wrong pattern for client-side adventure selection                                 |
| Plain TypeScript + webpack | Requires extensive manual configuration; Vite provides smart defaults                                     |

---

## 2. TanStack Query v5 for Server State Management

### Decision

Use **TanStack Query v5** for enterprise-grade server state management with automatic caching, background refetching, and optimistic updates. Configure with:

- 5-minute stale time for adventure data
- 10-minute cache time before garbage collection
- Cursor-based pagination for 100+ adventures
- Automatic cache invalidation on mutations

### Rationale

- Eliminates boilerplate state management code
- Automatic background refetching keeps UI data fresh
- Built-in devtools for debugging
- `keepPreviousData` option prevents UI flashing during pagination
- Optimistic updates provide instant user feedback

### Implementation Details

**Setup** (`hooks/useAdventures.ts`):

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

export const useAdventures = () => {
  return useQuery({
    queryKey: ["adventures"],
    queryFn: () => api.adventures.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

export const useCreateAdventure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.adventures.create({ name }),
    onSuccess: (newAdventure) => {
      queryClient.setQueryData(["adventures"], (old) => [
        ...(old || []),
        newAdventure,
      ]);
    },
  });
};

export const useDeleteAdventure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.adventures.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(["adventures"], (old) =>
        (old || []).filter((a) => a.id !== deletedId),
      );
    },
  });
};
```

**Pagination for 100+ Adventures**:
Use `useInfiniteQuery` with cursor-based pagination:

```typescript
export const useAdventuresInfinite = () => {
  return useInfiniteQuery({
    queryKey: ["adventures"],
    queryFn: ({ pageParam = null }) =>
      api.adventures.list({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
```

**Provider Setup** (`App.tsx`):

```typescript
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

### Alternatives Considered

| Alternative                  | Why Rejected                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| Local Redux state            | Overkill for read-heavy dashboard; much boilerplate                                   |
| SWR (stale-while-revalidate) | Smaller API; TanStack Query offers more features (infinite query, optimistic updates) |
| Zustand + manual fetch       | Missing automatic background refetching and cache management                          |
| GraphQL + Relay              | REST API already exists; REST is simpler for this feature                             |

---

## 3. React Router v6 for SPA Navigation

### Decision

Use **React Router v6** with JSX-based route configuration and layout nesting. Integrate with TanStack Query using route loaders for prefetching data before rendering.

### Rationale

- Standard, widely-adopted routing library with excellent TypeScript support
- JSX route config more intuitive than object-based config
- Layout-based architecture enables proper focus management and error boundaries
- Route loaders enable data prefetching before component render

### Implementation Details

**Router Setup** (`App.tsx`):

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
        loader: () => queryClient.ensureQueryData({
          queryKey: ['adventures'],
          queryFn: () => api.adventures.list(),
        }),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

**Layout Component** (`components/RootLayout.tsx`):

```typescript
export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="container mx-auto p-4">
          {/* Navigation */}
        </nav>
      </header>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
```

**Accessing Loader Data**:

```typescript
import { useLoaderData } from 'react-router-dom';

export default function DashboardPage() {
  const initialAdventures = useLoaderData() as Adventure[];
  const { data: adventures } = useAdventures();

  return (
    // Component renders with prefetched data
  );
}
```

### Alternatives Considered

| Alternative     | Why Rejected                                                         |
| --------------- | -------------------------------------------------------------------- |
| Next.js routing | File-based routing adds complexity; Next.js targets SSR (not needed) |
| TanStack Router | Newer, fewer community resources; React Router v6+ sufficient        |
| Custom routing  | Too much boilerplate; React Router provides battle-tested solution   |

---

## 4. Tailwind CSS for Responsive Design

### Decision

Use **Tailwind CSS v4** with extended breakpoints (320px to 2560px+) and responsive utilities. Mobile-first approach ensures accessibility on all devices.

### Rationale

- Utility-first approach reduces CSS complexity
- Built-in responsive prefixes (sm:, md:, lg:, xl:) enable mobile-first design
- Dark mode support via `prefers-color-scheme`
- Excellent WCAG color contrast utilities (`text-white/90` ensures 4.5:1 contrast)

### Implementation Details

**Tailwind Config** (`tailwind.config.ts`):

```typescript
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "320px", // Mobile portrait
        sm: "640px", // Mobile landscape
        md: "768px", // Tablet
        lg: "1024px", // Laptop
        xl: "1280px", // Desktop
        "2xl": "1536px", // Large desktop
        "4xl": "2560px", // Ultra-wide
      },
      spacing: {
        touch: "2.75rem", // 44px for touch targets
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
```

**Touch Targets** (44x44px minimum):

```jsx
// ✅ Good: h-11 w-11 = 44x44px
<button className="h-11 w-11 rounded-lg bg-blue-600 hover:bg-blue-700">
  Delete
</button>

// ✅ Good: p-3 with text creates 44px+ tap area
<div className="p-3 cursor-pointer hover:bg-gray-100">
  <span className="text-base">Adventure Name</span>
</div>
```

**Responsive Design**:

```jsx
// Container adapts from 320px to 2560px+
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {adventures.map((adv) => (
    <AdventureCard key={adv.id} adventure={adv} />
  ))}
</div>
```

**Color Contrast** (WCAG AA):

```jsx
// ✅ Good: 4.5:1 contrast ratio (white text on blue-600)
<h1 className="text-white/95 bg-blue-600">Adventure List</h1>

// ✅ Good: Use prefers-color-scheme for dark mode
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content
</div>
```

### Alternatives Considered

| Alternative       | Why Rejected                                           |
| ----------------- | ------------------------------------------------------ |
| CSS Modules       | More boilerplate, harder to maintain responsive styles |
| Styled Components | Runtime overhead; Tailwind is faster and simpler       |
| Bootstrap         | Larger CSS payload, less customizable than Tailwind    |
| Plain CSS         | No utilities, prone to inconsistency                   |

---

## 5. OpenAPI to TypeScript Code Generation

### Decision

Use **`openapi-typescript`** (community-maintained) to generate TypeScript types from the backend OpenAPI 3.0.1 specification. Integrate generation into the build pipeline with a pre-build script.

### Rationale

- Zero runtime overhead (pure type generation)
- 265+ code snippets in documentation, actively maintained
- Handles complex OpenAPI features (discriminators, oneOf, allOf)
- Prevents type mismatches between frontend and backend at compile time

### Implementation Details

**Installation**:

```bash
npm install -D openapi-typescript
```

**Generate Script** (`package.json`):

```json
{
  "scripts": {
    "generate:api": "openapi-typescript ../../swagger-openapi.json -o src/types/api.ts",
    "dev": "npm run generate:api && vite",
    "build": "npm run generate:api && vite build"
  }
}
```

**Watch Mode** (during development):

```bash
npx openapi-typescript ../../swagger-openapi.json --watch src/types/api.ts
```

**Using Generated Types** (`services/api.ts`):

```typescript
import { paths } from "../types/api";

type Adventure =
  paths["/adventures/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export const api = {
  adventures: {
    list: async (): Promise<Adventure[]> => {
      const response = await fetch(`${API_URL}/adventures`);
      return response.json();
    },
  },
};
```

**Environment Variable** (`vite.config.ts`):

```typescript
export default defineConfig({
  define: {
    __API_URL__: JSON.stringify(
      process.env.VITE_API_URL || "http://localhost:5000",
    ),
  },
  // ...
});
```

### Alternatives Considered

| Alternative                    | Why Rejected                                         |
| ------------------------------ | ---------------------------------------------------- |
| OpenAPI Generator (Java-based) | Heavyweight setup, overkill for types only           |
| Manual type writing            | Error-prone; defeats purpose of OpenAPI contract     |
| Axios auto-types               | Limited; doesn't handle complex OpenAPI schemas      |
| GraphQL Code Generator         | Requires GraphQL schema; REST API is already defined |

---

## 6. React Accessibility (WCAG AA Compliance)

### Decision

Implement full WCAG AA compliance through:

1. **Semantic HTML**: Use native elements (button, input, dialog)
2. **ARIA Labels**: Only when semantic HTML is insufficient (use `useId()`)
3. **Keyboard Navigation**: Full Tab, Arrow, Enter, Escape support
4. **Focus Management**: Visible focus indicators, focus traps in modals
5. **Color Contrast**: 4.5:1 ratio for normal text, 3:1 for large text

### Rationale

- Legal requirement in many jurisdictions
- Text-based adventures benefit most from screen reader support
- Keyboard navigation enables play for users with motor disabilities
- Improves usability for all users

### Implementation Details

**Semantic Components** (`components/AdventureCard.tsx`):

```typescript
export default function AdventureCard({ adventure, onSelect, onDelete }: Props) {
  return (
    <article className="p-4 border rounded-lg hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500">
      <h2 className="text-xl font-bold">{adventure.name}</h2>
      <time dateTime={adventure.createdAt}>
        Created: {format(adventure.createdAt, 'PPP')}
      </time>

      {/* Properly labeled button with accessible delete pattern */}
      <button
        onClick={() => onDelete(adventure.id)}
        aria-label={`Delete adventure: ${adventure.name}`}
        className="px-3 py-2 text-sm rounded-md bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Delete
      </button>
    </article>
  );
}
```

**Accessible Forms** (`components/CreateAdventureForm.tsx`):

```typescript
import { useId } from 'react';

export default function CreateAdventureForm({ onSubmit }: Props) {
  const nameId = useId();
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = nameInputRef.current?.value;

    if (!name) {
      setError('Adventure name is required');
      nameInputRef.current?.focus();
      return;
    }

    onSubmit(name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={nameId} className="block font-medium text-gray-700">
        Adventure Name
      </label>
      <input
        id={nameId}
        ref={nameInputRef}
        type="text"
        maxLength={100}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${nameId}-error` : undefined}
        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && (
        <p id={`${nameId}-error`} className="text-red-600 text-sm mt-1">
          {error}
        </p>
      )}
      <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Create Adventure
      </button>
    </form>
  );
}
```

**Focus Management in Dialogs** (`components/ConfirmDialog.tsx`):

```typescript
import FocusLock from 'react-focus-lock';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <FocusLock>
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
          className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full"
        >
          <h2 id="dialog-title" className="text-xl font-bold mb-4">
            {title}
          </h2>
          <p id="dialog-description" className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Confirm
            </button>
          </div>
        </div>
      </FocusLock>
    </div>
  );
}
```

**Color Contrast Testing**:

- Use Tailwind's built-in palette: `text-white dark:text-gray-900` on `bg-blue-600`
- Test with WebAIM Contrast Checker
- Enable `prefers-contrast` media feature in Tailwind config

**Keyboard Navigation**:

- All interactive elements reachable via Tab
- Enter/Space activates buttons
- Escape closes modals and dialogs
- Arrow keys navigate lists (optional enhancement)

### Alternatives Considered

| Alternative                      | Why Rejected                                                 |
| -------------------------------- | ------------------------------------------------------------ |
| Manual WCAG testing              | Error-prone; automated tools + manual spot-check preferred   |
| Headless UI library              | Adds dependency; React's semantic HTML + Tailwind sufficient |
| Skip automated contrast checking | WCAG AA compliance non-negotiable per constitution           |

---

## Implementation Timeline & Dependencies

### Phase 1 (Design)

- [x] Technology research completed
- [ ] Generate data-model.md
- [ ] Create API contracts (OpenAPI schemas)
- [ ] Generate quickstart guide

### Phase 2 (Development)

- [ ] Set up Vite project scaffold
- [ ] Generate TypeScript types from OpenAPI
- [ ] Implement core components with accessibility
- [ ] Add comprehensive unit/component tests (Vitest + React Testing Library)
- [ ] Performance profiling (<3s initial load, <200ms API calls)

### Dependencies to Install

```bash
# Core
npm install react@18 react-dom@18 react-router-dom@6

# State management & data fetching
npm install @tanstack/react-query@5

# Styling
npm install -D tailwindcss@4 postcss autoprefixer

# Build & dev
npm install -D vite@7 typescript@5.9 @vitejs/plugin-react

# Testing
npm install -D vitest @testing-library/react @testing-library/user-event

# Accessibility
npm install react-focus-lock

# Code generation
npm install -D openapi-typescript

# Environmental config
npm install dotenv
```

---

## Unknowns Resolved

✅ **React 18 + Vite setup**: Use `react-jsx` transform, Vite v7 with optimized deps  
✅ **TanStack Query v5**: 5-min stale time, cursor-based pagination for 100+ items  
✅ **React Router v6**: JSX routes with loader data prefetching  
✅ **Tailwind CSS**: Mobile-first with extended breakpoints (320px-2560px+)  
✅ **OpenAPI TypeScript**: Use `openapi-typescript` pre-build script  
✅ **Accessibility**: Semantic HTML + ARIA labels + focus management

---

**Status**: Ready for Phase 1 Design (data-model.md, contracts/, quickstart.md)
