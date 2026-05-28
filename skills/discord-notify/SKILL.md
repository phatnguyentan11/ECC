---
name: discord-notify
description: Send a formatted embed notification to a Discord channel via webhook at the end of an agent flow or significant operation.
---

# Discord Notify Skill

## When to Use

Activate this skill when you need to:
- Notify a Discord channel after completing a significant operation (PR opened, scan complete, deployment done)
- Send a structured summary of an agent session outcome
- Alert team/community of build failures or critical findings

## Prerequisites

Set environment variable before running:
```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

If `DISCORD_WEBHOOK_URL` is not set, the skill **silently skips** — no error thrown.

## Usage

```
@doc-updater Use the discord-notify skill to send a summary when done.
```

Or reference the script directly:

```bash
node skills/discord-notify/scripts/post-discord.js \
  --title "ECC Governance Scan" \
  --status "PASS" \
  --summary "8 rules checked, 0 violations found." \
  --color "green"
```

## Message Format

Sends a Discord embed with:
- **Title** — operation name
- **Color** — green (PASS) / red (FAIL) / blue (INFO)
- **Description** — summary text
- **Fields** — key:value pairs (optional)
- **Footer** — timestamp + ECC label

## Security

- Webhook URL must come from `DISCORD_WEBHOOK_URL` env var — never hardcoded
- Payload is sanitized — no file contents, no secrets, no PII
- Payload capped at 4KB
- Non-blocking — failure does not stop the main flow
- Webhook URL host must be `discord.com` or `discordapp.com`

## Reference

See `scripts/post-discord.js` for implementation.

## Exception

This skill's script makes outbound HTTP. See `rules/common/blocked-rules.md` EX-004 (to be added when deploying to production).