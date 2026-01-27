using DiceEngine.Application.Services;
using DiceEngine.Infrastructure.Persistence;
using DiceEngine.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Dice Rolling Engine API",
        Version = "v1",
        Description = "A high-performance dice rolling engine with cryptographically secure randomization, supporting standard RPG dice notation, complex expressions, and D&D 5e advantage/disadvantage mechanics.",
        Contact = new OpenApiContact
        {
            Name = "Dice Engine Team"
        }
    });

    // Include XML comments for better API documentation
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

builder.Services.AddScoped<IDiceService, DiceService>();
builder.Services.AddScoped<IDiceExpressionParser, DiceExpressionParser>();
builder.Services.AddScoped<IDiceRoller, DiceRoller>();

// Register Adventure services
builder.Services.AddScoped<IAdventureService, AdventureService>();
builder.Services.AddScoped<IAdventureRepository, AdventureRepository>();

builder.Services.AddDbContext<DiceEngineDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Enable Swagger UI in all environments for demonstration purposes
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Dice Engine API v1");
    options.RoutePrefix = string.Empty; // Serve Swagger UI at root
});

app.MapControllers();

app.Run();
