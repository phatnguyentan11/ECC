# Context Management Guide

> **Applies to:** Claude Code, GitHub Copilot Agent Mode
> **Related:** `CLAUDE.md` § Context Load Order, `docs/SKILL-DEVELOPMENT-GUIDE.md`

---

## Context Load Order (Tier System)

When the context window is under pressure, load files in this priority order and stop when the budget is exhausted:

| Tier | Budget | Files to Load |
|------|--------|---------------|
| **Tier 1** — Always | ≤10k tokens | `rules/common/blocked-rules.md` → `AGENTS.md` (orchestration section only) |
| **Tier 2** — Task-relevant | ≤25k tokens | Active agent definition + active skill(s) + relevant `rules/common/` files |
| **Tier 3** — On-demand | Remaining budget | Full skills library, documentation, MCP configs |

**If only Tier 1 fits:** note "reduced context mode" in response and proceed with blocked rules + agent orchestration only.

---

## Token Budget Rules

### Skill Files

| Component | Budget | Overflow destination |
|-----------|--------|---------------------|
| `SKILL.md` body | ≤5,000 tokens | — |
| Long checklists, templates | Move to `reference/` | `skills/<name>/reference/` |
| Deterministic scripts | Move to `scripts/` | `skills/<name>/scripts/` |

### Agent Files

| Component | Budget | Notes |
|-----------|--------|-------|
| Agent `.md` body | ≤3,000 tokens | Focus on trigger conditions and output format |
| Tool list | Minimal — only what agent needs | Don't list all tools by default |

### Rule Files

| Component | Budget | Notes |
|-----------|--------|-------|
| `rules/common/blocked-rules.md` | ≤2,000 tokens | Tier 1 — always loaded |
| Individual rule files | ≤1,500 tokens | Tier 2 — loaded on demand |

---

## 3-Level Progressive Disclosure for Skills

ECC skills follow Anthropic's 3-level progressive disclosure pattern:

```
Level 1 — Summary (in SKILL.md header)
  ↓ "When to use this skill" — 2-3 sentences max

Level 2 — Core workflow (in SKILL.md body, ≤5k tokens)
  ↓ Step-by-step process, key decisions, output format

Level 3 — Reference material (in reference/ subdirectory)
  ↓ Full checklists, templates, examples, edge cases
```

**Rule:** A user should be able to activate a skill using only Level 1+2. Level 3 is loaded only when explicitly needed.

---

## Context Pressure Signals

Watch for these signals that indicate context pressure:

- Claude responds with "I'll focus on the most relevant parts..."
- Responses become shorter than expected
- Earlier context (file contents, prior decisions) is forgotten
- Model suggests starting a new conversation

**Response to pressure:**
1. Identify which tier you're in
2. Drop Tier 3 content first (skills library, full docs)
3. Keep Tier 1 always (blocked-rules, AGENTS.md orchestration)
4. Use `/compact` or `strategic-compact` skill to summarize and continue

---

## Practical Guidelines

### For Contributors adding new skills

1. Write `SKILL.md` — keep body ≤5k tokens
2. Put long checklists in `reference/checklist.md`
3. Put scripts in `scripts/` subdirectory
4. External URL fetching from `scripts/` is **BLOCKED** (see `blocked-rules.md` ECC-SKILL-001)
5. Test that skill activates correctly without reference materials

### For Contributors adding new agents

1. Use `agents/_template.agent.md` as starting point
2. Describe trigger conditions clearly — when should this agent be used vs not
3. Keep tool list minimal — only list tools the agent actually needs
4. Include output format expectations

### For Users hitting context limits

1. Start with `/compact` to summarize current context
2. Use `strategic-compact` skill for long sessions
3. For very large refactors: break into phases, one phase per session
4. Use `plan/` directory to persist plans across sessions

---

## Related Files

- `CLAUDE.md` — Context Load Order section
- `rules/common/blocked-rules.md` — Tier 1 always-load
- `AGENTS.md` — Agent orchestration (Tier 1 partial load)
- `docs/SKILL-DEVELOPMENT-GUIDE.md` — Token budget details for skill authors
- `skills/strategic-compact/` — Skill for managing context pressure *(planned)*
- `skills/context-budget/` — Skill for context budget tracking *(planned)*
