# Tasks: Dice Rolling Engine

**Input**: Design documents from `/specs/001-dice-engine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml
**Tests**: Full TDD approach - tests required by specification to validate user stories
**Organization**: Tasks grouped by user story to enable independent implementation and validation

**Path Conventions**: Single ASP.NET Core project structure (src/, tests/ at repository root)

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3) for traceability and independent testing
- **File paths**: All tasks include exact paths relative to repository root

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create ASP.NET Core 10 solution structure with dependencies

- [x] T001 Create DiceEngine.sln solution file in repository root
- [x] T002 [P] Create DiceEngine.API project in src/DiceEngine.API/ with Program.cs and Dependencies
- [x] T003 [P] Create DiceEngine.Application project in src/DiceEngine.Application/ for services and models
- [x] T004 [P] Create DiceEngine.Domain project in src/DiceEngine.Domain/ for entities and value objects
- [x] T005 [P] Create DiceEngine.Infrastructure project in src/DiceEngine.Infrastructure/ for persistence and EF Core
- [x] T006 [P] Create DiceEngine.Application.Tests project in tests/DiceEngine.Application.Tests/ with xUnit
- [x] T007 [P] Create DiceEngine.API.Tests project in tests/DiceEngine.API.Tests/ with xUnit
- [x] T008 Add NuGet package references: Microsoft.EntityFrameworkCore, Microsoft.EntityFrameworkCore.PostgreSQL to DiceEngine.Infrastructure.csproj
- [x] T009 [P] Add xUnit dependencies to test projects: xunit, xunit.runner.visualstudio, Microsoft.NET.Test.Sdk
- [x] T010 Configure project references: API → Application → Domain, Infrastructure → Domain, Tests → Application/API
- [x] T011 Create appsettings.json in src/DiceEngine.API/ with logging and basic configuration
- [x] T012 Update .gitignore to exclude bin/, obj/, .vs/, appsettings.Production.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST complete before ANY user story implementation

**⚠️ CRITICAL - BLOCKS ALL USER STORIES**: No user story work can begin until this phase is complete

### Infrastructure & Database

- [x] T013 Create PostgreSQL DbContext in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs for future roll history
- [x] T014 [P] Create appsettings.json database connection string configuration in src/DiceEngine.API/appsettings.json
- [x] T015 Create default DbContext constructor pattern with dependency injection support in src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs

### Core Service Framework

- [x] T016 Create IDiceService interface in src/DiceEngine.Application/Services/IDiceService.cs with Roll() and ValidateExpression() signatures
- [x] T017 Create DiceService class skeleton in src/DiceEngine.Application/Services/DiceService.cs with dependency injection ready
- [x] T018 Create IDiceExpressionParser interface in src/DiceEngine.Application/Services/IDiceExpressionParser.cs with Parse() signature
- [x] T019 Create DiceExpressionParser class in src/DiceEngine.Application/Services/DiceExpressionParser.cs (regex patterns to be implemented per story)
- [x] T020 Create IDiceRoller interface in src/DiceEngine.Application/Services/IDiceRoller.cs with Roll() and RollAdvantage()/RollDisadvantage() signatures
- [x] T021 Create DiceRoller class in src/DiceEngine.Application/Services/DiceRoller.cs using System.Security.Cryptography.RandomNumberGenerator

### Domain Entities

- [x] T022 [P] Create DiceRoll value object in src/DiceEngine.Domain/ValueObjects/DiceRoll.cs with NumberOfDice, SidesPerDie, Modifier properties
- [x] T023 [P] Create DiceExpression aggregate in src/DiceEngine.Domain/Entities/DiceExpression.cs with OriginalExpression, DiceRolls[], Modifiers[], HasAdvantage, HasDisadvantage
- [x] T024 [P] Create RollMetadata value object in src/DiceEngine.Domain/ValueObjects/RollMetadata.cs with ExecutionTimeMs, RngAlgorithm, IsCached
- [x] T025 Create RollResult model in src/DiceEngine.Application/Models/RollResult.cs for API response serialization

### API Controller Framework

- [x] T026 Create RollController in src/DiceEngine.API/Controllers/RollController.cs with dependency injection for DiceService
- [x] T027 Create StandardResponse<T> wrapper in src/DiceEngine.API/Models/StandardResponse.cs for consistent API responses
- [x] T028 Create ErrorResponse model in src/DiceEngine.API/Models/ErrorResponse.cs with code, message, details fields
- [x] T029 Configure dependency injection in src/DiceEngine.API/Program.cs to wire up services (DiceService, DiceExpressionParser, DiceRoller)
- [x] T030 [P] Create custom exception types in src/DiceEngine.Application/Exceptions/ (InvalidExpressionException.cs, ValidationException.cs)

### Testing Infrastructure

- [x] T031 Create test helper in tests/DiceEngine.Application.Tests/Helpers/RngMockHelper.cs to mock crypto-secure RNG for deterministic tests
- [x] T032 Create test fixtures in tests/DiceEngine.Application.Tests/Fixtures/DiceRollerFixture.cs for setup/teardown

**Checkpoint: Foundation Ready** ✅
All user story work can now begin in parallel. All infrastructure, services, entities, and controller are scaffolded and wired via DI.

---

## Phase 3: User Story 1 - Basic Dice Notation Parsing (Priority: P1) 🎯 MVP

**Goal**: Implement standard RPG dice notation parsing and rolling (2d6, 1d20+5, 3d8-2) with cryptographically secure randomization

**Independent Test Criteria**:

- Parse valid notations (2d6, 1d20+5, 3d8-2) without errors
- Individual rolls match expected ranges (1-N per die)
- Apply modifiers correctly
- Reject invalid notations (2x6, d20, 0d6) with clear error messages
- Can be fully tested without User Story 2 or 3

### Tests for User Story 1 (TDD - Write These FIRST, Ensure They FAIL)

- [x] T033 [P] [US1] Unit test DiceExpressionParser for valid basic notation "2d6" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T034 [P] [US1] Unit test DiceExpressionParser for valid modified notation "1d20+5" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T035 [P] [US1] Unit test DiceExpressionParser for negative modifier "3d8-2" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T036 [P] [US1] Unit test DiceExpressionParser rejecting invalid "2x6" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs with error code INVALID_EXPRESSION (should FAIL before implementation)
- [x] T037 [P] [US1] Unit test DiceExpressionParser rejecting "d20" (no count) in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T038 [P] [US1] Unit test DiceExpressionParser rejecting "0d6" (zero dice) in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T039 [P] [US1] Unit test DiceRoller for 2d6 with seeded RNG returns correct range in tests/DiceEngine.Application.Tests/DiceRollerTests.cs (should FAIL before implementation)
- [x] T040 [P] [US1] Unit test DiceRoller applies modifiers correctly in tests/DiceEngine.Application.Tests/DiceRollerTests.cs (should FAIL before implementation)
- [x] T041 [P] [US1] Unit test DiceService.Roll("2d6") returns RollResult with individualRolls array in tests/DiceEngine.Application.Tests/DiceServiceTests.cs (should FAIL before implementation)
- [x] T042 [US1] Integration test POST /api/roll with body {"expression":"2d6"} returns 200 with roll data in tests/DiceEngine.API.Tests/RollControllerTests.cs (should FAIL before implementation)
- [x] T043 [US1] Integration test POST /api/roll with invalid "2x6" returns 400 with error in tests/DiceEngine.API.Tests/RollControllerTests.cs (should FAIL before implementation)

### Implementation for User Story 1

- [x] T044 Implement basic regex pattern in DiceExpressionParser for standard notation NdS±M in src/DiceEngine.Application/Services/DiceExpressionParser.cs
- [x] T045 Implement Parse() method to extract N, S, M from "2d6+5" format in src/DiceEngine.Application/Services/DiceExpressionParser.cs
- [x] T046 [P] [US1] Implement DiceRoll validation (1-1000 dice, 1-1000 sides) in src/DiceEngine.Domain/ValueObjects/DiceRoll.cs
- [x] T047 [P] [US1] Implement DiceExpression.Parse() factory and validation in src/DiceEngine.Domain/Entities/DiceExpression.cs
- [x] T048 [US1] Implement DiceRoller.Roll() using System.Security.Cryptography.RandomNumberGenerator in src/DiceEngine.Application/Services/DiceRoller.cs
- [x] T049 [US1] Implement sum calculation for individual rolls in DiceRoller in src/DiceEngine.Application/Services/DiceRoller.cs
- [x] T050 [US1] Implement modifier application to totals in DiceRoller in src/DiceEngine.Application/Services/DiceRoller.cs
- [x] T051 [US1] Implement DiceService.Roll() orchestration method in src/DiceEngine.Application/Services/DiceService.cs calling Parser → Roller → RollResult
- [x] T052 [US1] Implement POST /api/roll endpoint in RollController in src/DiceEngine.API/Controllers/RollController.cs
- [x] T053 [US1] Implement request validation and error handling in RollController in src/DiceEngine.API/Controllers/RollController.cs
- [x] T054 [US1] Implement response serialization to StandardResponse<RollResult> in src/DiceEngine.API/Controllers/RollController.cs
- [x] T055 [US1] Implement timestamp and metadata capture in RollResult in src/DiceEngine.Application/Models/RollResult.cs
- [x] T056 [US1] Implement error code mapping (INVALID_EXPRESSION, INVALID_PARAMETERS) in src/DiceEngine.API/Models/ErrorResponse.cs
- [x] T057 [US1] Run all User Story 1 tests and verify passing (T033-T043 should now PASS)
- [ ] T058 [US1] Performance validation: Execute 100 rolls averaging <5ms per roll, <50ms SLA in tests/DiceEngine.Application.Tests/PerformanceTests.cs

**Checkpoint: User Story 1 Complete** ✅
Basic dice notation (2d6, 1d20+5, 3d8-2) fully functional and independently testable. MVP achievable at this point.

---

## Phase 4: User Story 2 - Complex Expression Parsing (Priority: P2)

**Goal**: Parse and roll multiple dice groups combined with modifiers (2d6+1d4+3, 1d8+2d6+5)

**Independent Test Criteria**:

- Parse expressions with 2+ dice groups: "2d6+1d4+3"
- Execute each group independently
- Sum results correctly
- Use left-to-right evaluation
- Reject malformed: "2d6++1d4", "d6+", missing operands
- Can be fully tested alongside User Story 1 (independent)

### Tests for User Story 2 (TDD - Write These FIRST, Ensure They FAIL)

- [x] T059 [P] [US2] Unit test DiceExpressionParser for "2d6+1d4+3" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T060 [P] [US2] Unit test DiceExpressionParser for "1d8+2d6+5" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T061 [P] [US2] Unit test DiceExpressionParser for "1d10+1d6-2" left-to-right evaluation in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T062 [P] [US2] Unit test DiceExpressionParser rejecting "2d6++1d4" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T063 [P] [US2] Unit test DiceExpressionParser rejecting "d6+" in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T064 [P] [US2] Unit test DiceRoller rolling multiple groups and summing correctly in tests/DiceEngine.Application.Tests/DiceRollerTests.cs (should FAIL before implementation)
- [x] T065 [US2] Unit test DiceService.Roll("2d6+1d4+3") returns RollResult with multiple roll groups in tests/DiceEngine.Application.Tests/DiceServiceTests.cs (should FAIL before implementation)
- [x] T066 [US2] Integration test POST /api/roll with "2d6+1d4+3" returns 200 with correct structure in tests/DiceEngine.API.Tests/RollControllerTests.cs (should FAIL before implementation)
- [x] T067 [US2] Integration test POST /api/roll with max complexity "3d6+2d8+1d4+10" completes <50ms in tests/DiceEngine.API.Tests/PerformanceTests.cs

### Implementation for User Story 2

- [x] T068 Extend regex patterns in DiceExpressionParser to support multiple dice groups in src/DiceEngine.Application/Services/DiceExpressionParser.cs
- [x] T069 [US2] Implement sequential component extraction: parse "2d6+1d4+3" → [(2d6), (1d4), (+3)] in src/DiceEngine.Application/Services/DiceExpressionParser.cs
- [x] T070 [US2] Update DiceExpression to support multiple DiceRoll components in DiceRolls collection in src/DiceEngine.Domain/Entities/DiceExpression.cs
- [x] T071 [US2] Implement DiceRoller to handle arrays of DiceRoll objects in src/DiceEngine.Application/Services/DiceRoller.cs
- [x] T072 [US2] Implement RollResult.RollsByGroup dictionary to group rolls by expression component in src/DiceEngine.Application/Models/RollResult.cs
- [x] T073 [US2] Implement RollResult.SubtotalsByGroup to show intermediate results in src/DiceEngine.Application/Models/RollResult.cs
- [x] T074 [US2] Update RollController to handle complex expressions in src/DiceEngine.API/Controllers/RollController.cs
- [x] T075 [US2] Run all User Story 2 tests and verify passing (T059-T067 should now PASS)
- [x] T076 [US2] Performance validation: 5+ dice groups completing <50ms SLA in tests/DiceEngine.Application.Tests/PerformanceTests.cs

**Checkpoint: User Stories 1 + 2 Complete** ✅
Basic and complex expressions fully functional. Both stories independently testable.

---

## Phase 5: User Story 3 - Advantage and Disadvantage Mechanics (Priority: P3)

**Goal**: Implement D&D-style advantage (roll twice, use higher) and disadvantage (roll twice, use lower)

**Independent Test Criteria**:

- "1d20a" performs two 1d20 rolls, returns higher
- "1d20d" performs two 1d20 rolls, returns lower
- Both rolls returned in advantageRollResults for transparency
- Flags cannot be combined (advantage AND disadvantage = error)
- Can be fully tested alongside Stories 1 & 2

### Tests for User Story 3 (TDD - Write These FIRST, Ensure They FAIL)

- [x] T077 [P] [US3] Unit test DiceExpressionParser for "1d20a" flag in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T078 [P] [US3] Unit test DiceExpressionParser for "1d20d" flag in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T079 [P] [US3] Unit test DiceExpressionParser rejecting "1d20ad" (conflicting flags) in tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs (should FAIL before implementation)
- [x] T080 [P] [US3] Unit test DiceRoller advantage roll returning 2 rolls and selecting higher in tests/DiceEngine.Application.Tests/DiceRollerTests.cs (should FAIL before implementation)
- [x] T081 [P] [US3] Unit test DiceRoller disadvantage roll returning 2 rolls and selecting lower in tests/DiceEngine.Application.Tests/DiceRollerTests.cs (should FAIL before implementation)
- [x] T082 [P] [US3] Unit test DiceRoller for "2d6+3" with advantage (advantage on 2d6, modifier after selection) in tests/DiceEngine.Application.Tests/DiceRollerTests.cs (should FAIL before implementation)
- [x] T083 [US3] Unit test DiceService.Roll("1d20a") returns RollResult with advantageRollResults array in tests/DiceEngine.Application.Tests/DiceServiceTests.cs (should FAIL before implementation)
- [x] T084 [US3] Integration test POST /api/roll with "1d20a" returns 200 with both rolls in advantageRollResults in tests/DiceEngine.API.Tests/RollControllerTests.cs (should FAIL before implementation)
- [x] T085 [US3] Integration test POST /api/roll with "1d20ad" returns 400 with CONFLICTING_FLAGS error in tests/DiceEngine.API.Tests/RollControllerTests.cs

### Implementation for User Story 3

- [x] T086 Extend DiceExpression with HasAdvantage and HasDisadvantage boolean flags in src/DiceEngine.Domain/Entities/DiceExpression.cs
- [x] T087 [US3] Update DiceExpressionParser regex to capture 'a' (advantage) or 'd' (disadvantage) flags in src/DiceEngine.Application/Services/DiceExpressionParser.cs
- [x] T088 [US3] Add validation: Cannot have both advantage AND disadvantage in DiceExpression in src/DiceEngine.Domain/Entities/DiceExpression.cs
- [x] T089 [US3] Implement DiceRoller.RollAdvantage() method: roll twice, return both, select higher in src/DiceEngine.Application/Services/DiceRoller.cs
- [x] T090 [US3] Implement DiceRoller.RollDisadvantage() method: roll twice, return both, select lower in src/DiceEngine.Application/Services/DiceRoller.cs
- [x] T091 [US3] Update DiceRoller.Roll() to dispatch to advantage/disadvantage methods based on flags in src/DiceEngine.Application/Services/DiceRoller.cs
- [x] T092 [US3] Extend RollResult with IsAdvantage and IsDisadvantage boolean flags in src/DiceEngine.Application/Models/RollResult.cs
- [x] T093 [US3] Implement RollResult.AdvantageRollResults array to store both rolls in src/DiceEngine.Application/Models/RollResult.cs
- [x] T094 [US3] Update DiceService.Roll() to pass advantage/disadvantage flags through to DiceRoller in src/DiceEngine.Application/Services/DiceService.cs
- [x] T095 [US3] Run all User Story 3 tests and verify passing (T077-T085 should now PASS)
- [x] T096 [US3] Performance validation: Advantage rolls completing <50ms SLA in tests/DiceEngine.Application.Tests/PerformanceTests.cs

**Checkpoint: All User Stories Complete** ✅
All core dice rolling features (basic, complex, advantage/disadvantage) fully functional and independently testable.

---

## Phase 6: Validation Endpoint & Statistics (Cross-Cutting Features)

**Purpose**: Additional API features that enhance usability (validate without rolling, statistical analysis)

- [x] T097 Implement POST /api/roll/validate endpoint in src/DiceEngine.API/Controllers/RollController.cs (reuses parser, no RNG)
- [x] T098 Create ValidateRequest model in src/DiceEngine.API/Models/ValidateRequest.cs
- [x] T099 Create ValidateResponse model in src/DiceEngine.API/Models/ValidateResponse.cs with ParsedComponents
- [x] T100 Implement DiceService.ValidateExpression() in src/DiceEngine.Application/Services/DiceService.cs
- [x] T101 [P] Implement DiceService.GetStatistics() calculating min/max/mean/stddev for expressions in src/DiceEngine.Application/Services/DiceService.cs
- [x] T102 [P] Implement GET /api/roll/stats/{expression} endpoint in src/DiceEngine.API/Controllers/RollController.cs
- [x] T103 Create StatsResponse model in src/DiceEngine.API/Models/StatsResponse.cs
- [x] T104 Unit test ValidateRequest/Response serialization in tests/DiceEngine.API.Tests/
- [x] T105 Integration test POST /api/roll/validate with valid expression in tests/DiceEngine.API.Tests/RollControllerTests.cs
- [x] T106 Integration test GET /api/roll/stats/2d6 returns correct statistical analysis in tests/DiceEngine.API.Tests/RollControllerTests.cs

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality improvements, documentation, and comprehensive validation

### Code Quality & Testing

- [x] T107 [P] Run complete test suite: `dotnet test` (all user story tests must pass)
- [x] T108 [P] Verify >90% code coverage for DiceService, DiceExpressionParser, DiceRoller in tests/
- [x] T109 Run comprehensive edge case tests in tests/DiceEngine.Application.Tests/EdgeCaseTests.cs:
  - [x] "0d6" rejection (zero dice)
  - [x] "2d0" rejection (zero sides)
  - [x] "100d100+50d50" max complexity handling
  - [x] Whitespace variations: "2d6 + 1d4" equals "2d6+1d4"
  - [x] Large modifiers: "1d20+1000", "1d20-1000"

### Documentation & API

- [x] T110 Generate OpenAPI/Swagger documentation from code attributes in src/DiceEngine.API/
- [x] T111 Cross-check generated OpenAPI against specs/001-dice-engine/contracts/openapi.yaml
- [x] T112 Add XML doc comments to all public methods in DiceService, DiceRoller, DiceExpressionParser
- [x] T113 Create README.md in repository root with feature overview and quickstart
- [x] T114 Update specs/001-dice-engine/quickstart.md with actual build/run commands for completed implementation

### Performance & Security

- [x] T115 [P] Verify cryptography: Confirm RandomNumberGenerator cannot be predicted (statistical test in tests/DiceEngine.Application.Tests/CryptographyTests.cs)
- [x] T116 [P] Performance benchmark: Run 1000 rolls of varying complexity, verify all <50ms in tests/DiceEngine.Application.Tests/BenchmarkTests.cs
- [x] T117 Input validation: Confirm all invalid expressions properly rejected with appropriate error codes
- [x] T118 Test database connectivity: Spin up PostgreSQL, verify DbContext migrations work in tests/

### Integration & Deployment

- [x] T119 Create docker-compose.yaml for local PostgreSQL setup in repository root
- [x] T120 Create Dockerfile for containerizing DiceEngine.API in repository root
- [x] T121 Test full API startup: `dotnet run --project src/DiceEngine.API`
- [x] T122 Manual validation: Execute quickstart.md cURL examples end-to-end
- [x] T123 Clean up: Run `dotnet format` on all source files for consistency
- [x] T124 Final git cleanup: Commit all changes, verify clean working directory

**Final Checkpoint: Ready for Production** ✅

- All tests passing (>90% coverage)
- API fully functional with all endpoints tested
- Performance SLA (<50ms per operation) verified
- Documentation complete
- Container-ready

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓ (MUST COMPLETE BEFORE)
Phase 2: Foundational [CRITICAL - BLOCKS ALL STORIES]
    ↓ (MUST COMPLETE BEFORE)
Phase 3: User Story 1 (P1) ──┐
Phase 4: User Story 2 (P2) ──┼─→ CAN RUN IN PARALLEL
Phase 5: User Story 3 (P3) ──┘
    ↓ (ALL MUST COMPLETE BEFORE)
Phase 6: Validation & Statistics
    ↓
Phase 7: Polish & Cross-Cutting
```

