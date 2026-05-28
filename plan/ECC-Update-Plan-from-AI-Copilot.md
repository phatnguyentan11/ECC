# ECC Update Plan — Bổ Sung Từ AI Copilot Package

> **Planner Agent** — Expert AI Engineering
> **Ngày:** 2026-05-28
> **Mục tiêu:** Update ECC với các best practices từ AI Copilot Package
> **Nguồn phân tích:** `plan/ECC-vs-AI-Copilot-Comparison.md`

---

## Tổng Quan

Dựa trên so sánh chi tiết, ECC cần bổ sung **4 nhóm tính năng** từ AI Copilot Package:

1. **APPROVED Gate** — Strict plan-before-implement workflow
2. **Automated Governance Scan** — Machine-readable blocked rules + pre-push check
3. **Context Tier System** — Token budget management
4. **Exception Tracking** — Formal audit trail cho violations

---

## Phase 1 — APPROVED Gate (Ưu tiên CAO nhất)

### Mục tiêu
Thêm BR-PLAN-001 / BR-IMPL-001 equivalent vào ECC workflow.

### Thay đổi cần thực hiện

#### 1.1 Update `CLAUDE.md`
Thêm **SUPREME RULE** section (học từ AI Copilot `CLAUDE.md`):

```markdown
## SUPREME RULE — Plan + APPROVED Gate

> Overrides everything else. No exception.

**RULE 1 — Plan first.**
Every code/config/infrastructure change requires a written plan before implementation.
Exception: purely conversational or docs-only changes.

**RULE 2 — APPROVED before implement.**
Implementation is BLOCKED until user responds with exactly `APPROVED`
(case-sensitive, trimmed, no other words).

**RULE 3 — APPROVED + changes = update plan + re-APPROVE.**
If user requests any change during implementation → STOP → update plan → request new `APPROVED`.
```

#### 1.2 Update `AGENTS.md` — Agent Orchestration section
Thêm APPROVED gate vào orchestration rules:

```markdown
## Plan + Approval Gate (Non-Negotiable)
- Complex/risky changes → planner agent → write plan → wait for `APPROVED`
- Implementation BLOCKED without clean standalone `APPROVED`
- "APPROVED + change request" = NOT APPROVED → update plan first
```

#### 1.3 Update `rules/common/` — Thêm `planning.md`
File mới `rules/common/planning.md`:

```markdown
# Planning Rules (ECC-PLAN-001, ECC-IMPL-001)

## ECC-PLAN-001 — Plan before implement
Write plan for every code/config change. Exception: docs-only.

## ECC-IMPL-001 — APPROVED gate
Implementation blocked until clean `APPROVED` from user.
Clean = case-sensitive, trimmed, no other content.
```

**Files cần thay đổi:**
- `CLAUDE.md` — thêm SUPREME RULE section
- `AGENTS.md` — update Agent Orchestration section
- `rules/common/planning.md` — file mới

**Effort:** ~2 giờ
**Risk:** LOW — chỉ thêm documentation/rules, không thay đổi code

---

## Phase 2 — Automated Governance Scan (Ưu tiên CAO)

### Mục tiêu
Tạo machine-readable blocked rules + CI script tự động scan violations.

### Thay đổi cần thực hiện

#### 2.1 Tạo `rules/common/blocked-rules.md`
Single source of truth cho non-negotiable rules (học từ AI Copilot `blocked-rules.md`):

