# Combat System Quick Start Guide

**Feature**: Turn-Based Combat System  
**Version**: 1.0.0  
**Last Updated**: 2026-01-29

---

## Overview

The Combat System provides turn-based combat encounters with initiative-based turns, attack/damage resolution, and AI-driven enemy behavior. This guide walks through the most common workflows with curl examples.

---

## Prerequisites

Before starting combat:

- ✅ Active adventure exists
- ✅ At least one player character created in the adventure
- ✅ At least one enemy entity created or available

---

## Quick Start: Complete Combat Encounter

### 1. Create an Enemy

```bash
curl -X POST http://localhost:5000/api/enemies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Goblin Fighter",
    "description": "A nasty little goblin wielding a rusty sword",
    "max_health": 20,
    "armor_class": 14,
    "str_base": 10,
    "dex_base": 14,
    "int_base": 8,
    "con_base": 12,
    "cha_base": 8,
    "weapon_info": "Rusty Sword|1d6+2",
    "flee_health_threshold": 0.25
  }'
```

**Response:**

```json
{
  "id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
  "name": "Goblin Fighter",
  "description": "A nasty little goblin wielding a rusty sword",
  "max_health": 20,
  "current_health": 20,
  "armor_class": 14,
  "str_base": 10,
  "dex_base": 14,
  "int_base": 8,
  "con_base": 12,
  "cha_base": 8,
  "str_modifier": 0,
  "dex_modifier": 2,
  "int_modifier": -1,
  "con_modifier": 1,
  "cha_modifier": -1,
  "weapon_info": "Rusty Sword|1d6+2",
  "current_ai_state": "Aggressive",
  "flee_health_threshold": 0.25,
  "created_at": "2026-01-29T10:00:00Z"
}
```

---

### 2. Initiate Combat

```bash
curl -X POST http://localhost:5000/api/combats \
  -H "Content-Type: application/json" \
  -d '{
    "adventure_id": "550e8400-e29b-41d4-a716-446655440001",
    "player_character_ids": [
      "550e8400-e29b-41d4-a716-446655440002"
    ],
    "enemy_ids": [
      "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b"
    ]
  }'
```

**Response:**

```json
{
  "combat_id": "c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "status": "Active",
  "current_round": 1,
  "current_turn_combatant_id": "550e8400-e29b-41d4-a716-446655440002",
  "combatants": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "display_name": "Theron the Brave",
      "combatant_type": "Character",
      "current_health": 30,
      "max_health": 30,
      "armor_class": 16,
      "status": "Active",
      "initiative_score": 18,
      "dexterity_modifier": 3
    },
    {
      "id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
      "display_name": "Goblin Fighter",
      "combatant_type": "Enemy",
      "current_health": 20,
      "max_health": 20,
      "armor_class": 14,
      "status": "Active",
      "initiative_score": 15,
      "dexterity_modifier": 2,
      "ai_state": "Aggressive"
    }
  ],
  "initiative_order": [
    "550e8400-e29b-41d4-a716-446655440002",
    "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b"
  ],
  "winner": null,
  "started_at": "2026-01-29T10:05:00Z",
  "ended_at": null
}
```

**Key Details:**

- `current_turn_combatant_id` indicates whose turn it is (Theron goes first with initiative 18)
- `initiative_order` shows the turn sequence for all rounds
- `status: "Active"` means combat is ongoing

---

### 3. Player Character Attacks Enemy

```bash
curl -X POST http://localhost:5000/api/combats/c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f/turns \
  -H "Content-Type: application/json" \
  -d '{
    "combatant_id": "550e8400-e29b-41d4-a716-446655440002",
    "action_type": "Attack",
    "target_combatant_id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b"
  }'
```

**Response:**

