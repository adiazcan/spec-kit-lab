using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence;

/// <summary>
/// Provides seed data for the inventory system.
/// Call SeedData.Initialize(context) to seed the database with sample items and loot tables.
/// </summary>
public static class SeedData
{
    // Fixed GUIDs for seed data to ensure idempotency
    private static readonly Guid HealingPotionId = new("11111111-0001-0001-0001-000000000001");
    private static readonly Guid GoldCoinsId = new("11111111-0001-0001-0001-000000000002");
    private static readonly Guid ArrowsId = new("11111111-0001-0001-0001-000000000003");
    private static readonly Guid ManaElixirId = new("11111111-0001-0001-0001-000000000004");
    
    private static readonly Guid IronLongswordId = new("22222222-0002-0002-0002-000000000001");
    private static readonly Guid IronBreastplateId = new("22222222-0002-0002-0002-000000000002");
    private static readonly Guid WoodenShieldId = new("22222222-0002-0002-0002-000000000003");
    private static readonly Guid LeatherBootsId = new("22222222-0002-0002-0002-000000000004");
    private static readonly Guid IronHelmId = new("22222222-0002-0002-0002-000000000005");
    private static readonly Guid RustyDaggerId = new("22222222-0002-0002-0002-000000000006");
    private static readonly Guid AmuletOfWisdomId = new("22222222-0002-0002-0002-000000000007");
    private static readonly Guid RingOfStrengthId = new("22222222-0002-0002-0002-000000000008");
    
    private static readonly Guid GoblinLootTableId = new("33333333-0003-0003-0003-000000000001");
    private static readonly Guid TreasureChestTableId = new("33333333-0003-0003-0003-000000000002");
    private static readonly Guid CommonDropsTableId = new("33333333-0003-0003-0003-000000000003");

