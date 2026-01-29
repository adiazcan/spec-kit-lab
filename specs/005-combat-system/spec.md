# Feature Specification: Turn-Based Combat System

**Feature Branch**: `005-combat-system`  
**Created**: January 29, 2026  
**Status**: Draft  
**Input**: User description: "Build a turn-based combat system with: NPCs/enemies with stats and behaviors, AI states: aggressive, defensive, flee, Turn resolution using the dice engine, Initiative order based on DEX modifier + d20, Attack rolls vs armor class, Damage calculation with weapon dice"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Basic Combat Encounter (Priority: P1)

A player character encounters an enemy and engages in basic combat, taking turns to attack until one combatant is defeated or flees.

**Why this priority**: This is the core combat loop - the minimum viable combat experience. Without this, no combat can occur. It delivers immediate value by enabling the fundamental game mechanic.

**Independent Test**: Can be fully tested by initiating combat between one player character and one enemy, performing attack actions, and observing turn resolution until combat ends. Delivers a complete combat experience with clear winner/loser outcome.

**Acceptance Scenarios**:

1. **Given** a player character and an enemy are ready for combat, **When** combat is initiated, **Then** both combatants are placed in a combat encounter with their stats visible
2. **Given** it is the player's turn, **When** the player chooses to attack, **Then** an attack roll is made and damage is calculated if the attack hits
3. **Given** it is the enemy's turn, **When** the enemy takes its action, **Then** the enemy's attack is resolved using the same combat rules
4. **Given** a combatant's health reaches zero, **When** the turn completes, **Then** combat ends and the victor is declared
5. **Given** an attack is made, **When** the attack roll meets or exceeds the target's armor class, **Then** the attack hits and damage is calculated using the appropriate weapon dice

---

### User Story 2 - Multi-Combatant Initiative (Priority: P2)

When multiple combatants enter combat, the system determines and maintains turn order based on initiative rolls, ensuring fair and consistent turn resolution.

**Why this priority**: Essential for realistic combat scenarios with multiple participants. Enables party-based gameplay and multiple enemies. Builds upon P1 by adding complexity that's common in actual gameplay.

**Independent Test**: Can be tested by initiating combat with 3+ combatants (mix of player characters and enemies), verifying initiative order is calculated correctly and maintained throughout combat, and confirming each combatant acts in the proper sequence.

**Acceptance Scenarios**:

1. **Given** multiple combatants are entering combat, **When** combat begins, **Then** each combatant rolls initiative (d20 + DEX modifier) and turn order is established from highest to lowest
2. **Given** initiative has been rolled, **When** a combat round begins, **Then** combatants act in initiative order without skipping or duplicating turns
3. **Given** a combat round completes, **When** the last combatant in initiative order finishes their turn, **Then** a new round begins with the same initiative order maintained
4. **Given** combatants have equal initiative scores, **When** determining turn order, **Then** the tie is resolved consistently using DEX modifier as tiebreaker, then a coin flip if still tied
5. **Given** a combatant is defeated or flees, **When** their turn would occur, **Then** they are skipped and removed from the initiative order

---

### User Story 3 - Intelligent Enemy AI Behavior (Priority: P3)

Enemy combatants exhibit different behavioral patterns based on their current state (aggressive, defensive, flee), making combat more dynamic and strategic.

**Why this priority**: Enhances combat depth and replayability by making enemy behavior varied and strategic. This is an enhancement that improves user experience but isn't required for functional combat.

**Independent Test**: Can be tested by placing enemies in scenarios that trigger different AI states (high health = aggressive, moderate health = defensive, low health = flee) and observing their action choices match their current state.

**Acceptance Scenarios**:

1. **Given** an enemy is in aggressive state, **When** it is their turn, **Then** they prioritize offensive actions targeting the combatant with lowest health or highest threat
2. **Given** an enemy is in defensive state, **When** it is their turn, **Then** they may choose defensive actions or cautious attacks prioritizing self-preservation
3. **Given** an enemy health drops below their flee threshold, **When** it is their turn, **Then** they attempt to flee from combat
4. **Given** an enemy successfully flees, **When** the flee action completes, **Then** they are removed from combat and the encounter continues without them
5. **Given** multiple valid targets exist, **When** an aggressive enemy selects a target, **Then** they choose based on strategic factors like lowest armor class, lowest health, or closest proximity

---

### User Story 4 - Character Defense and Armor (Priority: P2)

Characters and enemies have defensive capabilities determined by their armor class, which attackers must overcome to deal damage.

**Why this priority**: Core combat mechanic that provides meaningful character differentiation and tactical depth. Part of the fundamental combat resolution system.

**Independent Test**: Can be tested by creating combatants with different armor class values, performing attacks, and verifying that attack rolls below AC miss while rolls meeting or exceeding AC hit.

**Acceptance Scenarios**:

1. **Given** a character has armor class 15, **When** an attacker rolls 14 or lower on their attack roll, **Then** the attack misses and no damage is dealt
2. **Given** a character has armor class 15, **When** an attacker rolls 15 or higher on their attack roll, **Then** the attack hits and damage is calculated
3. **Given** an attack hits, **When** damage is calculated, **Then** the appropriate weapon dice are rolled and the total is subtracted from the target's health
4. **Given** different weapons have different damage dice, **When** an attack hits, **Then** the correct weapon dice are used for that attacker's equipped weapon