```json
{
  "action_result": {
    "action_type": "Attack",
    "attacker_id": "550e8400-e29b-41d4-a716-446655440002",
    "attacker_name": "Theron the Brave",
    "target_id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
    "target_name": "Goblin Fighter",
    "attack_roll": 17,
    "attack_modifier": 5,
    "attack_total": 22,
    "target_ac": 14,
    "is_hit": true,
    "is_critical_hit": false,
    "weapon_name": "Longsword",
    "damage_expression": "1d8+3",
    "damage_roll": 6,
    "damage_modifier": 3,
    "total_damage": 9,
    "target_health_after": 11
  },
  "combat_state": {
    "combat_id": "c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "status": "Active",
    "current_round": 1,
    "current_turn_combatant_id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
    "combatants": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "display_name": "Theron the Brave",
        "current_health": 30,
        "status": "Active"
      },
      {
        "id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
        "display_name": "Goblin Fighter",
        "current_health": 11,
        "status": "Active",
        "ai_state": "Defensive"
      }
    ]
  }
}
```

**Key Details:**

- Attack roll (17) + modifier (5) = 22, exceeds AC (14) → **Hit!**
- Damage: 1d8+3 rolled 6+3 = 9 damage
- Goblin health reduced from 20 → 11 (55%)
- Goblin AI state changed from "Aggressive" → "Defensive" (health < 50%)
- Turn advanced to goblin (next in initiative order)

---

### 4. Enemy's Turn (Automatic)

When it's an enemy's turn, the AI automatically selects an action based on its current state:

```bash
curl -X POST http://localhost:5000/api/combats/c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f/enemy-turn
```

**Response:**

```json
{
  "action_result": {
    "action_type": "Attack",
    "attacker_id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
    "attacker_name": "Goblin Fighter",
    "target_id": "550e8400-e29b-41d4-a716-446655440002",
    "target_name": "Theron the Brave",
    "attack_roll": 12,
    "attack_modifier": 4,
    "attack_total": 16,
    "target_ac": 16,
    "is_hit": true,
    "is_critical_hit": false,
    "weapon_name": "Rusty Sword",
    "damage_expression": "1d6+2",
    "damage_roll": 4,
    "damage_modifier": 2,
    "total_damage": 6,
    "target_health_after": 24
  },
  "combat_state": {
    "combat_id": "c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "status": "Active",
    "current_round": 2,
    "current_turn_combatant_id": "550e8400-e29b-41d4-a716-446655440002",
    "combatants": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "display_name": "Theron the Brave",
        "current_health": 24,
        "status": "Active"
      },
      {
        "id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
        "display_name": "Goblin Fighter",
        "current_health": 11,
        "status": "Active",
        "ai_state": "Defensive"
      }
    ]
  }
}
```

**Key Details:**

- AI selected "Attack" action (defensive state still attacks but more cautiously)
- Attack barely hit (16 vs AC 16)
- Theron damaged for 6 HP (30 → 24)
- Round 2 begins, back to Theron's turn

---

### 5. Continue Combat Until Victory

Player attacks again to finish the goblin:

```bash
curl -X POST http://localhost:5000/api/combats/c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f/turns \
  -H "Content-Type: application/json" \
  -d '{
    "combatant_id": "550e8400-e29b-41d4-a716-446655440002",
    "action_type": "Attack",
    "target_combatant_id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b"
  }'
```

**Response:**

```json
{
  "action_result": {
    "action_type": "Attack",
    "attacker_id": "550e8400-e29b-41d4-a716-446655440002",
    "attacker_name": "Theron the Brave",
    "target_id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
    "target_name": "Goblin Fighter",
    "attack_roll": 20,
    "attack_modifier": 5,
    "attack_total": 25,
    "target_ac": 14,
    "is_hit": true,
    "is_critical_hit": true,
    "weapon_name": "Longsword",
    "damage_expression": "2d8+3",
    "damage_roll": 14,
    "damage_modifier": 3,
    "total_damage": 17,
    "target_health_after": 0
  },
  "combat_state": {
    "combat_id": "c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    "status": "Completed",
    "current_round": 2,
    "winner": "Player",
    "combatants": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "display_name": "Theron the Brave",
        "current_health": 24,
        "status": "Active"
      },
      {
        "id": "e7f2c3a1-8b9d-4e6f-a1b2-3c4d5e6f7a8b",
        "display_name": "Goblin Fighter",
        "current_health": 0,
        "status": "Defeated"
      }
    ],
    "ended_at": "2026-01-29T10:10:00Z"
  }
}
```

