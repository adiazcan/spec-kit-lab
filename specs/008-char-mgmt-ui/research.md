# Research Findings: Character Management Interface

**Feature**: 008-char-mgmt-ui  
**Date**: January 30, 2026  
**Status**: Complete - All clarifications resolved

---

## Research Summary

All specification ambiguities have been resolved. Three core mechanics (point-buy, dice rolling, modifier calculation) are defined using industry-standard D&D 5E rules. Backend API dependency verified. No blockers for implementation.

---

## Research Topics & Decisions

### 1. Point-Buy System Mechanics

**Question**: What are the exact rules for point-buy attribute allocation?

**Research Result**: Analyzed existing TTRPGs and the specification's D&D 5E assumption.

**Decision Made**: Implement D&D 5E Standard Point-Buy

**Details**:

| Attribute Score | Cost (Points) |
| --------------- | ------------- |
| 8-9             | 1             |
| 9-10            | 1             |
| 10-11           | 1             |
| 11-12           | 1             |
| 12-13           | 1             |
| 13-14           | 2             |
| 14-15           | 2             |
| 15-16           | 3             |
| 16-17           | 3             |
| 17-18           | 4             |

**Starting State**: All attributes at 8, 27 points available

**Rationale**:

- Follows D&D 5E specification, industry standard
- Provides balanced point distribution
- Non-linear scaling (higher values cost more) incentivizes attribute specialization
- Familiar to target audience of tabletop gamers
- Matches player expectations from existing content

**Alternatives Considered**:

1. **Flat Point Cost** (e.g., all +1 = 1 point)
   - **Rejected**: Provides no incentive to specialize - all attributes equally valuable
   - Creates no meaningful strategic choice
   - Results in min-max play patterns

2. **Unlimited Points**
   - **Rejected**: No resource constraint defeats game balance
   - Players would create overpowered characters
   - Violates game design principle of meaningful trade-offs

3. **Preset Attribute Allocations**
   - **Rejected**: Removes player agency
   - Reduces character personalization
   - Contradicts user story stating "allocate attribute points"

**Implementation Impact**:

- Frontend: Build point cost lookup table, validate allocation against remaining pool
- Backend: No change needed (accepts any 3-18 attribute values)
- Testing: Verify point math, edge cases (all 18s impossible with 27 points)

---

### 2. Dice Roll Method

**Question**: What is the standard dice rolling method for attribute generation?

**Research Result**: Examined traditional tabletop RPG rolling methods.

**Decision Made**: Implement 4d6 Drop Lowest (D&D 5E Standard)

**Details**:

**Method**: Roll 4 six-sided dice, discard the lowest value, sum the remaining three

**Examples**:

- Roll [3, 4, 5, 6] → Drop 3 → Sum 4+5+6 = **15**
- Roll [2, 2, 2, 4] → Drop one 2 → Sum 2+2+4 = **8**
- Roll [1, 1, 1, 1] → Drop 1 → Sum 1+1+1 = **3**
- Roll [6, 6, 6, 6] → Drop 6 → Sum 6+6+6 = **18**

**Range**: 3-18 (minimum roll 1+1+1, maximum 6+6+6)

**Re-roll Policy**: Users can re-roll individual attributes before submitting (not entire character)

**Animation/UX**:

- Display all 4 dice during roll
- Highlight/shade the dropped die
- Show running sum calculation
- Allow ~1 second delay for visual feedback

**Rationale**:

- Standard in tabletop industry for 40+ years
- Exciting visual element vs. pure randomization
- Works within 3-18 attribute range (matches point-buy)
- Four dice create excitement and favorable probability curve
- Visual feedback enhances engagement

**Alternatives Considered**:

1. **3d6 Standard**
   - **Rejected**: Range 3-18 but all rolls median ~10 (boring bell curve)
   - Less variance, less exciting
   - Many rolls in uninteresting 8-12 range

2. **2d6+6**
   - **Rejected**: Also produces 3-18 range
   - Less familiar (not standard in D&D)
   - Mechanical feel, no "lucky critical" excitement

3. **Manual Number Entry**
   - **Rejected**: Contradicts user story desire for "randomness and excitement"
   - Players could cheat
   - Lacks tabletop feel

4. **Single d20**
   - **Rejected**: Only 20 possible values, not 3-18 range
   - Would require transformation (complicated for UI)

**Implementation Impact**:

- Frontend: Build dice roller utility, generate 4 random numbers 1-6, sort and drop min
- Backend: No change needed (accepts any valid 3-18)
- Testing: Verify distribution, ensure low values possible but rare

---

### 3. Modifier Calculation Formula

**Question**: What formula calculates modifiers from attribute values?

**Research Result**: Confirmed with backend specification (003-character-management).

**Decision Made**: Standard D&D 5E Formula

**Formula**: `Math.floor((attributeValue - 10) / 2)`

**Calculation Examples**:

| Attribute | Calculation                  | Modifier | Display |
| --------- | ---------------------------- | -------- | ------- |
| 3         | (3-10)/2 = -3.5 → floor = -3 | -3       | -3      |
| 8         | (8-10)/2 = -1                | -1       | -1      |
| 10        | (10-10)/2 = 0                | 0        | +0      |
| 12        | (12-10)/2 = 1                | 1        | +1      |
| 14        | (14-10)/2 = 2                | 2        | +2      |
| 16        | (16-10)/2 = 3                | 3        | +3      |
| 18        | (18-10)/2 = 4                | 4        | +4      |

