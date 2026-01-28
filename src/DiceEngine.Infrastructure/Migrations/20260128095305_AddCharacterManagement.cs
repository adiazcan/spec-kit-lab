using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiceEngine.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCharacterManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "characters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    AdventureId = table.Column<Guid>(type: "uuid", nullable: false),
                    StrBase = table.Column<int>(type: "integer", nullable: false),
                    DexBase = table.Column<int>(type: "integer", nullable: false),
                    IntBase = table.Column<int>(type: "integer", nullable: false),
                    ConBase = table.Column<int>(type: "integer", nullable: false),
                    ChaBase = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_characters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_characters_Adventures_AdventureId",
                        column: x => x.AdventureId,
                        principalTable: "Adventures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "character_snapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CharacterId = table.Column<Guid>(type: "uuid", nullable: false),
                    Label = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StrBase = table.Column<int>(type: "integer", nullable: false),
                    DexBase = table.Column<int>(type: "integer", nullable: false),
                    IntBase = table.Column<int>(type: "integer", nullable: false),
                    ConBase = table.Column<int>(type: "integer", nullable: false),
                    ChaBase = table.Column<int>(type: "integer", nullable: false),
                    StrModifier = table.Column<int>(type: "integer", nullable: false),
                    DexModifier = table.Column<int>(type: "integer", nullable: false),
                    IntModifier = table.Column<int>(type: "integer", nullable: false),
                    ConModifier = table.Column<int>(type: "integer", nullable: false),
                    ChaModifier = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_character_snapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_character_snapshots_characters_CharacterId",
                        column: x => x.CharacterId,
                        principalTable: "characters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_character_snapshots_CharacterId",
                table: "character_snapshots",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_character_snapshots_CharacterId_CreatedAt",
                table: "character_snapshots",
                columns: new[] { "CharacterId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_characters_AdventureId",
                table: "characters",
                column: "AdventureId");

            migrationBuilder.CreateIndex(
                name: "IX_characters_CreatedAt",
                table: "characters",
                column: "CreatedAt",
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "character_snapshots");

            migrationBuilder.DropTable(
                name: "characters");
        }
    }
}
