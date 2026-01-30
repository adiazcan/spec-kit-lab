# Implementation Plan: Character Management Interface

**Branch**: `008-char-mgmt-ui` | **Date**: January 30, 2026 | **Spec**: [spec.md](./spec.md)  
**Status**: ✅ **Phase 1 Design Complete** | **Next**: Phase 2 Tasks & Implementation

---

## Summary

Build an interactive character management interface for the Adventure Dashboard featuring character creation with point-buy or dice-roll attribute allocation, real-time modifier calculation, character sheet display, editing, and adventure selection. Integrates with the backend 003-character-management API to provide a complete character lifecycle from creation through gameplay.

## Technical Context

**Language/Version**: TypeScript 5.9, React 18.3, Node.js 20 LTS  
**Frontend Framework**: React 18 SPA with Vite 5.4 bundler  
**Primary Dependencies**: React Router v6, TanStack React Query v5, Tailwind CSS v4.1  
**Backend API**: .NET Core REST API (DiceEngine.API, consuming 003-character-management endpoints)  
**Storage**: Backend managed (PostgreSQL via .NET Entity Framework)  
**Testing**: Vitest for unit and component tests, @testing-library/react for integration  
**Target Platform**: Web (responsive 320px-2560px+), modern browsers (ES2020+)  
**Project Type**: Web/SPA - TypeScript React frontend in `/frontend` directory  
**Performance Goals**: <3s initial load, <200ms API responses, modifiers display <100ms  
**Constraints**: Bundle size <100KB gzipped, all components keyboard/screen-reader accessible, no `any` types  
**Scale/Scope**: 6 main components (form, sheet, list, selector), 3 utility modules (dice, modifiers, api), responsive UI

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ PASS - All Principles Compliant

| Principle                 | Requirement                                                               | Status  | Notes                                                                            |
| ------------------------- | ------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| I. RESTful Design         | Consume character CRUD endpoints following REST conventions               | ✅ PASS | Backend API provides POST/GET/PUT/DELETE character endpoints                     |
| II. Documentation Clarity | JSDoc for all components, services, utilities with input/output contracts | ✅ PASS | Will document all React components and utility functions                         |
| III. Testability          | >90% coverage on modifier calculation, form validation, dice roll utility | ✅ PASS | Vitest available, critical logic easily testable pure functions                  |
| IV. Simplicity            | Use Tailwind + native React, avoid component library complexity           | ✅ PASS | Bootstrap no CSS framework, custom components for character forms                |
| V. Performance            | Modifier display <100ms, API responses <200ms, load <3s                   | ✅ PASS | Real-time calculations are synchronous (no network), React Query for API caching |
| VI. Accessibility         | Keyboard navigation, ARIA labels, 4.5:1 color contrast, 44x44px targets   | ✅ PASS | Will follow semantic HTML, focus management, accessibility audit required        |
| VII. Responsiveness       | 320px-2560px responsive, touch-friendly, initial load <3s on 3G           | ✅ PASS | Tailwind responsive utilities cover all breakpoints, Vite optimizes load time    |
| VIII. Type Safety         | Generated OpenAPI types, no `any` types, request/response validation      | ✅ PASS | Frontend uses generated types from `/frontend/src/types/api.ts`                  |

**Gate Result**: ✅ **APPROVED** - No principle violations. Feature aligns with project constitution.

## Project Structure

### Documentation (this feature)

```text
specs/008-char-mgmt-ui/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (TBD)
├── data-model.md        # Phase 1 output (TBD)
├── quickstart.md        # Phase 1 output (TBD)
├── contracts/           # Phase 1 output (TBD)
├── checklists/
│   └── requirements.md   # Validation checklist
└── tasks.md             # Phase 2 output (task list for implementation)
```

### Source Code (React Frontend)

```text
frontend/src/
├── components/
│   ├── CharacterForm.tsx           # P1: Create/edit character form
│   │   ├── NameInput.tsx           # Name input, validation
│   │   ├── AttributeInput.tsx      # Single attribute control
│   │   ├── PointBuyMode.tsx        # Point-buy allocation UI
│   │   └── DiceRollMode.tsx        # Dice roll interface
│   ├── ModifierDisplay.tsx          # P1: Calculated modifier badge
│   ├── CharacterSheet.tsx           # P1: Character view
│   │   └── AttributeSection.tsx     # Attributes display
│   ├── CharacterList.tsx            # P3: Character list, deletion
│   └── CharacterSelector.tsx        # P2: Adventure character selection
├── pages/
│   ├── CharacterCreatePage.tsx      # Create character route
│   ├── CharacterSheetPage.tsx       # View character route
│   ├── CharacterListPage.tsx        # All characters route
│   └── CharacterSelectPage.tsx      # Adventure selection route
├── services/
│   ├── characterApi.ts              # Character CRUD API calls
│   ├── diceRoller.ts                # Dice roll logic (4d6 drop-lowest)
│   └── attributeCalculator.ts       # Modifier calculation (pure functions)
├── types/
│   ├── character.ts                 # TypeScript character interfaces
│   └── api.ts                       # Generated from OpenAPI spec
├── hooks/
│   ├── useCharacterForm.ts          # Form state management
│   ├── useAttributeValidation.ts    # Validation logic
│   └── useDiceRoll.ts               # Dice roll state
├── utils/
│   └── formatting.ts                # Modifier display formatting
└── index.css                        # Tailwind styles
```

