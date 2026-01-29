# Adventure Dashboard SPA - Research Findings

## 1. React 18 + Vite + TypeScript Best Practices

### 1.1 Essential Vite Config Options for React SPAs

**Decision:** Use Vite v7 with optimized React-specific configuration including:

- HMR client type declarations in `tsconfig.json`
- React-specific ESLint configuration
- Disabled sourcemaps for production builds
- Optimized dependency pre-bundling

**Rationale:**

- Vite provides instant HMR (Hot Module Replacement) for React development
- v7 is the latest stable version (Benchmark Score: 76.9)
- TypeScript integration is built-in with proper type definitions
- Production builds automatically optimized with Rollup

**Vite Config Essentials:**

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

**Build Configuration:**

```javascript
export default defineConfig({
  build: {
    sourcemap: false, // Disable sourcemaps for production
    minify: "terser", // Efficient minification
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"],
  },
});
```

**Alternatives Considered:**

- Next.js: More complex, unnecessary for SPA (better for SSR/SSG)
- Webpack: Slower DX compared to Vite's instant HMR
- esbuild alone: Lacks best practices for SPAs

---

### 1.2 TypeScript with React 18 in Vite Projects

**Decision:** Implement TypeScript 5.9+ with React 18 component interfaces, explicit children typing, and type-aware lint rules.

**Rationale:**

- React 18 requires explicit `children?: React.ReactNode` declarations
- TypeScript 5.9+ provides better type inference for hooks
- Type-aware ESLint rules catch errors at development time
- Prevents prop-related runtime errors

**Implementation Pattern:**

```typescript
// Use interfaces for component props
interface MyButtonProps {
  title: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

function MyButton({ title, disabled = false, children }: MyButtonProps) {
  return <button disabled={disabled}>{title || children}</button>;
}
```

**ESLint Configuration:**

```javascript
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      reactX.configs["recommended-typescript"],
      reactDom.configs.recommended,
    ],
  },
]);
```

**Alternatives Considered:**

- PropTypes: Deprecated pattern, runtime overhead
- Zod/Runtime validation: Adds complexity for frontend
- Untyped components: Loses type safety benefits

---

### 1.3 Recommended Folder Structure for Component Organization

**Decision:** Use feature-based structure with collocated styles, tests, and types.

**Rationale:**

- Matches React's component composition model
- Scalability: Easy to move/delete features
- Improved developer experience: All related files in one directory
- Supports both small and large features

**Recommended Structure:**

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.types.ts
│   │   │   └── index.ts
│   │   └── Card/
│   ├── features/
│   │   ├── AdventureList/
│   │   │   ├── AdventureList.tsx
│   │   │   ├── AdventureListItem.tsx
│   │   │   ├── AdventureList.test.tsx
│   │   │   ├── useAdventures.ts
│   │   │   └── index.ts
│   │   └── AdventureMap/
│   └── layouts/
│       ├── DashboardLayout.tsx
│       └── AuthLayout.tsx
├── hooks/
│   ├── useAdventures.ts
│   ├── useCharacter.ts
│   └── usePagination.ts
├── services/
│   ├── api.ts
│   ├── adventureService.ts
│   └── characterService.ts
├── types/
│   ├── adventure.ts
│   ├── character.ts
│   └── api.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── store/
│   └── queryClient.ts
├── App.tsx
└── main.tsx
```

**Alternatives Considered:**

- Flat structure: Doesn't scale beyond 10-15 components
- Domain-based (by API module): Works but less intuitive for UI features
- Type of file structure (components/, hooks/, utils/): Harder to locate related code

---

## 2. TanStack Query (React Query) for Adventure Data Fetching

### 2.1 Best Practices for Setting Up TanStack Query v5 in React 18

**Decision:** Configure QueryClientProvider at app root with optimized default options for adventure data with 5-minute stale time and 10-minute cache time.

**Rationale:**

- Centralized query cache management
- v5 has native TypeScript support (Code Snippets: 1664)
- Default options prevent unnecessary refetches
- Adventure data is relatively stable (5-minute stale acceptable)

**Setup Pattern:**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes (cacheTime in v4)
      retry: 2,
      refetchOnWindowFocus: 'stale',   // Only refetch if stale
    },
    mutations: {
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  )
}
```

**Alternatives Considered:**

- Redux: Overkill for server state management
- Zustand: Better for client state, not server state
- SWR: Simpler but less feature-rich than TanStack Query

---

### 2.2 Handling Loading States and Skeleton Screens with useQuery

**Decision:** Use `useQuery` status variants (`isPending`, `isError`, `isFetching`, `isPlaceholderData`) with `keepPreviousData` for smooth transitions.

**Rationale:**

- `isPending` detects initial load (show skeleton)
- `isError` handles failures gracefully
- `isFetching` indicates background updates
- `keepPreviousData` prevents UI jumps during pagination
- Better UX than showing loading spinners

**Implementation:**

