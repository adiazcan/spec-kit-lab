# Research & Clarifications: Main Game Interface

**Feature**: 009-main-game-ui  
**Date**: 2026-02-02  
**Status**: ✅ Complete

---

## Overview

This document resolves all NEEDS CLARIFICATION items from the Technical Context and provides research-backed decisions for implementing the main game interface UI components.

---

## Research Tasks

### Task 1: Backend API Integration Points

**Topic**: Clarify which backend APIs provide game state, scene, narrative, and combat data

**Decision**: Use Existing Backend REST APIs

**Backend APIs Available**:

1. **Adventures API** (`/api/Adventures`)
   - `GET /api/Adventures/{id}` - Retrieve adventure state with current scene
   - `PUT /api/Adventures/{id}` - Update adventure state
   - Provides: Adventure ID, current scene reference, game state

2. **Combat API** (`/api/Combats`)
   - `POST /api/Combats` - Initiate combat encounter
   - `GET /api/Combats/{id}` - Get current combat state
   - `POST /api/Combats/{id}/turns` - Resolve player turn
   - `POST /api/Combats/{id}/enemy-turn` - Resolve enemy AI turn
   - `GET /api/Combats/{id}/actions` - Get combat history
   - Provides: Combat state, turn order, combatant HP, round counter

3. **Characters API** (`/api/characters/{id}`)
   - Already implemented in spec 003
   - Provides: Character stats, HP, conditions, equipment

**Integration Strategy**:

- Use React Query for API state management (already established pattern)
- Real-time game state via polling or WebSocket (WebSocket for future enhancement, polling for MVP)
- Cache combat state locally during combat to reduce API calls
- Use OpenAPI generated types for type safety

**Rationale**: Backend APIs already exist and provide all necessary data. No new backend endpoints needed. Focus on frontend state management and UI presentation.

**Alternatives Considered**:

- Create new unified "game state" endpoint (rejected - unnecessary overhead, existing endpoints sufficient)
- Store game state entirely in frontend (rejected - violates separation of concerns, loses state on refresh)

---

### Task 2: Narrative Display Architecture

**Topic**: Define how narrative messages are stored, displayed, and scrolled

**Decision**: Accumulate Messages in Frontend State with Virtual Scrolling

**Architecture**:

- Narrative messages are accumulated in React component state
- Each message has: timestamp, type (narration, action result, combat log), content
- Use virtual scrolling for performance when message count exceeds 100
- Auto-scroll to bottom on new messages, but preserve scroll position if user scrolled up
- Messages persist in session storage to survive page refreshes

**Message Types**:

1. **Scene Description** - Rich text description of current location
2. **Narrative Text** - Story events, ambient descriptions
3. **Action Results** - "You opened the door", "You picked up the sword"
4. **Combat Log** - Attack rolls, damage dealt, turn announcements
5. **System Messages** - "Combat started", "Quest completed"

**Display Format**:

```
[10:32 AM] SCENE: You stand at the entrance to a dark cavern...
[10:32 AM] NARRATION: A cool breeze emanates from within.
[10:33 AM] ACTION: You enter the cavern.
[10:33 AM] COMBAT: A goblin appears! Combat started.
[10:33 AM] COMBAT: Roll initiative: You rolled 15. Goblin rolled 8.
```

**Rationale**: Accumulating messages in frontend provides instant feedback and allows scrolling through history. Virtual scrolling ensures performance even with hundreds of messages. Session storage preserves narrative context across page refreshes.

**Alternatives Considered**:

