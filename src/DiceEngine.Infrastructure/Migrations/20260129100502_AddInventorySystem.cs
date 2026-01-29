using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiceEngine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventorySystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Rarity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ItemType = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    MaxStackSize = table.Column<int>(type: "integer", nullable: true),
                    SlotType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Modifiers = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_items", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "loot_tables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_loot_tables", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "equipment_slots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotType = table.Column<string>(type: "text", nullable: false),
                    EquippedItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    EquippedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_slots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_equipment_slots_characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_equipment_slots_items_EquippedItemId",
                        column: x => x.EquippedItemId,
                        principalTable: "items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "inventory_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AdventureId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    SlotPosition = table.Column<int>(type: "integer", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_inventory_entries_Adventures_AdventureId",
                        column: x => x.AdventureId,
                        principalTable: "Adventures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_inventory_entries_items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "loot_table_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LootTableId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Weight = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_loot_table_entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_loot_table_entries_items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_loot_table_entries_loot_tables_LootTableId",
                        column: x => x.LootTableId,
                        principalTable: "loot_tables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_equipment_slots_CharacterId",
                table: "equipment_slots",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_slots_CharacterId_SlotType",
                table: "equipment_slots",
                columns: new[] { "CharacterId", "SlotType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_equipment_slots_EquippedItemId",
                table: "equipment_slots",
                column: "EquippedItemId");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_entries_AdventureId",
                table: "inventory_entries",
                column: "AdventureId");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_entries_AdventureId_ItemId",
                table: "inventory_entries",
                columns: new[] { "AdventureId", "ItemId" });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_entries_ItemId",
                table: "inventory_entries",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_loot_table_entries_ItemId",
                table: "loot_table_entries",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_loot_table_entries_LootTableId",
                table: "loot_table_entries",
                column: "LootTableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "equipment_slots");

            migrationBuilder.DropTable(
                name: "inventory_entries");

            migrationBuilder.DropTable(
                name: "loot_table_entries");

            migrationBuilder.DropTable(
                name: "items");

            migrationBuilder.DropTable(
                name: "loot_tables");
        }
    }
}