```typescript
import { keepPreviousData, useQuery } from '@tanstack/react-query'

function AdventureList() {
  const [page, setPage] = useState(0)

  const {
    isPending,
    isError,
    error,
    data,
    isFetching,
    isPlaceholderData
  } = useQuery({
    queryKey: ['adventures', page],
    queryFn: () => fetchAdventures(page),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })

  if (isPending) return <AdventureListSkeleton />
  if (isError) return <ErrorMessage error={error} />

  return (
    <>
      <AdventureCards adventures={data?.items} />
      {isFetching && <LoadingIndicator />}
    </>
  )
}

// Skeleton Component Pattern
function AdventureListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  )
}
```

**Alternatives Considered:**

- Always show spinners: Poor UX, feels slower
- Progressive image loading: Better for images, not entire cards
- Server-side pagination: Increases API calls and complexity

---

### 2.3 Pagination Patterns for 100+ Adventures

**Decision:** Implement cursor-based pagination with `keepPreviousData` and prefetching for seamless infinite scroll or page-by-page navigation.

**Rationale:**

- Cursor-based pagination is more efficient than offset for large datasets
- Prefetching the next page improves perceived performance
- Works with both finite pagination and infinite scroll
- Prevents gaps in data when new adventures are added

**Cursor-Based Pagination Pattern:**

```typescript
const { data, status, isFetching, isPlaceholderData } = useQuery({
  queryKey: ["adventures", pageNum],
  queryFn: () => fetchAdventures({ page: pageNum }),
  placeholderData: keepPreviousData,
  staleTime: 5 * 60 * 1000,
});

// Prefetch next page
useEffect(() => {
  if (!isPlaceholderData && data?.hasMore) {
    queryClient.prefetchQuery({
      queryKey: ["adventures", pageNum + 1],
      queryFn: () => fetchAdventures({ page: pageNum + 1 }),
      staleTime: 5 * 60 * 1000,
    });
  }
}, [data, isPlaceholderData, pageNum, queryClient]);
```

**Infinite Scroll with useInfiniteQuery:**

```typescript
const { data, status, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ["adventures"],
    queryFn: ({ pageParam = 1 }) => fetchAdventures({ page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    staleTime: 5 * 60 * 1000,
  });
```

**Alternatives Considered:**

- Offset pagination: Slower for large datasets, prone to duplicates
- Client-side pagination of fetched data: Requires loading all 100+ upfront
- Relay-style cursor: More complex for adventures API

---

### 2.4 Cache Invalidation Strategy for CRUD Operations

**Decision:** Use `queryClient.invalidateQueries()` with partial query key matching after mutations, combined with `onSuccess` callbacks.

**Rationale:**

- Ensures fresh data after create/update/delete
- Partial key matching catches related queries efficiently
- `Promise.all()` waits for refetches before marking mutation complete
- Maintains data consistency across app

**Pattern for Create/Update/Delete:**

```typescript
const queryClient = useQueryClient();

// Create adventure
const createMutation = useMutation({
  mutationFn: (newAdventure) => createAdventure(newAdventure),
  onSuccess: async (data) => {
    // Invalidate adventures list to refetch
    await queryClient.invalidateQueries({
      queryKey: ["adventures"],
    });
    // Update specific adventure if loaded
    queryClient.setQueryData(["adventure", data.id], data);
  },
});

// Update adventure
const updateMutation = useMutation({
  mutationFn: ({ id, updates }) => updateAdventure(id, updates),
  onSuccess: async (data) => {
    // Invalidate both list and specific adventure
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["adventures"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["adventure", data.id],
      }),
    ]);
    // Optionally update cache immediately
    queryClient.setQueryData(["adventure", data.id], data);
  },
});

// Delete adventure
const deleteMutation = useMutation({
  mutationFn: (adventureId) => deleteAdventure(adventureId),
  onSuccess: async () => {
    // Clear all adventures queries
    await queryClient.invalidateQueries({
      queryKey: ["adventures"],
    });
  },
});
```

**Optimistic Updates (Advanced):**

```typescript
const mutation = useMutation({
  mutationFn: (updates) => updateAdventure(id, updates),
  onMutate: async (updates) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: ["adventure", id],
    });
    // Snapshot previous data
    const previous = queryClient.getQueryData(["adventure", id]);
    // Optimistically update cache
    queryClient.setQueryData(["adventure", id], (old) => ({
      ...old,
      ...updates,
    }));
    return { previous };
  },
  onError: (err, updates, context) => {
    // Revert on error
    queryClient.setQueryData(["adventure", id], context.previous);
  },
  onSettled: () => {
    // Refetch regardless
    queryClient.invalidateQueries({
      queryKey: ["adventure", id],
    });
  },
});
```

**Alternatives Considered:**

- Manual refetch: Error-prone, doesn't scale
- Polling: Wasteful for data that changes infrequently
- WebSockets: Overkill for this use case, adds complexity

---

## 3. React Router v6 for SPA Routing

### 3.1 Recommended Setup for Nested Routes and Protected Routes

**Decision:** Use JSX-based `createRoutesFromElements` with `createBrowserRouter` for type-safe nested routes and protect with layout-based guards.

**Rationale:**

