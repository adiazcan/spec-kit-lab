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
    }
}
