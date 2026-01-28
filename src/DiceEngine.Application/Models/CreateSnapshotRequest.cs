using System.ComponentModel.DataAnnotations;

namespace DiceEngine.Application.Models;

/// <summary>
/// Request model for creating a character snapshot.
/// </summary>
public class CreateSnapshotRequest
{
    [StringLength(255)]
    public string? Label { get; set; }
}