### Within Phase 2 (Foundational)

All infrastructure tasks can run in parallel once they don't conflict:

```
Database/Infrastructure [T013-T015]:
  - Can run in parallel with Service Framework

Service Framework [T016-T021]:
  - Must complete before Phase 3 implementation tasks
  - Can run in parallel with each other

Domain Entities [T022-T025]:
  - Must complete before Phase 3 implementation tasks
  - Can run in parallel: T022, T023, T024 (different files)

Controller Framework [T026-T030]:
  - Must complete before Phase 3 implementation tasks
  - Can run in parallel: T026, T027, T028 (different files)

Testing Infrastructure [T031-T032]:
  - Can run in parallel with other foundational tasks
```

### Within Each User Story Phase

```
Tests [Phase 3: T033-T043, Phase 4: T059-T067, Phase 5: T077-T085]:
  - All marked [P] can run in parallel
  - MUST be written and FAIL before implementation begins

Implementation [Phase 3: T044-T057, Phase 4: T068-T075, Phase 5: T086-T095]:
  - Domain/parser tasks [P] can run in parallel (different files)
  - Service/roller tasks must follow parser
  - Controller tasks depend on service completion
```

### Parallel Opportunities

#### Parallel Example 1: Phase 1 Project Creation

```
Team: 7 developers
T002: Create API project (Dev A)
T003: Create Application project (Dev B)
T004: Create Domain project (Dev C)
T005: Create Infrastructure project (Dev D)
T006: Create Application.Tests project (Dev E)
T007: Create API.Tests project (Dev F)
T008: Add NuGet packages (Dev G)

All 7 running simultaneously ➜ Phase 1 complete in 1/7 time
```

