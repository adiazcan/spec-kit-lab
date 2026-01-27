using System;

namespace DiceEngine.API.Models;

public sealed class StandardResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public ErrorResponse? Error { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    public static StandardResponse<T> Ok(T data) => new()
    {
        Success = true,
        Data = data,
        Timestamp = DateTime.UtcNow
    };

    public static StandardResponse<T> Fail(string code, string message, object? details = null) => new()
    {
        Success = false,
        Error = new ErrorResponse
        {
            Code = code,
            Message = message,
            Details = details
        },
        Timestamp = DateTime.UtcNow
    };
}
