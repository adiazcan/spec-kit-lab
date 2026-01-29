<!--
Sync Impact Report:
- Version: 1.0.0 → 1.1.0 (MINOR bump - new principles added)
- Modified principles:
  • II. Documentation Clarity: Extended to include component/function documentation requirements
  • IV. Simplicity: Extended to include UI design philosophy (functionality over visual complexity)
- Added sections:
  • VI. Accessibility (NON-NEGOTIABLE): Keyboard navigation and screen reader support
  • VII. Responsiveness (NON-NEGOTIABLE): Mobile and desktop compatibility
  • VIII. Type Safety: Frontend-backend communication contracts
  • Error Handling subsection under Quality Standards: User-facing error display
- Removed sections: N/A
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (validated - constitution check compatible with frontend principles)
  ✅ .specify/templates/spec-template.md (validated - requirements align with extended principles)
  ✅ .specify/templates/tasks-template.md (validated - frontend task workflow compatible)
- Follow-up TODOs: None
-->

# Text Adventure Game REST API Constitution

## Core Principles

### I. RESTful Design (NON-NEGOTIABLE)

All API endpoints MUST follow REST architectural conventions strictly:

- Resources MUST be noun-based (not verbs)
- HTTP methods MUST be used semantically: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- URIs MUST be hierarchical and represent resource relationships
- Stateless communication MUST be maintained
- Responses MUST use appropriate HTTP status codes (2xx success, 4xx client errors, 5xx server errors)
- HATEOAS principles SHOULD be applied where practical for discoverability

**Rationale**: REST conventions provide predictable, standardized interfaces that reduce cognitive load for API consumers and ensure consistent behavior across all endpoints. Strict adherence prevents architectural drift and maintains long-term maintainability.

### II. Documentation Clarity (NON-NEGOTIABLE)

Every API endpoint MUST be fully documented using OpenAPI Specification 3.0.1:

- Complete request/response schemas with data types and constraints
- All parameters (path, query, header, body) documented with examples
- Success and error response codes with descriptions
- Authentication/authorization requirements clearly stated
- Example request/response payloads for each endpoint
- Deprecated endpoints MUST be clearly marked with migration guidance

**Frontend Documentation Requirements**:

- All React/UI components MUST have JSDoc or TypeDoc comments describing purpose, props, and usage
- All utility functions and services MUST be documented with input/output contracts
- Complex state management logic MUST include inline comments explaining rationale
- Component props MUST be typed with descriptions for each property

**Rationale**: Comprehensive documentation serves as both a contract for consumers and a development guide. OpenAPI 3.0.1 provides machine-readable specifications enabling automated client generation, testing, and validation. Frontend documentation ensures component reusability and reduces onboarding friction for UI development.

### III. Testability

Every feature MUST have corresponding unit tests:

- All business logic MUST be covered by unit tests
- Critical paths (dice engine, modifier calculation, combat resolution) MUST have >90% code coverage
- Tests MUST be isolated, repeatable, and fast (<100ms per test)
- Mock external dependencies to ensure unit tests remain independent
- Test naming MUST clearly describe the scenario and expected outcome
- Failed tests MUST block deployment

**Rationale**: Unit tests provide rapid feedback during development, prevent regressions, and serve as living documentation of system behavior. They enable confident refactoring and ensure game mechanics function correctly before integration.

### IV. Simplicity

Prefer simple, straightforward solutions over complex architectures:

