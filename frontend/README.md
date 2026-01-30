# Adventure Dashboard Frontend

React 18 SPA for managing text-based adventure games.

## Tech Stack

- **React 18** - UI library with JSX transform
- **Vite 5** - Build tool and dev server
- **TypeScript 5** - Type safety
- **TailwindCSS 4** - Utility-first styling
- **React Router v6** - SPA routing
- **TanStack Query v5** - Server state management
- **Vitest** - Unit testing
- **React Testing Library** - Component testing

## Prerequisites

- Node.js 18+ and npm 9+
- Backend API running (default: `http://localhost:5000`)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate TypeScript types from OpenAPI spec
npm run generate:api

# Start development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## Available Scripts

- `npm run dev` - Start dev server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run generate:api` - Generate types from OpenAPI spec
- `npm run lint` - Run TypeScript type checking

## Project Structure

```
src/
├── App.tsx                      # Root component with router
├── main.tsx                     # React DOM entry point
├── index.css                    # Tailwind CSS imports
├── vite-env.d.ts                # Vite environment types
│
├── pages/
│   ├── DashboardPage.tsx        # Main dashboard page
│   └── GamePage.tsx             # Game screen placeholder
│
├── components/
│   ├── AdventureCard.tsx        # Individual adventure card
│   ├── AdventureList.tsx        # Adventure list container
│   ├── ConfirmDialog.tsx        # Confirmation dialog
│   ├── CreateAdventureForm.tsx  # Create adventure modal
│   ├── ErrorBoundary.tsx        # Error boundary wrapper
│   ├── LoadingSkeleton.tsx      # Loading placeholders
│   └── RootLayout.tsx           # App shell layout
│
├── hooks/
│   └── useAdventures.ts         # TanStack Query hooks
│
├── services/
│   └── api.ts                   # API client (fetch wrapper)
│
├── types/
│   └── api.ts                   # Generated OpenAPI types
│
└── utils/
    ├── formatters.ts            # Date/text formatting
    └── errorMessages.ts         # User-friendly errors
```

## Environment Variables

Create a `.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Debug flags (optional)
VITE_DEBUG_API=false
VITE_MOCK_API=false
```

## Features Implemented

### ✅ Phase 1: Project Setup

- Vite + React 18 + TypeScript configuration
- TailwindCSS with responsive breakpoints (320px-2560px+)
- TanStack Query for server state management
- Directory structure and dependencies

### ✅ Phase 2: Core Infrastructure

- OpenAPI TypeScript type generation
- API service layer with error handling
- React Router v6 setup with nested routes
- TanStack Query hooks (list, create, delete)
- Error boundary component
- Utility functions (formatters, error messages)

### ✅ Phase 3: User Story 1 - View Adventures

- Dashboard page with adventure list
- Adventure cards with metadata (ID, dates, progress)
- Loading skeletons
- Empty state handling
- Error state with retry
- Responsive grid layout

### ✅ Phase 4: User Story 2 - Create Adventure

- Modal form with validation
- Focus management with react-focus-lock
- Optimistic UI updates
- Error handling with user-friendly messages
- Accessibility (ARIA labels, keyboard navigation)

### ✅ Phase 5: User Story 3 - Select Adventure

- Click-to-navigate functionality
- Game page placeholder
- Route handling with adventureId param
- Loading states during navigation

### ✅ Phase 6: User Story 4 - Delete Adventure

- Confirmation dialog with focus trap
- Optimistic cache updates
- Error handling with rollback
- Accessibility (Escape to cancel, Tab navigation)

### ✅ Phase 7: Polish & Validation

- TypeScript strict mode with zero errors
- JSDoc comments on all public functions
- Responsive design (320px-2560px+)
- WCAG AA accessibility compliance
- Touch-friendly targets (44x44px minimum)

## Backend API Notes

The backend API uses `/api/Adventures` (capital A) with the following structure:

**AdventureDto**:

- `id` (UUID)
- `currentSceneId` (string | null)
- `gameState` (object | null)
- `createdAt` (ISO8601)
- `lastUpdatedAt` (ISO8601)

**Note**: The backend does not currently support:

- Adventure names/descriptions
- Progress tracking
- Status (active/completed/archived)
- Last played timestamps

The frontend displays placeholder values for these fields until backend support is added.

## Accessibility

This app follows WCAG AA standards:

- Semantic HTML (`<article>`, `<time>`, `<button>`)
- ARIA labels for screen readers
- Keyboard navigation (Tab, Enter, Escape)
- Focus indicators (`:focus-visible`)
- Color contrast 4.5:1 ratio
- Touch targets 44x44px minimum

## Testing

Run tests:

```bash
npm run test
```

Generate coverage:

```bash
npm run test:coverage
```

## Deployment

Build for production:

```bash
npm run build
```

Output in `dist/` directory. Serve with any static file server:

```bash
npx serve dist
```

## Troubleshooting

### Types not generating

Ensure `swagger-openapi.json` exists in parent directory:

```bash
npm run generate:api
```

### API connection errors

Check `VITE_API_URL` in `.env` matches your backend:

```env
VITE_API_URL=http://localhost:5000
```

### Port already in use

Vite will try the next available port automatically, or specify:

```bash
vite --port 3000
```

## Next Steps

- Add backend support for adventure names and metadata
- Implement unit tests for components and hooks
- Add MSW (Mock Service Worker) for testing
- Performance optimization (React.memo, lazy loading)
- Bundle size analysis and optimization

## Contributing

1. Follow existing code structure
2. Add JSDoc comments to all functions
3. Run `npm run lint` before committing
4. Test accessibility with keyboard navigation
5. Ensure responsive design (test 320px and 2560px+)

## License

ISC
