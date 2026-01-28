using System.Collections.Generic;

namespace DiceEngine.Application.Models;

/// <summary>
/// Response model for paginated snapshot list.
/// </summary>
public class SnapshotListResponse
{
    public IEnumerable<CharacterSnapshotDto> Data { get; set; } = new List<CharacterSnapshotDto>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
}
