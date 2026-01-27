using System.Security.Cryptography;

namespace DiceEngine.Application.Tests.Helpers;

public static class RngMockHelper
{
    public static RandomNumberGenerator CreateDefault()
    {
        // Placeholder helper to be expanded with deterministic behavior for tests.
        return RandomNumberGenerator.Create();
    }
}
