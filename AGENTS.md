# Everything Claude Code (ECC) — Agent Instructions

This is a **production-ready AI coding plugin** providing 29 specialized agents, 94 skills, 50 commands, and automated hook workflows for software development.

**Version:** 2.0.0-rc.1

## Core Principles

1. **Agent-First** — Delegate to specialized agents for domain tasks
2. **Test-Driven** — Write tests before implementation, 80%+ coverage required
3. **Security-First** — Never compromise on security; validate all inputs
4. **Immutability** — Always create new objects, never mutate existing ones
5. **Plan Before Execute** — Plan complex features before writing code

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Expert planning for complex features and refactoring | Complex features, refactoring, architectural changes |
| architect | System design, scalability, and technical decision-making | Architectural decisions, new features planning |
| tdd-guide | Test-driven development, 80%+ coverage enforcement | New features, bug fixes |
| code-reviewer | Code quality and maintainability review | After writing/modifying code (MUST BE USED) |
| security-reviewer | Vulnerability detection — secrets, SSRF, injection, OWASP Top 10 | Before commits, sensitive code, user input handling |
| build-error-resolver | Build and TypeScript error resolution, minimal diffs | When build fails or type errors occur |
| e2e-runner | End-to-end testing with Playwright/Vercel Agent Browser | Critical user flows, E2E test maintenance |
| refactor-cleaner | Dead code cleanup using knip, depcheck, ts-prune | Code maintenance, removing duplicates |
| doc-updater | Documentation and codemaps sync | Updating docs, codemaps, READMEs |
| docs-lookup | Documentation lookup via Context7 MCP | API/docs questions, library usage |
| database-reviewer | PostgreSQL/Supabase — queries, schema design, performance | Writing SQL, migrations, schema design |
| loop-operator | Operate autonomous loops, monitor and intervene safely | Autonomous loops, monitoring stalls |
| harness-optimizer | Agent harness config tuning for reliability, cost, throughput | Harness config reliability and cost |
| typescript-reviewer | TypeScript/JavaScript code review — type safety, async, security | TypeScript/JavaScript projects (MUST BE USED) |
| csharp-reviewer | C# code review — .NET conventions, async, security, nullable | C# projects (MUST BE USED) |
| a11y-architect | Accessibility Architect, WCAG 2.2 compliance for Web and Native | Designing UI components, design systems, accessibility audits |
| chief-of-staff | Communication triage — email, Slack, LINE, Messenger; draft replies | Multi-channel communication workflows |
| code-architect | Feature architecture blueprints — files, interfaces, data flow, build order | Designing new features within existing codebase |
| code-explorer | Codebase analysis — execution paths, architecture layers, dependencies | Understanding existing features before new development |
| code-simplifier | Code simplification for clarity and maintainability, preserving behavior | Recently modified code cleanup |
| comment-analyzer | Code comment accuracy, completeness, and comment rot detection | Code comment review and maintenance |
| conversation-analyzer | Analyze conversation transcripts to find hook-worthy behaviors | Triggered by /hookify without arguments |
| opensource-forker | Fork projects for open-sourcing — strip secrets, replace internal refs | First stage of opensource-pipeline |
| opensource-packager | Generate OSS packaging — CLAUDE.md, setup.sh, README, LICENSE, templates | Third stage of opensource-pipeline |
| opensource-sanitizer | Verify OSS fork is clean — 20+ regex patterns, PASS/FAIL report | Second stage of opensource-pipeline, before public release |
| performance-optimizer | Performance bottlenecks, bundle size, memory leaks, render optimization | Slow code, profiling, algorithmic improvements |
| pr-test-analyzer | PR test coverage quality and completeness | Pull request reviews |
| silent-failure-hunter | Detect silent failures, swallowed errors, bad fallbacks | Code quality review |
| type-design-analyzer | Type design — encapsulation, invariants, usefulness, enforcement | TypeScript/type system design review |

## Agent Orchestration

Use agents proactively without user prompt:
- Complex feature requests → **planner**
- Code just written/modified → **code-reviewer**
- Bug fix or new feature → **tdd-guide**
- Architectural decision → **architect**
- Security-sensitive code → **security-reviewer**
- Autonomous loops / loop monitoring → **loop-operator**
- Harness config reliability and cost → **harness-optimizer**
- UI/accessibility work → **a11y-architect**
- OSS release preparation → **opensource-forker** → **opensource-sanitizer** → **opensource-packager**
- Performance issues → **performance-optimizer**
- Hook behavior patterns → **conversation-analyzer**
- Feature architecture design → **code-architect**
- Codebase exploration before new work → **code-explorer**
- TypeScript/JavaScript changes → **typescript-reviewer**
- C# changes → **csharp-reviewer**

