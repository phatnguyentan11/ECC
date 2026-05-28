---
name: agent-name
description: One-line purpose — what this agent does and when to use it
model: sonnet
tools:
  - Read
  - Write
  - Bash
---

# Agent Name

> **Token budget:** Keep this file ≤3,000 tokens. Move reference material to a linked doc.

## Purpose

2-3 sentences describing what this agent does, what problem it solves, and what it produces.

## When to Trigger

Use this agent when:
- Condition 1 — specific situation
- Condition 2 — specific situation
- Condition 3 — specific situation

Do NOT use this agent when:
- Use `other-agent` instead for X
- Use `other-agent` instead for Y

## Input Required

| Input | Required | Description |
|-------|----------|-------------|
| `input_1` | Yes | Description of required input |
| `input_2` | No | Description of optional input |

## Process

1. **Step 1** — What the agent does first
2. **Step 2** — What happens next
3. **Step 3** — How it concludes

## Output Format

Describe what the agent produces:
- Files created/modified
- Reports generated
- Actions taken

## Dependencies

- Agents: `other-agent` (if needed for X)
- Skills: `skill-name` (for Y)
- Tools: List any special tools required

## Example Invocation

```
@agent-name [context or task description]
```

## Notes

- Any important caveats
- Known limitations
- Edge cases to be aware of