    /// <summary>
    /// Initializes the database with sample inventory items and loot tables.
    /// This method is idempotent - running it multiple times won't create duplicates.
    /// </summary>
    public static async Task InitializeAsync(DiceEngineDbContext context)
    {
        // Check if we've already seeded
        if (await context.Items.AnyAsync(i => i.Id == HealingPotionId))
        {
            return; // Already seeded
        }

        // ============== SEED STACKABLE ITEMS ==============
        var stackableItems = CreateStackableItems();
        await context.StackableItems.AddRangeAsync(stackableItems);

        // ============== SEED UNIQUE ITEMS ==============
        var uniqueItems = CreateUniqueItems();
        await context.UniqueItems.AddRangeAsync(uniqueItems);

        await context.SaveChangesAsync();

        // ============== SEED LOOT TABLES ==============
        // Loot tables must be created after items are saved since entries reference items
        var lootTables = CreateLootTables();
        await context.LootTables.AddRangeAsync(lootTables);

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Creates sample stackable items for seeding.
    /// </summary>
    public static List<StackableItem> CreateStackableItems()
    {
        return
        [
            // Healing Potion - Common consumable
            StackableItem.Create(
                HealingPotionId,
                "Healing Potion",
                "A small vial of red liquid that restores health when consumed.",
                ItemRarity.Common,
                10),

            // Gold Coins - Currency
            StackableItem.Create(
                GoldCoinsId,
                "Gold Coins",
                "Shiny golden coins, the standard currency of the realm.",
                ItemRarity.Common,
                9999),

            // Arrows - Ammunition
            StackableItem.Create(
                ArrowsId,
                "Arrows",
                "Wooden arrows with iron tips, used with bows.",
                ItemRarity.Common,
                50),

            // Mana Elixir - Uncommon consumable
            StackableItem.Create(
                ManaElixirId,
                "Mana Elixir",
                "A blue shimmering potion that restores magical energy.",
                ItemRarity.Uncommon,
                10)
        ];
    }

    /// <summary>
    /// Creates sample unique items (equipment) for seeding.
    /// </summary>
    public static List<UniqueItem> CreateUniqueItems()
    {
        return
        [
            // Iron Longsword - MainHand weapon
            UniqueItem.Create(
                IronLongswordId,
                "Iron Longsword",
                "A sturdy iron sword with a double-edged blade.",
                ItemRarity.Common,
                SlotType.MainHand,
                [new StatModifier("Strength", 2), new StatModifier("Attack", 5)]),

            // Iron Breastplate - Chest armor
            UniqueItem.Create(
                IronBreastplateId,
                "Iron Breastplate",
                "A heavy iron chest piece that provides solid protection.",
                ItemRarity.Common,
                SlotType.Chest,
                [new StatModifier("Constitution", 3), new StatModifier("Defense", 8)]),

            // Wooden Shield - OffHand
            UniqueItem.Create(
                WoodenShieldId,
                "Wooden Shield",
                "A simple but effective wooden shield bound with iron bands.",
                ItemRarity.Common,
                SlotType.OffHand,
                [new StatModifier("Defense", 3)]),

            // Leather Boots - Feet
            UniqueItem.Create(
                LeatherBootsId,
                "Leather Boots",
                "Comfortable leather boots that allow quick movement.",
                ItemRarity.Common,
                SlotType.Feet,
                [new StatModifier("Dexterity", 1), new StatModifier("Speed", 2)]),

            // Iron Helm - Head
            UniqueItem.Create(
                IronHelmId,
                "Iron Helm",
                "A sturdy iron helmet that protects the head.",
                ItemRarity.Uncommon,
                SlotType.Head,
                [new StatModifier("Constitution", 1), new StatModifier("Defense", 2)]),

            // Rusty Dagger - MainHand (low tier)
            UniqueItem.Create(
                RustyDaggerId,
                "Rusty Dagger",
                "A small dagger with a rusted blade. Better than nothing.",
                ItemRarity.Common,
                SlotType.MainHand,
                [new StatModifier("Attack", 2)]),

            // Amulet of Wisdom - Accessory
            UniqueItem.Create(
                AmuletOfWisdomId,
                "Amulet of Wisdom",
                "A golden amulet that enhances the wearer's intellect.",
                ItemRarity.Rare,
                SlotType.Accessory,
                [new StatModifier("Intelligence", 3), new StatModifier("MagicPower", 5)]),

            // Ring of Strength - Accessory
            UniqueItem.Create(
                RingOfStrengthId,
                "Ring of Strength",
                "An enchanted ring that grants the wearer greater physical power.",
                ItemRarity.Rare,
                SlotType.Accessory,
                [new StatModifier("Strength", 4)])
        ];
    }

    /// <summary>
    /// Creates sample loot tables for seeding.
    /// </summary>
    public static List<LootTable> CreateLootTables()
    {
        // Goblin Loot - 60% Gold, 30% Potion, 10% Dagger
        var goblinLoot = LootTable.Create(GoblinLootTableId, "Goblin Loot", "Common drops from defeating goblins.");
        goblinLoot.AddEntry(LootTableEntry.Create(GoblinLootTableId, GoldCoinsId, 60, 10)); // 10 gold coins
        goblinLoot.AddEntry(LootTableEntry.Create(GoblinLootTableId, HealingPotionId, 30, 1));
        goblinLoot.AddEntry(LootTableEntry.Create(GoblinLootTableId, RustyDaggerId, 10, 1));

        // Treasure Chest - Higher quality loot with multiple valuable items
        var treasureChest = LootTable.Create(TreasureChestTableId, "Treasure Chest", "A locked treasure chest containing valuable equipment and gold.");
        treasureChest.AddEntry(LootTableEntry.Create(TreasureChestTableId, GoldCoinsId, 30, 50)); // 50 gold coins
        treasureChest.AddEntry(LootTableEntry.Create(TreasureChestTableId, IronLongswordId, 20, 1));
        treasureChest.AddEntry(LootTableEntry.Create(TreasureChestTableId, IronBreastplateId, 15, 1));
        treasureChest.AddEntry(LootTableEntry.Create(TreasureChestTableId, AmuletOfWisdomId, 10, 1));
        treasureChest.AddEntry(LootTableEntry.Create(TreasureChestTableId, HealingPotionId, 25, 3)); // 3 potions

        // Common Drops - Basic adventuring finds
        var commonDrops = LootTable.Create(CommonDropsTableId, "Common Drops", "Basic items found while exploring.");
        commonDrops.AddEntry(LootTableEntry.Create(CommonDropsTableId, GoldCoinsId, 50, 5)); // 5 gold coins
        commonDrops.AddEntry(LootTableEntry.Create(CommonDropsTableId, ArrowsId, 30, 10)); // 10 arrows
        commonDrops.AddEntry(LootTableEntry.Create(CommonDropsTableId, HealingPotionId, 20, 1));

        return [goblinLoot, treasureChest, commonDrops];
    }

    /// <summary>
    /// Gets the predefined item IDs for use in tests or other seeding scenarios.
    /// </summary>
    public static class ItemIds
    {
        public static Guid HealingPotion => HealingPotionId;
        public static Guid GoldCoins => GoldCoinsId;
        public static Guid Arrows => ArrowsId;
        public static Guid ManaElixir => ManaElixirId;
        public static Guid IronLongsword => IronLongswordId;
        public static Guid IronBreastplate => IronBreastplateId;
        public static Guid WoodenShield => WoodenShieldId;
        public static Guid LeatherBoots => LeatherBootsId;
        public static Guid IronHelm => IronHelmId;
        public static Guid RustyDagger => RustyDaggerId;
        public static Guid AmuletOfWisdom => AmuletOfWisdomId;
        public static Guid RingOfStrength => RingOfStrengthId;
    }

    /// <summary>
    /// Gets the predefined loot table IDs for use in tests or other seeding scenarios.
    /// </summary>
    public static class LootTableIds
    {
        public static Guid GoblinLoot => GoblinLootTableId;
        public static Guid TreasureChest => TreasureChestTableId;
        public static Guid CommonDrops => CommonDropsTableId;
    }
}