- JSX matches React component paradigm
- Nested routes create layout hierarchy visually
- Layout-based guards (AuthLayout) are cleaner than route wrappers
- Works seamlessly with TanStack Query loaders
- v6 architecture is stable and well-documented (Code Snippets: 6823)

**Nested Routes with Authentication Pattern:**

```typescript
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      {/* Public routes */}
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />

      {/* Public auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" index element={<DashboardHome />} />

          {/* Nested adventures feature */}
          <Route path="adventures">
            <Route index element={<AdventureList />} />
            <Route path=":id" element={<AdventureDetail />} />
            <Route path="new" element={<CreateAdventure />} />
            <Route path=":id/edit" element={<EditAdventure />} />
          </Route>

          {/* Nested character routes */}
          <Route path="characters">
            <Route index element={<CharacterList />} />
            <Route path=":id" element={<CharacterDetail />} />
          </Route>

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Route>
  )
)

export function App() {
  return <RouterProvider router={router} />
}
```

**Protected Route Component:**

```typescript
function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
```

**Alternatives Considered:**

- Flat routing: Doesn't express layout hierarchy
- Dynamic route generation: Less type-safe
- Higher-order components: More verbose for React Router v6

---

### 3.2 Integration Pattern with TanStack Query

**Decision:** Use React Router loaders to prefetch queries before route transition, with errors thrown from loaders becoming `LoaderFunctionArgs`.

**Rationale:**

- Data loads in parallel with route transition
- Users see full page when route completes
- Error boundaries catch loader failures
- Type-safe with TanStack Query queryClient

**Loader Integration Pattern:**

```typescript
// Create queryClient for loaders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

// Adventure list loader - prefetch with pagination
async function adventureListLoader({ searchParams }) {
  const page = parseInt(searchParams.get('page')) || 0
  return queryClient.ensureQueryData({
    queryKey: ['adventures', page],
    queryFn: () => adventureService.getAdventures({ page }),
    staleTime: 5 * 60 * 1000,
  })
}

// Adventure detail loader - ensure data before rendering
async function adventureDetailLoader({ params }) {
  const { id } = params
  return queryClient.ensureQueryData({
    queryKey: ['adventure', id],
    queryFn: () => adventureService.getAdventure(id),
    staleTime: 5 * 60 * 1000,
  })
}

// Error handling for loaders
async function authMiddleware({ request, context }) {
  const session = await getSession(request)
  const userId = session.get('userId')

  if (!userId) {
    throw redirect('/login')
  }

  const user = await getUserById(userId)
  context.set(userContext, user)
}

// Update router with loaders
<Route
  path="adventures"
  element={<AdventureList />}
  loader={adventureListLoader}
/>
<Route
  path="adventures/:id"
  element={<AdventureDetail />}
  loader={adventureDetailLoader}
  errorElement={<ErrorPage />}
/>
```

**Component Usage with useLoaderData:**

```typescript
function AdventureDetail() {
  const initialData = useLoaderData() // Type-safe initial data
  const { data } = useQuery({
    queryKey: ['adventure', params.id],
    queryFn: () => adventureService.getAdventure(params.id),
    initialData, // Use loader data as initial state
  })

  return <DetailView adventure={data} />
}
```

**Alternatives Considered:**

- Suspense boundaries: Not fully integrated with React Router v6 yet
- Component-level loading: Data loads after render (slower UX)
- Separate useQuery in component: Duplicates fetch logic

---

### 3.3 Handling Loading States During Navigation

**Decision:** Use React Router's `useNavigation()` hook combined with `isPending` state for full page transitions and TanStack Query's `isFetching` for background updates.

**Rationale:**

- `useNavigation()` tells you about route transitions
- Separates page-level loading from query-level loading
- Allows different UI for "loading new page" vs "refreshing data"
- Improves perceived performance

**Implementation:**

```typescript
import { useNavigation } from 'react-router-dom'

function DashboardLayout() {
  const navigation = useNavigation()
  const isPageLoading = navigation.state === 'loading'

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {isPageLoading && <PageLoadingBar />}
        <Outlet />
      </main>
    </div>
  )
}

// Adventure list with navigation state
function AdventureList() {
  const navigation = useNavigation()
  const { data, isFetching } = useQuery({
    queryKey: ['adventures', page],
    queryFn: () => fetchAdventures(page),
  })

  const isPageLoading = navigation.state === 'loading'

  return (
    <>
      {/* Full-page skeleton during navigation */}
      {isPageLoading && <AdventureListSkeleton />}

      {/* Background refetch indicator */}
      {isFetching && !isPageLoading && (
        <RefreshingBadge />
      )}

      {/* Actual content */}
      {!isPageLoading && (
        <>
          <AdventureCards adventures={data?.items} />
          <Pagination />
        </>
      )}
    </>
  )
}
```

**Alternatives Considered:**

- Global loading state: Less precise, harder to manage
- Per-route loading: More boilerplate
- Suspense: Not fully stable for all use cases in v6

---

## 4. Tailwind CSS for Responsive Mobile-First Design

### 4.1 Breakpoints for 320px to 2560px+ Support