---

### Edge Cases

- What happens when all player characters are defeated (total party defeat)?
- What happens when an enemy attempts to flee but the attempt fails?
- How does the system handle invalid actions during a combatant's turn (e.g., attacking when out of range)?
- What happens when combat is initiated with zero enemies or zero player characters?
- How are simultaneous defeats handled (player and enemy both reach zero health in the same turn)?
- What happens if a combatant has extremely high or negative DEX modifiers affecting initiative?
- How does the system handle dice roll errors or invalid results from the dice engine?
- What happens when an AI state transition would occur mid-turn?
- How are ties in initiative order resolved when multiple combatants have identical DEX modifiers?
- What happens when a combatant attempts to attack an already-defeated target?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST support turn-based combat encounters between player characters and NPC enemies
- **FR-002**: System MUST calculate initiative order using d20 plus each combatant's DEX modifier at the start of combat
- **FR-003**: System MUST maintain initiative order consistently throughout the entire combat encounter
- **FR-004**: System MUST resolve attack actions by comparing attack roll (d20 + modifiers) against target's armor class
- **FR-005**: System MUST calculate damage using weapon-specific dice rolls when attacks hit successfully
- **FR-006**: System MUST subtract calculated damage from the target combatant's current health
- **FR-007**: System MUST integrate with the existing dice engine for all random number generation (initiative, attack rolls, damage rolls)
- **FR-008**: System MUST track each combatant's current state including health, armor class, and position in initiative order
- **FR-009**: System MUST support NPC/enemy combatants with configurable stats (health, armor class, DEX modifier, equipped weapon)
- **FR-010**: System MUST support three AI behavioral states for enemies: aggressive, defensive, and flee
- **FR-011**: System MUST determine enemy actions based on their current AI state during their turn
- **FR-012**: System MUST allow enemies to attempt fleeing from combat when in flee state
- **FR-013**: System MUST end combat when all combatants on one side are defeated or have fled
- **FR-014**: System MUST declare a victor when combat ends naturally
- **FR-015**: System MUST handle multiple combatants on each side (multiple player characters, multiple enemies)
- **FR-016**: System MUST skip turns for defeated or fled combatants while maintaining initiative order
- **FR-017**: System MUST support different weapon types with different damage dice configurations
- **FR-018**: System MUST resolve ties in initiative order using DEX modifier as the first tiebreaker
- **FR-019**: System MUST track combat rounds and display current turn information to players
- **FR-020**: System MUST validate that only the active combatant can take actions during their turn

### Key Entities

- **Combat Encounter**: Represents an active combat session containing all participating combatants, current round number, and initiative order. Tracks the overall state of the battle and orchestrates turn resolution.

- **Combatant**: Represents any participant in combat (player character or enemy). Core attributes include current health, maximum health, armor class, DEX modifier, equipped weapon, position in initiative order, and current status (active, defeated, fled).

- **Enemy/NPC**: A type of combatant representing non-player entities with additional attributes including AI behavioral state (aggressive, defensive, flee), flee threshold health value, and behavioral tendencies. Related to Combatant through inheritance or composition.

- **Initiative Entry**: Represents a combatant's initiative score and position in turn order. Contains initiative roll result (d20 + DEX modifier), reference to the combatant, and sequence order for tie-breaking.

- **Attack Action**: Represents an attempted attack during combat. Contains attacker reference, target reference, attack roll result, weapon used, and calculated damage if hit. Links to dice engine rolls for attack and damage.

- **Weapon**: Defines weapon properties including name, damage dice expression (e.g., "2d6", "1d8+2"), and attack type. Used by Combatants to determine attack damage.

- **AI State**: Defines the current behavioral mode of an enemy combatant. States include aggressive (offensive focus), defensive (self-preservation focus), and flee (escape attempt). May include transition conditions (health thresholds, threat levels).

- **Combat Round**: Represents one complete cycle through all combatants in initiative order. Tracks round number and turn progression to maintain combat flow.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete a full combat encounter from initiation through victory/defeat in under 2 minutes for a single-enemy battle
- **SC-002**: Initiative order is correctly calculated and maintained for combat encounters with up to 20 total combatants
- **SC-003**: Attack roll calculations (d20 + modifiers vs armor class) resolve in under 100 milliseconds per attack
- **SC-004**: 100% of damage calculations correctly apply weapon dice expressions integrated with the existing dice engine
- **SC-005**: Enemy AI state transitions occur appropriately based on health thresholds (flee state triggers when health drops below 25% of maximum)
- **SC-006**: Combat encounters with multiple combatants complete all turns in correct initiative order with zero skipped or duplicate turns
- **SC-007**: 95% of users successfully understand turn order and combat flow without requiring external documentation
- **SC-008**: System successfully handles edge cases (tied initiative, simultaneous defeats, invalid actions) without errors or crashes
