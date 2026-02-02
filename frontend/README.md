# Adventure Dashboard Frontend

React 18 SPA for managing text-based adventure games with integrated character management system.

## Tech Stack

- **React 18** - UI library with JSX transform
- **Vite 5** - Build tool and dev server
- **TypeScript 5** - Type safety with strict mode
- **TailwindCSS 4** - Utility-first styling
- **React Router v6** - SPA routing
- **TanStack Query v5** - Server state management with caching
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
│   ├── DashboardPage.tsx        # Main dashboard page with adventure list
│   ├── GamePage.tsx             # Game screen placeholder
│   ├── CharacterCreatePage.tsx  # Character creation form
│   ├── CharacterSheetPage.tsx   # Character view/display
│   ├── CharacterEditPage.tsx    # Character editing form
│   ├── CharacterListPage.tsx    # All characters management
│   └── CharacterSelectPage.tsx  # Adventure character selection
│
├── components/
│   ├── AdventureCard.tsx        # Individual adventure card
│   ├── AdventureList.tsx        # Adventure list container
│   ├── ConfirmDialog.tsx        # Confirmation dialog for destructive actions
│   ├── CreateAdventureForm.tsx  # Create adventure modal
│   ├── ErrorBoundary.tsx        # Error boundary wrapper
│   ├── LoadingSkeleton.tsx      # Loading placeholders
│   ├── RootLayout.tsx           # App shell layout
│   │
│   ├── CharacterForm.tsx        # Main character creation/edit form
│   ├── CharacterForm/
│   │   ├── AttributeInput.tsx   # Attribute value control
│   │   ├── ModifierDisplay.tsx  # Modifier badge component
│   │   ├── PointBuyMode.tsx     # Point-buy allocation UI
│   │   └── DiceRollMode.tsx     # Dice roll interface
│   │
│   ├── CharacterSheet.tsx       # Character display view
│   ├── CharacterSheet/
│   │   └── AttributeSection.tsx # Attributes grid display
│   │
│   ├── CharacterList.tsx        # Character list with search
│   ├── CharacterList/
│   │   └── CharacterListItem.tsx # Individual character in list
│   │
│   └── CharacterSelector.tsx    # Adventure character selection
│       └── CharacterSelector/
│           ├── CharacterPreviewCard.tsx
│           └── CharacterPreviewModal.tsx
│
├── hooks/
│   ├── useAdventures.ts         # TanStack Query hooks for adventures
│   ├── useCharacterForm.ts      # Form state management for characters
│   └── useDiceRoll.ts           # Dice roll logic hook
│
├── services/
│   ├── api.ts                   # Base HTTP client
│   ├── characterApi.ts          # Character API with React Query hooks
│   ├── attributeCalculator.ts   # D&D modifier calculations
│   └── diceRoller.ts            # Dice rolling utilities
│
├── types/
│   ├── character.ts             # Character interfaces and validation
│   └── api.ts                   # Generated OpenAPI types
│
└── utils/
    ├── formatters.ts            # Date/text formatting utilities
    ├── errorMessages.ts         # User-friendly error messages
    └── pointBuy.ts              # Point-buy validation and calculations
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

### ✅ Phase 1-2: Project Setup & Foundation

- Vite + React 18 + TypeScript strict mode configuration
- TailwindCSS with responsive breakpoints (320px-2560px+)
- TanStack Query for server state management and caching
- Directory structure and all dependencies installed
- Type definitions and API service layer
- React Router v6 with nested routing

### ✅ Phase 3: Character Management (User Stories 1-3)

**Create Characters (Point-Buy Mode)**

- 27-point budget allocation system (D&D 5E standard)
- Real-time budget and validation feedback
- Modifiers display <100ms (pure function calculation)
- Full support for all 5 D&D attributes (STR, DEX, INT, CON, CHA)

**Create Characters (Dice Roll Mode)**

- Roll 4d6 drop lowest for each attribute
- Visual dice display with animation
- Re-roll individual attributes
- Real-time modifier calculation

**View Characters**

- Complete character sheet display
- All attributes with calculated modifiers
- Creation date and metadata
- Edit and delete buttons

### ✅ Phase 4: Character Editing (User Story 4)

- Edit existing character attributes and name
- Pre-populated form with current values
- Same validation as creation
- Real-time modifier updates
- Optimistic UI updates via React Query

### ✅ Phase 5: Adventure Character Selection (User Story 5)

- Select character for adventure participation
- Character preview with stats
- Multi-step confirmation flow
- "Create New Character" option integrated

### ✅ Phase 6: Character Management Interface (User Story 6)