#### Parallel Example 2: Phase 2 Infrastructure after Foundational

```
Team: 3 developers
After Phase 1 completes:

Dev A: Database/Infrastructure [T013-T015]
Dev B: Service Framework [T016-T021]
Dev C: Domain Entities [T022-T025]

All 3 complete in parallel ➜ Phase 2 ~3x faster
```

#### Parallel Example 3: All User Stories After Foundational Completes

```
Team: 3 developers
After Phase 2 completes:

Dev A: User Story 1 [T044-T057]
Dev B: User Story 2 [T068-T075]
Dev C: User Story 3 [T086-T095]

All 3 stories complete in parallel ➜ Phase 3-5 optimal velocity
```

#### Parallel Example 4: Within User Story 1 Implementation

```
Dev A: T044-T045 (Parser regex)
Dev B: T046-T047 (Domain validation) ──→ Depends on A
Dev C: T048-T050 (Roller implementation) ──→ Depends on A
Dev D: T051 (DiceService) ──→ Depends on B,C
Dev E: T052-T054 (Controller) ──→ Depends on D

Critical path: T044 → (T046-T047 parallel with T048-T050) → T051 → T052
Parallel opportunity: While A writes parser, B starts on domain and C on roller patterns
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Fastest path to deployment**: 1-3 weeks for production-ready basic rolling

```
Week 1:
  Complete Phase 1: Setup
  Complete Phase 2: Foundational (critical, takes longest)