```markdown
# ECC Blocked Rules

Single source of truth. All other files defer to this file.

## Approved Exceptions
| ID | Rule | Scope | Owner | Reason | Expiry |
|----|------|-------|-------|--------|--------|
| EX-001 | ECC-HOOK-001 | hooks/hooks.json bootstrap only | ECC team | Self-contained hook requirement | 2026-12-31 |

## Blocked Security Behaviors
- Hardcoded secrets/tokens in any file
- Console.log with sensitive data (password, token, key, secret)
- SQL queries with string concatenation (not parameterized)

## Blocked Implementation Behaviors
- ECC-PLAN-001: Implementation without approved plan
- ECC-IMPL-001: Implementation without clean `APPROVED`

## Machine-Readable Scan Block
\`\`\`blocked-scan
ECC-SEC-001  *  (?i)(password|secret|api_key|apikey|token)\s*=\s*["'][^"'${\s]{8,}  Hardcoded secret detected; use environment variable
ECC-SEC-002  *.js,*.ts  (?i)console\.(log|error|warn).*\b(password|token|secret|key|auth)\b  Possible sensitive data in console log
ECC-SQL-001  *.js,*.ts  (?i)(query|execute|run)\s*\(\s*[`"'].*\$\{  Possible SQL injection via template literal; use parameterized queries
ECC-AGENT-001  *.json,*.md  (?i)bypassPermissions|--dangerously-skip-permissions  Forbidden permission bypass flag
ECC-MCP-001  *.json  (?i)--allow-unrestricted-file-access  MCP unrestricted file access blocked
\`\`\`
```

#### 2.2 Tạo `scripts/ci/blocked-rules-scan.js`
Node.js script đọc scan block và check files:

```javascript
// scripts/ci/blocked-rules-scan.js
// Reads blocked-scan block from rules/common/blocked-rules.md
// Scans all project files for violations
// Exits 1 if violations found (CI-compatible)
```

**Logic:**
1. Parse `blocked-scan` code block từ `blocked-rules.md`
2. Parse tab-delimited rules: `ID<TAB>globs<TAB>regex<TAB>message`
3. Glob files theo pattern
4. Regex scan nội dung
5. Report violations với file path + line number
6. Exit 1 nếu có violations

#### 2.3 Update `package.json` — thêm script
```json
{
  "scripts": {
    "governance-scan": "node scripts/ci/blocked-rules-scan.js",
    "pre-push": "npm run governance-scan && npm test"
  }
}
```

#### 2.4 Update CI pipeline
Thêm governance scan vào CI:
```yaml
- name: Governance scan
  run: npm run governance-scan
```

**Files cần thay đổi:**
- `rules/common/blocked-rules.md` — file mới
- `scripts/ci/blocked-rules-scan.js` — file mới
- `package.json` — thêm scripts
- `.github/workflows/` hoặc CI config — thêm scan step
- `tests/ci/blocked-rules-scan.test.js` — tests cho script mới

**Effort:** ~1 ngày
**Risk:** MEDIUM — thêm CI step có thể break existing CI nếu violations exist

---

## Phase 3 — Context Tier System (Ưu tiên TRUNG BÌNH)

### Mục tiêu
Thêm explicit context loading priority vào CLAUDE.md và agent instructions.

### Thay đổi cần thực hiện

#### 3.1 Update `CLAUDE.md` — Thêm Context Load Order

```markdown
## Context Load Order

When context window is under pressure, load in priority order:

**Tier 1 (always — ≤10k tokens):**
- `rules/common/blocked-rules.md`
- `AGENTS.md` (orchestration section only)

**Tier 2 (task-relevant — ≤25k tokens):**
- Active agent definition
- Active skill(s)
- `rules/common/` relevant files

**Tier 3 (on-demand):**
- Full skills library
- Documentation
- MCP configs
```

#### 3.2 Update skills — Token budget enforcement
Audit tất cả skills trong `skills/` và enforce:
- Skill body ≤5k tokens
- Move long checklists vào `reference/` subdirectory
- Move scripts vào `scripts/` subdirectory

Ước tính: ~20-30 skills cần restructure.

#### 3.3 Tạo `docs/CONTEXT-MANAGEMENT.md`
Document tier system và token budget guidelines cho contributors.

#### 3.4 Update `SKILL-DEVELOPMENT-GUIDE.md`
Thêm token budget requirement:
```markdown
## Token Budget
- Skill body (SKILL.md): ≤5,000 tokens
- Long checklists → reference/ subdirectory
- Deterministic operations → scripts/ subdirectory
- External URL fetching from scripts: BLOCKED
```

