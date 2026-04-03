# Claude Code Timestamp Issues — Community Requests

21 issues filed (9 open, 12 closed as duplicates). Zero official Anthropic responses on any of them.

## Open Issues

| # | Title | Author | Opened | Upvotes | What They Want |
|---|-------|--------|--------|---------|----------------|
| [#2441](https://github.com/anthropics/claude-code/issues/2441) | Add timestamp to each message | @MarcinOrlowski | 2025-06-22 | **28** | Timestamp every message in CLI UI. ASCII mockup with `[2025-06-21, 23:59]` right-aligned. |
| [#21051](https://github.com/anthropics/claude-code/issues/21051) | Display message timestamps in CLI interface | @tlelekas-cloud | 2026-01-26 | **14** | Visible timestamps for tracking, debugging, performance measurement, documentation. |
| [#30745](https://github.com/anthropics/claude-code/issues/30745) | Add message timestamps to interactive view | @paradoxlabdev | 2026-03-04 | **9** | HH:MM:SS next to each message. Correlate with server logs during debugging. |
| [#34186](https://github.com/anthropics/claude-code/issues/34186) | Timestamps visible to the model | @tsubasa-rsrch | 2026-03-13 | **4** | Timestamps in conversation context so Claude has temporal awareness. |
| [#32590](https://github.com/anthropics/claude-code/issues/32590) | Give Claude temporal continuity | @cday-with-ai | 2026-03-09 | **3** | Claude has no sense of time passing between sessions. |
| [#33009](https://github.com/anthropics/claude-code/issues/33009) | Add timestamps to tool use output | @sophronesis | 2026-03-10 | **2** | Timestamps on tool use output, right-aligned. |
| [#32495](https://github.com/anthropics/claude-code/issues/32495) | Expose timestamps for elapsed time | @mgaglianoupgrade | 2026-03-09 | **1** | Claude can't compute elapsed time without message timestamps. |
| [#41389](https://github.com/anthropics/claude-code/issues/41389) | Add timestamps to conversation context | @klappenbach | 2026-03-31 | **0** | Timestamps for "what did I work on yesterday?" and stale tool result detection. |
| [#41072](https://github.com/anthropics/claude-code/issues/41072) | Show timestamps on chat messages | @jasonnickel | 2026-03-30 | **0** | HH:MM timestamp next to each message bubble. |

## Closed Issues (duplicates/stale — same request, unfulfilled)

| # | Title | Author | Opened | What They Want |
|---|-------|--------|--------|----------------|
| [#18582](https://github.com/anthropics/claude-code/issues/18582) | Expose message timestamps to Claude | @mgaglianoupgrade | 2026-01-16 | Claude can't compute elapsed time. Re-filed as #32495. |
| [#24182](https://github.com/anthropics/claude-code/issues/24182) | Inject timestamp into every user message | @rupjae | 2026-02-08 | System prompt date goes stale. Can't detect gaps or time of day. |
| [#26088](https://github.com/anthropics/claude-code/issues/26088) | Per-message timestamps in UI | @EGDongAn | 2026-02-16 | In tmux, shell prompt timestamps disappear. |
| [#28531](https://github.com/anthropics/claude-code/issues/28531) | Per-message timestamps in conversation UI | @seizeit | 2026-02-25 | "Every comparable tool does this — Slack, Discord, iTerm2, even `script` from 1979." |
| [#28717](https://github.com/anthropics/claude-code/issues/28717) | Per-message timestamp option for CLI | @etrzanupgrade | 2026-02-25 | High-precision timestamps for auditing and log correlation. |
| [#30144](https://github.com/anthropics/claude-code/issues/30144) | Show timestamps on chat messages | @marxo126 | 2026-03-02 | Per-message timestamps like Slack/Discord. |
| [#31271](https://github.com/anthropics/claude-code/issues/31271) | Show timestamps on conversation messages | @davidwhittington | 2026-03-05 | Correlate activity across windows, gauge response times. |
| [#33862](https://github.com/anthropics/claude-code/issues/33862) | Timestamps in session list and per-message | @cosmic-dynasty | 2026-03-13 | Absolute dates in session list + per-message timestamps. |
| [#34302](https://github.com/anthropics/claude-code/issues/34302) | Workaround: `date` bash call | @bhanquier | 2026-03-14 | Documents workaround. Notes Claude hallucinates timestamps without this. |
| [#18551](https://github.com/anthropics/claude-code/issues/18551) | Timestamps in message metadata | @wolfkevin | 2026-01-16 | Detect time gaps, know time of day, temporal context. |
| [#23655](https://github.com/anthropics/claude-code/issues/23655) | Inject local time into context | @NoRain211 | 2026-02-06 | Like other agentic environments do by default. |
| [#32949](https://github.com/anthropics/claude-code/issues/32949) | Per-message timestamps in conversation view | @pdej7 | 2026-03-10 | Correlate with deploys, CI runs, API usage. |

## Coverage

| Issue | Ask | Addressed? | How |
|-------|-----|------------|-----|
| [#2441](https://github.com/anthropics/claude-code/issues/2441) (28 upvotes) | Timestamp every message in CLI UI | **Yes** | `systemMessage` fires on all three events — user message, tool call, and Claude response. Every exchange shows a visible timestamp. Only limitation: can't right-align inside the message bubble (requires Anthropic UI change). CLI `view` and web viewer show full per-message timestamps. |
| [#21051](https://github.com/anthropics/claude-code/issues/21051) (14 upvotes) | Visible timestamps for tracking/debugging | **Yes** | Live hooks + CLI search/view + web viewer. |
| [#30745](https://github.com/anthropics/claude-code/issues/30745) (9 upvotes) | HH:MM:SS, correlate with server logs | **Yes** | `--format short` shows time only. Second-precision timestamps with timezone. |
| [#34186](https://github.com/anthropics/claude-code/issues/34186) (4 upvotes) | Timestamps visible to the model | **Yes** | `UserPromptSubmit` hook injects timecode into `additionalContext` every message. Claude sees and can reference exact times. |
| [#32590](https://github.com/anthropics/claude-code/issues/32590) (3 upvotes) | Temporal continuity across sessions | **Yes** | Claude sees timecodes on every message. Can detect session gaps, reason about elapsed time, know time of day. |
| [#33009](https://github.com/anthropics/claude-code/issues/33009) (2 upvotes) | Timestamps on tool use output | **Yes** | `PostToolUse` hook injects timecode with tool name into Claude's context. |
| [#32495](https://github.com/anthropics/claude-code/issues/32495) (1 upvote) | Elapsed time calculations | **Yes** | Claude sees consecutive timecodes, can compute duration between any two messages. |
| [#41389](https://github.com/anthropics/claude-code/issues/41389) | Timestamps in conversation context | **Yes** | All three hook events inject timestamps. "What did I work on yesterday?" answerable via CLI `search --date`. |
| [#41072](https://github.com/anthropics/claude-code/issues/41072) | Show timestamps on chat messages | **Yes** | `systemMessage` on all three hook events. Every exchange gets a visible timestamp. |
| [#28717](https://github.com/anthropics/claude-code/issues/28717) | Configurable timestamp format | **Yes** | `--format` flag: `full`, `short`, `24h`, `iso`. |
| [#28531](https://github.com/anthropics/claude-code/issues/28531) | "Even `script` from 1979 does this" | **Yes** | And we go further — search, export, web viewer, travel-aware dual timezone. |
| [#33862](https://github.com/anthropics/claude-code/issues/33862) | Session list with absolute dates + per-message | **Yes** | `sessions` command shows absolute dates, duration, message count. `view` shows per-message timestamps. |
| [#24182](https://github.com/anthropics/claude-code/issues/24182) | System prompt date goes stale | **Yes** | `UserPromptSubmit` hook injects fresh timestamp on every single message. Never stale. |
| [#34302](https://github.com/anthropics/claude-code/issues/34302) | Claude hallucinates timestamps without `date` call | **Yes** | Hook provides real timestamps automatically — no need for Claude to call `date` via Bash. |
| [#18551](https://github.com/anthropics/claude-code/issues/18551) | Detect time gaps, temporal context | **Yes** | Claude sees timecodes. CLI `at` command jumps to any timecode. |
| [#23655](https://github.com/anthropics/claude-code/issues/23655) | Inject local time into context | **Yes** | Exactly what the `UserPromptSubmit` hook does. |
| [#26088](https://github.com/anthropics/claude-code/issues/26088) | tmux hides shell prompt timestamps | **Yes** | Hook-based timestamps work regardless of terminal — tmux, screen, SSH, whatever. |
| [#30144](https://github.com/anthropics/claude-code/issues/30144) | Per-message timestamps like Slack/Discord | **Yes** | `systemMessage` on every exchange + CLI and web viewer for review. Formatting differs from Slack (not inline in bubble) but every message gets a visible timestamp. |
| [#31271](https://github.com/anthropics/claude-code/issues/31271) | Correlate activity across windows | **Yes** | Timestamps are absolute with timezone. Same message shows same time regardless of which window you're in. |
| [#32949](https://github.com/anthropics/claude-code/issues/32949) | Correlate with deploys, CI runs, API usage | **Yes** | Second-precision timestamps with timezone. `--format iso` for machine-parseable output. |
| [#18582](https://github.com/anthropics/claude-code/issues/18582) | Expose timestamps to Claude for elapsed time | **Yes** | Same as #32495. |

**Summary:** 21 of 21 addressed. Every exchange gets a visible timestamp via `systemMessage` hooks. The only cosmetic limitation is positioning — timestamps appear as system messages rather than right-aligned inside message bubbles, which would require Anthropic to modify Claude Code's renderer.
