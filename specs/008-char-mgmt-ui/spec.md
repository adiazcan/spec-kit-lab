# Feature Specification: Character Management Interface

**Feature Branch**: `008-char-mgmt-ui`  
**Created**: January 30, 2026  
**Status**: Draft  
**Input**: User description: "Build a character management interface with character creation form, attribute allocation system, point-buy or dice roll options, calculated modifiers display, character sheet view, edit functionality, and character selection for adventures"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create Character with Point-Buy System (Priority: P1)

A player wants to create a new character by entering a name and allocating attribute points using a point-buy system. They see their available points decrease as they assign values, with modifiers updating in real-time, ensuring they can make informed decisions before finalizing.

**Why this priority**: Character creation is the foundational user journey. Without this capability, players cannot participate in adventures. The point-buy system provides a balanced, strategic approach that most tabletop games support.

**Independent Test**: Can be fully tested by opening the character creation form, entering a name, distributing points across attributes, observing modifier calculations, and submitting the character. Delivers a complete character ready for adventure selection.

**Acceptance Scenarios**:

1. **Given** a user opens the character creation form, **When** they enter a character name and allocate points across all five attributes within the available budget, **Then** the system displays the corresponding modifier for each attribute in real-time
2. **Given** a user has allocated all available points, **When** they attempt to increase an attribute further, **Then** the system prevents the increase and indicates no points remain
3. **Given** a user has completed all required fields with valid values, **When** they submit the form, **Then** the character is created and the user is shown the character sheet view
4. **Given** a user has entered a name but has unspent points remaining, **When** they attempt to submit, **Then** the system allows submission (unspent points are permitted)

---

### User Story 2 - Create Character with Dice Roll Option (Priority: P1)

A player prefers the traditional tabletop experience of rolling dice to determine their character's attributes. They want to roll for each attribute, see the results, and have the option to re-roll or accept the values before creating their character.

**Why this priority**: Dice rolling is a core tabletop RPG mechanic that many players prefer for the excitement and randomness it provides. Offering this alongside point-buy ensures the interface appeals to different play styles.

**Independent Test**: Can be fully tested by opening character creation, selecting dice roll mode, rolling for attributes, observing results with modifiers, and submitting the character. Delivers a character with randomly generated attributes.

**Acceptance Scenarios**:

1. **Given** a user selects dice roll mode for character creation, **When** they roll for an attribute, **Then** the system displays the rolled value (within 3-18 range) and its calculated modifier
2. **Given** a user has rolled for all five attributes, **When** they view the results, **Then** all attributes show their rolled values and corresponding modifiers
3. **Given** a user has rolled for an attribute, **When** they choose to re-roll that attribute, **Then** the previous value is replaced with a new random value
4. **Given** a user has not rolled for all attributes, **When** they attempt to submit, **Then** the system prevents submission and indicates which attributes need to be rolled

---

### User Story 3 - View Character Sheet (Priority: P1)

A player wants to view a complete overview of their character including name, all attributes with base values and modifiers, displayed in a clear, organized character sheet format similar to traditional tabletop character sheets.

**Why this priority**: The character sheet is essential for gameplay reference. Players need to quickly view their character's stats during adventures. This completes the create-and-view core loop.

**Independent Test**: Can be fully tested by creating a character and navigating to the character sheet view, verifying all attributes, modifiers, and character information are displayed correctly. Delivers gameplay-ready character reference.

**Acceptance Scenarios**:

1. **Given** a character exists, **When** a user opens the character sheet view, **Then** the system displays the character's name prominently at the top
2. **Given** a character has attributes STR=14, DEX=12, INT=10, CON=16, CHA=8, **When** a user views the character sheet, **Then** each attribute shows both the base value and its modifier (STR: 14 (+2), DEX: 12 (+1), INT: 10 (+0), CON: 16 (+3), CHA: 8 (-1))
3. **Given** a user is viewing a character sheet, **When** they want to make changes, **Then** an edit option is clearly visible and accessible

---

### User Story 4 - Edit Existing Character (Priority: P2)

A player needs to modify their character's attributes after creation, such as when leveling up or correcting a mistake. They want to adjust values using the same intuitive interface as character creation, with real-time modifier updates.

**Why this priority**: Character editing enables ongoing character progression and error correction. While not needed for initial character use, it becomes essential as gameplay progresses.

**Independent Test**: Can be fully tested by opening an existing character for editing, modifying one or more attributes, observing updated modifiers, saving changes, and verifying the character sheet reflects the updates.

