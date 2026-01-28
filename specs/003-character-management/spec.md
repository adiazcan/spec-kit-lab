# Feature Specification: Character Management System

**Feature Branch**: `003-character-management`  
**Created**: January 27, 2026  
**Status**: Draft  
**Input**: User description: "Build a character management system with the following: Create, edit, retrieve characters; Attributes: STR (Strength), DEX (Dexterity), INT (Intelligence), CON (Constitution), CHA (Charisma); Each attribute has a base value (3-18) and calculated modifier ((value - 10) / 2); Character snapshots and versioning for game saves; Character belongs to an adventure"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Character (Priority: P1)

A game master or player wants to create a new character for their adventure with unique attributes and a descriptive name. They assign attribute values within the allowed range and the system automatically calculates the corresponding modifiers.

**Why this priority**: This is the foundational capability - without creating characters, no other character management features can be used. It's the minimum viable feature that delivers immediate value.

**Independent Test**: Can be fully tested by creating a character with five attribute values, retrieving it, and verifying all attributes and calculated modifiers are correct. Delivers a functional character ready for gameplay.

**Acceptance Scenarios**:

1. **Given** an existing adventure, **When** a user creates a character with name "Gandalf" and attributes STR=10, DEX=12, INT=18, CON=14, CHA=16, **Then** the character is saved with modifiers STR=0, DEX=1, INT=4, CON=2, CHA=3
2. **Given** an existing adventure, **When** a user creates a character with minimum attributes (all values = 3), **Then** the character is saved with all modifiers = -3
3. **Given** an existing adventure, **When** a user creates a character with maximum attributes (all values = 18), **Then** the character is saved with all modifiers = 4
4. **Given** no adventure exists, **When** a user attempts to create a character, **Then** the system rejects the request with an error message

---

### User Story 2 - Retrieve Character Details (Priority: P1)

A game master or player needs to view a character's complete information including name, all attribute values, and calculated modifiers to use during gameplay or planning.

**Why this priority**: Retrieving character data is essential for the system to be useful - users must be able to access created characters. This completes the core MVP with create + read operations.

**Independent Test**: Can be fully tested by creating a character, retrieving it by identifier, and verifying all returned data matches the created values. Delivers immediate gameplay value.

**Acceptance Scenarios**:

1. **Given** a character exists with ID "abc123", **When** a user retrieves character "abc123", **Then** the system returns the character's name, all five attribute base values, and all five calculated modifiers
2. **Given** an adventure has three characters, **When** a user retrieves all characters for that adventure, **Then** the system returns all three characters with complete attribute information
3. **Given** no character exists with ID "xyz999", **When** a user attempts to retrieve character "xyz999", **Then** the system returns an error indicating the character was not found

---

### User Story 3 - Update Character Attributes (Priority: P2)

A game master needs to modify a character's attributes during gameplay when the character levels up or is affected by game events. The system recalculates modifiers automatically when base values change.

**Why this priority**: Character progression is important for ongoing gameplay but not required for initial system utility. Players can start using characters before needing to modify them.

**Independent Test**: Can be fully tested by creating a character, updating one or more attributes, retrieving it, and verifying the new values and recalculated modifiers. Delivers character progression capability.

**Acceptance Scenarios**:

1. **Given** a character with STR=10 (modifier=0), **When** a user updates STR to 16, **Then** the character's STR modifier is recalculated to 3
2. **Given** a character exists, **When** a user updates the character's name from "Frodo" to "Frodo Baggins", **Then** the character's name is updated while attributes remain unchanged
3. **Given** a character exists, **When** a user updates multiple attributes simultaneously (STR=14, INT=16), **Then** all updated attributes and their modifiers reflect the new values
4. **Given** a character exists, **When** a user attempts to update an attribute to an invalid value (e.g., 19 or 2), **Then** the system rejects the update with a validation error

---

### User Story 4 - Character Version Snapshots (Priority: P3)

A game master wants to save the current state of a character at key moments (e.g., before a dangerous quest, at level milestones) so they can view or restore the character to that state if needed for game continuity or rollback scenarios.

**Why this priority**: Versioning adds safety and historical tracking but isn't essential for basic character management. Most gameplay can proceed without snapshots initially.

**Independent Test**: Can be fully tested by creating a character, saving a snapshot, modifying the character, saving another snapshot, and verifying both snapshots are retrievable with correct historical values. Delivers game save functionality.

**Acceptance Scenarios**:

1. **Given** a character with STR=12, **When** a user creates a snapshot labeled "Level 1", **Then** the snapshot is saved with all current attribute values and timestamp
2. **Given** a character has snapshots "Level 1" and "Level 2", **When** a user retrieves all snapshots for that character, **Then** the system returns both snapshots in chronological order with complete attribute data
3. **Given** a character has been modified after a snapshot, **When** a user views the snapshot, **Then** the snapshot shows the historical values, not the current values
4. **Given** a character has a snapshot from before an attribute change, **When** a user views that snapshot, **Then** the snapshot displays the historical attribute values for reference only (snapshots are read-only and cannot be restored)

---

### User Story 5 - Remove Character (Priority: P3)

