# spec-kit-lab Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-27

## Active Technologies
- C# with ASP.NET Core 10 + ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL, Swashbuckle (002-adventure-init)
- PostgreSQL database with Entity Framework Core ORM (002-adventure-init)
- PostgreSQL database with Entity Framework Core ORM (extending existing schema) (003-character-management)
- C# / .NET 10.0 + ASP.NET Core 10.0, Entity Framework Core 10.0.2, Npgsql 10.0.0, Swashbuckle 7.2.0 (004-inventory-system)
- PostgreSQL (existing database, new tables: items, inventory_entries, equipment_slots, loot_tables, loot_table_entries) (004-inventory-system)
- C# with ASP.NET Core 10 + ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL, existing DiceService (005-combat-system)
- PostgreSQL (new tables: quests, quest_stages, quest_objectives, quest_progress, quest_rewards, quest_dependencies) (006-multi-stage-quests)
- TypeScript 5.x with React 18 (JSX/TSX syntax) + React 18, Vite, React Router v6, TanStack Query (React Query), Tailwind CSS, TypeScript, Vitest, React Testing Library (007-adventure-dashboard)
- Backend API (RESTful) - no local storage for adventure data; API URL via environment variables (007-adventure-dashboard)
- TypeScript 5.9, React 18.3, Node.js 20 LTS + React Router v6, TanStack React Query v5, Tailwind CSS v4.1 (008-char-mgmt-ui)
- Backend managed (PostgreSQL via .NET Entity Framework) (008-char-mgmt-ui)
- TypeScript 5.9 + React 18.3.1 (ES2020) + React 18, React Router 6.30, React Query 5.90, Tailwind CSS 4.1, Vite 5.4 (010-inventory-ui)
- N/A (state management via React Query, API calls to .NET backend) (010-inventory-ui)
- TypeScript 5.x, React 18.x + React, TypeScript, Tailwind CSS, React Router, Axios (HTTP client) (011-quest-tracking-ui)
- Backend (.NET/PostgreSQL), accessed via REST API (011-quest-tracking-ui)

- C# with ASP.NET Core 10 + ASP.NET Core 10 Web API, Entity Framework Core, PostgreSQL (001-dice-engine)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for C# with ASP.NET Core 10

## Code Style

C# with ASP.NET Core 10: Follow standard conventions

## Recent Changes
- 011-quest-tracking-ui: Added TypeScript 5.x, React 18.x + React, TypeScript, Tailwind CSS, React Router, Axios (HTTP client)
- 010-inventory-ui: Added TypeScript 5.9 + React 18.3.1 (ES2020) + React 18, React Router 6.30, React Query 5.90, Tailwind CSS 4.1, Vite 5.4
- 009-main-game-ui: Added TypeScript 5.9, React 18.3, Node.js 20 LTS + React Router v6, TanStack React Query v5, Tailwind CSS v4.1


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
