/**
 * Quest Tracking Components barrel export
 * Re-exports all quest tracking components for easy importing
 *
 * Components in this module:
 * - ActiveQuestsList: Page component for active quests
 * - QuestList: Main quest list container
 * - QuestListItem: Individual quest item in list
 * - QuestDetail: Quest detail modal/panel (to be created)
 * - ObjectiveItem: Individual objective display (to be created)
 * - ProgressBar: Reusable progress indicator
 * - QuestFilter: Filter controls (to be created)
 * - CompletedQuests: Completed quests history (to be created)
 * - RewardDisplay: Rewards display component (to be created)
 */

// Phase 3 - User Story 1 (Complete)
export { default as ActiveQuestsList } from "./ActiveQuestsList";
export { default as QuestList } from "./QuestList";
export { default as QuestListItem } from "./QuestListItem";
export { default as ProgressBar } from "./ProgressBar";

// Phase 4 - User Story 2 (Complete)
export { default as QuestDetail } from "./QuestDetail";
export { default as ObjectiveItem } from "./ObjectiveItem";
export { default as RewardDisplay } from "./RewardDisplay";

// Phase 6 - User Story 4 (Complete)
export { default as QuestFilter } from "./QuestFilter";

// Phase 7 - User Story 5 (Complete)
export { default as CompletedQuests } from "./CompletedQuests";
export { default as CompletedQuestsHistory } from "./CompletedQuestsHistory";
