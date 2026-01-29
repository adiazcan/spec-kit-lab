using System;
using System.Collections.Generic;
using System.Linq;

namespace DiceEngine.Domain.Entities;

/// <summary>
/// Represents a loot table containing weighted entries for random item generation.
/// </summary>
public class LootTable
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public ICollection<LootTableEntry> Entries { get; private set; } = new List<LootTableEntry>();

    private LootTable() { } // EF Core constructor

    /// <summary>
    /// Factory method for creating a new loot table.
    /// </summary>
    public static LootTable Create(string name, string? description = null)
    {
        return Create(Guid.NewGuid(), name, description);
    }

    /// <summary>
    /// Factory method for creating a loot table with a specific ID (for seeding).
    /// </summary>
    public static LootTable Create(Guid id, string name, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required", nameof(name));
        if (name.Length > 100)
            throw new ArgumentException("Name cannot exceed 100 characters", nameof(name));

        return new LootTable
        {
            Id = id,
            Name = name.Trim(),
            Description = description?.Trim() ?? string.Empty
        };
    }

    /// <summary>
    /// Adds an entry to the loot table.
    /// </summary>
    public void AddEntry(LootTableEntry entry)
    {
        if (entry.Weight <= 0)
            throw new ArgumentException("Entry weight must be positive", nameof(entry));

        Entries.Add(entry);
    }

    /// <summary>
    /// Gets the total weight of all entries in this table.
    /// </summary>
    public int GetTotalWeight()
    {
        return Entries.Sum(e => e.Weight);
    }
}