### Test Structure

```text
frontend/tests/
├── components/
│   ├── CharacterForm.test.tsx
│   ├── ModifierDisplay.test.tsx
│   ├── CharacterSheet.test.tsx
│   └── attributeCalculator.test.tsx
├── services/
│   ├── diceRoller.test.ts
│   └── attributeCalculator.test.ts
└── hooks/
    └── useCharacterForm.test.ts
```

**Structure Decision**: React frontend SPA using component composition pattern. Separate presentational components (Form, Sheet, List) from container components (Pages). Pure function utilities (modifier calculation, dice rolling) for easy testing and reusability. Services layer handles API communication via React Query. Custom hooks encapsulate form state and validation logic.

## Complexity Tracking

> No constitution violations detected. Feature adheres to all core principles.

| Item                     | Status                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Complex Dependencies     | ✅ None - uses existing stack (React, Vite, Tailwind, React Query)                     |
| Custom Algorithms        | ✅ Simple - modifier calculator is basic math, dice roller is standard 4d6 drop-lowest |
| State Management         | ✅ Simple - form state in custom hooks, API state via React Query                      |
| Performance Trade-offs   | ✅ None - synchronous modifier calculation, caching via React Query                    |
| Accessibility Trade-offs | ✅ None - full keyboard + screen reader support required                               |

**Conclusion**: Feature is straightforward implementation following established patterns. No architectural complexity justified.

---

# Phase 0: Research & Clarifications

**Goal**: Resolve all [NEEDS CLARIFICATION] items and research best practices

### Research Tasks

#### Task 1: Point-Buy System Mechanics - DECISION MADE

**Topic**: Finalize point-buy system rules  
**Input from Spec**: "Point-buy starts with a standard point pool (commonly 27 points in D5E-style systems, starting all attributes at 8)"

**Decision**: Implement D&D 5E Point-Buy Standard

- **Point Pool**: 27 points available
- **Starting Values**: All attributes begin at 8
- **Point Costs**: Follow D&D 5E cost table:
  - Score 8→9: 1 point
  - Score 9→10: 1 point
  - Score 10→11: 1 point
  - Score 11→12: 1 point
  - Score 12→13: 1 point
  - Score 13→14: 2 points
  - Score 14→15: 2 points
  - Score 15→16: 3 points
  - Score 16→17: 3 points
  - Score 17→18: 4 points