**Files cần thay đổi:**
- `CLAUDE.md` — thêm Context Load Order
- `docs/SKILL-DEVELOPMENT-GUIDE.md` — thêm token budget
- `docs/CONTEXT-MANAGEMENT.md` — file mới
- ~20-30 skill files — restructure (risky, cần careful review)

**Effort:** ~3 ngày (bulk của effort là audit/restructure skills)
**Risk:** MEDIUM-HIGH — restructure skills có thể break existing usage

---

## Phase 4 — Exception Tracking & Living Docs (Ưu tiên TRUNG BÌNH)

### Mục tiêu
Formal audit trail cho violations + mandatory docs update policy.

### Thay đổi cần thực hiện

#### 4.1 Exception table trong `blocked-rules.md`
(Đã include trong Phase 2 — `blocked-rules.md`)

Thêm exception entries cho known intentional violations:

| ID | Rule | Scope | Owner | Reason | Expiry |
|----|------|-------|-------|--------|--------|
| EX-001 | ECC-HOOK-001 | hooks/hooks.json | ECC team | Self-contained hook bootstrap | 2026-12-31 |
| EX-002 | ECC-PYTHON-001 | ecc_dashboard.py | ECC team | Tkinter UI requirement | 2026-12-31 |

#### 4.2 Living docs policy — Update `AGENTS.md`

```markdown
## Living Docs Mandate
After every feature/fix/migration:
- doc-updater agent MUST be triggered automatically
- Update CHANGELOG.md with conventional commit format
- Update relevant docs in docs/ directory
```

#### 4.3 Tạo `docs/project-changelog.md` và `docs/feature-delivery-log.md`
(Học từ AI Copilot `.github/docs/` structure)

Living documents updated sau mỗi change:
- `project-changelog.md` — technical changelog theo module
- `feature-delivery-log.md` — business-facing delivery log

#### 4.4 Update `doc-updater` agent
Thêm trigger: auto-activate sau mỗi significant implementation.

**Files cần thay đổi:**
- `rules/common/blocked-rules.md` — thêm exception table
- `AGENTS.md` — thêm living docs mandate
- `docs/project-changelog.md` — file mới
- `docs/feature-delivery-log.md` — file mới
- `agents/doc-updater.md` — update trigger conditions

**Effort:** ~4 giờ
**Risk:** LOW — documentation changes

---

## Phase 5 — Agent Template & Persona (Ưu tiên THẤP)

### Mục tiêu
Standardize agent format + thêm persona concept.

### Thay đổi cần thực hiện

#### 5.1 Tạo `agents/_template.agent.md`

```markdown
---
name: agent-name
description: One-line purpose
model: claude-opus-4-5 | claude-sonnet-4-5
tools: [Read, Write, Bash, ...]
trigger: When to use this agent
---

# Agent Name

## Purpose
[2-3 sentences]

## When to Trigger
- Condition 1
- Condition 2

## Output Format
[Expected output structure]

## Dependencies
[Other agents/skills this agent uses]
```

#### 5.2 Standardize existing 35 agents
Audit tất cả agents theo template.

#### 5.3 Tạo `agents/personas/` directory
```
agents/personas/
├── startup-cto.md
├── security-auditor.md
├── ml-engineer.md
└── banking-engineer.md
```

Activate với `/persona [name]` command.

**Files cần thay đổi:**
- `agents/_template.agent.md` — file mới
- `agents/personas/*.md` — files mới
- 35 existing agent files — standardize (optional, low urgency)
- `CLAUDE.md` — thêm `/persona` command

**Effort:** ~1 ngày
**Risk:** LOW

---

## Phase 6 — Notification Skills (Ưu tiên THẤP)

### Mục tiêu
Thêm Teams/Discord notification skills cho enterprise integration.

### Thay đổi cần thực hiện

#### 6.1 Tạo `skills/teams-notify/`
```
skills/teams-notify/
├── SKILL.md          # ≤5k tokens
├── reference/
│   └── adaptive-card-template.json
└── scripts/
    └── post-teams.ps1  # Exception in blocked-rules required
```

