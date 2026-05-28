# Planning Rules

> **Rule IDs:** ECC-PLAN-001, ECC-IMPL-001, ECC-IMPL-002
> These rules are non-negotiable. They override all other guidance.

## ECC-PLAN-001 — Plan Before Implement

Every code, config, data, or infrastructure change requires a written plan before any implementation begins.

**Plan must include:**
- Scope — what is changing and why
- Affected files — list every file to be created, modified, or deleted
- Risks — what could break, side effects, rollback steps
- Verification — how to confirm the change worked
- Docs impact — which documentation needs updating

**Exception:** Purely conversational responses or docs-only changes with zero code or config impact do not require a formal plan.

## ECC-IMPL-001 — Clean APPROVED Required

Implementation is **BLOCKED** until the user responds with exactly `APPROVED`.

**Rules:**
- `APPROVED` must be case-sensitive, trimmed, no other words
- `APPROVED` + any change request = **NOT APPROVED** → update plan first, request new `APPROVED`
- No exception for small or trivial changes
- No exception for "obvious" fixes

## ECC-IMPL-002 — Plan Folder Required (for agent flows)

When using the `planner` agent or any automated implementation flow, a plan file must exist before implementation begins.

If no plan exists: refuse and direct user to run the planner agent first.

## Workflow

```
Receive task
    ↓
Write plan (scope, files, risks, verification, docs)
    ↓
Present plan → "Type APPROVED to proceed"
    ↓
Wait for response
    ↓
APPROVED (clean)?  →  Implement
    ↓ (no)
Update plan → loop back
```

## Plan Storage

- Plans for complex features: `plan/<timestamp>-<slug>/00-overview.md`
- Simple inline plans: present in chat before implementing
- All plans tracked in `plan/` directory for audit trail