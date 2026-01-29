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
    }
}
