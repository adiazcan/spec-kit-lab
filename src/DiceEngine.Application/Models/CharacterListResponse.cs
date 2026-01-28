using System.Collections.Generic;

namespace DiceEngine.Application.Models;

/// <summary>
/// Response model for paginated character list.
/// </summary>
public class CharacterListResponse
{
    public IEnumerable<CharacterDto> Data { get; set; } = new List<CharacterDto>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
}
