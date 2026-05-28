# ECC Feature Delivery Log

> Business-facing delivery log — summarizes what was delivered, why, and impact.
> Updated after every significant feature delivery.

---

## 2026-05-28 — Governance & Quality Update

### What was delivered

**ECC v2.0 Governance Hardening** — Borrowing best practices from banking-grade AI governance packages.

| Feature | Files | Impact |
|---------|-------|--------|
| Automated governance scanner | `scripts/ci/blocked-rules-scan.js` | Pre-push security scan, 8 rules |
| Blocked rules single source of truth | `rules/common/blocked-rules.md` | Exception tracking, numbered rules |
| Plan + APPROVED gate rules | `rules/common/planning.md` | ECC-PLAN-001, ECC-IMPL-001 |
| Context tier system | `CLAUDE.md`, `docs/CONTEXT-MANAGEMENT.md` | Tier 1/2/3 loading, token budgets |
| Token budget for skills | `docs/SKILL-DEVELOPMENT-GUIDE.md` | ≤5k tokens per skill body |
| Agent template | `agents/_template.agent.md` | Consistent agent format |
| Living docs | `docs/project-changelog.md`, this file | Audit trail |
| Dashboard Windows fix | `package.json` | `npm run dashboard` now works on Windows |

### Why it was done

Analysis of `D:\PhatNT\AI` (banking-grade GitHub Copilot package) revealed ECC lacked:
- Automated enforcement (principles without scan = aspirational not operational)
- APPROVED gate (implementation could start without approval)
- Context management (no token budget discipline)
- Exception audit trail (no tracking of intentional violations)

### Impact

- `npm run governance-scan` now scans 679 files, 8 rules, exits 0 on clean codebase
- Contributors get immediate feedback on security violations before push
- AI agents have explicit context loading priority (Tier 1 always, Tier 2 task-relevant, Tier 3 on-demand)
- Skill contributors have clear token budget requirements

---

## Log Format

```
## YYYY-MM-DD — Feature Name

### What was delivered
[Table or list of changes]

### Why it was done
[Business/technical justification]

### Impact
[Measurable outcomes, metrics]