**Decision:** Extend Tailwind v3 default breakpoints to include extra-small (320px) and ultra-wide (2560px+) screens.

**Rationale:**

- Default breakpoints miss mobile-first edge cases (320px phones)
- Ultra-wide display support increasingly important
- Mobile-first ensures solid base for all devices
- Tailwind benefits from custom breakpoint definitions

**Configuration:**

```javascript
// tailwind.config.js
export default {
  theme: {
    screens: {
      xs: "320px", // Extra small phones (iPhone SE, older models)
      sm: "640px", // Small phones (default sm)
      md: "768px", // Tablets (default md)
      lg: "1024px", // Small laptops (default lg)
      xl: "1280px", // Laptops (default xl)
      "2xl": "1536px", // Large laptops (default 2xl)
      "3xl": "1920px", // Full HD displays
      "4xl": "2560px", // Ultra-wide (4K)
    },
  },
};
```

**Mobile-First Approach Example:**

```html
<!-- Base: Mobile (320px) -->
<div class="grid grid-cols-1 gap-4 p-3">
  <!-- Tablet (768px+) -->
  <div class="md:grid-cols-2 md:gap-6 md:p-4">
    <!-- Desktop (1024px+) -->
    <div class="lg:grid-cols-3 lg:gap-8 lg:p-6">
      <!-- Ultra-wide (2560px+) -->
      <div class="4xl:grid-cols-4 4xl:max-w-7xl 4xl:mx-auto">
        Adventure Card
      </div>
    </div>
  </div>
</div>
```

**Alternatives Considered:**

- Fixed layouts: Ignored responsive design principles
- Only default breakpoints: Poor experience on extreme screen sizes
- CSS media queries: Less maintainable than Tailwind approach

---

### 4.2 Touch Target Sizing (44x44px Minimum)

**Decision:** Use `h-11` and `w-11` (44x44px) as minimum for interactive elements, with `h-10 w-10` (40x40px) acceptable for grouped items.

**Rationale:**

- Apple HIG and WCAG AA recommend 44x44px minimum
- Prevents accidental clicks on small devices
- Accounts for fingers vs mouse pointers
- Improves mobile usability significantly

**Implementation:**

```html
<!-- Buttons and Links -->
<button class="h-11 w-11 rounded-lg flex items-center justify-center">
  <svg class="h-5 w-5" />
</button>

<!-- Icon buttons with label -->
<button class="h-11 px-4 rounded-lg flex items-center gap-2">
  <svg class="h-5 w-5" />
  <span>Action</span>
</button>

<!-- Form inputs and selects -->
<input class="h-11 px-3 rounded-lg border" type="text" />
<select class="h-11 px-3 rounded-lg border">
  <option>Select</option>
</select>

<!-- Grouped items (like tabs) - can be 40px -->
<button class="h-10 px-4 border-b-2">Tab</button>

<!-- Spacing around click targets -->
<div class="flex gap-3">
  <!-- Ensures adequate spacing for finger taps -->
  <button class="h-11 w-11">Click me</button>
  <button class="h-11 w-11">Don't overlap</button>
</div>
```

**Accessibility Sizing Map:**

```
xs: h-8  w-8  (32px)  - Desktop only, icon-only
sm: h-9  w-9  (36px)  - Desktop only, with label
base: h-10 w-10 (40px) - Grouped items, grouped buttons
md: h-11 w-11 (44px)  - Primary interactive elements
lg: h-12 w-12 (48px)  - Important actions, mobile forms
```

**Alternatives Considered:**

- No minimum: Fails WCAG AA compliance
- Larger padding: Makes compact UIs harder
- Variable sizing: Inconsistent experience

---

### 4.3 Accessibility Color Contrast with Tailwind Utilities

**Decision:** Use Tailwind's color palette with minimum WCAG AA contrast (4.5:1 for normal text, 3:1 for large text) and `prefers-contrast` media feature for users requesting more contrast.

**Rationale:**

- Tailwind colors meet AA standards out of box
- AAA (7:1) not necessary for adventure dashboard
- `prefers-contrast` respects user OS settings
- Reduces eye strain for users requesting it

**Configuration:**

```javascript
// tailwind.config.js - Ensure good default contrast
export default {
  theme: {
    colors: {
      // Define accessible color pairings
      text: {
        default: "#1f2937", // gray-900
        secondary: "#6b7280", // gray-500
        inverted: "#f9fafb", // gray-50
        disabled: "#d1d5db", // gray-300
      },
      bg: {
        primary: "#ffffff",
        secondary: "#f3f4f6", // gray-100
        dark: "#1f2937", // gray-900
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      // Add support for prefers-contrast
      addVariant("contrast-more", "@media (prefers-contrast: more)");
      addVariant("contrast-less", "@media (prefers-contrast: less)");
    },
  ],
};
```

**Usage Examples:**