**Key Details:**

- **Critical Hit!** Natural 20 on attack roll
- Damage dice doubled: 1d8 → 2d8 (rolled 14) + modifier 3 = 17 damage
- Goblin reduced to 0 HP → Status: "Defeated"
- Combat automatically ends with Winner: "Player"
- `status: "Completed"` and `ended_at` timestamp recorded

---

## Common Workflows

### A. Multi-Combatant Battle (Party vs Multiple Enemies)

```bash
curl -X POST http://localhost:5000/api/combats \
  -H "Content-Type: application/json" \
  -d '{
    "adventure_id": "550e8400-e29b-41d4-a716-446655440001",
    "player_character_ids": [
      "char-id-warrior",
      "char-id-wizard",
      "char-id-rogue"
    ],
    "enemy_ids": [
      "enemy-id-goblin-1",
      "enemy-id-goblin-2",
      "enemy-id-orc-chief"
    ]
  }'
```

**Initiative Resolution:**

- System rolls d20 + DEX modifier for all 6 combatants
- Sorts by score (high to low)
- Ties broken by DEX modifier, then random
- Turn order established for entire combat

---

### B. Check Combat Status

```bash
curl -X GET http://localhost:5000/api/combats/c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f
```

**Response:**

```json
{
  "combat_id": "c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "status": "Active",
  "current_round": 3,
  "current_turn_combatant_id": "char-id-wizard",
  "combatants": [...],
  "initiative_order": [...],
  "winner": null
}
```

---

### C. View Combat History

```bash
curl -X GET http://localhost:5000/api/combats/c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f/actions
```

**Response:**

```json
{
  "combat_id": "c1f2d3e4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "total_actions": 8,
  "actions": [
    {
      "action_id": "action-1",
      "attacker_name": "Theron the Brave",
      "target_name": "Goblin Fighter",
      "attack_total": 22,
      "is_hit": true,
      "total_damage": 9,
      "timestamp": "2026-01-29T10:05:30Z"
    },
    {
      "action_id": "action-2",
      "attacker_name": "Goblin Fighter",
      "target_name": "Theron the Brave",
      "attack_total": 16,
      "is_hit": true,
      "total_damage": 6,
      "timestamp": "2026-01-29T10:06:00Z"
    }
  ]
}
```

---

### D. List All Enemies (For Combat Planning)

```bash
curl -X GET "http://localhost:5000/api/enemies?skip=0&limit=20"
```

**Response:**

```json
{
  "total": 15,
  "skip": 0,
  "limit": 20,
  "enemies": [
    {
      "id": "enemy-goblin-1",
      "name": "Goblin Scout",
      "max_health": 18,
      "armor_class": 13,
      "current_ai_state": "Aggressive"
    },
    {
      "id": "enemy-orc-1",
      "name": "Orc Warrior",
      "max_health": 35,
      "armor_class": 15,
      "current_ai_state": "Aggressive"
    }
  ]
}
```

---

### E. Create Custom Enemy Template

```bash
curl -X POST http://localhost:5000/api/enemies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dire Wolf",
    "description": "A massive, vicious wolf with glowing red eyes",
    "max_health": 30,
    "armor_class": 14,
    "str_base": 16,
    "dex_base": 15,
    "int_base": 3,
    "con_base": 14,
    "cha_base": 7,
    "weapon_info": "Bite|2d6+3",
    "flee_health_threshold": 0.20
  }'
```

**Key Details:**

- Higher STR (16) for strong attacks
- High DEX (15) for good initiative
- Low INT (3) - beast intelligence
- Bite weapon: 2d6+3 damage (powerful)
- Flees at 20% health (more aggressive than default 25%)

---

## AI State Behavior Examples

### Aggressive State (Health > 50%)

**Behavior:**