**Acceptance Scenarios**:

1. **Given** a user is viewing their character sheet, **When** they select the edit option, **Then** the system presents an editable form pre-populated with the character's current values
2. **Given** a user is editing a character and changes STR from 10 to 14, **When** they view the modifier, **Then** it updates from +0 to +2 in real-time before saving
3. **Given** a user has made changes to a character, **When** they save the changes, **Then** the system updates the character and returns to the character sheet view showing the new values
4. **Given** a user is editing a character and decides not to save, **When** they cancel, **Then** the character retains its original values and the user returns to the character sheet

---

### User Story 5 - Select Character for Adventure (Priority: P2)

A player wants to select one of their characters to participate in an adventure. They need to browse their available characters, review their stats, and confirm their selection before joining.

**Why this priority**: Character selection connects characters to adventures, enabling actual gameplay. It bridges the character management and adventure systems.

**Independent Test**: Can be fully tested by viewing available characters, selecting one for an adventure, confirming the selection, and verifying the character is now associated with the adventure.

**Acceptance Scenarios**:

1. **Given** a user has multiple characters, **When** they open the character selection for an adventure, **Then** the system displays a list of all their characters with key stats (name and attribute summary)
2. **Given** a user is viewing the character selection list, **When** they select a character, **Then** the system shows a preview of the full character sheet for confirmation
3. **Given** a user has selected a character and confirmed, **When** the adventure begins, **Then** the selected character is associated with that adventure
4. **Given** an adventure requires character selection, **When** a user has no characters, **Then** the system offers an option to create a new character

---

### User Story 6 - Browse and Manage Character List (Priority: P3)

A player with multiple characters wants to view all their characters in a list, see summary information for each, and access individual character sheets or perform management actions like deletion.

**Why this priority**: Character list management improves organization for players with multiple characters but isn't essential for basic single-character gameplay.

**Independent Test**: Can be fully tested by creating multiple characters, viewing the character list, verifying all characters appear with summary info, and accessing individual sheets from the list.

**Acceptance Scenarios**:

1. **Given** a user has three characters, **When** they open the character list view, **Then** all three characters are displayed with their names and a brief attribute summary
2. **Given** a user is viewing the character list, **When** they select a character, **Then** they are taken to that character's full character sheet view
3. **Given** a user wants to delete a character, **When** they initiate deletion, **Then** the system asks for confirmation before permanently removing the character
4. **Given** a user confirms character deletion, **When** the deletion completes, **Then** the character no longer appears in the list and cannot be retrieved

---

### Edge Cases

- What happens when a user enters an empty or whitespace-only character name?
- How does the dice roll animation/display behave on slow network connections?
- What happens if a user closes the browser mid-character creation with unsaved changes?
- How does the interface handle a character list with many characters (e.g., 50+ characters)?
- What happens when trying to edit a character that was deleted by another session?
- How does the system display negative modifiers visually (e.g., CHA: 6 (-2))?
- What happens if the user rapidly clicks the dice roll button multiple times?
- How does the interface behave when switching between point-buy and dice roll modes mid-creation?

## Requirements _(mandatory)_

### Functional Requirements

**Character Creation Form**

- **FR-001**: System MUST provide a character creation form with a text input field for character name
- **FR-002**: System MUST validate that character name is not empty and contains at least one non-whitespace character
- **FR-003**: System MUST provide input controls for all five attributes: STR (Strength), DEX (Dexterity), INT (Intelligence), CON (Constitution), and CHA (Charisma)
- **FR-004**: System MUST label each attribute clearly with both its abbreviation and full name (e.g., "STR (Strength)")

**Point-Buy Attribute Allocation**

- **FR-005**: System MUST provide a point-buy mode where users start with a pool of available points to distribute across attributes
- **FR-006**: System MUST display the remaining point balance that updates in real-time as users allocate points
- **FR-007**: System MUST provide increment and decrement controls for each attribute in point-buy mode
- **FR-008**: System MUST prevent increasing an attribute when no points remain in the pool
- **FR-009**: System MUST enforce that attribute values stay within the valid range of 3-18 during point allocation
- **FR-010**: System MUST allow users to reallocate points freely before submitting (increase one attribute by decreasing another)

**Dice Roll Attribute Generation**