```html
<!-- Standard contrast (4.5:1 ratio) -->
<h1 class="text-gray-900 bg-white">Adventure Title</h1>

<!-- Good contrast pair -->
<p class="text-gray-500 bg-white">Secondary text</p>

<!-- Enhanced contrast for users who prefer more -->
<button
  class="
  text-gray-900 bg-blue-600
  contrast-more:text-gray-900 contrast-more:bg-blue-700
  contrast-more:border-2 contrast-more:border-gray-900
"
>
  Adventure Button
</button>

<!-- Reduce contrast for motion sensitivity -->
<div
  class="
  opacity-100
  contrast-less:opacity-90
"
>
  Subtle overlay
</div>

<!-- Dark mode with proper contrast -->
<div
  class="
  bg-white text-gray-900
  dark:bg-gray-900 dark:text-gray-50
"
>
  Maintains 4.5:1+ contrast in both modes
</div>

<!-- Disabled state with poor contrast intentional -->
<button disabled class="text-gray-400 bg-gray-100 cursor-not-allowed">
  Disabled button
</button>
```

**WCAG AA Contrast Checker - Tailwind Pairings:**

- ✅ gray-900 on white: 17.29:1 (AAA)
- ✅ gray-700 on white: 10.64:1 (AAA)
- ✅ gray-600 on white: 7.02:1 (AAA)
- ✅ gray-500 on white: 4.54:1 (AA)
- ✅ blue-600 on white: 4.54:1 (AA)
- ✅ white on gray-900: 17.29:1 (AAA)

**Alternatives Considered:**

- No contrast consideration: WCAG non-compliant
- AAA only: Too restrictive, poor design flexibility
- Custom colors: Risk of non-compliant combinations

---

## 5. Generating TypeScript Types from OpenAPI Specification

### 5.1 Tools for OpenAPI to TypeScript Code Generation

**Decision:** Use `openapi-typescript@latest` (not `openapi-ts`) for pure type generation with zero runtime overhead.

**Rationale:**

- Latest stable tool from community leaders (Benchmark Score: 75.7)
- Generates pristine TypeScript types from OpenAPI 3.0/3.1
- Integrates with `openapi-fetch` for type-safe requests
- Zero runtime impact (types only)
- Code Snippets: 265+ available examples

**Installation:**

```bash
npm install -D openapi-typescript typescript openapi-fetch
```

**Alternative Tools Comparison:**

```
openapi-typescript:  Type generation only, lightweight, recommended
openapi-ts (hey-api): Full SDK generation, more features, slower
tRPC codegen:       Not for OpenAPI specs
graphql-codegen:    For GraphQL, not REST APIs
```

---

### 5.2 Integration with Vite Build Pipeline

**Decision:** Add npm script to regenerate types before build, include in pre-commit hooks, and watch for schema changes during development.

**Rationale:**

- Automatic schema updates prevent stale types
- CI/CD catches type mismatches early
- Git hooks prevent commits with outdated types
- Watch mode enables local development workflow

**Setup:**

```json
{
  "scripts": {
    "api:generate": "openapi-typescript ./swagger-openapi.json -o ./src/types/api.d.ts",
    "api:watch": "node -e \"require('chokidar').watch('./swagger-openapi.json').on('change', () => { require('child_process').execSync('npm run api:generate') })\"",
    "build": "npm run api:generate && vite build",
    "dev": "npm run api:watch & vite dev",
    "test:ts": "tsc --noEmit"
  }
}
```

**Vite Plugin Alternative (Advanced):**

```typescript
// vite-plugin-openapi.ts
import { defineConfig } from "vite";
import { execSync } from "child_process";
import fs from "fs";

export function openapiPlugin() {
  return {
    name: "openapi-plugin",
    apply: "serve",
    configResolved(config) {
      // Watch OpenAPI spec
      if (config.command === "serve") {
        fs.watch("./swagger-openapi.json", () => {
          console.log("OpenAPI spec changed, regenerating types...");
          execSync("npm run api:generate");
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [openapiPlugin()],
});
```

**Git Hook Setup (Pre-commit):**

```bash
#!/bin/bash
# .husky/pre-commit
npm run api:generate
git add src/types/api.d.ts
```

**Alternatives Considered:**

- Manual type writing: Error-prone, doesn't scale
- Runtime validation only: Lost type safety benefits
- Weekly batch generation: Types go stale quickly

---

### 5.3 Handling Generated Type Updates in Development Workflow

**Decision:** Commit generated types to git (read-only directory), use semantic versioning for API, and update types before feature branches.

**Rationale:**

