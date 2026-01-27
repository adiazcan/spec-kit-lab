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
}