A game master wants to remove characters that are no longer part of the active adventure (e.g., deceased characters, test characters, or characters transferred to another adventure).

**Why this priority**: Deletion is important for data hygiene but not critical for initial feature use. Users can manage characters without deletion capability initially.

**Independent Test**: Can be fully tested by creating a character, deleting it, and verifying it cannot be retrieved afterward. Delivers data management capability.

**Acceptance Scenarios**:

1. **Given** a character exists with ID "abc123", **When** a user deletes character "abc123", **Then** the character and all its snapshots are permanently removed from the system
2. **Given** a character has been deleted, **When** a user attempts to retrieve or update that character, **Then** the system returns an error indicating the character no longer exists

---

### Edge Cases

- What happens when a user attempts to create a character with an attribute value outside the 3-18 range (e.g., 0, 25, negative values)?
- How does the system handle modifier calculation when the result is not an integer (e.g., (11-10)/2 = 0.5)?
- What happens if a user tries to create multiple characters with identical names in the same adventure?
- How does the system behave if a character has many snapshots (e.g., 100+ versions) - are there storage or retrieval limits?
- What happens when trying to create a character for an adventure that doesn't exist?
- How does the system handle concurrent updates to the same character by multiple users?
- What happens if a user provides incomplete attribute data (e.g., only STR and DEX, missing the other three)?

## Requirements *(mandatory)*

### Functional Requirements

**Character Creation**
- **FR-001**: System MUST allow users to create a character with a name and five attributes: STR (Strength), DEX (Dexterity), INT (Intelligence), CON (Constitution), and CHA (Charisma)
- **FR-002**: System MUST enforce that each attribute base value is between 3 and 18 (inclusive)
- **FR-003**: System MUST automatically calculate a modifier for each attribute using the formula: (base_value - 10) / 2, rounded down to the nearest integer
- **FR-004**: System MUST require that every character is associated with exactly one adventure
- **FR-005**: System MUST reject character creation if the associated adventure does not exist

**Character Retrieval**
- **FR-006**: System MUST allow users to retrieve a specific character by its unique identifier
- **FR-007**: System MUST allow users to retrieve all characters belonging to a specific adventure
- **FR-008**: System MUST return character data including name, all five attribute base values, and all five calculated modifiers
- **FR-009**: System MUST return an error when attempting to retrieve a character that doesn't exist

**Character Updates**
- **FR-010**: System MUST allow users to update a character's name and attribute base values
- **FR-011**: System MUST recalculate all modifiers automatically when attribute base values are updated
- **FR-012**: System MUST enforce attribute value constraints (3-18) during updates
- **FR-013**: System MUST reject updates to characters that don't exist

**Character Snapshots**
- **FR-014**: System MUST allow users to create a snapshot of a character's current state at any time
- **FR-015**: System MUST capture all character attributes and calculated modifiers in each snapshot
- **FR-016**: System MUST record a timestamp for each snapshot
- **FR-017**: System MUST allow users to retrieve all snapshots for a specific character in chronological order
- **FR-018**: System MUST preserve snapshots independently from the current character state
- **FR-019**: Snapshots are read-only and cannot be used to restore character state - they serve as historical reference only

**Character Deletion**
- **FR-020**: System MUST allow users to delete a character
- **FR-021**: System MUST prevent retrieval or updates of deleted characters

**Data Validation**
- **FR-022**: System MUST validate that all five attributes are provided when creating a character
- **FR-023**: System MUST reject non-integer attribute values
- **FR-024**: System MUST handle modifier calculation consistently, rounding toward negative infinity (e.g., (11-10)/2 = 0.5 becomes 0, (9-10)/2 = -0.5 becomes -1)

### Key Entities

- **Character**: Represents a playable or non-playable character in the game. Contains a unique identifier, name, five core attributes (STR, DEX, INT, CON, CHA) with base values and calculated modifiers, and a reference to the adventure it belongs to. Maintains historical versions through snapshots.

- **Character Snapshot**: Represents a point-in-time capture of a character's state. Contains all character attributes, modifiers, timestamp of creation, and reference to the parent character. Immutable once created.

- **Character Attribute**: Represents one of the five core stats (STR, DEX, INT, CON, CHA). Each has a base value (3-18) and a derived modifier calculated as (base - 10) / 2 rounded down.

- **Adventure**: Represents a game campaign or story. Characters belong to exactly one adventure. Referenced by character entity but defined in a separate feature specification (002-adventure-init).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new character with all five attributes in under 30 seconds
- **SC-002**: Attribute modifiers are calculated correctly 100% of the time for all attribute values (3-18)
- **SC-003**: Users can retrieve character information with all attributes and modifiers displayed within 2 seconds
- **SC-004**: System successfully validates and rejects invalid attribute values (outside 3-18 range) with clear error messages
- **SC-005**: Character updates, including recalculation of all modifiers, complete within 3 seconds
- **SC-006**: Users can create and retrieve character snapshots, with historical data preserved accurately across multiple versions
- **SC-007**: 95% of character operations (create, read, update) complete successfully on first attempt without errors
- **SC-008**: System maintains data integrity for all characters belonging to an adventure, with no orphaned or incorrectly associated characters
