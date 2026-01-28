using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DiceEngine.Infrastructure.Persistence;

/// <summary>
/// Design-time factory for DbContext to support EF Core migrations.
/// </summary>
public class DiceEngineDbContextFactory : IDesignTimeDbContextFactory<DiceEngineDbContext>
{
    public DiceEngineDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DiceEngineDbContext>();

        // Use the same connection string from appsettings.json
        optionsBuilder.UseNpgsql("Server=localhost;Port=5432;Database=dice_engine;User Id=dice_user;Password=dice_pass_secure;");

        return new DiceEngineDbContext(optionsBuilder.Options);
    }
}
