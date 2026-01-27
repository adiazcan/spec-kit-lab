# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files
COPY DiceEngine.slnx .
COPY src/DiceEngine.API/*.csproj ./src/DiceEngine.API/
COPY src/DiceEngine.Application/*.csproj ./src/DiceEngine.Application/
COPY src/DiceEngine.Domain/*.csproj ./src/DiceEngine.Domain/
COPY src/DiceEngine.Infrastructure/*.csproj ./src/DiceEngine.Infrastructure/

# Restore dependencies
RUN dotnet restore src/DiceEngine.API/DiceEngine.API.csproj

# Copy source code
COPY src/ ./src/

# Build and publish
WORKDIR /src/src/DiceEngine.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy published app from build stage
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:8080/api/roll/stats/1d6 || exit 1

# Run the application
ENTRYPOINT ["dotnet", "DiceEngine.API.dll"]