Week 2:
  Complete Phase 3: User Story 1 (basic rolling)
  Run tests T033-T057 to verify
  Validate <50ms SLA

Week 2.5:
  Partial Phase 7: Documentation, README
  Deploy first MVP: Basic rolling (2d6, 1d20+5, etc.)

Result: Production-ready MVP with core feature
```

### Incremental Delivery

**Each story adds value without breaking previous features**

```
Delivery 1 (Week 2.5): User Story 1 (Basic rolling)
  - Deploy: 2d6, 1d20+5, error handling
  - Usable for: Simple game mechanics

Delivery 2 (Week 3.5): User Stories 1 + 2 (Complex expressions)
  - Deploy: 2d6+1d4+3, multi-group rolling
  - Usable for: Complex damage calculations

Delivery 3 (Week 4): User Stories 1 + 2 + 3 (Advantage/Disadvantage)
  - Deploy: Full feature set including 1d20a, 1d20d
  - Usable for: Complete D&D mechanics
```

### Parallel Team Strategy (3 Developers)

**Optimal velocity with team of 3**

```
Days 1-2: All 3 devs complete Phase 1 Setup together
Days 2-4: All 3 devs complete Phase 2 Foundational together
Days 5-7: Devs split: A→US1, B→US2, C→US3 (parallel)
Days 8: All 3 regroup: Phase 6 cross-cutting features
Days 9: All 3: Phase 7 polish & testing
Days 10: Deploy