- Targets highest-threat enemy (most damage dealt so far)
- Uses offensive actions
- No self-preservation

**Example Output:**

```json
{
  "ai_state": "Aggressive",
  "action_type": "Attack",
  "target_selection": "highest_threat"
}
```

---

### Defensive State (Health 25-50%)

**Behavior:**

- Still attacks but prioritizes self-preservation
- May choose less risky targets
- Considers tactical positioning

**Example Output:**

```json
{
  "ai_state": "Defensive",
  "action_type": "Attack",
  "target_selection": "nearest_threat"
}
```

---

### Flee State (Health < 25%)

**Behavior:**

- Attempts to flee from combat
- If blocked, continues defensive attacks
- Avoids engaging new targets

**Example Output:**

```json
{
  "ai_state": "Flee",
  "action_type": "Flee",
  "flee_attempt_result": "success"
}
```

After successful flee:

```json
{
  "status": "Fled",
  "removed_from_initiative": true
}
```

---

## Error Handling

### Not Your Turn

```bash
# Attempting to act when it's another combatant's turn
curl -X POST http://localhost:5000/api/combats/{combat_id}/turns \
  -d '{"combatant_id": "wrong-combatant", "action_type": "Attack", ...}'
```

**Response (409 Conflict):**

```json
{
  "error": "NotYourTurn",
  "message": "It is currently combatant 'active-combatant-id' turn, not 'wrong-combatant'",
  "details": {
    "current_turn_combatant_id": "active-combatant-id",
    "requested_combatant_id": "wrong-combatant"
  }
}
```

---

### Invalid Target

```bash
# Attacking a defeated combatant
curl -X POST http://localhost:5000/api/combats/{combat_id}/turns \
  -d '{"combatant_id": "...", "action_type": "Attack", "target_combatant_id": "defeated-enemy"}'
```

**Response (422 Unprocessable Entity):**

```json
{
  "error": "InvalidTarget",
  "message": "Cannot target defeated combatant 'defeated-enemy'",
  "details": {
    "target_status": "Defeated"
  }
}
```

---

### Combat Already Ended

```bash
# Attempting action on completed combat
curl -X POST http://localhost:5000/api/combats/{combat_id}/turns \
  -d '{"combatant_id": "...", "action_type": "Attack", ...}'
```

**Response (409 Conflict):**

```json
{
  "error": "CombatEnded",
  "message": "Combat has already ended with winner: Player",
  "details": {
    "status": "Completed",
    "winner": "Player",
    "ended_at": "2026-01-29T10:10:00Z"
  }
}
```

---

## Performance Guidelines

### Response Time Targets

- **Initiative Calculation**: < 50ms (for up to 20 combatants)
- **Attack Resolution**: < 100ms (single attack with damage)
- **Enemy AI Decision**: < 50ms (state evaluation + action selection)
- **Combat Status Retrieval**: < 50ms

### Recommended Practices

1. **Poll Combat State**: Check status after each action to update UI
2. **Batch History Queries**: Use pagination for combat history (`?skip=0&limit=50`)
3. **Cache Enemy Templates**: Load enemy list once, reuse for multiple encounters
4. **Optimize Turn Flow**: Use `/enemy-turn` endpoint for automatic AI resolution

---

## Next Steps

After completing this quick start:

1. **Review Data Model**: See [data-model.md](./data-model.md) for entity details
2. **API Reference**: See [contracts/openapi.yaml](./contracts/openapi.yaml) for full API specs
3. **Integration**: Integrate combat into your adventure workflow
4. **Testing**: Write integration tests for edge cases (tied initiative, simultaneous defeat, flee attempts)

---

## Additional Resources

- **Feature Spec**: [spec.md](./spec.md) - Complete feature requirements
- **Research**: [research.md](./research.md) - D&D 5e mechanics and design decisions
- **Implementation Plan**: [plan.md](./plan.md) - Technical architecture and roadmap

---

**Questions or Issues?**  
Refer to the API documentation in `contracts/openapi.yaml` or check the combat service logs for detailed error messages.
