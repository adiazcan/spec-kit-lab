using System;

namespace DiceEngine.API.Models;

/// <summary>
/// Response after adding an item to inventory.
/// </summary>
public class AddItemResponse
{
    public Guid EntryId { get; set; }
    public Guid ItemId { get; set; }
    public int Quantity { get; set; }
    public bool Merged { get; set; }
}
