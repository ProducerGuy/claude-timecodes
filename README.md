# Claude Timecodes

Live timestamps and speaker labels for every Claude Code conversation. Every exchange shows who said what and when — visible to both you and Claude. Search, browse, and export your full conversation history by time and speaker.

**Zero dependencies.** Pure Node.js stdlib. Works with all existing sessions.

## Why

Claude Code stores timestamps on every message but never shows them. You can't see when a conversation happened, you can't tell who said what at a glance, and Claude can't reason about time. 25 issues filed on [anthropics/claude-code](https://github.com/anthropics/claude-code) asking for this — zero shipped.

This fixes it.

## Install

```bash
npx github:ProducerGuy/claude-timecodes install
```

That's it. The installer:
1. Copies the hook script to `~/.claude/timecode.sh`
2. Adds hooks to `~/.claude/settings.json` (UserPromptSubmit, Stop, PostToolUse)
3. Auto-detects your display name from your Anthropic account
4. Auto-detects your home timezone
5. Saves config to `~/.claude/timecodes.json`

Every Claude Code session from that point forward shows timestamped speaker labels on every exchange.

## What You Get

### Live speaker labels and timestamps

Every exchange shows who said it and when:

```
Producer · 2:44:51 PM CDT
Claude · 2:44:53 PM CDT
Claude · 2:44:55 PM CDT · Bash
```

- Your messages show your Anthropic display name (e.g. `Producer`)
- Claude's responses show `Claude`
- Tool calls show `Claude` with the tool name (e.g. `Bash`, `Edit`, `Read`)

Claude also sees timecodes in its context, so it can answer questions like "how long did that take?" or "what did I work on an hour ago?"

### CLI search and browse

```bash
# List all sessions with start/end times and duration
claude-timecodes sessions

# View a full conversation with timestamps on every message
claude-timecodes view <session-id>

# Search across all conversations
claude-timecodes search "authentication bug"

# Search only your messages or only Claude's
claude-timecodes search "bug" --role me
claude-timecodes search "bug" --role claude

# Filter by date
claude-timecodes search --date 2026-04-01

# Filter by time range
claude-timecodes search --from "2026-04-01 14:00" --to "2026-04-01 15:00"

# Jump to an exact timecode with surrounding context
claude-timecodes at "2026-04-01 14:32:15"

# Export a session to markdown
claude-timecodes export <session-id>
claude-timecodes export <session-id> -o session.md

# Launch browser-based viewer
claude-timecodes web
```

Partial session IDs work — you only need the first few characters.

### Web viewer

`claude-timecodes web` opens a local browser UI with:
- Session list sidebar with dates and durations
- Full conversation view with timestamps on every message
- Search across all sessions with highlighted results
- Click any timecode to copy it
- Timeline visualization of session activity

### Travel-aware timestamps

On install, your home timezone is auto-detected. When you're home, timestamps are clean:

```
Producer · 2:44:51 PM CDT
```

When you travel, both timezones show automatically:

```
Producer · 4:44:51 AM JST (2:44:51 PM CDT)
```

Your local time is primary. Your home time shows in parentheses so teammates and logs stay in sync. When you're home, the parenthetical doesn't appear.

### Configuration

```bash
# Show current config
claude-timecodes config

# Change display name
claude-timecodes config --name "Your Name"

# Change home timezone
claude-timecodes config --timezone America/New_York
```

### Timestamp formats

```bash
# Default — 12-hour with date and timezone
claude-timecodes sessions
# 04/01/2026, 02:44:51 PM CDT

# Short — time only
claude-timecodes view <id> --format short
# 2:44:51 PM

# 24-hour
claude-timecodes view <id> --format 24h
# 04/01/2026, 14:44:51 CDT

# ISO 8601
claude-timecodes view <id> --format iso
# 2026-04-01T19:44:51.031Z
```

## Uninstall

```bash
npx github:ProducerGuy/claude-timecodes uninstall
```

Removes the hooks from settings.json. Your conversation data is untouched.

## How It Works

Claude Code already stores ISO 8601 timestamps on every message in JSONL files at `~/.claude/projects/`. This tool:

1. **Hooks** — A bash script (`~/.claude/timecode.sh`) fires on three events:
   - `UserPromptSubmit` — shows `Producer · 2:44:51 PM CDT` to user, injects timecode into Claude's context
   - `Stop` — shows `Claude · 2:44:53 PM CDT` to user
   - `PostToolUse` — shows `Claude · 2:44:55 PM CDT · Bash` to user, injects tool timecode into Claude's context
2. **CLI** — Reads the JSONL files, parses timestamps, converts to local time, and presents them with speaker labels and color-coded output
3. **Web viewer** — Local HTTP server serving a single-page app that hits JSON APIs backed by the same JSONL parser

## Requirements

- Node.js 18+
- `jq` (for the hook script — pre-installed on most systems)
- Claude Code

## Community Requests

This project addresses [25 open and closed issues](ISSUES.md) on anthropics/claude-code requesting timestamps and speaker labels. See ISSUES.md for the full list with authors, details, and coverage status.
