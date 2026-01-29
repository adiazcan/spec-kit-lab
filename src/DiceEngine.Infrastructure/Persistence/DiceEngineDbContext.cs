using System.Text.Json;
using DiceEngine.Domain.Entities;
using DiceEngine.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace DiceEngine.Infrastructure.Persistence;

public class DiceEngineDbContext : DbContext
{
    public DiceEngineDbContext()
    {
    }

    public DiceEngineDbContext(DbContextOptions<DiceEngineDbContext> options)
        : base(options)
    {
    }

    public DbSet<Adventure> Adventures { get; set; }
    public DbSet<Character> Characters { get; set; }
    public DbSet<CharacterSnapshot> CharacterSnapshots { get; set; }

    // Inventory System
    public DbSet<Item> Items { get; set; }
    public DbSet<StackableItem> StackableItems { get; set; }
    public DbSet<UniqueItem> UniqueItems { get; set; }
    public DbSet<InventoryEntry> InventoryEntries { get; set; }
    public DbSet<EquipmentSlot> EquipmentSlots { get; set; }
    public DbSet<LootTable> LootTables { get; set; }
    public DbSet<LootTableEntry> LootTableEntries { get; set; }

    // Combat System
    public DbSet<CombatEncounter> CombatEncounters { get; set; }
    public DbSet<Combatant> Combatants { get; set; }
    public DbSet<Enemy> Enemies { get; set; }
    public DbSet<AttackAction> AttackActions { get; set; }

