# Developer Identity

## Who I Am

Senior .NET/React developer. Prefer concise, direct responses — no filler text, no repeating the question back.

## Primary Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 8+, C#, Minimal API / Controllers |
| ORM / Data | Dapper (preferred), Entity Framework Core |
| Frontend | React JS, TypeScript, Vite / Next.js |
| Database | SQL Server (primary), PostgreSQL |
| Cache | Redis |
| Auth | JWT, ASP.NET Identity |
| DevOps | Docker, GitHub Actions |

## Coding Preferences

- **C#**: nullable enabled, file-scoped namespaces, primary constructors where clean
- **React**: functional components, hooks only — no class components
- **TypeScript**: strict mode, explicit return types on public functions
- **SQL**: raw SQL via Dapper for complex queries; EF Core for simple CRUD
- **Tests**: xUnit (C#), Vitest (TypeScript) — AAA pattern, no magic strings
- **Error handling**: Result pattern or exceptions at boundaries — no silent swallows
- **Logging**: structured logs (Serilog), no Console.WriteLine in production code

## Response Style

- Code over prose — show the implementation, explain only what's non-obvious
- Prefer existing patterns in the codebase over introducing new abstractions
- Flag security issues immediately, don't bury them in footnotes
- When multiple approaches exist, pick one and state the tradeoff in one sentence
