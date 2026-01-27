using System;
using DiceEngine.Application.Services;

namespace DiceEngine.Application.Tests.Fixtures;

public class DiceRollerFixture : IDisposable
{
    public IDiceRoller Roller { get; } = new DiceRoller();

    public void Dispose()
    {
        // No disposable resources yet; placeholder for future teardown logic.
    }
}