Use parallel execution for independent operations — launch multiple agents simultaneously.

## Security Guidelines

**Before ANY commit:**
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on all endpoints
- Error messages don't leak sensitive data

**Secret management:** NEVER hardcode secrets. Use environment variables or a secret manager. Validate required secrets at startup. Rotate any exposed secrets immediately.

**If security issue found:** STOP → use security-reviewer agent → fix CRITICAL issues → rotate exposed secrets → review codebase for similar issues.

## Coding Style

**Immutability (CRITICAL):** Always create new objects, never mutate. Return new copies with changes applied.

**File organization:** Many small files over few large ones. 200-400 lines typical, 800 max. Organize by feature/domain, not by type. High cohesion, low coupling.

**Error handling:** Handle errors at every level. Provide user-friendly messages in UI code. Log detailed context server-side. Never silently swallow errors.

**Input validation:** Validate all user input at system boundaries. Use schema-based validation. Fail fast with clear messages. Never trust external data.

**Code quality checklist:**
- Functions small (<50 lines), files focused (<800 lines)
- No deep nesting (>4 levels)
- Proper error handling, no hardcoded values
- Readable, well-named identifiers

## Testing Requirements

**Minimum coverage: 80%**

Test types (all required):
1. **Unit tests** — Individual functions, utilities, components
2. **Integration tests** — API endpoints, database operations
3. **E2E tests** — Critical user flows

**TDD workflow (mandatory):**
1. Write test first (RED) — test should FAIL
2. Write minimal implementation (GREEN) — test should PASS
3. Refactor (IMPROVE) — verify coverage 80%+

Troubleshoot failures: check test isolation → verify mocks → fix implementation (not tests, unless tests are wrong).

## Development Workflow

1. **Plan** — Use planner agent, identify dependencies and risks, break into phases
2. **TDD** — Use tdd-guide agent, write tests first, implement, refactor
3. **Review** — Use code-reviewer agent immediately, address CRITICAL/HIGH issues
4. **Capture knowledge in the right place**
   - Personal debugging notes, preferences, and temporary context → auto memory
   - Team/project knowledge (architecture decisions, API changes, runbooks) → the project's existing docs structure
   - If the current task already produces the relevant docs or code comments, do not duplicate the same information elsewhere
   - If there is no obvious project doc location, ask before creating a new top-level file
5. **Commit** — Conventional commits format, comprehensive PR summaries

## Workflow Surface Policy

- `skills/` is the canonical workflow surface.
- New workflow contributions should land in `skills/` first.
- `commands/` is a legacy slash-entry compatibility surface and should only be added or updated when a shim is still required for migration or cross-harness parity.

## Git Workflow

**Commit format:** `<type>: <description>` — Types: feat, fix, refactor, docs, test, chore, perf, ci

**PR workflow:** Analyze full commit history → draft comprehensive summary → include test plan → push with `-u` flag.

## Architecture Patterns

**API response format:** Consistent envelope with success indicator, data payload, error message, and pagination metadata.

**Repository pattern:** Encapsulate data access behind standard interface (findAll, findById, create, update, delete). Business logic depends on abstract interface, not storage mechanism.

**Skeleton projects:** Search for battle-tested templates, evaluate with parallel agents (security, extensibility, relevance), clone best match, iterate within proven structure.

## Performance

**Context management:** Avoid last 20% of context window for large refactoring and multi-file features. Lower-sensitivity tasks (single edits, docs, simple fixes) tolerate higher utilization.

**Build troubleshooting:** Use build-error-resolver agent → analyze errors → fix incrementally → verify after each fix.

## Project Structure

```
agents/          — 29 specialized subagents
skills/          — 94 workflow skills and domain knowledge
commands/        — 50 slash commands
hooks/           — Trigger-based automations
rules/           — Always-follow guidelines (common + per-language)
scripts/         — Cross-platform Node.js utilities
mcp-configs/     — 14 MCP server configurations
tests/           — Test suite
```

`commands/` remains in the repo for compatibility, but the long-term direction is skills-first.

## Success Metrics

- All tests pass with 80%+ coverage
- No security vulnerabilities
- Code is readable and maintainable
- Performance is acceptable
- User requirements are met