- Generated types are read-only artifacts (don't edit manually)
- Semantic API versioning prevents breaking changes unannounced
- Reduces merge conflicts when multiple devs regenerate
- Clear audit trail of API changes

**Workflow:**

```bash
# 1. Pull latest spec from API server
curl https://api.adventure.dev/openapi.json > swagger-openapi.json

# 2. Generate types
npm run api:generate

# 3. Run type checker
npm run test:ts

# 4. Commit types if changed
git add swagger-openapi.json src/types/api.d.ts
git commit -m "chore: update API types from OpenAPI spec v1.2.0"

# 5. Start feature work
git checkout -b feature/adventure-filters
```

**Generated Types Pattern:**

```typescript
// src/types/api.d.ts - AUTO-GENERATED, DO NOT EDIT
// This file is generated by openapi-typescript. Run: npm run api:generate

export interface Adventure {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAdventures {
  items: Adventure[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type CreateAdventureRequest = Omit<
  Adventure,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateAdventureRequest = Partial<CreateAdventureRequest>;
```

**API Service with Generated Types:**

```typescript
// src/services/adventureService.ts
import {
  Adventure,
  PaginatedAdventures,
  CreateAdventureRequest,
} from "@/types/api";

export const adventureService = {
  async getAdventures(page: number): Promise<PaginatedAdventures> {
    const res = await fetch(`/api/adventures?page=${page}`);
    return res.json();
  },

  async getAdventure(id: string): Promise<Adventure> {
    const res = await fetch(`/api/adventures/${id}`);
    return res.json();
  },

  async createAdventure(data: CreateAdventureRequest): Promise<Adventure> {
    const res = await fetch("/api/adventures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
```

**CI/CD Type Checking:**

```yaml
# .github/workflows/type-check.yml
name: Type Check
on: [push, pull_request]

jobs:
  types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm run api:generate
      - run: pnpm run test:ts
```

**Alternatives Considered:**

- Committing generated types: Merge conflicts on regeneration
- Runtime validation with Zod: Type duplication, increases bundle
- Manual type updates: Unmaintainable, error-prone

---

## 6. React Component Accessibility Best Practices

### 6.1 WCAG AA Compliance in Component Design

**Decision:** Achieve WCAG AA (level 2) compliance for all interactive components with focus on:

- Text contrast minimum 4.5:1
- Touch targets minimum 44x44px
- Keyboard navigation for all interactions
- Proper semantic HTML

**Rationale:**

- AA is industry standard for public-facing apps
- AAA (7:1 contrast) too restrictive for dash
- Covers 80% of accessibility needs
- Required for legal compliance in many jurisdictions

**Compliance Checklist:**

```
Visual Design:
✓ Color contrast 4.5:1+ for normal text
✓ Color contrast 3:1+ for large text (18pt+)
✓ No color alone conveys information
✓ Focus indicators visible (2px, high contrast)
✓ Touch targets 44x44px minimum

Interaction:
✓ All features keyboard accessible
✓ Tab order logical and complete
✓ No keyboard traps
✓ Skip to main content link

Content:
✓ Form labels associated with inputs
✓ Error messages clear and specific
✓ Instructions for complex interactions
✓ Meaningful alt text for images

Code:
✓ Semantic HTML elements
✓ Proper heading hierarchy (h1-h6)
✓ ARIA labels where semantic HTML insufficient
✓ Live regions for dynamic content
```

**Component Audit Template:**

```typescript
// Example: AdventureCard component audit
export function AdventureCard({ adventure }: { adventure: Adventure }) {
  return (
    <article          // ✓ Semantic HTML
      className="
        focus-visible:outline-2 outline-offset-2 outline-blue-600  // ✓ Focus style
        h-44           // ✓ Touch target sized
        p-4
        rounded-lg
      "
      role="link"     // Only if not using <a> tag
      tabIndex={0}    // ✓ Keyboard accessible
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigate(`/adventures/${adventure.id}`)
        }
      }}
    >
      <h3 className="text-gray-900">{adventure.name}</h3>  {/* ✓ Heading hierarchy */}
      <p className="text-gray-600">{adventure.description}</p>

      <div className="flex gap-3 mt-2">
        <span className="text-sm font-semibold text-gray-900">
          Difficulty:
        </span>
        <span className="text-sm text-gray-700">
          {adventure.difficulty}  {/* ✓ Not just color */}
        </span>
      </div>
    </article>
  )
}
```

**Alternatives Considered:**

- No accessibility: Legal liability, excludes users
- AAA compliance: Overly restrictive, diminishes design
- Accessibility last: Much harder to retrofit

---

### 6.2 ARIA Labels and Semantic HTML with React

**Decision:** Prefer semantic HTML (`<button>`, `<input>`, `<label>`, `<nav>`, `<article>`) over generic `<div>` with ARIA. Use ARIA (`aria-label`, `aria-describedby`) only when semantic HTML insufficient.

**Rationale:**

- Semantic HTML provides accessibility "for free"
- ARIA is supplement, not replacement
- Reduces maintenance burden
- Better screen reader support with semantics
- Matches React component paradigm

**Semantic HTML Best Practices:**

```typescript
// ✅ GOOD: Use semantic elements
export function AdventureFilters() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>()

  return (
    <aside>  {/* Indicates filter section */}
      <form>
        <fieldset>  {/* Groups related inputs */}
          <legend>Filter by Difficulty</legend>

          <div className="space-y-2">
            <label htmlFor="diff-easy">
              <input
                id="diff-easy"
                type="radio"
                name="difficulty"
                value="easy"
                onChange={(e) => setDifficulty(e.target.value as 'easy')}
              />
              Easy
            </label>

            <label htmlFor="diff-medium">
              <input
                id="diff-medium"
                type="radio"
                name="difficulty"
                value="medium"
              />
              Medium
            </label>
          </div>
        </fieldset>

        <button type="submit">Apply Filters</button>
        <button type="reset">Clear Filters</button>
      </form>
    </aside>
  )
}

// ✅ GOOD: Form validation with semantic association
export function CreateAdventure() {
  const [error, setError] = useState<string>()
  const errorId = useId()

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="adventure-name">Adventure Name</label>
      <input
        id="adventure-name"
        type="text"
        aria-describedby={error ? errorId : undefined}
        className={error ? 'border-red-500' : ''}
      />

      {error && (
        <p id={errorId} role="alert" className="text-red-600">
          {error}
        </p>
      )}

      <button type="submit">Create Adventure</button>
    </form>
  )
}

// ❌ BAD: Generic divs without ARIA
export function BrokenAdventureCard() {
  return (
    <div
      onClick={handleClick}  // Not keyboard accessible!
      className="cursor-pointer border p-4"
    >
      <div className="text-lg font-bold">Adventure</div>
      <div className="text-sm">Description</div>
    </div>
  )
}
```

**When to Use ARIA:**

```typescript
// ✅ ARIA for icon-only buttons (when no label visible)
export function IconButton({ icon: Icon, label }: IconButtonProps) {
  return (
    <button aria-label={label} className="h-11 w-11 flex items-center justify-center">
      <Icon className="h-5 w-5" />
    </button>
  )
}

// ✅ ARIA for complex widgets (custom date picker, etc.)
export function CustomDatePicker() {
  const inputId = useId()
  const popupId = useId()

  return (
    <>
      <input
        id={inputId}
        aria-describedby={popupId}
        aria-expanded={isOpen}
        aria-controls={popupId}
      />
      <div id={popupId} role="dialog" aria-label="Select date">
        {/* Date picker UI */}
      </div>
    </>
  )
}

// ✅ ARIA for live regions (notifications, loading states)
export function AdventureList() {
  const { data, isFetching } = useQuery({
    queryKey: ['adventures'],
    queryFn: fetchAdventures,
  })

  return (
    <>
      <div aria-live="polite" aria-atomic="true" role="region">
        {isFetching && 'Loading adventures...'}
      </div>

      <div role="list">
        {data?.map((adventure) => (
          <AdventureCard key={adventure.id} adventure={adventure} />
        ))}
      </div>
    </>
  )
}
```

**Semantic HTML Element Reference:**

```
<button>         - Interactive actions
<a>              - Navigation links (href required)
<input>          - Form inputs
<label>          - Form labels (htmlFor + id pairing)
<fieldset>       - Groups related form inputs
<legend>         - Label for fieldset
<nav>            - Navigation section
<main>           - Primary content
<article>        - Self-contained content
<section>        - Content grouping
<aside>          - Sidebar/filters
<header>         - Page/section header
<footer>         - Page/section footer
<form>           - Form container
<select>         - Dropdown menus
<textarea>       - Multi-line text input
```

**Alternatives Considered:**

- ARIA for everything: Overly complex, error-prone
- No HTML semantics: Requires extensive ARIA
- Global role override: Defeats accessibility

---

### 6.3 Keyboard Navigation Implementation

**Decision:** Support full keyboard navigation via Tab, Enter/Space for actions, Arrow keys for lists, and Escape to close modals. Use `focus-visible` for visible focus indicators.

**Rationale:**

- 1 in 20 people rely on keyboard navigation (accessibility.com)
- Motor disabilities, injuries, or preference
- Better for power users
- Enables voice control (which uses keyboard synthesizing)

**Global Keyboard Shortcuts Pattern:**

```typescript
// hooks/useKeyboardShortcut.ts
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { ctrlKey?: boolean; shiftKey?: boolean }
) {
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (
        e.key === key &&
        (!options?.ctrlKey || e.ctrlKey) &&
        (!options?.shiftKey || e.shiftKey)
      ) {
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [key, callback, options])
}

// Usage
export function DashboardLayout() {
  const navigate = useNavigate()

  useKeyboardShortcut('n', () => navigate('/adventures/new'))
  useKeyboardShortcut('/', () => {
    // Focus search
  })

  return <Layout />
}
```

**List Navigation with Arrow Keys:**

```typescript
// components/AdventureList.tsx
export function AdventureList() {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const { data } = useQuery({
    queryKey: ['adventures'],
    queryFn: fetchAdventures,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const itemCount = data?.length || 0

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        data?.[focusedIndex] && navigate(`/adventures/${data[focusedIndex].id}`)
        break
    }
  }

  return (
    <div
      ref={listRef}
      onKeyDown={handleKeyDown}
      role="listbox"
      className="focus:outline-none focus-visible:ring-2 ring-blue-600"
      tabIndex={0}
    >
      {data?.map((adventure, index) => (
        <AdventureCard
          key={adventure.id}
          adventure={adventure}
          isFocused={index === focusedIndex}
          onFocus={() => setFocusedIndex(index)}
          onKeyDown={handleKeyDown}
        />
      ))}
    </div>
  )
}
```

**Modal with Escape Key:**

```typescript
// components/AdventureModal.tsx
export function AdventureModal({ isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Focus trap: keep focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleTab)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
    }
  }, [isOpen, onClose])

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg p-6 max-w-md">
        {/* Modal content */}
      </div>
    </div>
  )
}
```

**Focus Management Example:**

```typescript
// components/Pagination.tsx
export function Pagination({ page, onPageChange }: PaginationProps) {
  const prevButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  // Move focus when page changes (announcement for screen readers)
  const handlePageChange = (newPage: number) => {
    onPageChange(newPage)
    // Move focus to first item on new page for context
    document.querySelector('main')?.focus()
  }

  return (
    <nav className="flex gap-2 mt-6" aria-label="Pagination">
      <button
        ref={prevButtonRef}
        disabled={page === 0}
        onClick={() => handlePageChange(page - 1)}
        className="
          h-11 px-4
          focus-visible:outline-2 outline-blue-600 outline-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label={`Go to page ${page}`}
      >
        Previous
      </button>

      <span className="h-11 flex items-center px-3">
        Page {page + 1}
      </span>

      <button
        ref={nextButtonRef}
        onClick={() => handlePageChange(page + 1)}
        className="
          h-11 px-4
          focus-visible:outline-2 outline-blue-600 outline-offset-2
        "
        aria-label={`Go to page ${page + 2}`}
      >
        Next
      </button>
    </nav>
  )
}
```

**Focus Visible Tailwind Utility:**

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      outline: {
        blue: "2px solid rgb(37, 99, 235)",
      },
    },
  },
};

