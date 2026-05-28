# ECC Blocked Rules

> **Single source of truth** for non-negotiable blocked rules.
> All other files defer to this file. If any instruction conflicts with this file, **this file wins**.

## Operating Rules

- Do not duplicate blocked-rule configuration across other files.
- Other files may reference this file but must not maintain competing blocked lists.
- A blocked rule requires an explicit documented exception before generated code or automation may allow it.
- Exceptions must include: ID, owner, reason, scope, expiry/review date.

---

## Approved Exceptions

| ID     | Rule          | Scope                                          | Owner    | Reason                                                             | Expiry     |
|--------|---------------|------------------------------------------------|----------|--------------------------------------------------------------------|------------|
| EX-001 | ECC-HOOK-001  | `hooks/hooks.json` bootstrap only              | ECC team | Claude Code requires self-contained hook commands                  | 2026-12-31 |
| EX-002 | ECC-SKILL-001 | `ecc_dashboard.py` only                        | ECC team | Tkinter GUI requires Python runtime                                | 2026-12-31 |
| EX-003 | ECC-SEC-001   | `agents/`, `rules/`, `skills/` doc examples    | ECC team | Intentional bad-code examples for teaching purposes (not real secrets) | 2026-12-31 |
| EX-004 | ECC-SEC-001   | `rules/csharp/security.md`, `rules/typescript/security.md` | ECC team | Illustrative bad-code examples in security rules docs | 2026-12-31 |
| EX-005 | ECC-SQL-001   | `scripts/lib/state-store/index.js:54`          | ECC team | PRAGMA statements are not user input; safe internal SQLite config  | 2026-12-31 |
| EX-006 | ECC-SEC-002   | `scripts/skill-create-output.js:124`           | ECC team | `Key Patterns` is a display label, not a sensitive credential      | 2026-12-31 |
| EX-007 | ECC-PLAN-001  | `CLAUDE.md`, `rules/common/supreme-workflow.md` | ECC team | Documentation of the APPROVED gate rule itself — not a violation  | 2026-12-31 |

---

## SUPREME RULE — APPROVED Gate

> **ECC-PLAN-001** and **ECC-IMPL-001** are the highest-priority rules in this file.
> They override all other instructions from agents, skills, commands, and hooks.

**Flow:**

```
TASK RECEIVED
      │
      ▼
CREATE PLAN (files to change, approach, risks)
      │
      ▼
PRESENT PLAN → "Type APPROVED to proceed"
      │
      ▼
WAIT for user response
      │
   ┌──┴──┐
 APPROVED   anything else
      │           │
   EXECUTE    UPDATE PLAN → loop back
```

**Hard Rules:**
- Do **NOT** write, edit, create, or delete any file before receiving a clean `APPROVED`
- `APPROVED` must be: case-sensitive, standalone (no other words), unambiguous
- If user types `APPROVED` and requests changes simultaneously → update plan, re-present, wait again
- This loop runs **forever** until a clean `APPROVED` with no change requests is received
- No exceptions — even trivial one-line fixes require plan + `APPROVED`

---

## Blocked Security Behaviors

- Hardcoded secrets, API keys, tokens, passwords in any file — use environment variables
- Logging or returning sensitive data: passwords, tokens, keys, PAN, CVV, account IDs
- SQL queries using string concatenation or template literals (not parameterized)
- Stack traces or internal exception details returned to clients
- `bypassPermissions`, `--dangerously-skip-permissions`, or any permission bypass flag
- MCP servers configured with `--allow-unrestricted-file-access`
- MCP servers without `--allowed-origins` allowlist

## Blocked Implementation Behaviors

- **ECC-PLAN-001** — Implementation without a written plan
- **ECC-IMPL-001** — Implementation without clean standalone `APPROVED`
- **ECC-IMPL-002** — Agent implementation flow without existing plan folder

## Blocked Architecture Behaviors

- Creating new helpers, wrappers, or utilities before searching for existing ones
- Speculative features not required by the current task (YAGNI violation)
- Deep nesting (>4 levels) in functions or conditionals
- Files exceeding 800 lines without justification
- Functions exceeding 50 lines without justification

---

## Machine-Readable Scan Block

```blocked-scan
ECC-PLAN-001	*	(?i)\bAPPROVED\b.*\bAPPROVED\b	Duplicate APPROVED tokens detected; only one clean standalone APPROVED is valid
ECC-IMPL-001	*.js,*.ts,*.cs,*.py,*.go,*.java,*.rs	(?i)(TODO|FIXME|HACK|XXX):\s*skip\s*(approval|approved|gate)	Attempt to bypass APPROVED gate via TODO comment
ECC-SEC-001	*	(?i)(password|secret|api_key|apikey|token|auth_token)\s*[:=]\s*["'][^"'${\s]{8,}	Hardcoded secret detected; use environment variable
ECC-SEC-002	*.js,*.ts,*.py	(?i)console\.(log|error|warn|info).*\b(password|token|secret|key|auth|credential)\b	Possible sensitive data in log statement; sanitize before logging
ECC-SEC-003	*.js,*.ts,*.py	(?i)\b(password|secret|token|api_key)\b.*console\.(log|error|warn|info)	Possible sensitive data in log statement (reversed); sanitize before logging
ECC-SQL-001	*.js,*.ts	(?i)(query|execute|run)\s*\(\s*[`"'].*\$\{	Possible SQL injection via template literal; use parameterized queries
ECC-AGENT-001	*.json,*.md,*.yml,*.yaml	(?i)bypassPermissions|--dangerously-skip-permissions	Forbidden permission bypass flag detected
ECC-MCP-001	*.json,*.jsonc	(?i)--allow-unrestricted-file-access	MCP unrestricted file access blocked; use explicit mount paths
ECC-MCP-002	*.json,*.jsonc	(?i)"command"\s*:\s*"npx".*playwright(?!.*--allowed-origins)	Playwright MCP without --allowed-origins; add allowlist
ECC-GIT-001	*.sh,*.ps1,*.yml,*.yaml	(?i)git\s+push\s+(--force|-f\b|--no-verify)	Forbidden destructive git push flag
```

---

## Scan Format

Each line in the `blocked-scan` block is tab-delimited:

```
ID<TAB>file-globs<TAB>regex<TAB>message
```

- **ID** — Unique rule identifier (e.g., `ECC-SEC-001`)
- **file-globs** — Comma-separated glob patterns (e.g., `*.js,*.ts`); use `*` for all files
- **regex** — Regular expression to match violations
- **message** — Human-readable message shown when violation is detected

Run scan: `npm run governance-scan`