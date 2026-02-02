# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript 5.9 + React 18.3.1 (ES2020)  
**Primary Dependencies**: React 18, React Router 6.30, React Query 5.90, Tailwind CSS 4.1, Vite 5.4  
**Storage**: N/A (state management via React Query, API calls to .NET backend)  
**Testing**: Vitest 4.0 + React Testing Library 16.3  
**Target Platform**: Web (Vite SPA, responsive 1024px-1920px+)  
**Project Type**: Frontend SPA (web application)  
**Performance Goals**: <100ms inventory render, <50ms equip/unequip feedback, 60 FPS animations  
**Constraints**: Responsive design (mobile 1024px+), WCAG AA accessibility, drag-and-drop support  
**Scale/Scope**: Inventory UI system with grid/list views, equipment slots, item tooltips, modals, drag-and-drop

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Core Principles Validation

**I. RESTful Design** ✅ COMPLIANT

- UI consumes 004-inventory-system backend APIs (GET /inventory, PUT /equip, POST /use, etc.)
- Backend APIs follow REST conventions (inventory spec assumes backend has REST contract)
- No violations

**II. Documentation Clarity** ✅ COMPLIANT

- All React components will have JSDoc comments describing props and usage
- Service modules will document API contracts with TypeScript types
- OpenAPI schema from backend will be used to generate frontend types

**III. Testability** ✅ COMPLIANT

- Unit tests with Vitest for components, hooks, services
- Integration tests for key workflows (equip/unequip, item selection)
- No testability concerns

**IV. Simplicity** ✅ COMPLIANT

- Functional React components with hooks, avoiding complex patterns
- Tailwind CSS for styling (no custom CSS complexity)
- Straightforward Inventory and Equipment views
- No gratuitous animations/complexity justified

**V. Performance** ✅ COMPLIANT

- Target <100ms for inventory render (well within available budget)
- Equipment updates <50ms (within performance goals)
- Responsive design preserves performance across devices

**VI. Accessibility** ✅ COMPLIANT (BY DESIGN)

- Keyboard navigation: Tab through items, Enter to open details, Esc to close
- Screen reader support: ARIA labels on items, drag-drop alternatives with buttons
- Color contrast: Use Tailwind's contrast-safe colors, text labels for rarity
- Focus management: Maintain visible focus indicators throughout

**VII. Responsiveness** ✅ COMPLIANT (BY DESIGN)

- Layout adapts 1024px (tablets) to 1920px+ (desktop)
- Touch targets 44x44px for mobile
- Drag-and-drop has button alternative for accessibility

**VIII. Type Safety** ✅ COMPLIANT

- Generate TypeScript types from backend OpenAPI spec (`npm run generate:api`)
- All inventory/equipment data typed from backend contracts
- No `any` types in API communication

**GATE RESULT**: ✅ PASS - All principles met. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/010-inventory-ui/
├── plan.md                  # This file (/speckit.plan command output)
├── research.md              # Phase 0 output (/speckit.plan command)
├── data-model.md            # Phase 1 output (/speckit.plan command)
├── quickstart.md            # Phase 1 output (/speckit.plan command)
├── contracts/               # Phase 1 output (/speckit.plan command)
└── tasks.md                 # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Frontend: Web application (React + Vite)

frontend/
├── src/
│   ├── components/
│   │   ├── InventoryUI/                 # NEW: Inventory grid/list display
│   │   │   ├── InventoryGrid.tsx        # Grid view component
│   │   │   ├── InventoryList.tsx        # List view component
│   │   │   ├── InventoryViewToggle.tsx  # View mode switcher
│   │   │   └── InventoryContainer.tsx   # Main container with state
│   │   ├── Equipment/                   # NEW: Equipment slots display
│   │   │   ├── EquipmentSlots.tsx       # All 7 slots visualization
│   │   │   └── EquipmentSlot.tsx        # Individual slot component
│   │   ├── ItemDetail/                  # NEW: Item detail modal/view
│   │   │   ├── ItemDetailModal.tsx      # Full detail view modal
│   │   │   └── ItemDetailContent.tsx    # Detail content component
│   │   └── ItemTooltip/                 # NEW: Hover tooltip
│   │       └── ItemTooltip.tsx          # Quick info tooltip
│   ├── hooks/
│   │   ├── useInventory.ts              # NEW: Inventory state management
│   │   ├── useEquipment.ts              # NEW: Equipment state management
│   │   └── useDragDrop.ts               # NEW: Drag-and-drop logic
│   ├── services/
│   │   ├── inventoryClient.ts           # NEW: Inventory API client (from 004 backend)
│   │   └── equipmentClient.ts           # NEW: Equipment API client (from 004 backend)
│   ├── types/
│   │   ├── inventory.ts                 # NEW: Inventory-specific types
│   │   ├── equipment.ts                 # NEW: Equipment-specific types
│   │   └── api.ts                       # Generated from backend OpenAPI spec
│   └── (existing structure preserved)
└── tests/
    └── components/
        ├── __inventory/                 # NEW: Inventory component tests
        └── __equipment/                 # NEW: Equipment component tests
```

**Structure Decision**: Selected Option 2 + existing structure preserved. Frontend is a single React SPA project using component-based architecture with new Inventory UI system added to existing components folder. No new project created; extends existing frontend with inventory-specific components, hooks, and services following established patterns.

## Complexity Tracking

> **No violations identified** - Constitution Check passed without exceptions. All core principles are met through standard React/TypeScript patterns and existing project architecture.