- Apply YAGNI (You Aren't Gonna Need It): implement only what is required now
- Avoid premature abstraction; extract patterns only after third usage
- Choose boring, proven technologies over novel ones unless compelling justification exists
- Code SHOULD be self-documenting; prefer clarity over cleverness
- Configuration MUST be explicit and minimal
- Dependencies MUST be justified; prefer standard library when sufficient

**Frontend Design Philosophy**:

- Focus on functionality over visual complexity
- Avoid gratuitous animations, transitions, or visual effects that don't serve user needs
- UI components SHOULD be self-explanatory without requiring tooltips or help text
- Prefer native HTML elements over custom widgets when functionality is equivalent
- CSS complexity MUST be justified; avoid framework overuse

**Rationale**: Simplicity reduces cognitive load, minimizes bugs, and accelerates development velocity. Complex solutions increase maintenance burden and onboarding time. For a text adventure game, straightforward logic and uncluttered UI ensure the game remains understandable, accessible, and extensible.

### V. Performance

All API endpoints MUST respond within 200ms under normal load:

- Database queries MUST be optimized with appropriate indexes
- N+1 query patterns MUST be eliminated
- Response payloads MUST be appropriately sized (pagination required for collections >100 items)
- Heavy computations MUST be cached when deterministic
- Performance testing MUST be part of the deployment validation
- Endpoints exceeding 200ms threshold MUST be profiled and optimized before release

**Rationale**: Fast response times ensure engaging gameplay experience. Turn-based combat and character interactions feel sluggish when endpoints lag. Sub-200ms responses maintain the illusion of real-time interaction critical for text adventures.

### VI. Accessibility (NON-NEGOTIABLE)

All user interfaces MUST be accessible to users with disabilities:

- Keyboard Navigation: Every interactive element MUST be reachable and operable via keyboard alone (Tab, Enter, Space, Arrow keys)
- Screen Reader Support: All content MUST be perceivable by screen readers using proper semantic HTML and ARIA attributes
- Focus Management: Visible focus indicators MUST be present on all interactive elements; focus MUST be managed logically during navigation and modal interactions
- Alt Text: All images conveying information MUST have descriptive alt text; decorative images MUST use empty alt attributes
- Color Contrast: Text MUST meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Form Labels: All form inputs MUST have associated labels or ARIA attributes

**Rationale**: Accessibility is not optional—it's a legal requirement in many jurisdictions and a moral imperative. Text-based adventure games particularly benefit from screen reader support, as the medium is inherently text-focused. Keyboard navigation ensures users with motor disabilities can play. These requirements expand the potential audience and improve usability for all users.

### VII. Responsiveness (NON-NEGOTIABLE)

Interfaces MUST function correctly on both mobile and desktop devices:

- Layout: UI MUST adapt to viewport sizes from 320px (mobile) to 2560px+ (desktop) without horizontal scrolling
- Touch Targets: Interactive elements MUST be at least 44x44 CSS pixels on touch devices
- Mobile Gestures: Support swipe, tap, and long-press where appropriate; avoid hover-dependent interactions
- Performance: Initial page load MUST complete in <3 seconds on 3G connections
- Text Readability: Base font size MUST be at least 16px; line height at least 1.5
- Viewport Meta Tag: MUST be configured to prevent unintended zooming on mobile

**Rationale**: Over 60% of web traffic comes from mobile devices. Text adventure games are ideal for mobile play during commutes or downtime. Responsive design ensures consistent experience across devices, increasing player engagement and retention. Touch-friendly targets prevent frustration on mobile devices.

### VIII. Type Safety

Frontend-backend communication MUST use strongly typed contracts:

- API Client Generation: TypeScript types MUST be generated from OpenAPI specification (e.g., via `openapi-typescript`)
- No `any` Types: Avoid using TypeScript's `any` type in API communication; prefer `unknown` with type guards if necessary
- Request/Response Validation: All API requests MUST use generated types; responses MUST be validated against expected schema
- Compile-Time Checks: Type errors MUST be caught at compile time, not runtime
- Schema Sync: Frontend types MUST stay synchronized with backend OpenAPI spec via CI/CD checks
- Null Safety: Handle nullable fields explicitly; use optional chaining and nullish coalescing

**Rationale**: Type safety eliminates entire classes of runtime errors caused by API contract mismatches. Generated types ensure frontend stays synchronized with backend changes, catching breaking changes at compile time. This reduces debugging time, prevents production errors, and improves developer confidence when refactoring.

## Quality Standards

### Security

- Authentication MUST be implemented for state-modifying operations
- Input validation MUST be applied at API boundaries
- SQL injection, XSS, and CSRF protections MUST be in place
- Sensitive data (if any) MUST be encrypted at rest and in transit
- Security vulnerabilities MUST be triaged and fixed within 7 days of discovery

### Code Quality

- Code reviews MUST be performed before merging to main branch
- Linting rules MUST be enforced in CI/CD pipeline
- No commented-out code in production branches
- Magic numbers MUST be replaced with named constants
- Error messages MUST be actionable and informative

### Error Handling (User-Facing)

All API errors MUST be displayed gracefully to users:

- Network Errors: Display user-friendly message (e.g., "Unable to connect. Please check your internet connection.")
- Validation Errors: Show specific field errors with actionable guidance (e.g., "Password must be at least 8 characters")
- Server Errors (5xx): Display generic message without exposing technical details (e.g., "Something went wrong. Please try again later.")
- Authentication Errors (401/403): Clear messaging about required permissions or expired sessions
- Not Found Errors (404): Informative message explaining what wasn't found
- Loading States: Show visual feedback during API requests (spinners, skeleton screens)
- Retry Mechanisms: Offer retry options for transient failures
- Error Logging: Log errors to monitoring service for debugging without exposing to users

**Rationale**: Poor error handling frustrates users and increases support burden. Graceful error display maintains user trust even when things go wrong. Clear, actionable error messages help users self-recover, while proper logging enables developers to diagnose issues quickly.

## Development Workflow

### Feature Development Process

1. **Specification Phase**: Feature requirements documented in `/specs/[###-feature-name]/spec.md`
2. **Planning Phase**: Technical design captured in `/specs/[###-feature-name]/plan.md`
3. **Constitution Compliance Check**: Verify new feature aligns with all five core principles
4. **Implementation**: Follow TDD cycle - write tests first, ensure they fail, then implement
5. **Documentation**: Update OpenAPI spec before marking feature complete
6. **Review**: Code review focusing on REST compliance, test coverage, simplicity, and performance
7. **Validation**: Automated tests + manual performance verification (<200ms)
8. **Deployment**: Merge only after all checks pass

### Complexity Justification

Any deviation from core principles MUST be documented in the plan's "Complexity Tracking" section with:

- Specific principle violated
- Business/technical justification
- Simpler alternatives considered and rejected with rationale

## Governance

### Amendment Procedure

This constitution can only be amended through the following process:

1. Proposal documented with clear rationale and impact analysis
2. Review period of minimum 3 days for stakeholder feedback
3. Approval required from project maintainers
4. Version increment following semantic versioning rules
5. Migration plan for existing code if principles change substantively

### Versioning Policy

- **MAJOR**: Backward-incompatible principle changes or removals
- **MINOR**: New principles added or existing principles materially expanded
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

- All pull requests MUST verify compliance with this constitution
- Templates in `.specify/templates/` MUST align with these principles
- Periodic audits (quarterly) to ensure codebase adherence
- Non-compliant code discovered MUST be tracked and remediated within 30 days

**Version**: 1.1.0 | **Ratified**: 2026-01-27 | **Last Amended**: 2026-01-29