Elapsed time: 2 weeks vs 3+ weeks sequential
```

### Sequential Strategy (1 Developer)

**If team of 1 focused on completing full feature**

```
Days 1-2: Phase 1 Setup
Days 2-5: Phase 2 Foundational
Days 5-7: Phase 3 User Story 1
Days 7-8: Phase 4 User Story 2
Days 8-9: Phase 5 User Story 3
Days 9-10: Phase 6 + Phase 7 Polish

Total: ~2 weeks for full feature
```

---

## Notes

- **[P] marker**: Tasks with different files that don't depend on incomplete tasks
- **[Story] label**: Maps task to specific user story (US1, US2, US3) for traceability
- **Independence**: Each user story is independently completable and testable
- **TDD approach**: All test tasks must be written and FAIL before implementation begins
- **Checkpoints**: Pause at each checkpoint to validate story independently before proceeding
- **Commits**: Commit after each completed task or logical group
- **Skips**: Can stop at any checkpoint for MVP validation (stop after Phase 3 for basic rolling)

---

## Quick Reference: Story Scope

| Story | Feature                               | Tasks     | Tests     | Status  |
| ----- | ------------------------------------- | --------- | --------- | ------- |
| US1   | Basic Notation (2d6, 1d20+5)          | T033-T058 | T033-T043 | Phase 3 |
| US2   | Complex Expressions (2d6+1d4+3)       | T059-T076 | T059-T067 | Phase 4 |
| US3   | Advantage/Disadvantage (1d20a, 1d20d) | T077-T096 | T077-T085 | Phase 5 |
| Cross | Validate & Stats endpoints            | T097-T106 | T104-T106 | Phase 6 |
| Final | Documentation & production-ready      | T107-T124 | T108-T109 | Phase 7 |

---

## File Change Summary

### New Files to Create

```
src/DiceEngine.API/Program.cs
src/DiceEngine.API/appsettings.json
src/DiceEngine.API/Controllers/RollController.cs
src/DiceEngine.API/Models/StandardResponse.cs
src/DiceEngine.API/Models/ErrorResponse.cs
src/DiceEngine.API/Models/ValidateRequest.cs
src/DiceEngine.API/Models/ValidateResponse.cs
src/DiceEngine.API/Models/StatsResponse.cs