- Browse all characters with list view
- Search/filter for 50+ characters
- Delete with confirmation dialog
- Optimistic cache updates
- Empty state handling

### ✅ Phase 7: Polish & Compliance

- JSDoc comments on all components and services
- React.memo optimizations for list performance
- Error boundary for graceful error recovery
- TypeScript strict mode (zero `any` types)
- WCAG AA accessibility compliance
- Keyboard navigation throughout app
- Screen reader compatible
- Touch targets 44x44px minimum
- 4.5:1 color contrast ratios
- Performance optimized (<100ms modifiers, <3s load)

## Accessibility

This app follows WCAG AA standards:

- **Semantic HTML**: `<article>`, `<time>`, `<button>`, `<nav>` elements
- **ARIA labels**: All form inputs and interactive elements labeled
- **Keyboard Navigation**:
  - Tab through all controls
  - Enter/Space to activate buttons
  - Escape to cancel dialogs
  - Arrow keys in numeric inputs
- **Focus Management**: Visible focus indicators, focus traps in modals
- **Color Contrast**: 4.5:1 minimum ratio on all text
- **Touch Targets**: 44x44px minimum on all interactive elements
- **Screen Readers**: Semantic structure, ARIA labels, role attributes

## Performance

- **Modifier Calculations**: <100ms real-time updates (pure functions)
- **API Response Time**: <200ms target (P95) with React Query caching
- **Initial Load**: <3 seconds on 3G connection
- **Bundle Size**: <100KB gzipped
- **React Query**: Configured with smart caching and stale time
- **Code Splitting**: Character pages use React.lazy() for code splitting
- **Memoization**: AttributeInput and CharacterListItem use React.memo()

## Testing

Run tests:

```bash
npm run test
```

Generate coverage:

```bash
npm run test:coverage
```

Test coverage targets:

- `attributeCalculator`: >90% coverage
- `diceRoller`: >90% coverage
- `pointBuy`: >90% coverage
- `CharacterForm`: Component and integration tests
- `CharacterSheet`: Component tests
- `CharacterList`: Component and integration tests
- **E2E Tests**: Point-buy creation, dice roll creation, character editing

## Deployment

Build for production:

```bash
npm run build
```

Output in `dist/` directory. Serve with any static file server:

```bash
npx serve dist
```

## Character Management API Integration

The frontend integrates with the backend 003-character-management API:

**Endpoints**:

- `POST /api/characters` - Create new character
- `GET /api/characters/{id}` - Get character details
- `PUT /api/characters/{id}` - Update character
- `DELETE /api/characters/{id}` - Delete character
- `GET /api/adventures/{adventureId}/characters` - List adventure characters

**Character Model**:

```typescript
interface Character {
  id: string; // UUID
  name: string; // 1-50 characters
  adventureId: string; // Associated adventure
  attributes: {
    str: number; // 3-18
    dex: number;
    int: number;
    con: number;
    cha: number;
  };
  modifiers: {
    // Calculated: (value - 10) / 2
    str: number;
    dex: number;
    int: number;
    con: number;
    cha: number;
  };
  createdAt: string; // ISO 8601
  updatedAt: string;
}
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

### Character creation failing

- Verify backend 003-character-management is running
- Check browser console for API error details
- Ensure all 5 attributes are allocated (dice roll mode)
- Verify point-buy budget is not exceeded (point-buy mode)

### Forms not validating

- Ensure character name is provided (required)
- Attributes must be 3-18 (valid range)
- Point-buy sum cannot exceed 27 points
- All attributes must be rolled/selected before submission

## Constitution Compliance

All code follows project constitution principles:

1. **RESTful Design** - Consumes standard REST character API
2. **Documentation Clarity** - JSDoc on all public components/functions
3. **Testability** - >90% coverage on critical utilities
4. **Simplicity** - Custom components, no heavy libraries
5. **Performance** - <100ms modifiers, <200ms API, <3s load
6. **Accessibility** - WCAG AA compliant throughout
7. **Responsiveness** - 320px-2560px+ responsive layout
8. **Type Safety** - Generated types, no `any` types, strict mode

## Next Steps

- Performance monitoring: Add analytics for character operations
- Backend enhancement: Support character portraits/images
- UI Enhancement: Add character class/race system (if backend supported)
- Testing: Add visual regression testing
- Localization: Support multiple languages

## Contributing

1. Follow existing code structure
2. Add JSDoc comments to all new functions
3. Run `npm run lint` before committing
4. Test accessibility with keyboard navigation
5. Ensure responsive design (test 320px and 2560px+)
6. Aim for >90% test coverage on utilities
7. Update README.md for new features

## License

ISC
