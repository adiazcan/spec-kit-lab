# Implementation Plan: Main Game Interface

**Branch**: `009-main-game-ui` | **Date**: 2026-02-02 | **Spec**: [spec.md](./spec.md)  
**Status**: 🔨 **Phase 0 In Progress** | **Next**: Research & Design

**Input**: Build the main text adventure game interface with narrative display, player input, scene description, character status panel, action buttons, combat mode with turn indicators, and dice roll animations

## Summary

Create a comprehensive text-based adventure game interface featuring a narrative display with scroll history, real-time command input with history navigation, character status sidebar showing HP/conditions/equipment, combat UI with turn indicators and round counter, and animated dice roll visualization. Integrates with existing adventure and combat management APIs to provide an immersive gameplay experience.

## Technical Context

**Language/Version**: TypeScript 5.9, React 18.3, Node.js 20 LTS  
**Frontend Framework**: React 18 SPA with Vite 5.4 bundler  
**Primary Dependencies**: React Router v6, TanStack React Query v5, Tailwind CSS v4.1  
**Backend API**: .NET Core REST API (DiceEngine.API for game engine, adventure, combat endpoints)  
**Storage**: Backend managed (PostgreSQL via .NET Entity Framework)  
**Testing**: Vitest for unit and component tests, @testing-library/react for integration  
**Target Platform**: Web (responsive 800px-2560px+), modern browsers (ES2020+)  
**Project Type**: Web/SPA - TypeScript React frontend in `/frontend` directory  
**Performance Goals**: <100ms input capture, <3s initial load, <200ms API responses, smooth 60fps animations  
**Constraints**: Bundle size <150KB gzipped, keyboard/screen-reader accessible, <2s dice animations  
**Scale/Scope**: 8-10 main components (narrative, input, status, combat, dice), 500+ narrative messages scrollable, responsive UI

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ PASS - All Principles Compliant

| Principle                 | Requirement                                                                 | Status  | Notes                                                                     |
| ------------------------- | --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| I. RESTful Design         | Consume adventure/combat endpoints following REST conventions               | ✅ PASS | Backend API provides GET scene, POST action, GET combat state endpoints   |
| II. Documentation Clarity | JSDoc for all components, services, utilities with input/output contracts   | ✅ PASS | Will document all React components (Narrative, Input, Combat, Dice)       |
| III. Testability          | >90% coverage on input handling, dice animation, combat state display       | ✅ PASS | Vitest available, UI logic testable via React Testing Library             |
| IV. Simplicity            | Use Tailwind + native React, avoid animation library complexity             | ✅ PASS | Custom components for game UI, CSS animations for dice (no external libs) |
| V. Performance            | Input capture <100ms, dice animation <2s, scroll smooth at 60fps            | ✅ PASS | Event handlers are synchronous, CSS animations GPU-accelerated            |
| VI. Accessibility         | Keyboard navigation, ARIA live regions for narrative, screen reader support | ✅ PASS | Semantic HTML, focus management for input, ARIA live for combat updates   |
| VII. Responsiveness       | 800px-2560px responsive, touch-friendly action buttons, <3s load            | ✅ PASS | Tailwind responsive design, 44x44px touch targets for action buttons      |
| VIII. Type Safety         | Generated OpenAPI types, no `any` types, request/response validation        | ✅ PASS | Frontend uses generated types from `/frontend/src/types/api.ts`           |

**Gate Result**: ✅ **APPROVED** - No principle violations. Feature aligns with project constitution.

## Project Structure

### Documentation (this feature)