- **Rationale**: Standard tabletop rule set, familiar to target players, balanced progression
- **Alternatives Considered**:
  - Flat point cost (rejected - doesn't incentivize high-value attributes)
  - Unlimited points (rejected - no resource constraint, poor balance)
  - Fixed preset builds (rejected - reduces player agency)

#### Task 2: Dice Roll Method - DECISION MADE

**Topic**: Define standard dice roll mechanics

**Decision**: Implement 4d6 Drop Lowest (D&D 5E Standard)

- **Method**: Roll 4d6 (four 6-sided dice), remove lowest, sum remaining three
- **Range**: 3-18 (minimum: 1+1+1=3, maximum: 6+6+6=18)
- **UI/UX**: Show all four dice, highlight the dropped die, display final sum
- **Re-roll Mechanics**: Allow re-rolls of individual attributes (not full character)
- **Rationale**: Industry-standard method, exciting visual feedback, aligns with point-buy range
- **Alternatives Considered**:
  - 3d6 standard (rejected - range too narrow, less exciting)
  - 2d6+6 (rejected - less familiar, mechanical feel)
  - Manual input (rejected - less fun than rolling)

#### Task 3: Modifier Calculation Formula - DECISION MADE

**Topic**: Confirm modifier calculation approach

**Decision**: Standard D&D 5E Formula

- **Formula**: (Attribute Value - 10) / 2, rounded down
- **Examples**:
  - 8 → (8-10)/2 = -1
  - 10 → (10-10)/2 = 0
  - 12 → (12-10)/2 = 1
  - 14 → (14-10)/2 = 2
  - 16 → (16-10)/2 = 3
  - 18 → (18-10)/2 = 4
- **Implementation**: Pure function in TypeScript, easily testable
- **Rationale**: Standard formula, matches backend 003-character-management spec
- **Display**: Always show explicit modifier ("+0" for zero, "+2" for positive, "-1" for negative)

#### Task 4: Backend Dependency - VERIFIED

**Topic**: Confirm 003-character-management API integration

**Status**: ✅ VERIFIED - API exists and provides:

- POST /api/characters - Create character
- GET /api/characters/{id} - Retrieve character
- PUT /api/characters/{id} - Update character
- DELETE /api/characters/{id} - Delete character
- GET /api/adventures/{adventureId}/characters - List adventure characters

**Integration Points**:

- Character creation form POSTs to POST /api/characters
- Character sheet fetches from GET /api/characters/{id}
- Edit form PUTs to PUT /api/characters/{id}
- Character selector lists from GET /api/adventures/{adventureId}/characters
- Delete button calls DELETE /api/characters/{id}

**OpenAPI Contract**: Types generated via `npm run generate:api` from `/swagger-openapi.json`

---

## Phase 1: Design & Contracts Complete ✅

### 1. Data Model

**Output**: [data-model.md](./data-model.md) ✅

Complete frontend data models including:

- `Character` domain model with attributes and modifiers
- `CharacterFormData` for form state management
- `CharacterListItem` for list views
- `DiceRoll` structure for dice rolling
- Validation rules and component mappings
- Data flow patterns for all user journeys

### 2. API Contracts

**Output**: [contracts/api-contracts.md](./contracts/api-contracts.md) ✅

Complete REST API specifications including:

- 5 core endpoints (Create, Get, Update, Delete, List)
- Request/response payload examples
- Validation rules and error handling
- HTTP status codes and error responses
- Type definitions for frontend consumption
- Caching strategy for React Query optimization

### 3. Component Architecture Quickstart

**Output**: [quickstart.md](./quickstart.md) ✅

Step-by-step implementation guide including:

- Type definitions setup
- Utility functions (modifiers, dice rolling)
- API service with React Query hooks
- Custom hooks for form state management
- Component implementations with examples
- Page/route setup
- Testing approach
- Troubleshooting tips

---

## Phase 1 Design Summary

| Artifact                                                   | Status      | Purpose                                                      |
| ---------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| [research.md](./research.md)                               | ✅ Complete | Phase 0 research findings (point-buy, dice rolls, modifiers) |
| [data-model.md](./data-model.md)                           | ✅ Complete | Frontend data structures and validation                      |
| [contracts/api-contracts.md](./contracts/api-contracts.md) | ✅ Complete | REST API specifications                                      |
| [quickstart.md](./quickstart.md)                           | ✅ Complete | Developer integration guide                                  |
| Agent Context                                              | ✅ Updated  | GitHub Copilot context file                                  |

---

## Implementation Readiness Checklist

**Code Structure**:

- ✅ Directory layout defined (components, pages, services, hooks)
- ✅ TypeScript interfaces specified (Character, CharacterFormData, etc.)
- ✅ API service contract defined
- ✅ Component props fully documented

**Testing Strategy**:

- ✅ Unit test approach defined (Vitest + @testing-library)
- ✅ Key test cases identified (modifier calculation, validation, dice rolls)
- ✅ Coverage targets specified (>90% for critical logic)

**Documentation**:

- ✅ JSDoc/TypeDoc template provided
- ✅ Accessibility requirements specified (WCAG AA)
- ✅ Component responsibilities clearly defined
- ✅ Data flow diagrams included

**Integration**:

- ✅ Backend API dependency verified
- ✅ OpenAPI contract confirmed
- ✅ Type generation approach documented
- ✅ React Query caching strategy defined

---

## Constitution Check (Post-Design)

**Re-verification**: ✅ **STILL COMPLIANT**

All design decisions align with project constitution:

1. **RESTful Design** ✅ - Consuming standard REST endpoints from 003-character-management
2. **Documentation Clarity** ✅ - Data models fully specified, APIs documented with examples
3. **Testability** ✅ - Pure functions for modifiers/dice make unit testing straightforward
4. **Simplicity** ✅ - Custom React components, no heavy libraries, Tailwind for styling
5. **Performance** ✅ - Synchronous calculations <100ms, React Query for API caching, load <3s target
6. **Accessibility** ✅ - Semantic HTML, ARIA labels, focus management specified
7. **Responsiveness** ✅ - Tailwind responsive design 320px-2560px+
8. **Type Safety** ✅ - Full TypeScript strict mode, generated types from OpenAPI

**No complexity violations, no deviations justified.**

---

## Phase 2: Implementation Tasks (Next)

The implementation will be organized via `/speckit.tasks` command which will generate:

- [tasks.md](./tasks.md) with granular implementation tasks
- Checklists for each P1, P2, P3 user story
- Test definitions for each component
- Code review criteria

**Estimated Effort**:

- Core components (Form, Sheet, List): 20-30 hours
- Services & utilities: 5-10 hours
- Testing & documentation: 10-15 hours
- **Total**: 35-55 hours for complete implementation

**Team**: 1-2 frontend engineers (TypeScript/React familiar)

---

## Success Criteria (from Specification)

All design artifacts support these measurable outcomes:

- **SC-001**: Users complete character creation in <3 minutes ← Data model supports quick form
- **SC-002**: Modifiers display <100ms ← Synchronous calculation specified
- **SC-003**: 95% first-attempt success ← Form validation clearly defined
- **SC-004**: Character sheet loads <2s ← API contracts with caching strategy
- **SC-005**: Character selection <30 seconds ← List component with search support
- **SC-006**: 90% edit success ← Pre-population approach documented
- **SC-007**: Selection in 3 steps ← Flow diagram shows 3-step process
- **SC-008**: User-friendly error messages ← Error handling defined in API contracts

---