#### 6.2 Tạo `skills/discord-notify/`
```
skills/discord-notify/
├── SKILL.md
└── scripts/
    └── post-discord.ps1
```

**Files cần thay đổi:**
- `skills/teams-notify/` — directory mới
- `skills/discord-notify/` — directory mới
- `rules/common/blocked-rules.md` — thêm exceptions cho outbound HTTP

**Effort:** ~4 giờ
**Risk:** LOW

---

## Tổng Hợp Kế Hoạch

### Roadmap theo Priority

```
Phase 1 — APPROVED Gate          [~2h]   ████ P1 CRITICAL
Phase 2 — Governance Scan        [~1d]   ████ P1 CRITICAL
Phase 4 — Exception + LiveDocs   [~4h]   ███  P2 HIGH
Phase 3 — Context Tier System    [~3d]   ███  P2 HIGH
Phase 5 — Agent Template+Persona [~1d]   ██   P3 MEDIUM
Phase 6 — Notification Skills    [~4h]   █    P3 LOW
```

### Total effort estimate: ~6-7 ngày

### Dependency graph

```
Phase 1 (APPROVED Gate)
    └── Phase 2 (Governance Scan) — needs blocked-rules.md
            └── Phase 4 (Exception Tracking) — extends blocked-rules.md
                    └── Phase 3 (Context Tier) — independent
                            └── Phase 5 (Agent Template) — independent
                                    └── Phase 6 (Notifications) — independent
```

### Files Tổng Hợp Cần Tạo/Update

| File | Action | Phase |
|------|--------|-------|
| `CLAUDE.md` | UPDATE — thêm SUPREME RULE + Context tier | 1, 3 |
| `AGENTS.md` | UPDATE — thêm APPROVED gate + living docs | 1, 4 |
| `rules/common/planning.md` | CREATE | 1 |
| `rules/common/blocked-rules.md` | CREATE | 2 |
| `scripts/ci/blocked-rules-scan.js` | CREATE | 2 |
| `tests/ci/blocked-rules-scan.test.js` | CREATE | 2 |
| `package.json` | UPDATE — thêm governance-scan script | 2 |
| `docs/CONTEXT-MANAGEMENT.md` | CREATE | 3 |
| `docs/SKILL-DEVELOPMENT-GUIDE.md` | UPDATE | 3 |
| `docs/project-changelog.md` | CREATE | 4 |
| `docs/feature-delivery-log.md` | CREATE | 4 |
| `agents/doc-updater.md` | UPDATE | 4 |
| `agents/_template.agent.md` | CREATE | 5 |
| `agents/personas/` | CREATE (4 files) | 5 |
| `skills/teams-notify/` | CREATE | 6 |
| `skills/discord-notify/` | CREATE | 6 |

---

## Rủi Ro & Mitigation

| Rủi ro | Severity | Mitigation |
|--------|----------|-----------|
| Governance scan false positives break CI | HIGH | Dry-run mode trước, whitelist exceptions |
| Skill restructure break existing usage | MEDIUM | Audit trước, backward-compatible changes only |
| APPROVED gate friction cho contributors | MEDIUM | Docs-only exception rõ ràng |
| Agent template migration effort | LOW | Optional migration, template enforced for new agents only |

---

## Điều Kiện Thành Công

- [ ] Phase 1: CLAUDE.md có SUPREME RULE, AGENTS.md có APPROVED gate
- [ ] Phase 2: `npm run governance-scan` chạy pass trên clean codebase
- [ ] Phase 2: CI pipeline include governance scan step
- [ ] Phase 4: `blocked-rules.md` có exception table với known violations
- [ ] Phase 3: CLAUDE.md có Context Load Order tiers
- [ ] Phase 5: `agents/_template.agent.md` tồn tại
- [ ] Phase 6: `skills/teams-notify/` và `skills/discord-notify/` tồn tại

---

*Planner Agent — ECC Update Plan v1.0*
*Dựa trên: plan/ECC-vs-AI-Copilot-Comparison.md*