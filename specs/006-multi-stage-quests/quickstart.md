# Quest System - Quick Start Guide

**Version**: 1.0.0 | **Last Updated**: January 29, 2026

This guide provides quick reference for using the Multi-Stage Quest System API and implementing quest functionality.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Concepts](#core-concepts)
3. [Common Workflows](#common-workflows)
4. [API Endpoints Cheat Sheet](#api-endpoints-cheat-sheet)
5. [Code Examples](#code-examples)
6. [Debugging Checklist](#debugging-checklist)

---

## System Overview

### What is a Quest?

A **Quest** is a multi-stage narrative progression system that:

- Has 2+ sequential stages (objectives)
- Each stage has 1+ objectives (tasks)
- Requires all objectives complete before progressing
- May have prerequisites (other quests that must be done first)
- Grants rewards (XP, items, currency) on final completion
- Tracks player progress persistently

### Key Components

| Component         | Role                       | Example                                                      |
| ----------------- | -------------------------- | ------------------------------------------------------------ |
| **Quest**         | Complete narrative arc     | "The Bandit Caves" quest                                     |
| **Stage**         | Milestone within quest     | "Stage 1: Clear outer cave (3/3)", "Stage 2: Defeat captain" |
| **Objective**     | Single task within stage   | "Kill 3 bandits"                                             |
| **QuestProgress** | Player's position in quest | "Player Alice is on Stage 2 with 1/1 objective complete"     |
| **Reward**        | Incentive for completion   | "+500 XP, Leather Armor, +100 Gold"                          |
| **Dependency**    | Quest prerequisite         | "Must complete 'Beginner Training' before 'Bandit Caves'"    |

---

## Core Concepts

### Quest Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Quest Lifecycle                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Available Quests                                         │
│     ↓ (Check dependencies, show available/locked quests)    │
│                                                               │
│  2. Accept Quest                                             │
│     ├─→ Creates QuestProgress(Status=Active)                │
│     └─→ Initializes Stage 1, all objectives at 0/target    │
│     ↓ (Cannot accept if prerequisites not met)             │
│                                                               │
│  3. Progress Objectives                                      │
│     ├─→ Update objective progress                           │
│     └─→ Check if objective now complete (progress>=target)  │
│     ↓                                                         │
│                                                               │
│  4. Check Stage Completion                                   │
│     ├─→ All objectives complete? YES → Continue             │
│     └─→ Any failure conditions triggered? YES → FAIL         │
│     ↓                                                         │
│                                                               │
│  5. Complete Stage                                           │
│     ├─→ Grant stage rewards (if any)                        │
│     └─→ Progress to next stage (repeat 3-5)                 │
│     ↓                                                         │
│                                                               │
│  6. Final Stage Complete?                                    │
│     ├─→ YES: Mark quest complete, grant final rewards       │
│     └─→ NO: Loop back to step 3                             │
│     ↓                                                         │
│                                                               │
│  7. Quest Complete / Abandoned / Failed                      │
│     └─→ QuestProgress(Status=Completed|Abandoned|Failed)   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Quest States

| State         | Meaning                          | Can Progress?          | Can Abandon? | Can Resume? |
| ------------- | -------------------------------- | ---------------------- | ------------ | ----------- |
| **Active**    | Currently in progress            | ✅ Yes                 | ✅ Yes       | N/A         |
| **Completed** | All stages done, rewards granted | ❌ No                  | N/A          | ❌ No       |
| **Failed**    | Failure condition triggered      | ❌ No                  | N/A          | ❌ No       |
| **Abandoned** | Player chose to stop             | ❌ No (must re-accept) | N/A          | ✅ Yes \*   |

\*Abandoned quests show player's last progress when re-accepted (no restart required)

### Objective Condition Types

| Type               | What Player Must Do     | Example Target           |
| ------------------ | ----------------------- | ------------------------ |
| **KillCount**      | Defeat N enemies        | "Kill 10 bandits"        |
| **ItemCollected**  | Acquire N items         | "Collect 5 wolf pelts"   |
| **LocationVisit**  | Go to specific location | "Visit the shrine"       |
| **NpcInteraction** | Talk to NPC             | "Speak to village elder" |
| **DamageDealt**    | Deal N damage total     | "Deal 500 damage"        |
| **TimeElapsed**    | Spend N seconds         | "Wait 30 seconds"        |
| **Custom**         | Game-defined condition  | "Solve the puzzle"       |

---

## Common Workflows

### Workflow 1: Player Accepts a Quest

**Scenario**: Player views quest list and clicks "Accept" on "The Bandit Caves" quest

```
1. API: GET /quests              → List quests (show available/locked)
2. Check: Does player have       → NO: Cannot accept
          prerequisite done?
3. API: POST /quests/{id}/accept → Create QuestProgress, return current state
4. Show: "Quest Accepted! Stage 1/3: Clear outer cave..."
   └─→ Display objectives: "Kill 3 bandits (0/3)"
```

---

### Workflow 2: Player Progresses Objective

**Scenario**: Player defeats first bandit (1/3 killed)

```
1. Game Event: Enemy defeated
2. API: PATCH /objectives/{id}/update → Increment progress by 1
3. Return: { currentProgress: 1, targetAmount: 3, isCompleted: false }
4. Show: "Kill 3 bandits (1/3)" (progress bar at 33%)
5. Repeat for bandits 2 and 3
```

---

### Workflow 3: Player Completes Stage

**Scenario**: Player kills all 3 bandits and stage is ready to complete

```
1. Check: All objectives complete?
   ├─→ Kill count: 3/3 ✓
   ├─→ No failure conditions triggered ✓
   └─→ Ready to advance!

2. API: POST /stages/{stageNumber}/complete
3. Return:
   {
     questStatus: "Active",
     currentStageNumber: 2,
     stageRewards: [ {type: "Experience", amount: 100} ],
     message: "Stage 1/3 complete! Advancing to Stage 2..."
   }

4. Show: Stage 2 objectives:
   └─→ "Defeat the Bandit Captain (0/1)"
```

---

### Workflow 4: Player Checks Dependencies Before Accepting

**Scenario**: Player tries to accept "Defeat the Dragon" (requires "Bandit Caves")

```
1. Player clicks on "Defeat the Dragon" quest
2. API: GET /quests/{dragonQuestId}/dependencies?playerId=...
3. Return:
   {
     questId: "...",
     prerequisites: [
       {
         prerequisiteQuestId: "...",
         questName: "The Bandit Caves",
         dependencyType: "MustComplete",
         playerStatus: "NotStarted"  ← Player hasn't done this!
       }
     ],
     allPrerequisitesMet: false
   }

4. Show: "🔒 Locked - Complete 'The Bandit Caves' first"
```

---

### Workflow 5: Player Abandons Quest

**Scenario**: Player gets stuck on Stage 2 and gives up

```
1. API: POST /quests/{questId}/abandon
2. Return: { questProgressId: "...", status: "Abandoned" }
3. Quest removed from "Active Quests" list
4. Later: Player re-clicks "Accept" on "The Bandit Caves"
   └─→ Previous progress restored (Stage 2, objectives as before)
   └─→ Message: "Resuming 'The Bandit Caves' from where you left off..."
```

---

## API Endpoints Cheat Sheet

### Quest Discovery

```
GET /adventures/{aid}/quests                    List available quests
GET /adventures/{aid}/quests/{qid}/dependencies Get prerequisites
```

### Quest Acceptance & Abandonment

```
POST /adventures/{aid}/quests/{qid}/accept      Accept quest
POST /adventures/{aid}/quests/{qid}/abandon     Abandon quest
```

### Progress Tracking

```
GET  /adventures/{aid}/players/{pid}/quests/active       List active quests
GET  /adventures/{aid}/quests/{qid}/progress?pid=...     Get current progress
PATCH /adventures/{aid}/quests/{qid}/stages/{snum}/objectives/{oid}/update
      Update objective progress
POST /adventures/{aid}/quests/{qid}/stages/{snum}/complete
      Attempt to complete stage
```

See [OpenAPI Specification](contracts/openapi.yaml) for detailed parameters and responses.

---

## Code Examples

### Example 1: List Quests and Check Locks

```csharp
// Get all available quests
var response = await httpClient.GetAsync(
    $"/adventures/{adventureId}/quests?difficulty=Medium&skip=0&limit=20"
);
var json = await response.Content.ReadAsAsync<ListResponse<QuestSummary>>();

foreach (var quest in json.Items)
{
    if (quest.IsLocked)
    {
        Console.WriteLine($"🔒 {quest.Name} - {quest.LockReason}");
    }
    else
    {
        Console.WriteLine($"✓ {quest.Name} ({quest.StageCount} stages)");
    }
}
```

---

### Example 2: Accept Quest and Display Progress

```csharp
// Accept a quest
var acceptResponse = await httpClient.PostAsJsonAsync(
    $"/adventures/{adventureId}/quests/{questId}/accept",
    new { playerId = currentPlayer.Id }
);

var questProgress = await acceptResponse.Content.ReadAsAsync<QuestProgressFull>();

// Display quest header
Console.WriteLine($"✓ {questProgress.QuestName}");
Console.WriteLine($"  Progress: Stage {questProgress.CurrentStageNumber}/{questProgress.TotalStages} ({questProgress.ProgressPercentage:F1}%)");

// Display current stage and objectives
var stage = questProgress.CurrentStage;
Console.WriteLine($"\n📍 {stage.Title}");
Console.WriteLine($"   {stage.Description}");
Console.WriteLine($"\n   Objectives:");

foreach (var objective in stage.Objectives)
{
    var bar = new string('█', (int)(objective.ProgressPercentage / 5));
    var empty = new string('░', 20 - bar.Length);
    Console.WriteLine(
        $"   • {objective.Description} ({objective.CurrentProgress}/{objective.TargetAmount}) [{bar}{empty}]"
    );
}
```

---

### Example 3: Update Objective Progress When Event Occurs

```csharp
// In game code: when player kills an enemy in a quest
public async Task OnEnemyDefeated(Enemy enemy, QuestProgress questProgress)
{
    // Find objectives that track kill count
    var currentStage = questProgress.CurrentStage;
    var killObjective = currentStage.Objectives
        .FirstOrDefault(o => o.ConditionType == ObjectiveConditionType.KillCount);

    if (killObjective == null) return;

    // Update the objective
    var updateResponse = await httpClient.PatchAsJsonAsync(
        $"/adventures/{adventureId}/quests/{questProgress.QuestId}/stages/{currentStage.StageNumber}/objectives/{killObjective.ObjectiveId}/update",
        new
        {
            playerId = currentPlayer.Id,
            progressAmount = 1
        }
    );

    var updated = await updateResponse.Content.ReadAsAsync<ObjectiveProgress>();

    // Check if objective now complete
    if (updated.IsCompleted)
    {
        PlaySound("objective_complete");
        ShowNotification($"✓ {updated.Description}");
    }

    // Check if stage is now completable
    if (AllObjectivesComplete(currentStage))
    {
        ShowNotification($"Stage {currentStage.StageNumber} ready to complete!");
    }
}
```

---

### Example 4: Complete Stage and Advance

```csharp
// Try to complete current stage
var completeResponse = await httpClient.PostAsJsonAsync(
    $"/adventures/{adventureId}/quests/{questId}/stages/{currentStageNumber}/complete",
    new { playerId = currentPlayer.Id }
);

if (completeResponse.StatusCode == System.Net.HttpStatusCode.OK)
{
    var completion = await completeResponse.Content.ReadAsAsync<StageCompletionResult>();

    Console.WriteLine(completion.Message);

    // Grant stage rewards
    foreach (var reward in completion.StageRewards)
    {
        await GrantReward(reward);
    }

    // Check if quest itself is complete
    if (completion.QuestStatus == "Completed")
    {
        Console.WriteLine("🎉 Quest Complete!");
        ShowQuestCompletionScreen(questId);
    }
    else
    {
        Console.WriteLine($"Advancing to Stage {completion.CurrentStageNumber}...");
        UpdateUI(completion);
    }
}
else if (completeResponse.StatusCode == System.Net.HttpStatusCode.BadRequest)
{
    var error = await completeResponse.Content.ReadAsAsync<ErrorResponse>();
    Console.WriteLine($"❌ {error.Error}");
}
```

---

## Debugging Checklist

### Quest Won't Accept

- [ ] Check if all prerequisites completed: `GET /quests/{id}/dependencies?playerId=...`
- [ ] Verify player hasn't already accepted this quest (unique constraint)
- [ ] Check quest exists in adventure: `GET /quests`

### Objective Progress Won't Update

- [ ] Verify objective condition type matches game event (KillCount, ItemCollected, etc.)
- [ ] Check progress amount parameter >= 1
- [ ] Verify objective hasn't already been completed
- [ ] Check quest is still Active (not Failed/Abandoned/Completed)

### Stage Won't Complete

- [ ] List objectives: All progresses >= target? `GET /progress`
- [ ] Are there ANY failure conditions triggered? Check failure condition resolver
- [ ] Is current stage number correct? (matches stage.StageNumber)

### Rewards Not Granted

- [ ] Quest marked Completed? Check status in `GET /progress`
- [ ] Call to `/complete` returned 200? (not 400 or 409)
- [ ] Inventory system responding? (check logs for integration errors)
- [ ] Database transaction committed? (check DB for reward rows)

### Performance Issues

- [ ] Check composite index exists: `(player_id, status)` on quest_progress
- [ ] Verify `AsNoTracking()` used on read-only queries
- [ ] Check `.Include()` being used (not lazy loading objectives one-by-one)
- [ ] Monitor query count: should be <3 per endpoint

---

## Next Steps

1. **Implement Domain Layer**: Create C# entity classes (Quest, QuestStage, QuestProgress, etc.)
2. **Create EF Core Migrations**: Define database schema based on data-model.md
3. **Build Application Services**: QuestService, StageProgressService, DependencyResolver
4. **Implement API Controllers**: QuestsController, StagesController, ProgressController
5. **Write Tests**: Unit tests for service logic, integration tests for API endpoints
6. **Integrate Rewards**: Connect RewardService to inventory system when quest completes

See [data-model.md](data-model.md) for complete entity definitions and [contracts/openapi.yaml](contracts/openapi.yaml) for API specification.
