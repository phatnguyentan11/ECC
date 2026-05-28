# Supreme Workflow Rules — MANDATORY

> These rules have **highest priority** and override all other guidelines.
> Apply to every interaction: chat, agent, skill, command, hook, code review.

---

## Rule 1: Plan-First + APPROVED Gate

**Never touch any code or file without first presenting a plan and receiving explicit APPROVED.**

### Flow

```
[TASK RECEIVED]
      |
      v
[CREATE PLAN]
  - List every file to be changed
  - Describe the approach (what and why)
  - Identify risks and dependencies
  - Apply YAGNI/KISS/DRY check (see Rule 2)
      |
      v
[PRESENT PLAN TO USER]
  Ask: "Type APPROVED to proceed, or describe changes needed."
      |
      v
[WAIT FOR RESPONSE]
      |
   [APPROVED only?] ──YES──> [EXECUTE PLAN]
      |
      NO or APPROVED + changes
      |
      v
[UPDATE PLAN with requested changes]
      |
      v
[PRESENT UPDATED PLAN] ──> loop back to [WAIT FOR RESPONSE]
```

### Hard Rules

- **Do NOT write, edit, or delete any code/file before `APPROVED`** — no exceptions
- If user says `APPROVED` but also requests changes → treat as NOT approved, update plan first
- This loop runs indefinitely until a clean `APPROVED` is received
- Even a one-line fix requires a plan — "I will change X in file Y to Z. Type APPROVED to proceed."
- After `APPROVED`, execute exactly the approved plan — no scope creep

---

## Rule 2: YAGNI / KISS / DRY — Mandatory Pre-Code Checklist

Run this checklist **before** writing or presenting any code in the plan:

### YAGNI — You Aren't Gonna Need It

- [ ] Is this code/feature explicitly required by the current task?
- [ ] Am I adding anything "just in case" or for hypothetical future use?
- [ ] If YES to the above → **remove it**. Do not build what is not needed now.

### KISS — Keep It Simple, Stupid

- [ ] Is this the simplest solution that satisfies the requirement?
- [ ] Can any abstraction, layer, interface, or pattern be removed without losing functionality?
- [ ] Would a junior developer understand this without explanation?
- [ ] If answer is NO to simplicity → **simplify before proposing**

### DRY — Don't Repeat Yourself

- [ ] Does equivalent logic already exist in the codebase?
- [ ] Am I about to copy-paste code that should be extracted?
- [ ] Can I reuse an existing function, module, or utility?
- [ ] If duplication found → **refactor to shared logic first**

### Violation = Block

Any YAGNI/KISS/DRY violation found during plan creation must be:
1. Flagged explicitly in the plan
2. Resolved (simplified/removed/extracted) before presenting the plan
3. Not submitted for APPROVED until clean

---

## Rule 3: Scope Lock After APPROVED

Once `APPROVED` is received:
- Execute **exactly** what was approved
- Do NOT add extra improvements, refactors, or features not in the plan
- If you discover something else needs changing → complete the approved work, then create a new plan for the additional change

---

## Application Scope

These rules apply without exception to:
- Direct chat responses that involve code changes
- Agent executions (planner, code-reviewer, tdd-guide, etc.)
- Skill invocations
- Command executions (/plan, /build-fix, /refactor-clean, etc.)
- Hook implementations
- Any file modification in any context