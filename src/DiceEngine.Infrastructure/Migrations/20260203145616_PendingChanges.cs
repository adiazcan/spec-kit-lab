using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiceEngine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PendingChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "quests",
                columns: table => new
                {
                    QuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    MaxConcurrentPlayers = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quests", x => x.QuestId);
                });

            migrationBuilder.CreateTable(
                name: "quest_dependencies",
                columns: table => new
                {
                    DependencyId = table.Column<Guid>(type: "uuid", nullable: false),
                    DependentQuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    PrerequisiteQuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quest_dependencies", x => x.DependencyId);
                    table.ForeignKey(
                        name: "FK_quest_dependencies_quests_DependentQuestId",
                        column: x => x.DependentQuestId,
                        principalTable: "quests",
                        principalColumn: "QuestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_quest_dependencies_quests_PrerequisiteQuestId",
                        column: x => x.PrerequisiteQuestId,
                        principalTable: "quests",
                        principalColumn: "QuestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "quest_progress",
                columns: table => new
                {
                    QuestProgressId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentStageNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AbandonedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModified = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quest_progress", x => x.QuestProgressId);
                    table.ForeignKey(
                        name: "FK_quest_progress_quests_QuestId",
                        column: x => x.QuestId,
                        principalTable: "quests",
                        principalColumn: "QuestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "quest_stages",
                columns: table => new
                {
                    StageId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageNumber = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quest_stages", x => x.StageId);
                    table.ForeignKey(
                        name: "FK_quest_stages_quests_QuestId",
                        column: x => x.QuestId,
                        principalTable: "quests",
                        principalColumn: "QuestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "failure_conditions",
                columns: table => new
                {
                    FailureConditionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConditionType = table.Column<int>(type: "integer", nullable: false),
                    Metadata = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_failure_conditions", x => x.FailureConditionId);
                    table.ForeignKey(
                        name: "FK_failure_conditions_quest_stages_StageId",
                        column: x => x.StageId,
                        principalTable: "quest_stages",
                        principalColumn: "StageId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "quest_objectives",
                columns: table => new
                {
                    ObjectiveId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObjectiveNumber = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ConditionType = table.Column<int>(type: "integer", nullable: false),
                    TargetAmount = table.Column<int>(type: "integer", nullable: false),
                    Metadata = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quest_objectives", x => x.ObjectiveId);
                    table.ForeignKey(
                        name: "FK_quest_objectives_quest_stages_StageId",
                        column: x => x.StageId,
                        principalTable: "quest_stages",
                        principalColumn: "StageId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "quest_rewards",
                columns: table => new
                {
                    RewardId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestId = table.Column<Guid>(type: "uuid", nullable: true),
                    StageId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    ItemId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_quest_rewards", x => x.RewardId);
                    table.ForeignKey(
                        name: "FK_quest_rewards_quest_stages_StageId",
                        column: x => x.StageId,
                        principalTable: "quest_stages",
                        principalColumn: "StageId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_quest_rewards_quests_QuestId",
                        column: x => x.QuestId,
                        principalTable: "quests",
                        principalColumn: "QuestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "stage_progress",
                columns: table => new
                {
                    StageProgressId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestProgressId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageNumber = table.Column<int>(type: "integer", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stage_progress", x => x.StageProgressId);
                    table.ForeignKey(
                        name: "FK_stage_progress_quest_progress_QuestProgressId",
                        column: x => x.QuestProgressId,
                        principalTable: "quest_progress",
                        principalColumn: "QuestProgressId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_stage_progress_quest_stages_StageId",
                        column: x => x.StageId,
                        principalTable: "quest_stages",
                        principalColumn: "StageId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "objective_progress",
                columns: table => new
                {
                    ObjectiveProgressId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageProgressId = table.Column<Guid>(type: "uuid", nullable: false),
                    ObjectiveId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentProgress = table.Column<int>(type: "integer", nullable: false),
                    TargetAmount = table.Column<int>(type: "integer", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_objective_progress", x => x.ObjectiveProgressId);
                    table.ForeignKey(
                        name: "FK_objective_progress_quest_objectives_ObjectiveId",
                        column: x => x.ObjectiveId,
                        principalTable: "quest_objectives",
                        principalColumn: "ObjectiveId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_objective_progress_stage_progress_StageProgressId",
                        column: x => x.StageProgressId,
                        principalTable: "stage_progress",
                        principalColumn: "StageProgressId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_failure_conditions_StageId",
                table: "failure_conditions",
                column: "StageId");

            migrationBuilder.CreateIndex(
                name: "IX_objective_progress_ObjectiveId",
                table: "objective_progress",
                column: "ObjectiveId");

            migrationBuilder.CreateIndex(
                name: "IX_objective_progress_StageProgressId",
                table: "objective_progress",
                column: "StageProgressId");

            migrationBuilder.CreateIndex(
                name: "IX_quest_dependencies_DependentQuestId_PrerequisiteQuestId",
                table: "quest_dependencies",
                columns: new[] { "DependentQuestId", "PrerequisiteQuestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_quest_dependencies_PrerequisiteQuestId",
                table: "quest_dependencies",
                column: "PrerequisiteQuestId");

            migrationBuilder.CreateIndex(
                name: "IX_quest_objectives_StageId_ObjectiveNumber",
                table: "quest_objectives",
                columns: new[] { "StageId", "ObjectiveNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_quest_progress_PlayerId_QuestId",
                table: "quest_progress",
                columns: new[] { "PlayerId", "QuestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_quest_progress_PlayerId_Status",
                table: "quest_progress",
                columns: new[] { "PlayerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_quest_progress_QuestId",
                table: "quest_progress",
                column: "QuestId");

            migrationBuilder.CreateIndex(
                name: "IX_quest_rewards_QuestId",
                table: "quest_rewards",
                column: "QuestId");

            migrationBuilder.CreateIndex(
                name: "IX_quest_rewards_StageId",
                table: "quest_rewards",
                column: "StageId");

            migrationBuilder.CreateIndex(
                name: "IX_quest_stages_QuestId_StageNumber",
                table: "quest_stages",
                columns: new[] { "QuestId", "StageNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_quests_Difficulty",
                table: "quests",
                column: "Difficulty");

            migrationBuilder.CreateIndex(
                name: "IX_quests_Name",
                table: "quests",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_stage_progress_QuestProgressId",
                table: "stage_progress",
                column: "QuestProgressId");

            migrationBuilder.CreateIndex(
                name: "IX_stage_progress_StageId",
                table: "stage_progress",
                column: "StageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "failure_conditions");

            migrationBuilder.DropTable(
                name: "objective_progress");

            migrationBuilder.DropTable(
                name: "quest_dependencies");

            migrationBuilder.DropTable(
                name: "quest_rewards");

            migrationBuilder.DropTable(
                name: "quest_objectives");

            migrationBuilder.DropTable(
                name: "stage_progress");

            migrationBuilder.DropTable(
                name: "quest_progress");

            migrationBuilder.DropTable(
                name: "quest_stages");

            migrationBuilder.DropTable(
                name: "quests");
        }
    }
}