    // Quest System
    public DbSet<Quest> Quests { get; set; }
    public DbSet<QuestStage> QuestStages { get; set; }
    public DbSet<QuestObjective> QuestObjectives { get; set; }
    public DbSet<QuestProgress> QuestProgresses { get; set; }
    public DbSet<StageProgress> StageProgresses { get; set; }
    public DbSet<ObjectiveProgress> ObjectiveProgresses { get; set; }
    public DbSet<QuestReward> QuestRewards { get; set; }
    public DbSet<FailureCondition> FailureConditions { get; set; }
    public DbSet<QuestDependency> QuestDependencies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Adventure entity
        modelBuilder.Entity<Adventure>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.CurrentSceneId)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(a => a.GameState)
                .HasColumnType("jsonb")
                .IsRequired();

            entity.Property(a => a.CreatedAt)
                .IsRequired();

            entity.Property(a => a.LastUpdatedAt)
                .IsRequired();

            // Indexes for common queries
            entity.HasIndex(a => a.CreatedAt).IsDescending();
            entity.HasIndex(a => a.LastUpdatedAt).IsDescending();
            entity.HasIndex(a => a.CurrentSceneId);

            // JSONB index for potential future queries on game state
            entity.HasIndex(a => a.GameState)
                .HasMethod("gin");
        });

        // Configure Character entity
        modelBuilder.Entity<Character>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.AdventureId).IsRequired();
            entity.HasOne<Adventure>()
                .WithMany()
                .HasForeignKey(e => e.AdventureId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.StrBase).IsRequired();
            entity.Property(e => e.DexBase).IsRequired();
            entity.Property(e => e.IntBase).IsRequired();
            entity.Property(e => e.ConBase).IsRequired();
            entity.Property(e => e.ChaBase).IsRequired();

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.LastModifiedAt).IsRequired();
            entity.Property(e => e.Version)
                .IsConcurrencyToken()
                .IsRequired();

            entity.HasMany(e => e.Snapshots)
                .WithOne(s => s.Character)
                .HasForeignKey(s => s.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.AdventureId);
            entity.HasIndex(e => e.CreatedAt).IsDescending();

            entity.ToTable("characters");
        });

        // Configure CharacterSnapshot entity
        modelBuilder.Entity<CharacterSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CharacterId).IsRequired();
            entity.HasOne(e => e.Character)
                .WithMany(c => c.Snapshots)
                .HasForeignKey(e => e.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Label).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.Property(e => e.StrBase).IsRequired();
            entity.Property(e => e.DexBase).IsRequired();
            entity.Property(e => e.IntBase).IsRequired();
            entity.Property(e => e.ConBase).IsRequired();
            entity.Property(e => e.ChaBase).IsRequired();

            // Modifiers stored for historical reference
            entity.Property(e => e.StrModifier).IsRequired();
            entity.Property(e => e.DexModifier).IsRequired();
            entity.Property(e => e.IntModifier).IsRequired();
            entity.Property(e => e.ConModifier).IsRequired();
            entity.Property(e => e.ChaModifier).IsRequired();

            // Indexes for efficient queries
            entity.HasIndex(e => e.CharacterId);
            entity.HasIndex(e => new { e.CharacterId, e.CreatedAt }).IsDescending(false, true);

            entity.ToTable("character_snapshots");
        });

        // ============== INVENTORY SYSTEM ENTITIES ==============

        // Configure Item entity (TPH base class)
        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.Rarity)
                .HasConversion<string>()
                .HasMaxLength(20);

            // Table-per-Hierarchy discriminator
            entity.HasDiscriminator<string>("ItemType")
                .HasValue<StackableItem>("Stackable")
                .HasValue<UniqueItem>("Unique");

            entity.ToTable("items");
        });

        // Configure StackableItem entity
        modelBuilder.Entity<StackableItem>(entity =>
        {
            entity.Property(e => e.MaxStackSize).IsRequired();
        });

        // Configure UniqueItem entity
        modelBuilder.Entity<UniqueItem>(entity =>
        {
            entity.Property(e => e.SlotType)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.Modifiers)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<StatModifier>>(v, (JsonSerializerOptions?)null)
                         ?? new List<StatModifier>());
        });

        // Configure InventoryEntry entity
        modelBuilder.Entity<InventoryEntry>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.AdventureId).IsRequired();
            entity.HasOne(e => e.Adventure)
                .WithMany()
                .HasForeignKey(e => e.AdventureId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.ItemId).IsRequired();
            entity.HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.Quantity).IsRequired();
            entity.Property(e => e.AddedAt).IsRequired();

            // Indexes for performance
            entity.HasIndex(e => e.AdventureId);
            entity.HasIndex(e => new { e.AdventureId, e.ItemId });

            entity.ToTable("inventory_entries");
        });

        // Configure EquipmentSlot entity
        modelBuilder.Entity<EquipmentSlot>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CharacterId).IsRequired();
            entity.HasOne(e => e.Character)
                .WithMany()
                .HasForeignKey(e => e.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.SlotType)
                .HasConversion<string>()
                .IsRequired();

            entity.Property(e => e.EquippedItemId);
            entity.HasOne(e => e.EquippedItem)
                .WithMany()
                .HasForeignKey(e => e.EquippedItemId)
                .OnDelete(DeleteBehavior.SetNull);

            // Unique constraint: one slot per type per character
            entity.HasIndex(e => new { e.CharacterId, e.SlotType })
                .IsUnique();

            entity.HasIndex(e => e.CharacterId);

            entity.ToTable("equipment_slots");
        });

        // Configure LootTable entity
        modelBuilder.Entity<LootTable>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.HasMany(e => e.Entries)
                .WithOne(e => e.LootTable)
                .HasForeignKey(e => e.LootTableId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable("loot_tables");
        });

        // Configure LootTableEntry entity
        modelBuilder.Entity<LootTableEntry>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.LootTableId).IsRequired();
            entity.HasOne(e => e.LootTable)
                .WithMany(t => t.Entries)
                .HasForeignKey(e => e.LootTableId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.ItemId).IsRequired();
            entity.HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.Weight).IsRequired();
            entity.Property(e => e.Quantity).IsRequired();

            // Index for loot generation queries
            entity.HasIndex(e => e.LootTableId);

            entity.ToTable("loot_table_entries");
        });

        // ============== COMBAT SYSTEM ENTITIES ==============

        // Configure Enemy entity
        modelBuilder.Entity<Enemy>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.CurrentHealth).IsRequired();
            entity.Property(e => e.MaxHealth).IsRequired();

            entity.Property(e => e.StrBase).IsRequired();
            entity.Property(e => e.DexBase).IsRequired();
            entity.Property(e => e.IntBase).IsRequired();
            entity.Property(e => e.ConBase).IsRequired();
            entity.Property(e => e.ChaBase).IsRequired();

            entity.Property(e => e.ArmorClass).IsRequired();

            entity.Property(e => e.CurrentAIState)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.FleeHealthThreshold).IsRequired();
            entity.Property(e => e.EquippedWeaponInfo).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.LastModifiedAt).IsRequired();

            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.CreatedAt).IsDescending();

            entity.ToTable("enemies");
        });

        // Configure CombatEncounter entity
        modelBuilder.Entity<CombatEncounter>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.AdventureId).IsRequired();
            entity.HasOne<Adventure>()
                .WithMany()
                .HasForeignKey(e => e.AdventureId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.CurrentRound).IsRequired();
            entity.Property(e => e.CurrentTurnIndex).IsRequired();

            entity.Property(e => e.InitiativeOrder)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null) ?? new());

            entity.Property(e => e.Winner)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.StartedAt).IsRequired();
            entity.Property(e => e.EndedAt);
            entity.Property(e => e.Version).IsConcurrencyToken();

            entity.HasMany(e => e.Combatants)
                .WithOne()
                .HasForeignKey(c => c.CombatEncounterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.CompletedActions)
                .WithOne()
                .HasForeignKey(a => a.CombatEncounterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.AdventureId);
            entity.HasIndex(e => e.Status);

            entity.ToTable("combat_encounters");
        });

        // Configure Combatant entity
        modelBuilder.Entity<Combatant>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CombatEncounterId).IsRequired();

            entity.Property(e => e.CombatantType)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.CharacterId);
            entity.Property(e => e.EnemyId);

            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CurrentHealth).IsRequired();
            entity.Property(e => e.MaxHealth).IsRequired();
            entity.Property(e => e.ArmorClass).IsRequired();

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.DexterityModifier).IsRequired();
            entity.Property(e => e.InitiativeRoll).IsRequired();
            entity.Property(e => e.InitiativeScore).IsRequired();

            entity.Property(e => e.AIState)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(e => e.TiebreakerKey).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.HasIndex(e => e.CombatEncounterId);
            entity.HasIndex(e => new { e.CombatEncounterId, e.Status });
            entity.HasIndex(e => new { e.CombatEncounterId, e.InitiativeScore }).IsDescending(false, true);

            entity.ToTable("combatants");
        });

        // Configure AttackAction entity
        modelBuilder.Entity<AttackAction>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CombatEncounterId).IsRequired();

            entity.Property(e => e.AttackerId).IsRequired();
            entity.Property(e => e.TargetId).IsRequired();
            entity.Property(e => e.AttackRoll).IsRequired();
            entity.Property(e => e.AttackModifier).IsRequired();
            entity.Property(e => e.AttackTotal).IsRequired();
            entity.Property(e => e.TargetAC).IsRequired();
            entity.Property(e => e.IsHit).IsRequired();
            entity.Property(e => e.IsCriticalHit).IsRequired();
            entity.Property(e => e.WeaponName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DamageExpression).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DamageRoll).IsRequired();
            entity.Property(e => e.DamageModifier).IsRequired();
            entity.Property(e => e.TotalDamage).IsRequired();
            entity.Property(e => e.TargetHealthAfter).IsRequired();
            entity.Property(e => e.Timestamp).IsRequired();

            entity.HasIndex(e => e.CombatEncounterId);
            entity.HasIndex(e => new { e.CombatEncounterId, e.Timestamp });

            entity.ToTable("attack_actions");
        });

        // ============== QUEST SYSTEM ENTITIES ==============

        // Configure Quest entity
        modelBuilder.Entity<Quest>(entity =>
        {
            entity.HasKey(e => e.QuestId);

            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);

            entity.Property(e => e.Difficulty)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.MaxConcurrentPlayers).IsRequired();

            entity.HasMany(e => e.Stages)
                .WithOne(s => s.Quest)
                .HasForeignKey(s => s.QuestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.Difficulty);

            entity.ToTable("quests");
        });

        // Configure QuestStage entity
        modelBuilder.Entity<QuestStage>(entity =>
        {
            entity.HasKey(e => e.StageId);

            entity.Property(e => e.QuestId).IsRequired();
            entity.Property(e => e.StageNumber).IsRequired();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);

            entity.HasOne(e => e.Quest)
                .WithMany(q => q.Stages)
                .HasForeignKey(e => e.QuestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Objectives)
                .WithOne(o => o.Stage)
                .HasForeignKey(o => o.StageId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: (QuestId, StageNumber)
            entity.HasIndex(e => new { e.QuestId, e.StageNumber }).IsUnique();

            entity.ToTable("quest_stages");
        });

        // Configure QuestObjective entity
        modelBuilder.Entity<QuestObjective>(entity =>
        {
            entity.HasKey(e => e.ObjectiveId);

            entity.Property(e => e.StageId).IsRequired();
            entity.Property(e => e.ObjectiveNumber).IsRequired();
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);

            entity.Property(e => e.ConditionType)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(e => e.TargetAmount).IsRequired();
            entity.Property(e => e.Metadata).HasColumnType("jsonb");

            entity.HasOne(e => e.Stage)
                .WithMany(s => s.Objectives)
                .HasForeignKey(e => e.StageId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: (StageId, ObjectiveNumber)
            entity.HasIndex(e => new { e.StageId, e.ObjectiveNumber }).IsUnique();

            entity.ToTable("quest_objectives");
        });

        // Configure QuestProgress entity
        modelBuilder.Entity<QuestProgress>(entity =>
        {
            entity.HasKey(e => e.QuestProgressId);

            entity.Property(e => e.PlayerId).IsRequired();
            entity.Property(e => e.QuestId).IsRequired();
            entity.Property(e => e.CurrentStageNumber).IsRequired();

            entity.Property(e => e.Status)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(e => e.AcceptedAt).IsRequired();
            entity.Property(e => e.CompletedAt);
            entity.Property(e => e.FailedAt);
            entity.Property(e => e.AbandonedAt);
            entity.Property(e => e.LastModified).IsRequired();

            entity.Property(e => e.RowVersion)
                .IsRowVersion();

            entity.HasOne(e => e.Quest)
                .WithMany()
                .HasForeignKey(e => e.QuestId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.StageProgress)
                .WithOne(s => s.QuestProgress)
                .HasForeignKey(s => s.QuestProgressId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: (PlayerId, QuestId)
            entity.HasIndex(e => new { e.PlayerId, e.QuestId }).IsUnique();
            entity.HasIndex(e => new { e.PlayerId, e.Status });
            entity.HasIndex(e => e.QuestId);

            entity.ToTable("quest_progress");
        });

        // Configure StageProgress entity
        modelBuilder.Entity<StageProgress>(entity =>
        {
            entity.HasKey(e => e.StageProgressId);

            entity.Property(e => e.QuestProgressId).IsRequired();
            entity.Property(e => e.StageId).IsRequired();
            entity.Property(e => e.StageNumber).IsRequired();
            entity.Property(e => e.IsCompleted).IsRequired();
            entity.Property(e => e.CompletedAt);

            entity.HasOne(e => e.QuestProgress)
                .WithMany(q => q.StageProgress)
                .HasForeignKey(e => e.QuestProgressId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Stage)
                .WithMany()
                .HasForeignKey(e => e.StageId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.ObjectiveProgress)
                .WithOne(o => o.StageProgress)
                .HasForeignKey(o => o.StageProgressId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.QuestProgressId);

            entity.ToTable("stage_progress");
        });

        // Configure ObjectiveProgress entity
        modelBuilder.Entity<ObjectiveProgress>(entity =>
        {
            entity.HasKey(e => e.ObjectiveProgressId);

            entity.Property(e => e.StageProgressId).IsRequired();
            entity.Property(e => e.ObjectiveId).IsRequired();
            entity.Property(e => e.CurrentProgress).IsRequired();
            entity.Property(e => e.TargetAmount).IsRequired();
            entity.Property(e => e.IsCompleted).IsRequired();

            entity.HasOne(e => e.StageProgress)
                .WithMany(s => s.ObjectiveProgress)
                .HasForeignKey(e => e.StageProgressId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Objective)
                .WithMany()
                .HasForeignKey(e => e.ObjectiveId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.StageProgressId);

            entity.ToTable("objective_progress");
        });

        // Configure QuestReward entity
        modelBuilder.Entity<QuestReward>(entity =>
        {
            entity.HasKey(e => e.RewardId);

            entity.Property(e => e.QuestId);
            entity.Property(e => e.StageId);

            entity.Property(e => e.Type)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(e => e.Amount).IsRequired();
            entity.Property(e => e.ItemId).HasMaxLength(255);

            entity.HasOne(e => e.Quest)
                .WithMany(q => q.Rewards)
                .HasForeignKey(e => e.QuestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Stage)
                .WithMany(s => s.StageRewards)
                .HasForeignKey(e => e.StageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.QuestId);
            entity.HasIndex(e => e.StageId);

            entity.ToTable("quest_rewards");
        });

        // Configure FailureCondition entity
        modelBuilder.Entity<FailureCondition>(entity =>
        {
            entity.HasKey(e => e.FailureConditionId);

            entity.Property(e => e.StageId).IsRequired();

            entity.Property(e => e.ConditionType)
                .HasConversion<int>()
                .IsRequired();

            entity.Property(e => e.Metadata).HasColumnType("jsonb");

            entity.HasOne(e => e.Stage)
                .WithMany(s => s.FailureConditions)
                .HasForeignKey(e => e.StageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.StageId);

            entity.ToTable("failure_conditions");
        });

        // Configure QuestDependency entity
        modelBuilder.Entity<QuestDependency>(entity =>
        {
            entity.HasKey(e => e.DependencyId);

            entity.Property(e => e.DependentQuestId).IsRequired();
            entity.Property(e => e.PrerequisiteQuestId).IsRequired();

            entity.Property(e => e.Type)
                .HasConversion<int>()
                .IsRequired();

            entity.HasOne(e => e.DependentQuest)
                .WithMany(q => q.Dependencies)
                .HasForeignKey(e => e.DependentQuestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.PrerequisiteQuest)
                .WithMany(q => q.DependentQuests)
                .HasForeignKey(e => e.PrerequisiteQuestId)
                .OnDelete(DeleteBehavior.Restrict);

            // Unique constraint: (DependentQuestId, PrerequisiteQuestId)
            entity.HasIndex(e => new { e.DependentQuestId, e.PrerequisiteQuestId }).IsUnique();

            entity.ToTable("quest_dependencies");
        });
    }
}
