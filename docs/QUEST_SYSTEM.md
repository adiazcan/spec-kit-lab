# Quest System Documentation

**Version**: 1.0.0 | **Date**: January 29, 2026

## Overview

The Quest System provides a multi-stage quest progression framework with dependency management, progress tracking, and reward distribution. Players can accept quests, complete objectives across multiple stages, and receive rewards upon completion.

## Architecture

### Core Components

- **Quest**: Master quest definition with stages, objectives, and rewards
- **QuestStage**: Individual stage within a quest
- **QuestObjective**: Specific task/goal within a stage
- **QuestProgress**: Player's progression through a quest
- **QuestDependency**: Prerequisite relationships between quests

### Services

- **QuestService**: Quest acceptance, abandonment, and listing
- **StageProgressService**: Objective updates and stage completion
- **DependencyResolver**: Prerequisite validation and dependency checking
- **RewardService**: Reward granting upon completion
- **ConditionEvaluator**: Failure condition evaluation

## API Endpoints

### List Available Quests

```http
GET /api/adventures/{adventureId}/quests?difficulty=Medium&skip=0&limit=20
```

**Response**: List of available quests with lock status

### Accept Quest

```http
POST /api/adventures/{adventureId}/quests/{questId}/accept
Content-Type: application/json

{
  "playerId": "guid"
}
```

**Response 201**: Quest progress created  
**Response 409**: Prerequisites not met  
**Response 422**: Quest already active

### Get Quest Progress

```http
GET /api/adventures/{adventureId}/quests/{questId}/progress?playerId=guid
```

**Response 200**: Current quest progress with stage and objective details

### Update Objective Progress

```http
PATCH /api/adventures/{adventureId}/quests/{questId}/stages/{stageNumber}/objectives/{objectiveId}/update
Content-Type: application/json

{
  "playerId": "guid",
  "progressAmount": 1
}
```

**Response 200**: Updated objective progress

### Complete Stage

```http
POST /api/adventures/{adventureId}/quests/{questId}/stages/{stageNumber}/complete
Content-Type: application/json

{
  "playerId": "guid"
}
```

**Response 200**: Stage completion result with rewards

### Abandon Quest

```http
POST /api/adventures/{adventureId}/quests/{questId}/abandon
Content-Type: application/json

{
  "playerId": "guid"
}
```

**Response 204**: Quest abandoned

### Get Quest Dependencies

```http
GET /api/adventures/{adventureId}/quests/{questId}/dependencies?playerId=guid
```

**Response 200**: Dependency information with prerequisite status

### List Active Quests

```http
GET /api/adventures/{adventureId}/players/{playerId}/quests/active
```

**Response 200**: All active quests for player

## Configuration

### appsettings.json

```json
{
  "Quest": {
    "MaxConcurrentActiveQuests": 10,
    "MaxQuestStages": 20,
    "EnableDependencyValidation": true,
    "CacheDependencyGraphInMemory": true
  }
}
```

## Database Schema

### Core Tables

- `quests`: Quest definitions
- `quest_stages`: Stages within quests
- `quest_objectives`: Objectives within stages
- `quest_progress`: Player quest progress (optimistic locking with RowVersion)
- `stage_progress`: Stage completion tracking
- `objective_progress`: Objective completion tracking
- `quest_rewards`: Reward definitions
- `quest_dependencies`: Prerequisite relationships
- `failure_conditions`: Failure condition definitions

### Indexes

- `(player_id, quest_id)` UNIQUE on quest_progress
- `(player_id, status)` on quest_progress
- `(quest_id, stage_number)` UNIQUE on quest_stages
- `(stage_id, objective_number)` UNIQUE on quest_objectives

## Usage Examples

### Accept and Track Quest

```csharp
// Accept quest
var acceptRequest = new AcceptQuestRequest { PlayerId = playerId };
var progress = await httpClient.PostAsJsonAsync(
    $"/api/adventures/{adventureId}/quests/{questId}/accept",
    acceptRequest
);

// Update objective progress
var updateRequest = new UpdateObjectiveProgressRequest
{
    PlayerId = playerId,
    ProgressAmount = 1
};
await httpClient.PatchAsJsonAsync(
    $"/api/adventures/{adventureId}/quests/{questId}/stages/1/objectives/{objectiveId}/update",
    updateRequest
);

// Complete stage
var completeRequest = new CompleteStageRequest { PlayerId = playerId };
var result = await httpClient.PostAsJsonAsync(
    $"/api/adventures/{adventureId}/quests/{questId}/stages/1/complete",
    completeRequest
);
```

## Error Handling

### Common Exceptions

- **QuestNotFoundException**: Quest ID not found
- **QuestAlreadyActiveException**: Quest already active for player
- **PrerequisiteNotMetException**: Prerequisites not completed
- **MaxActiveQuestsExceededException**: Too many concurrent quests
- **QuestNotActiveException**: Quest not active (completed/failed/abandoned)
- **StageNotCompleteException**: Not all objectives complete
- **ObjectiveAlreadyCompleteException**: Objective already completed
- **QuestFailureException**: Failure condition triggered

## Performance Considerations

- All read queries use `.AsNoTracking()` for performance
- Dependency graph can be cached in memory
- Optimistic concurrency with RowVersion prevents conflicts
- Composite indexes optimize quest listing and progress queries
- Expected response times: <200ms p95 for all endpoints

## Testing

### Unit Tests

- QuestService: Quest acceptance, abandonment, prerequisite checks
- StageProgressService: Objective updates, stage completion
- DependencyResolver: Prerequisite validation, cycle detection

### Integration Tests

- API endpoints: Status codes, request/response validation
- Database: Concurrency, transaction integrity
- End-to-end: Complete quest flow from acceptance to completion

## Migration

Run database migration:

```bash
dotnet ef database update --project src/DiceEngine.Infrastructure
```

## Future Enhancements

- Quest branching and multiple paths
- Repeatable quests
- Time-limited quests
- Shared quests (party/multiplayer)
- Dynamic objective generation
- Quest templates and quest editor UI
