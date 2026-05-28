# ECC Project Changelog

> Living document — updated after every significant feature, fix, or migration.
> Format: `[YYYY-MM-DD] <type>: <description>` per module.

---

## 2026-05-28

### governance
- **feat:** Added `rules/common/blocked-rules.md` — single source of truth for non-negotiable blocked rules with machine-readable scan block (8 rules)
- **feat:** Added `scripts/ci/blocked-rules-scan.js` — automated pre-push governance scanner (CRLF-safe, exception-scoped)
- **feat:** Added `tests/ci/blocked-rules-scan.test.js` — 12 unit tests, all passing
- **feat:** Added `npm run governance-scan` and `npm run governance-scan:dry-run` scripts to `package.json`
- **feat:** Added `rules/common/planning.md` — ECC-PLAN-001, ECC-IMPL-001, ECC-IMPL-002 planning rules

### docs
- **feat:** Added `docs/CONTEXT-MANAGEMENT.md` — context tier system (Tier 1/2/3), token budgets, 3-level progressive disclosure
- **feat:** Added `docs/project-changelog.md` — this file (living changelog)
- **feat:** Added `docs/feature-delivery-log.md` — business-facing delivery log
- **feat:** Updated `docs/SKILL-DEVELOPMENT-GUIDE.md` — Token Budget Requirements section with ≤5k token limit
- **feat:** Added `agents/_template.agent.md` — standardized agent template

### claude
- **feat:** Updated `CLAUDE.md` — added Context Load Order (Tier 1/2/3) section

---

## Format Reference

```
[YYYY-MM-DD] <type>(<module>): <description>

Types: feat | fix | refactor | docs | test | chore | perf | security
Modules: agents | skills | commands | hooks | rules | scripts | docs | governance | claude