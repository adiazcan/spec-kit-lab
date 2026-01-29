using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiceEngine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCombatSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CharacterId1",
                table: "equipment_slots",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "combat_encounters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdventureId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CurrentRound = table.Column<int>(type: "integer", nullable: false),
                    CurrentTurnIndex = table.Column<int>(type: "integer", nullable: false),
                    InitiativeOrder = table.Column<string>(type: "jsonb", nullable: false),
                    Winner = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_combat_encounters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_combat_encounters_Adventures_AdventureId",
                        column: x => x.AdventureId,
                        principalTable: "Adventures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "enemies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CurrentHealth = table.Column<int>(type: "integer", nullable: false),
                    MaxHealth = table.Column<int>(type: "integer", nullable: false),
                    StrBase = table.Column<int>(type: "integer", nullable: false),
                    DexBase = table.Column<int>(type: "integer", nullable: false),
                    IntBase = table.Column<int>(type: "integer", nullable: false),
                    ConBase = table.Column<int>(type: "integer", nullable: false),
                    ChaBase = table.Column<int>(type: "integer", nullable: false),
                    ArmorClass = table.Column<int>(type: "integer", nullable: false),
                    CurrentAIState = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FleeHealthThreshold = table.Column<double>(type: "double precision", nullable: false),
                    EquippedWeaponInfo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_enemies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "attack_actions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CombatEncounterId = table.Column<Guid>(type: "uuid", nullable: false),
                    AttackerId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetId = table.Column<Guid>(type: "uuid", nullable: false),
                    AttackRoll = table.Column<int>(type: "integer", nullable: false),
                    AttackModifier = table.Column<int>(type: "integer", nullable: false),
                    AttackTotal = table.Column<int>(type: "integer", nullable: false),
                    TargetAC = table.Column<int>(type: "integer", nullable: false),
                    IsHit = table.Column<bool>(type: "boolean", nullable: false),
                    IsCriticalHit = table.Column<bool>(type: "boolean", nullable: false),
                    WeaponName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DamageExpression = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DamageRoll = table.Column<int>(type: "integer", nullable: false),
                    DamageModifier = table.Column<int>(type: "integer", nullable: false),
                    TotalDamage = table.Column<int>(type: "integer", nullable: false),
                    TargetHealthAfter = table.Column<int>(type: "integer", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_attack_actions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_attack_actions_combat_encounters_CombatEncounterId",
                        column: x => x.CombatEncounterId,
                        principalTable: "combat_encounters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "combatants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CombatEncounterId = table.Column<Guid>(type: "uuid", nullable: false),
                    CombatantType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CharacterId = table.Column<Guid>(type: "uuid", nullable: true),
                    EnemyId = table.Column<Guid>(type: "uuid", nullable: true),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CurrentHealth = table.Column<int>(type: "integer", nullable: false),
                    MaxHealth = table.Column<int>(type: "integer", nullable: false),
                    ArmorClass = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DexterityModifier = table.Column<int>(type: "integer", nullable: false),
                    InitiativeRoll = table.Column<int>(type: "integer", nullable: false),
                    InitiativeScore = table.Column<int>(type: "integer", nullable: false),
                    TiebreakerKey = table.Column<Guid>(type: "uuid", nullable: false),
                    EquippedWeaponId = table.Column<Guid>(type: "uuid", nullable: true),
                    AIState = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_combatants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_combatants_combat_encounters_CombatEncounterId",
                        column: x => x.CombatEncounterId,
                        principalTable: "combat_encounters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_equipment_slots_CharacterId1",
                table: "equipment_slots",
                column: "CharacterId1");

            migrationBuilder.CreateIndex(
                name: "IX_attack_actions_CombatEncounterId",
                table: "attack_actions",
                column: "CombatEncounterId");

            migrationBuilder.CreateIndex(
                name: "IX_attack_actions_CombatEncounterId_Timestamp",
                table: "attack_actions",
                columns: new[] { "CombatEncounterId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_combat_encounters_AdventureId",
                table: "combat_encounters",
                column: "AdventureId");

            migrationBuilder.CreateIndex(
                name: "IX_combat_encounters_Status",
                table: "combat_encounters",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_combatants_CombatEncounterId",
                table: "combatants",
                column: "CombatEncounterId");

            migrationBuilder.CreateIndex(
                name: "IX_combatants_CombatEncounterId_InitiativeScore",
                table: "combatants",
                columns: new[] { "CombatEncounterId", "InitiativeScore" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_combatants_CombatEncounterId_Status",
                table: "combatants",
                columns: new[] { "CombatEncounterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_enemies_CreatedAt",
                table: "enemies",
                column: "CreatedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_enemies_Name",
                table: "enemies",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_equipment_slots_characters_CharacterId1",
                table: "equipment_slots",
                column: "CharacterId1",
                principalTable: "characters",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_equipment_slots_characters_CharacterId1",
                table: "equipment_slots");

            migrationBuilder.DropTable(
                name: "attack_actions");

            migrationBuilder.DropTable(
                name: "combatants");

            migrationBuilder.DropTable(
                name: "enemies");

            migrationBuilder.DropTable(
                name: "combat_encounters");

            migrationBuilder.DropIndex(
                name: "IX_equipment_slots_CharacterId1",
                table: "equipment_slots");

            migrationBuilder.DropColumn(
                name: "CharacterId1",
                table: "equipment_slots");
        }
    }
}