**Display Rules**:

- Positive: "+2", "+3", "+4"
- Zero: "+0" (not "0" or blank)
- Negative: "-1", "-2", "-3"

**Real-Time Update**: Modifier recalculates immediately as user adjusts attribute value (<100ms)

**Rationale**:

- Matches backend implementation (verified in 003-character-management spec)
- Standard D&D 5E formula
- Simple to calculate (pure function)
- Easily tested with unit tests

**Implementation Impact**:

- Frontend: Create pure function `calculateModifier(baseValue: number): number`
- Synchronous calculation (no API call needed)
- <1ms per calculation
- Testable with 16 test cases (each attribute value 3-18)

---

### 4. Backend API Dependency

**Question**: Is the character management backend available for integration?

**Research Result**: Verified existing feature 003-character-management.

**Status**: ✅ **Available and Ready**

**API Endpoints**:

```
POST   /api/characters
GET    /api/characters/{characterId}
PUT    /api/characters/{characterId}
DELETE /api/characters/{characterId}
GET    /api/adventures/{adventureId}/characters
GET    /api/characters/{characterId}/snapshots
POST   /api/characters/{characterId}/snapshots
```

**Request/Response Contract**: OpenAPI 3.0.1 specification in `/swagger-openapi.json`

**Type Generation**: Frontend can generate TypeScript types using:

```bash
npm run generate:api
# Output: src/types/api.ts
```

**Key Endpoints for This Feature**:

1. **Create Character**: `POST /api/characters`

   ```json
   {
     "name": "Gandalf",
     "adventureId": "uuid",
     "attributes": {
       "str": 10,
       "dex": 12,
       "int": 18,
       "con": 14,
       "cha": 16
     }
   }
   ```

2. **Get Character**: `GET /api/characters/{characterId}`
   - Returns all attributes and calculated modifiers

3. **Update Character**: `PUT /api/characters/{characterId}`
   - Same payload structure as create

4. **Delete Character**: `DELETE /api/characters/{characterId}`
   - Returns 204 No Content

5. **List Characters**: `GET /api/adventures/{adventureId}/characters`
   - Returns array of characters with summary info

**Rationale**:

- Backend is production-ready (feature 003 complete)
- OpenAPI spec provides contract-first integration
- Type safety via generated types
- No custom backend endpoints needed

**Dependency Notes**:

- Frontend only needs character CRUD operations
- Modifiers calculated by backend based on attribute values
- Snapshots available but not required for P1 (P3 feature)
- Authentication/authorization handled by existing middleware

---

### 5. UI/UX Best Practices

**Question**: What patterns work best for attribute editors?

**Research Result**: Analyzed accessibility and usability patterns.

**Decision Made**: Accessible Numeric Input Pattern

**Component Design**:

- Increment/decrement buttons flanking number input (spinbutton pattern)
- Large touch targets (>44x44px) for mobile
- Keyboard support: arrow keys for adjustment, Tab to navigate
- Real-time visual feedback
- Semantic HTML: `<input type="number">` with ARIA labels

**Modifier Display Pattern**:

- Badge adjacent to input showing calculated value
- Color coding optional (green positive, neutral zero, red negative)
- Minimum contrast ratio 4.5:1 (WCAG AA)

**Form Validation**:

- Character name: non-empty, 1-50 characters
- Attributes: 3-18 range only, integer values
- Point-buy mode: prevent submission if points remain unspent (allow) or exceeds budget (prevent)
- Dice roll mode: require all attributes rolled before submission

**Rationale**:

- Follows WCAG 2.1 Level AA accessibility guidelines (constitution requirement)
- Responsive across 320px mobile to 2560px+ desktop
- Supports keyboard-only navigation (constitution requirement)
- Screen reader compatible via semantic HTML + ARIA

---

## Decisions Summary Table

| Topic                    | Decision                                        | Rationale                           | Impact                                      |
| ------------------------ | ----------------------------------------------- | ----------------------------------- | ------------------------------------------- |
| **Point-Buy System**     | D&D 5E: 27 points, 8-18 range, non-linear costs | Industry standard, balanced         | Form validation logic, point pool tracking  |
| **Dice Rolling**         | 4d6 drop lowest                                 | Standard, exciting, visual feedback | Random number generation, UI animation      |
| **Modifier Calculation** | `(value - 10) / 2` floor                        | Matches backend spec                | Pure function utility                       |
| **Backend API**          | 003-character-management endpoints              | Already available                   | HTTP client + React Query setup             |
| **Type Safety**          | Generate from OpenAPI spec                      | Prevents API contract mismatches    | `npm run generate:api` in dev workflow      |
| **Accessibility**        | WCAG AA Level compliance required               | Constitution principle VI           | Focus management, keyboard nav, ARIA labels |

---

## No Blockers Identified

✅ Point-buy mechanics clearly defined  
✅ Dice rolling method established  
✅ Modifier formula verified with backend  
✅ Backend API available for integration  
✅ Technology stack supports all requirements  
✅ Accessibility patterns available

**Ready to proceed to Phase 1: Design**

---

**Date Completed**: January 30, 2026  
**Next Phase**: Data Model & Contract Design