// In components:
// className="focus:outline-blue focus-visible:outline-blue"
// focus: applied when input receives focus (even via mouse)
// focus-visible: applied only on keyboard/programmatic focus
```

**Alternatives Considered:**

- No keyboard support: Excludes many users
- Tab only: Works but limits power user efficiency
- Custom focus traps: Hard to maintain correctly

---

### 6.4 Focus Management in Modals and Forms

**Decision:** Implement focus traps for modals, restore focus on close, and manage focus during form submissions.

**Rationale:**

- Prevents keyboard users from tabbing outside modal
- Accessible pattern for all modal libraries
- Improves experience for screen reader users
- Prevents accidental interactions with background content

**Modal Focus Management:**

```typescript
// hooks/useFocusTrap.ts
export function useFocusTrap(isActive: boolean, ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isActive || !ref.current) return

    const element = ref.current
    const previousActiveElement = document.activeElement as HTMLElement

    // Auto-focus first interactive element
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)

    // Restore focus on unmount
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [isActive, ref])
}

// Usage
export function AdventureModal({ isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(isOpen, modalRef)

  if (!isOpen) return null

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  )
}
```

**Form Submission Focus Management:**

```typescript
// components/CreateAdventureForm.tsx
export function CreateAdventureForm({ onSuccess }: FormProps) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string>()
  const formRef = useRef<HTMLFormElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')

    try {
      const formData = new FormData(formRef.current!)
      const response = await createAdventure(Object.fromEntries(formData))

      setStatus('success')

      // Focus success message for screen readers
      alertRef.current?.focus()
      onSuccess()
    } catch (err) {
      setError(err.message)
      setStatus('error')

      // Focus error message so screen reader announces it
      alertRef.current?.focus()
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {status === 'error' && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {status === 'success' && (
        <div
          ref={alertRef}
          role="status"
          tabIndex={-1}
          className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-4"
        >
          Adventure created successfully!
        </div>
      )}

      {/* Form fields */}
      <label htmlFor="name">Name</label>
      <input id="name" type="text" name="name" required />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" />

      <button
        ref={submitButtonRef}
        type="submit"
        disabled={status === 'pending'}
        className="h-11 px-6 bg-blue-600 text-white rounded-lg focus-visible:outline-2 outline-offset-2 outline-blue-800 disabled:opacity-50"
        aria-busy={status === 'pending'}
      >
        {status === 'pending' ? 'Creating...' : 'Create Adventure'}
      </button>
    </form>
  )
}
```

**Skip Links for Keyboard Navigation:**

```typescript
// components/SkipLink.tsx - Always render, visually hidden until focused
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        absolute -top-40
        bg-blue-600 text-white px-4 py-2 rounded
        focus:top-4
        focus:left-4
        z-50
      "
    >
      Skip to main content
    </a>
  )
}

// In layout:
<SkipLink />
<Header />
<Sidebar />
<main id="main-content" tabIndex={-1}>
  {/* Page content */}
</main>
```

**Alternatives Considered:**

- No focus management: Screen readers confused
- Always trap focus in forms: Breaks power user workflows
- Moving focus without announcement: Disorienting

---

## Summary

These findings provide a comprehensive research-backed approach to building a React 18 adventure dashboard SPA. The recommendations balance:

- **Developer Experience**: Fast iteration with Vite HMR, type safety, organized structure
- **Performance**: Query caching, pagination, code splitting via React Router
- **User Experience**: Loading states, prefetching, responsive design
- **Accessibility**: WCAG AA compliance, keyboard navigation, semantic HTML

Each decision includes alternatives considered and specific code examples for implementation.