```text
specs/009-main-game-ui/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (TBD)
├── data-model.md        # Phase 1 output (TBD)
├── quickstart.md        # Phase 1 output (TBD)
├── contracts/           # Phase 1 output (TBD)
├── checklists/          # Validation checklists
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (React Frontend)

```text
frontend/src/
├── components/
│   ├── GameScreen/
│   │   ├── GameScreen.tsx           # P1: Main game layout container
│   │   ├── NarrativeDisplay.tsx     # P1: Scrollable narrative text area
│   │   ├── SceneDescription.tsx     # P1: Current scene description
│   │   └── NarrativeMessage.tsx     # Individual message component
│   ├── CommandInput/
│   │   ├── CommandInput.tsx         # P1: Text input with submit
│   │   ├── CommandHistory.tsx       # P2: Up/down arrow history navigation
│   │   └── ActionButtons.tsx        # P2: Attack/Flee/Use Item buttons
│   ├── CharacterStatus/
│   │   ├── CharacterStatusSidebar.tsx  # P1: Character info panel
│   │   ├── HealthDisplay.tsx           # HP bar with current/max
│   │   ├── ConditionsList.tsx          # Active status effects
│   │   └── EquipmentList.tsx           # Equipped items
│   ├── CombatUI/
│   │   ├── CombatOverlay.tsx        # P3: Combat mode indicator
│   │   ├── TurnIndicator.tsx        # P3: Whose turn display
│   │   ├── RoundCounter.tsx         # P3: Round number
│   │   └── CombatantsList.tsx       # P3: All combatants status
│   └── DiceRoll/
│       ├── DiceRollAnimation.tsx    # P2: Animated dice component
│       ├── DiceResult.tsx           # P2: Result display with modifiers
│       └── DiceVisualizer.tsx       # 3D or 2D dice visual
├── pages/
│   ├── GamePage.tsx                 # Main game route
│   └── GameLoadingPage.tsx          # Loading/initialization screen
├── services/
│   ├── gameApi.ts                   # Game engine API calls
│   ├── sceneApi.ts                  # Scene/narrative API
│   ├── combatApi.ts                 # Combat state API
│   └── narrativeCache.ts            # Narrative message storage
├── hooks/
│   ├── useGameState.ts              # Game state management
│   ├── useCommandInput.ts           # Input handling with history
│   ├── useDiceRoll.ts               # Dice roll trigger and animation
│   ├── useCombatState.ts            # Combat turn tracking
│   └── useNarrativeScroll.ts        # Auto-scroll behavior
├── types/
│   ├── game.ts                      # Game state interfaces
│   ├── narrative.ts                 # Narrative message types
│   ├── combat.ts                    # Combat state types
│   └── api.ts                       # Generated from OpenAPI spec
├── utils/
│   ├── narrativeFormatter.ts        # Format messages for display
│   ├── diceAnimationHelper.ts       # Animation timing/sequencing
│   └── combatFormatter.ts           # Format combat turn info
└── index.css                        # Tailwind styles + animations
```

### Test Structure

```text
frontend/tests/
├── components/
│   ├── GameScreen.test.tsx
│   ├── NarrativeDisplay.test.tsx
│   ├── CommandInput.test.tsx
│   ├── CharacterStatusSidebar.test.tsx
│   ├── TurnIndicator.test.tsx
│   └── DiceRollAnimation.test.tsx
├── hooks/
│   ├── useCommandInput.test.ts
│   ├── useGameState.test.ts
│   └── useDiceRoll.test.ts
└── integration/
    └── gameFlow.test.tsx
