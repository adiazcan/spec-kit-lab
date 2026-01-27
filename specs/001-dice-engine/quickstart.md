# Quickstart: Dice Rolling Engine

**Version**: 1.0.0  
**Updated**: 2026-01-27  
**API**: ASP.NET Core 10 Web API on .NET 10

---

## 5-Minute Setup

### Prerequisites

- .NET 10 SDK installed
- Git
- Bash or PowerShell terminal
- (Optional) Docker for PostgreSQL

### Clone and Build

```bash
# Navigate to repository root
cd /workspaces/spec-kit-lab  # Or your repository location

# Verify .NET installation
dotnet --version  # Should show 10.x.x

# Restore dependencies
dotnet restore

# Build the solution
dotnet build

# Run tests (76+ tests should pass)
dotnet test
```

---

## Running the API

### Quick Start (No Database Required)

The API runs without database setup for basic rolling functionality:

```bash
# From repository root
dotnet run --project src/DiceEngine.API

# API available at:
# - http://localhost:5000 (Swagger UI at root)
# - Swagger JSON: http://localhost:5000/swagger/v1/swagger.json
```

### With PostgreSQL (Optional - for future roll history)

```bash
# Create docker-compose.yaml (in repository root)
cat > docker-compose.yaml <<'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: dice-engine-db
    environment:
      POSTGRES_USER: dice_user
      POSTGRES_PASSWORD: dice_pass_secure
      POSTGRES_DB: dice_engine
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start PostgreSQL
docker-compose up -d

# Verify connectivity
docker exec -it dice-engine-db psql -U dice_user -d dice_engine -c "SELECT 1"
```

Update connection string in `src/DiceEngine.API/appsettings.json` if using PostgreSQL.

---

## First Roll: cURL Examples

### Basic Roll (2d6)

```bash
curl -X POST http://localhost:5000/api/roll \
  -H "Content-Type: application/json" \
  -d '{"expression":"2d6"}'
```

**Response** (example):

```json
{
  "success": true,
  "data": {
    "expression": "2d6",
    "individualRolls": [3, 5],
    "rollsByGroup": {
      "2d6": [3, 5]
    },
    "subtotalsByGroup": {
      "2d6": 8
    },
    "totalModifier": 0,
    "finalTotal": 8,
    "isAdvantage": false,
    "isDisadvantage": false,
    "advantageRollResults": null,
    "timestamp": "2026-01-27T10:30:00Z",
    "metadata": {
      "executionTimeMs": 0.45,
      "rngAlgorithm": "RNGCryptoServiceProvider",
      "isCached": false
    }
  },
  "error": null,
  "timestamp": "2026-01-27T10:30:00Z"
}
```

### Complex Expression (2d6+1d4+3)

```bash
curl -X POST http://localhost:5000/api/roll \
  -H "Content-Type: application/json" \
  -d '{"expression":"2d6+1d4+3"}'
```

**Response** (example):

```json
{
  "success": true,
  "data": {
    "expression": "2d6+1d4+3",
    "individualRolls": [3, 5, 2],
    "rollsByGroup": {
      "2d6": [3, 5],
      "1d4": [2]
    },
    "subtotalsByGroup": {
      "2d6": 8,
      "1d4": 2
    },
    "totalModifier": 3,
    "finalTotal": 13,
    "isAdvantage": false,
    "isDisadvantage": false,
    "advantageRollResults": null,
    "timestamp": "2026-01-27T10:30:00Z",
    "metadata": {
      "executionTimeMs": 0.52,
      "rngAlgorithm": "RNGCryptoServiceProvider",
      "isCached": false
    }
  },
  "error": null,
  "timestamp": "2026-01-27T10:30:00Z"
}
```

### Advantage Roll (1d20a)

```bash
curl -X POST http://localhost:5000/api/roll \
  -H "Content-Type: application/json" \
  -d '{"expression":"1d20a"}'
```

**Response** (example):