- Fetch narrative history from backend (rejected - adds latency, backend doesn't store narrative logs)
- Render all messages without virtualization (rejected - performance degrades with 500+ messages)
- Use WebSocket for real-time narrative (deferred - overkill for MVP, can add later)

---

### Task 3: Command Input Mechanics

**Topic**: Define input handling, validation, and command history navigation

**Decision**: Text Input with Arrow Key History and Optional Quick Actions

**Input Mechanics**:

- Standard text input field with submit button and Enter key support
- Up/Down arrow keys navigate through command history (like terminal)
- Command history stored in component state (last 50 commands)
- Input is trimmed and validated (non-empty) before sending to backend
- Loading state disables input while waiting for API response
- Clear input field after successful submission

**Command History Behavior**:

- Press Up Arrow: Navigate backward through history (newer → older)
- Press Down Arrow: Navigate forward through history (older → newer)
- If at end of history (newest), show empty input field
- Current typed but unsubmitted input is saved when navigating history

**Quick Action Buttons** (P2):

- Attack, Flee, Use Item buttons
- Pre-fill input field with command text (e.g., "attack goblin")
- User can still edit before submitting
- Only visible when contextually appropriate (e.g., Attack in combat only)

**Validation**:

- Frontend validates non-empty input
- Backend validates command validity and context
- Display errors inline below input field

**Rationale**: Terminal-like command history is familiar to developers and power users. Quick action buttons reduce friction for common commands. Pre-filling input (rather than auto-submitting) gives users control and visibility.

**Alternatives Considered**:

- Auto-complete suggestions (rejected - complex, out of scope for MVP)
- Modal dialog for commands (rejected - slows interaction, breaks flow)
- Voice input (rejected - accessibility concern, requires permissions)

---

### Task 4: Dice Roll Animation Approach

**Topic**: Choose animation technique for dice rolls (CSS, Canvas, WebGL, library)

**Decision**: CSS-Based 3D Transform Animation (No External Library)

**Animation Technique**:

- Use CSS `transform: rotateX() rotateY() rotateZ()` for 3D dice tumbling
- Keyframe animation with randomized rotation angles
- Transition duration: 1.2-1.5 seconds
- Hardware-accelerated via `transform` and `opacity` properties only
- Final dice face determined before animation starts (not physics-based)

**Implementation**:

```css
@keyframes roll-dice {
  0% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    opacity: 0.8;
  }
  50% {
    transform: rotateX(720deg) rotateY(540deg) rotateZ(360deg);
    opacity: 1;
  }
  100% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
    opacity: 1;
  }
}
```

**Visual Design**:

- Display dice as 3D cube with 6 faces (1-6 pips)
- Use SVG or Unicode die characters for pip display: ⚀⚁⚂⚃⚄⚅
- Highlight result face after animation completes
- Show modifiers separately: "🎲 15 (roll: 12 + modifier: +3)"

**Performance**:

- CSS transforms are GPU-accelerated (60fps guaranteed)
- No JavaScript calculation loops during animation
- Lightweight DOM footprint (single div per die)

**Rationale**: CSS animations are performant, accessible, and don't require external libraries. They work on all modern browsers without plugins. 3D transforms convey dice rolling visually without complex 3D rendering.

**Alternatives Considered**:

- Three.js/WebGL realistic physics (rejected - 200KB+ library, overkill for text adventure)
- Canvas 2D animation (rejected - more complex than CSS, no benefit for simple dice)
- External dice roller library (rejected - dependency overhead, constitution violation)
- Static result display (rejected - less engaging, misses "game feel" benefit)

---

### Task 5: Character Status Display Layout

**Topic**: Determine sidebar layout and information hierarchy

**Decision**: Fixed Right Sidebar with Collapsible Sections

**Layout Structure**:

```
┌─────────────────────────┐
│ Character Name          │
├─────────────────────────┤
│ ❤️ HP: 25 / 30          │
│ [■■■■■■■■□□] 83%        │
├─────────────────────────┤
│ ⚔️ Equipped              │
│ • Longsword (+5 dmg)    │
│ • Shield (+2 AC)        │
│ • Leather Armor (AC 12) │
├─────────────────────────┤
│ 🔮 Active Conditions     │
│ • Blessed (3 turns)     │
│ • Poisoned (2 turns)    │
└─────────────────────────┘
```

**Information Hierarchy** (Top to Bottom):

1. **Character Name** - Large, bold text
2. **Health Bar** - Visual progress bar with numeric value
3. **Equipped Items** - Collapsible list with stat impacts
4. **Active Conditions** - Collapsible list with turn duration

**Responsive Behavior**:

- Desktop (>1200px): Fixed right sidebar, 300px width
- Tablet (800-1200px): Fixed right sidebar, 250px width
- Mobile (<800px): Collapsible overlay triggered by icon button

**Update Strategy**:

- Poll character endpoint every 5 seconds while game active
- Immediate update on combat action resolution
- Visual animation on HP change (red flash if damage, green flash if heal)

**Rationale**: Fixed sidebar keeps critical info always visible without scrolling. Collapsible sections reduce clutter while allowing detail access. Visual progress bar is faster to parse than numbers alone.

**Alternatives Considered**:

- Top header bar (rejected - wastes vertical space for text content)
- Bottom fixed bar (rejected - conflicts with mobile keyboards)
- Floating overlay (rejected - obstructs narrative text)

---

### Task 6: Combat UI Turn Indicator Design

**Topic**: How to clearly show whose turn it is and combat state

**Decision**: In-Context Turn Banner with Combatant Highlights

**Turn Indicator Display**:

- Prominent banner above action buttons: "🗡️ YOUR TURN" (green background)
- Or: "⏳ Goblin's Turn" (neutral background)
- Round counter in top-right of banner: "Round 3"
- Current combatant highlighted in combatants list
- Disable input during enemy turns (show "Waiting for enemy...")

**Combatants List** (in Combat UI section):

```
┌─────────────────────────────┐
│ 🗡️ COMBAT - Round 3         │
├─────────────────────────────┤
│ ▶️ [YOU] Hero               │
│    ❤️ 25/30 | AC 15          │
├─────────────────────────────┤
│   [ENEMY] Goblin 1          │
│    ❤️ 5/10 | AC 12           │
├─────────────────────────────┤
│   [ENEMY] Goblin 2          │
│    ❤️ 8/10 | AC 12           │
└─────────────────────────────┘
```

**Visual Cues**:

- Current turn: Green arrow indicator (▶️) next to active combatant
- Low health: Red text for HP below 30%
- Defeated: Strikethrough and gray color

**Initiative Order**:

- Combatants list ordered by initiative (highest to lowest)
- Order remains fixed throughout combat
- Defeated combatants move to bottom and gray out

**Rationale**: In-context banner is impossible to miss. Green/neutral color coding provides instant recognition. Combatants list shows full combat state without cluttering narrative. Highlighting active combatant prevents confusion.

**Alternatives Considered**:

- Modal overlay for combat (rejected - blocks narrative history)
- Separate combat screen (rejected - loses narrative context)
- Audio cues for turn changes (rejected - accessibility issue, sound may be off)

---

### Task 7: Performance Optimization Strategy

**Topic**: Ensure smooth 60fps animations and <100ms input response

**Decision**: React.memo, CSS Animations, and Throttled Polling

**Optimization Techniques**:

1. **Component Memoization**:
   - Use `React.memo()` on narrative messages to prevent unnecessary re-renders
   - Memoize character status components if props unchanged
   - Use `useMemo()` for expensive computations (formatting, filtering)

2. **CSS Animations Over JavaScript**:
   - Dice rolls use CSS keyframe animations (GPU-accelerated)
   - HP bar changes use CSS transitions (transform/opacity only)
   - Avoid JavaScript animation loops

3. **Virtual Scrolling**:
   - Render only visible narrative messages (windowing)
   - Use `react-window` or custom implementation if needed
   - Load more on scroll up (infinite scroll pattern)

4. **Debounced/Throttled API Calls**:
   - Throttle character status polling to every 5 seconds
   - Debounce command input validation to 300ms after typing stops
   - Batch multiple state updates in single API call when possible

5. **Code Splitting**:
   - Lazy load combat UI components (only when combat starts)
   - Lazy load dice animation components (only when dice roll triggered)

**Performance Targets**:

- Input capture to API call: <100ms
- Dice animation duration: 1.2-1.5s (feels responsive, not rushed)
- Narrative scroll: 60fps smooth scrolling
- Component re-render: <16ms (60fps threshold)

**Rationale**: CSS animations are hardware-accelerated and don't block JavaScript execution. Memoization prevents wasteful re-renders. Virtual scrolling maintains performance with hundreds of messages. These techniques are battle-tested and well-supported.

**Alternatives Considered**:

- Web Workers for animation (rejected - overkill, CSS sufficient)
- Canvas for all UI (rejected - accessibility issues, complexity)
- Real-time WebSocket (deferred - polling sufficient for MVP turn-based game)

---

### Task 8: Accessibility Considerations

**Topic**: Ensure keyboard navigation and screen reader support

**Decision**: Semantic HTML, ARIA Live Regions, and Full Keyboard Nav

**Keyboard Navigation**:

- Tab: Navigate between input field, action buttons, combatant list
- Enter: Submit command from input field
- Up/Down: Navigate command history (when input focused)
- Escape: Clear input field or close modal dialogs
- Spacebar: Activate action buttons

**Screen Reader Support**:

- Use `aria-live="polite"` for narrative messages area
- Use `aria-live="assertive"` for combat turn announcements
- Use `role="status"` for HP updates
- All buttons have `aria-label` describing action
- Combat state changes announced via `aria-live`

**Semantic HTML**:

- `<main>` for game screen content
- `<aside>` for character status sidebar
- `<form>` for command input
- `<button>` for all interactive elements (not divs)
- `<ul>/<li>` for combatants list

**Visual Accessibility**:

- Color contrast: 4.5:1 minimum (WCAG AA)
- Font size: Base 16px, scalable with browser zoom
- Focus indicators: 2px solid outline on all focusable elements
- No color-only information (use icons + text)

**Rationale**: Text adventures are inherently screen-reader friendly (text-based content). ARIA live regions provide real-time updates without interrupting user flow. Full keyboard navigation ensures usability for motor-impaired users.

**Alternatives Considered**:

- Skip keyboard support (rejected - constitution violation, accessibility requirement)
- Use divs with onClick (rejected - breaks semantic HTML, bad for screen readers)
- Rely on default browser accessibility (rejected - insufficient for complex UI)

---

## Summary of Decisions

| Research Area     | Decision                                         | Key Rationale                                    |
| ----------------- | ------------------------------------------------ | ------------------------------------------------ |
| Backend APIs      | Use existing Adventures, Combat, Characters APIs | Already implemented, sufficient for all features |
| Narrative Display | Frontend state with virtual scrolling            | Performance with 500+ messages, instant feedback |
| Command Input     | Text input + history navigation + quick actions  | Terminal-like UX, familiar and powerful          |
| Dice Animation    | CSS 3D transforms (no library)                   | GPU-accelerated, 60fps, no dependencies          |
| Character Status  | Fixed right sidebar, collapsible sections        | Always visible, clear hierarchy, responsive      |
| Combat Turn UI    | In-context banner + combatants list              | Impossible to miss, full context visible         |
| Performance       | React.memo + CSS animations + throttled polling  | 60fps animations, <100ms input response          |
| Accessibility     | Semantic HTML + ARIA live + keyboard nav         | WCAG AA compliant, screen reader friendly        |

---

## Dependencies Confirmed

✅ React 18.3 with TypeScript 5.9  
✅ TanStack React Query v5 (API state management)  
✅ React Router v6 (routing)  
✅ Tailwind CSS v4.1 (styling)  
✅ Vitest + React Testing Library (testing)  
✅ OpenAPI TypeScript (type generation from swagger)

**No new dependencies required** - all decisions use existing tech stack.

---

## Next Steps

This research phase is complete. Proceeding to:

- **Phase 1**: Generate `data-model.md` (frontend data structures)
- **Phase 1**: Generate `contracts/` (API integration specs)
- **Phase 1**: Generate `quickstart.md` (implementation guide)
- **Phase 1**: Update agent context for GitHub Copilot

---

**Research Status**: ✅ **COMPLETE** - All technical unknowns resolved. Ready for design phase.
