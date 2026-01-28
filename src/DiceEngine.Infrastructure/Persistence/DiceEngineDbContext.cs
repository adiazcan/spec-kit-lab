using DiceEngine.Domain.Entities;
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
    }
}