```json
{
  "success": true,
  "data": {
    "expression": "1d20a",
    "individualRolls": [18],
    "rollsByGroup": {
      "1d20": [18]
    },
    "subtotalsByGroup": {
      "1d20": 18
    },
    "totalModifier": 0,
    "finalTotal": 18,
    "isAdvantage": true,
    "isDisadvantage": false,
    "advantageRollResults": [
      {
        "expression": "1d20 (advantage roll 1)",
        "individualRolls": [14],
        "finalTotal": 14,
        "timestamp": "2026-01-27T10:30:00.123Z",
        "metadata": {
          "executionTimeMs": 0.23,
          "rngAlgorithm": "RNGCryptoServiceProvider",
          "isCached": false
        }
      },
      {
        "expression": "1d20 (advantage roll 2)",
        "individualRolls": [18],
        "finalTotal": 18,
        "timestamp": "2026-01-27T10:30:00.124Z",
        "metadata": {
          "executionTimeMs": 0.25,
          "rngAlgorithm": "RNGCryptoServiceProvider",
          "isCached": false
        }
      }
    ],
    "timestamp": "2026-01-27T10:30:00Z",
    "metadata": {
      "executionTimeMs": 0.65,
      "rngAlgorithm": "RNGCryptoServiceProvider",
      "isCached": false
    }
  },
  "error": null,
  "timestamp": "2026-01-27T10:30:00Z"
}
```

### Invalid Expression (2x6)

```bash
curl -X POST http://localhost:5000/api/roll \
  -H "Content-Type: application/json" \
  -d '{"expression":"2x6"}'
```

**Response**:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_EXPRESSION",
    "message": "Expression '2x6' is invalid. Expected format: NdS±M (e.g., 2d6, 1d20+5)",
    "details": {
      "position": 1,
      "expected": "digit",
      "actual": "x"
    }
  },
  "timestamp": "2026-01-27T10:30:00Z"
}
```

### Validate Expression (without rolling)

```bash
curl -X POST http://localhost:5000/api/roll/validate \
  -H "Content-Type: application/json" \
  -d '{"expression":"2d6+1d4+3"}'
```

**Response**:

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "originalExpression": "2d6+1d4+3",
    "parsedComponents": {
      "diceRolls": [
        { "numberOfDice": 2, "sidesPerDie": 6, "modifier": 0 },
        { "numberOfDice": 1, "sidesPerDie": 4, "modifier": 0 }
      ],
      "globalModifier": 3,
      "hasAdvantage": false,
      "hasDisadvantage": false
    },
    "expectedMinimum": 5,
    "expectedMaximum": 19,
    "message": null
  },
  "error": null,
  "timestamp": "2026-01-27T10:30:00Z"
}
```

### Get Statistics (2d6+5)

```bash
curl -X GET "http://localhost:5000/api/roll/stats/2d6%2B5"
```

**Response**:

```json
{
  "success": true,
  "data": {
    "expression": "2d6+5",
    "minimum": 7,
    "maximum": 17,
    "mean": 12.0,
    "standardDeviation": 2.415,
    "mode": 12,
    "median": 12
  },
  "error": null,
  "timestamp": "2026-01-27T10:30:00Z"
}
```

---

## Running Tests

```bash
# Run all tests
dotnet test

# Run specific test class
dotnet test --filter "ClassName=DiceExpressionParserTests"

# Run with coverage (requires coverlet.collector package)
dotnet add tests/DiceEngine.Application.Tests/DiceEngine.Application.Tests.csproj package coverlet.collector
dotnet test /p:CollectCoverage=true /p:CoverageFormat=json

# View coverage report
# Coverage JSON output to: tests/DiceEngine.Application.Tests/coverage.json
```

### Expected Test Coverage

- **DiceService**: >90% (core rolling logic)
- **DiceExpressionParser**: >90% (regex + validation)
- **DiceRoller**: >90% (RNG + statistics)
- **Overall**: >90%

---

## API Documentation

### OpenAPI (Swagger) Documentation

Generated from [contracts/openapi.yaml](./contracts/openapi.yaml).