src/DiceEngine.Application/Services/DiceService.cs
src/DiceEngine.Application/Services/IDiceService.cs
src/DiceEngine.Application/Services/DiceExpressionParser.cs
src/DiceEngine.Application/Services/IDiceExpressionParser.cs
src/DiceEngine.Application/Services/DiceRoller.cs
src/DiceEngine.Application/Services/IDiceRoller.cs
src/DiceEngine.Application/Models/RollResult.cs
src/DiceEngine.Application/Exceptions/InvalidExpressionException.cs
src/DiceEngine.Application/Exceptions/ValidationException.cs

src/DiceEngine.Domain/Entities/DiceExpression.cs
src/DiceEngine.Domain/ValueObjects/DiceRoll.cs
src/DiceEngine.Domain/ValueObjects/RollMetadata.cs

src/DiceEngine.Infrastructure/Persistence/DiceEngineDbContext.cs

tests/DiceEngine.Application.Tests/DiceExpressionParserTests.cs
tests/DiceEngine.Application.Tests/DiceRollerTests.cs
tests/DiceEngine.Application.Tests/DiceServiceTests.cs
tests/DiceEngine.Application.Tests/EdgeCaseTests.cs
tests/DiceEngine.Application.Tests/PerformanceTests.cs
tests/DiceEngine.Application.Tests/CryptographyTests.cs
tests/DiceEngine.Application.Tests/BenchmarkTests.cs
tests/DiceEngine.Application.Tests/Helpers/RngMockHelper.cs
tests/DiceEngine.Application.Tests/Fixtures/DiceRollerFixture.cs

tests/DiceEngine.API.Tests/RollControllerTests.cs
tests/DiceEngine.API.Tests/PerformanceTests.cs

DiceEngine.sln
docker-compose.yaml
Dockerfile
README.md
.gitignore
```

---

**Generated**: 2026-01-27 | **Status**: Ready for implementation | **Branch**: 001-dice-engine
