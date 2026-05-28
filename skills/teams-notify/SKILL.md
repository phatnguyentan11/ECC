---
name: teams-notify
description: Send a formatted notification to Microsoft Teams via Power Automate webhook at the end of an agent flow or significant operation.
---

# Teams Notify Skill

## When to Use

Activate this skill when you need to:
- Notify a Teams channel after completing a significant operation (PR opened, deployment done, scan complete)
- Send a structured summary of an agent session outcome
- Alert team members of failures or critical findings

## Prerequisites

Set environment variable before running:
```bash
export TEAMS_WEBHOOK_URL="https://prod-xx.logic.azure.com/..."
```

If `TEAMS_WEBHOOK_URL` is not set, the skill **silently skips** — no error thrown.

## Usage

```
@doc-updater Use the teams-notify skill to send a summary when done.
```

Or reference the script directly:

```bash
node skills/teams-notify/scripts/post-teams.js \
  --title "ECC Governance Scan" \
  --status "PASS" \
  --summary "8 rules checked, 0 violations found." \
  --facts "Files Scanned:679" "Rules Loaded:8"
```

## Message Format

Sends an Adaptive Card to Teams with:
- **Title** — operation name
- **Status** — PASS / FAIL / INFO
- **Summary** — 1-2 sentence description
- **Facts** — key:value pairs (optional)

## Security

- Webhook URL must come from `TEAMS_WEBHOOK_URL` env var — never hardcoded
- Payload is sanitized — no file contents, no secrets, no PII
- Payload capped at 4KB
- Non-blocking — failure does not stop the main flow

## Reference

See `reference/adaptive-card-template.json` for the card schema.
See `scripts/post-teams.js` for implementation.

## Exception

This skill's script makes outbound HTTP. See `rules/common/blocked-rules.md` EX-003 (to be added when deploying to production).