**View API documentation** (when API is running):

```
http://localhost:5000/swagger
```

### Manual API Exploration

```bash
# GET available operations
curl http://localhost:5000/api

# POST a roll
curl -X POST http://localhost:5000/api/roll \
  -H "Content-Type: application/json" \
  -d '{"expression":"2d6"}'

# Validate without rolling
curl -X POST http://localhost:5000/api/roll/validate \
  -H "Content-Type: application/json" \
  -d '{"expression":"2d6"}'

# Get statistics
curl http://localhost:5000/api/roll/stats/2d6
```

---

## Performance Validation

### Expected Performance

| Operation                      | Target | Expected |
| ------------------------------ | ------ | -------- |
| Basic roll (e.g., 2d6)         | <50ms  | <1ms     |
| Complex expression (5+ groups) | <50ms  | <2ms     |
| Advantage roll (double)        | <50ms  | <2ms     |
| Validation (no roll)           | <30ms  | <0.5ms   |
| Statistics calculation         | <30ms  | <0.25ms  |

### Verify Performance

```bash
# Create a performance test script (perf.sh)
cat > perf.sh <<'EOF'
#!/bin/bash
for i in {1..100}; do
  time curl -s -X POST http://localhost:5000/api/roll \
    -H "Content-Type: application/json" \
    -d '{"expression":"2d6+1d4+3"}' > /dev/null
done
EOF

chmod +x perf.sh
./perf.sh
# Monitor curl execution times
```

---

## Common Issues

### PostgreSQL Connection Failed

```
System.EntryPointNotFoundException: The entry point "PQgetCopyData" was not found
```

**Solution**: Ensure PostgreSQL is running and connection string is correct.

```bash
# Check PostgreSQL
docker ps | grep postgres

# Verify connection
psql -h localhost -U dice_user -d dice_engine -c "SELECT 1"
```

### .NET SDK Not Found

```
No .NET SDKs found in /opt/dotnet
```

**Solution**: Install .NET 10 SDK.

```bash
# macOS
brew install dotnet

# Linux
curl -s https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0

# Windows
# Download from https://dotnet.microsoft.com/download
```

### Port 5000 Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
dotnet run --project src/DiceEngine.API -- --urls="http://localhost:5001"
```

---

## Next Steps

1. **Implement Core Services** (Phase 2)
   - DiceExpressionParser (regex-based)
   - DiceRoller (crypto-secure RNG)
   - DiceService (orchestration)

2. **Implement API Endpoints** (Phase 2)
   - POST /api/roll
   - POST /api/roll/validate
   - GET /api/roll/stats/{expression}

3. **Add Comprehensive Tests** (Phase 2)
   - Unit tests for all services
   - Integration tests for API endpoints
   - Performance tests for <50ms SLA

4. **Enable Swagger UI** (Phase 2)
   - Install Swashbuckle.AspNetCore NuGet package
   - Configure OpenAPI generation from code
   - Validate against [contracts/openapi.yaml](./contracts/openapi.yaml)

5. **Deployment** (Phase 3+)
   - Docker containerization
   - Kubernetes deployment manifests
   - CI/CD pipeline (GitHub Actions)
   - Production PostgreSQL setup

---

## Additional Resources

- **Specification**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contract**: [contracts/openapi.yaml](./contracts/openapi.yaml)
- **Research**: [research.md](./research.md)

- **Official Docs**:
  - [ASP.NET Core 10 Docs](https://learn.microsoft.com/en-us/aspnet/core/?view=aspnetcore-10.0)
  - [Entity Framework Core Docs](https://learn.microsoft.com/en-us/ef/core/)
  - [xUnit.net Docs](https://xunit.net/docs)
  - [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## Support

- **Issues**: File in project issue tracker
- **Questions**: Raise discussion in project repo
- **Security**: Contact maintainers privately

---

**Prepared by**: GitHub Copilot  
**Date**: 2026-01-27  
**Version**: 1.0.0-alpha