- **FR-011**: System MUST provide a dice roll mode as an alternative to point-buy for attribute generation
- **FR-012**: System MUST provide a roll button for each attribute that generates a random value within 3-18 range
- **FR-013**: System MUST display the rolled value clearly after each roll
- **FR-014**: System MUST allow users to re-roll any individual attribute before submitting
- **FR-015**: System MUST require all five attributes to have rolled values before allowing form submission in dice roll mode

**Modifier Display**

- **FR-016**: System MUST display the calculated modifier next to each attribute value
- **FR-017**: System MUST calculate modifiers using the formula: (base_value - 10) / 2, rounded down
- **FR-018**: System MUST update the displayed modifier in real-time when the attribute value changes
- **FR-019**: System MUST display positive modifiers with a "+" prefix (e.g., "+2") and negative modifiers with a "-" prefix (e.g., "-2")
- **FR-020**: System MUST display zero modifiers as "+0" for consistency

**Character Sheet View**

- **FR-021**: System MUST provide a character sheet view that displays complete character information
- **FR-022**: System MUST display the character name prominently on the character sheet
- **FR-023**: System MUST display all five attributes with both base values and modifiers on the character sheet
- **FR-024**: System MUST provide visual organization that groups related information (e.g., attributes section)
- **FR-025**: System MUST provide a clear navigation path to edit the character from the sheet view

**Edit Character Functionality**

- **FR-026**: System MUST allow users to edit existing character name and attributes
- **FR-027**: System MUST pre-populate the edit form with the character's current values
- **FR-028**: System MUST enforce all validation rules during editing (attribute range, name requirements)
- **FR-029**: System MUST provide both save and cancel options when editing
- **FR-030**: System MUST discard unsaved changes when user cancels editing
- **FR-031**: System MUST update the character and navigate to the character sheet upon successful save

**Character Selection for Adventures**

- **FR-032**: System MUST display a selectable list of available characters when choosing a character for an adventure
- **FR-033**: System MUST show key character information (name, attribute summary) in the selection list
- **FR-034**: System MUST allow users to preview full character details before confirming selection
- **FR-035**: System MUST provide a confirmation step before finalizing character selection
- **FR-036**: System MUST offer a "create new character" option when user has no existing characters

**Character List Management**

- **FR-037**: System MUST provide a view listing all user's characters
- **FR-038**: System MUST display summary information for each character in the list
- **FR-039**: System MUST allow users to navigate to any character's full sheet from the list
- **FR-040**: System MUST provide a delete option for characters with confirmation required

**Mode Switching**

- **FR-041**: System MUST allow users to switch between point-buy and dice roll modes during character creation
- **FR-042**: System MUST warn users that switching modes will reset their current attribute allocations/rolls
- **FR-043**: System MUST clear all attribute values when switching modes (after user confirms)

### Key Entities

- **Character Creation Form**: User interface component for entering new character information, supporting both point-buy and dice roll attribute generation modes with real-time validation and modifier calculation.

- **Attribute Allocation Control**: Interface element for setting individual attribute values, displaying the attribute name, base value input/output, and calculated modifier. Behavior varies based on selected creation mode.

- **Character Sheet**: Read-only display of complete character information organized in a traditional character sheet format, showing name, all attributes with values and modifiers.

- **Character List Item**: Summary card displayed in character list views, showing character name and abbreviated attribute information for quick identification.

- **Character Selector**: Interface for choosing a character to join an adventure, featuring browsable list with preview capability and confirmation flow.

## Assumptions

- The backend character management system (003-character-management) is implemented and provides create, read, update, and delete operations for characters
- Point-buy starts with a standard point pool (commonly 27 points in D5E-style systems, starting all attributes at 8)
- Dice rolls simulate traditional 4d6 drop-lowest method, generating values in the 3-18 range
- Users can only edit and delete their own characters
- Character selection associates the character with exactly one adventure at a time

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete new character creation (name + all attributes) in under 3 minutes using either point-buy or dice roll method
- **SC-002**: Attribute modifiers update and display within 100 milliseconds of value changes, providing responsive real-time feedback
- **SC-003**: 95% of users successfully create their first character without encountering validation errors that require support
- **SC-004**: Character sheet loads and displays all information within 2 seconds of navigation
- **SC-005**: Users can locate and select a specific character from a list of 20 characters in under 30 seconds
- **SC-006**: 90% of edit operations complete successfully on first attempt without losing user changes
- **SC-007**: Character selection for adventures completes in 3 or fewer interaction steps (view list → select character → confirm)
- **SC-008**: Form validation provides actionable error messages that users understand without external help