```

**Structure Decision**: React frontend SPA with nested component organization. Game UI is organized by functional area (Narrative, Input, Status, Combat, Dice). Pure function utilities for formatting and animation coordination. Services layer handles API communication with React Query. Custom hooks encapsulate game state, input history, and combat tracking logic.

## Complexity Tracking

> No constitution violations detected. Feature adheres to all core principles.

| Item                     | Status                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| Complex Dependencies     | ✅ None - uses existing stack (React, Vite, Tailwind, React Query)     |
| Custom Animations        | ✅ Simple - CSS-based dice animations, GPU-accelerated transforms      |
| State Management         | ✅ Simple - game state in custom hooks, API state via React Query      |
| Performance Trade-offs   | ✅ None - synchronous input handling, CSS animations for 60fps         |
| Accessibility Trade-offs | ✅ None - full keyboard + screen reader support with ARIA live regions |

**Conclusion**: Feature is straightforward implementation following established patterns. No architectural complexity justified.

---

## Phase 0: Research & Clarifications ✅

**Status**: ✅ **Complete**

All technical unknowns have been resolved through research:

### Research Tasks Completed

1. **Backend API Integration Points** - Identified existing APIs (Adventures, Combat, Characters)
2. **Narrative Display Architecture** - Frontend state accumulation with virtual scrolling
3. **Command Input Mechanics** - Terminal-like history with arrow key navigation
4. **Dice Roll Animation Approach** - CSS 3D transforms (no external library)
5. **Character Status Display Layout** - Fixed right sidebar with collapsible sections
6. **Combat UI Turn Indicator Design** - In-context banner with combatant highlights
7. **Performance Optimization Strategy** - React.memo, CSS animations, throttled polling
8. **Accessibility Considerations** - Semantic HTML, ARIA live regions, keyboard nav

**Output**: [research.md](./research.md) ✅

---

## Phase 1: Design & Contracts ✅

**Status**: ✅ **Complete**

### Artifacts Generated

| Artifact                                                   | Status      | Purpose                                       |
| ---------------------------------------------------------- | ----------- | --------------------------------------------- |
| [research.md](./research.md)                               | ✅ Complete | Phase 0 research findings (8 decision points) |
| [data-model.md](./data-model.md)                           | ✅ Complete | Frontend data structures and validation rules |
| [contracts/api-contracts.md](./contracts/api-contracts.md) | ✅ Complete | REST API specifications (6 endpoints)         |
| [quickstart.md](./quickstart.md)                           | ✅ Complete | Step-by-step implementation guide             |
| Agent Context                                              | ✅ Updated  | GitHub Copilot context file updated           |

### 1. Data Model

**Output**: [data-model.md](./data-model.md) ✅

Complete frontend data models including:

- `GameState` - Root state container with adventure, scene, character, combat, narrative
- `NarrativeMessage` - Message types (scene, narration, action, combat, system, dialogue)
- `CharacterStatus` - Character info for sidebar (HP, equipment, conditions)
- `CombatState` - Combat encounter state (round, combatants, turn order)
- `DiceRollResult` - Dice roll details for animation and display
- `CommandInputState` - Input handling with command history
- `UIState` - Loading, errors, modal states
- Validation rules for all data types
- State management patterns with React Query
- Data flow patterns for game interactions

### 2. API Contracts

**Output**: [contracts/api-contracts.md](./contracts/api-contracts.md) ✅

Complete REST API specifications including:

- 6 core endpoints (Adventure, Character, Combat, Turn, Enemy Turn, History)
- Request/response payload examples with TypeScript schemas
- Error handling patterns (network, 400, 401, 404, 500)
- Caching strategy with React Query (per-endpoint stale times)
- Type safety with OpenAPI generated types
- Frontend integration examples with custom hooks
- Performance monitoring and logging patterns

### 3. Implementation Guide

**Output**: [quickstart.md](./quickstart.md) ✅

Step-by-step implementation guide including:

- Type definitions setup (game.ts with all interfaces)
- API service hooks (useAdventure, useCharacter, useCombat, mutations)
- Utility functions (narrative formatter, dice animation helper)
- Custom hooks (useCommandInput, useGameState with session storage)
- Core components (NarrativeDisplay, CommandInput, CharacterStatusSidebar)
- Combat components (TurnIndicator, CombatantsList)
- Main game page (GamePage with full integration)
- Routing setup with React Router
- CSS animations (dice roll, HP bar, fade-in)
- Testing examples (unit tests for CommandInput)
- Troubleshooting tips

---

## Constitution Check (Post-Design) ✅

**Re-verification**: ✅ **STILL COMPLIANT**

All design decisions align with project constitution:

| Principle                 | Requirement               | Status  | Notes                                                  |
| ------------------------- | ------------------------- | ------- | ------------------------------------------------------ |
| I. RESTful Design         | Consume REST endpoints    | ✅ PASS | All 6 endpoints follow REST conventions                |
| II. Documentation Clarity | JSDoc for components      | ✅ PASS | All components, hooks, utilities documented            |
| III. Testability          | >90% coverage target      | ✅ PASS | Pure functions, testable hooks, example tests provided |
| IV. Simplicity            | No complex dependencies   | ✅ PASS | CSS animations only, existing tech stack               |
| V. Performance            | <100ms input, 60fps       | ✅ PASS | React.memo, CSS GPU-accelerated, throttled polling     |
| VI. Accessibility         | WCAG AA, keyboard nav     | ✅ PASS | Semantic HTML, ARIA live, full keyboard support        |
| VII. Responsiveness       | 800px-2560px              | ✅ PASS | Tailwind responsive utilities, touch targets           |
| VIII. Type Safety         | Generated types, no `any` | ✅ PASS | OpenAPI TypeScript generation configured               |

**No complexity violations, no deviations from constitution.**

---

## Implementation Readiness Checklist ✅

**Code Structure**:

- ✅ Directory layout defined (components, pages, services, hooks, utils)
- ✅ TypeScript interfaces specified (8 core data types)
- ✅ API service contracts defined (6 endpoints with hooks)
- ✅ Component props fully documented

**Testing Strategy**:

- ✅ Unit test approach defined (Vitest + React Testing Library)
- ✅ Key test cases identified (input history, narrative scroll, combat turn)
- ✅ Coverage targets specified (>90% for critical logic)
- ✅ Example tests provided in quickstart

**Documentation**:

- ✅ JSDoc/TypeDoc templates provided
- ✅ Accessibility requirements specified (WCAG AA, ARIA live)
- ✅ Component responsibilities clearly defined
- ✅ Data flow diagrams included

**Integration**:

- ✅ Backend API dependencies verified (Adventures, Combat, Characters)
- ✅ OpenAPI contract confirmed (generate:api script)
- ✅ Type generation approach documented
- ✅ React Query caching strategy defined

**Performance**:

- ✅ Animation strategy defined (CSS 3D transforms, GPU-accelerated)
- ✅ Optimization techniques specified (React.memo, virtual scrolling)
- ✅ Polling intervals configured (2-60s based on data volatility)

---

## Phase 2: Implementation Tasks (Next)

The implementation will be organized via `/speckit.tasks` command which will generate:

- [tasks.md](./tasks.md) with granular implementation tasks
- Checklists for each P1, P2, P3 user story
- Test definitions for each component
- Code review criteria

**Estimated Effort**:

- Core components (Narrative, Input, Status, Combat): 25-35 hours
- API service hooks and utilities: 8-12 hours
- Custom hooks (state management): 6-10 hours
- Dice roll animation component: 4-6 hours
- Testing & documentation: 12-18 hours
- **Total**: 55-81 hours for complete implementation

**Team**: 1-2 frontend engineers (TypeScript/React familiar)

---

## Success Criteria (from Specification)

All design artifacts support these measurable outcomes:

- **SC-001**: Players read scene/character status without help ← Clear layout, sidebar design
- **SC-002**: Input capture <100ms ← Synchronous event handlers, no debouncing
- **SC-003**: Dice animations <2s ← CSS animation duration 1.2-1.5s specified
- **SC-004**: Narrative scroll smooth with 500+ messages ← Virtual scrolling strategy
- **SC-005**: 90% complete turn without confusion ← Turn indicator, action buttons
- **SC-006**: Quick actions reduce time 30% ← Action buttons designed, pre-fill input
- **SC-007**: Turn indicators clear ← Banner + arrow indicator + highlights
- **SC-008**: Responsive 800px-2560px ← Tailwind responsive utilities, sidebar collapse

---

**Phase 1 Status**: ✅ **COMPLETE** - All design artifacts generated. Ready for implementation (Phase 2).
