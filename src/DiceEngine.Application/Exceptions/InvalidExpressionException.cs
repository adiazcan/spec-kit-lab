using System;

namespace DiceEngine.Application.Exceptions;

public class InvalidExpressionException : Exception
{
    public InvalidExpressionException(string message) : base(message)
    {
    }
}
