#!/usr/bin/env node

import { parseArgs } from "util";
import {
  getAllSessions,
  enrichSession,
  loadSession,
  extractText,
  truncate,
  utcToLocal,
  formatTimecode,
  formatDuration,
  findSessionFile,
} from "../lib/sessions.js";
import { Y, G, B, C, DIM, BOLD, R } from "../lib/colors.js";

const HELP = `
Claude Timecodes — timestamped conversation history for Claude Code

Usage: claude-timecodes <command> [options]

Commands:
  sessions              List all sessions with timestamps
  view <session-id>     View a session with timestamps on every message
  search <query>        Search conversations with timecoded results
  at <timecode>         Jump to a specific timecode with context
  export <session-id>   Export session to markdown
  web                   Launch browser-based viewer
  install               Install timestamp hooks into Claude Code
  uninstall             Remove timestamp hooks from Claude Code
  config                Show current config
  config --timezone <TZ> Set home timezone (e.g. America/New_York)

Options:
  -n, --limit <N>       Limit results
  -d, --date <DATE>     Filter by date (YYYY-MM-DD)
  --from <DATETIME>     From time (YYYY-MM-DD HH:MM)
  --to <DATETIME>       To time (YYYY-MM-DD HH:MM)
  -c, --context <N>     Messages of context for 'at' (default 3)
  -f, --full            Show full message content
  -o, --output <file>   Output file for export
  -p, --port <N>        Port for web viewer (default 8420)
  -r, --role <ROLE>     Filter by speaker: you/me/user or claude/assistant
  --format <FMT>        Timestamp format: full (default), short (h:mm:ss AM/PM), 24h, iso
  -h, --help            Show this help
`;

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "-h" || command === "--help") {
  console.log(HELP);
  process.exit(0);
}

const rest = args.slice(1);

function parseOpts(positionals = 0) {
  const pos = rest.slice(0, positionals);
  const flags = rest.slice(positionals);
  const opts = {};
  for (let i = 0; i < flags.length; i++) {
    const f = flags[i];
    if (f === "-n" || f === "--limit") opts.limit = parseInt(flags[++i]);
    else if (f === "-d" || f === "--date") opts.date = flags[++i];
    else if (f === "--from") opts.from = flags[++i];
    else if (f === "--to") opts.to = flags[++i];
    else if (f === "-c" || f === "--context") opts.context = parseInt(flags[++i]);
    else if (f === "-f" || f === "--full") opts.full = true;
    else if (f === "-o" || f === "--output") opts.output = flags[++i];
    else if (f === "-p" || f === "--port") opts.port = parseInt(flags[++i]);
    else if (f === "--format") opts.format = flags[++i];
    else if (f === "--timezone") opts.timezone = flags[++i];
    else if (f === "--role" || f === "-r") opts.role = flags[++i];
    else pos.push(f);
  }
  return { pos, opts };
}

function fmtTC(date, fmt) {
  if (!date) return "[NO TIMECODE]";
  if (fmt === "iso") return date.toISOString();
  return formatTimecode(date, fmt);
}

switch (command) {
  case "sessions": {
    const { opts } = parseOpts(0);
    const fmt = opts.format || "full";
    const sessions = getAllSessions()
      .map(enrichSession)
      .filter((e) => e && e.firstTs)
      .sort((a, b) => b.firstTs - a.firstTs);

    const list = opts.limit ? sessions.slice(0, opts.limit) : sessions;

    if (!list.length) {
      console.log("No sessions found.");
      break;
    }

    for (const s of list) {
      const start = fmtTC(s.firstTs, fmt);
      const end = fmtTC(s.lastTs, fmt);
      const dur = s.firstTs && s.lastTs ? formatDuration(s.lastTs - s.firstTs) : "";
      console.log(`${Y}${start}${R}  ${DIM}→${R}  ${Y}${end}${R}  ${DIM}(${dur}, ${s.messageCount} msgs)${R}`);
      console.log(`  ${C}${s.sessionId}${R}`);
      if (s.preview) console.log(`  ${G}${s.preview}${R}`);
      console.log();
    }
    break;
  }

  case "view": {
    const { pos, opts } = parseOpts(1);
    const sessionId = pos[0];
    if (!sessionId) {
      console.error("Usage: claude-timecodes view <session-id>");
      process.exit(1);
    }
    const fmt = opts.format || "full";
    const file = findSessionFile(sessionId);
    if (!file) {
      console.error(`Session not found: ${sessionId}`);
      process.exit(1);
    }

    const messages = loadSession(file);
    if (!messages.length) {
      console.log("No messages in session.");
      break;
    }

    for (const msg of messages) {
      const ts = utcToLocal(msg.timestamp);
      const tc = fmtTC(ts, fmt);
      const content = extractText(msg.message?.content || "");
      const role = msg.type === "user" ? "You" : "Claude";
      const roleColor = msg.type === "user" ? G : B;

      console.log(`\n${Y}[${tc}]${R} ${roleColor}${BOLD}${role}:${R}`);
      if (!opts.full && content.length > 500) {
        console.log(`  ${truncate(content, 500)}`);
      } else {
        for (const line of content.split("\n")) {
          console.log(`  ${line}`);
        }
      }
    }
    break;
  }

  case "search": {
    const { pos, opts } = parseOpts(0);
    const query = pos.join(" ").toLowerCase();
    const fmt = opts.format || "full";
    const dateFilter = opts.date || null;
    const fromDt = opts.from ? new Date(opts.from) : null;
    const toDt = opts.to ? new Date(opts.to) : null;

    const roleFilter = opts.role ? opts.role.toLowerCase() : null;
    const roleType = roleFilter === "you" || roleFilter === "user" || roleFilter === "me" ? "user"
      : roleFilter === "claude" || roleFilter === "assistant" ? "assistant"
      : roleFilter;

    const results = [];
    for (const info of getAllSessions()) {
      for (const msg of loadSession(info.path)) {
        const ts = utcToLocal(msg.timestamp);
        if (!ts) continue;
        if (dateFilter && ts.toISOString().slice(0, 10) !== dateFilter) continue;
        if (fromDt && ts < fromDt) continue;
        if (toDt && ts > toDt) continue;
        if (roleType && msg.type !== roleType) continue;

        const content = extractText(msg.message?.content || "");
        if (query && !content.toLowerCase().includes(query)) continue;

        results.push({ ts, type: msg.type, content, sessionId: info.sessionId });
      }
    }

    results.sort((a, b) => a.ts - b.ts);
    const limited = opts.limit ? results.slice(0, opts.limit) : results;

    if (!limited.length) {
      console.log("No results found.");
      break;
    }

    console.log(`${BOLD}${limited.length} results:${R}\n`);
    let curSession = null;
    for (const r of limited) {
      if (r.sessionId !== curSession) {
        curSession = r.sessionId;
        console.log(`${DIM}--- session ${C}${curSession}${R}${DIM} ---${R}`);
      }
      const tc = fmtTC(r.ts, fmt);
      const roleColor = r.type === "user" ? G : B;
      const role = r.type === "user" ? "You" : "Claude";
      console.log(`  ${Y}[${tc}]${R} ${roleColor}${role}:${R} ${truncate(r.content, 150)}`);
    }
    console.log();
    break;
  }

  case "at": {
    const { pos, opts } = parseOpts(1);
    const tcInput = pos[0];
    if (!tcInput) {
      console.error("Usage: claude-timecodes at <timecode>");
      process.exit(1);
    }
    const fmt = opts.format || "full";
    const ctx = opts.context || 3;
    const target = new Date(tcInput);
    if (isNaN(target)) {
      console.error(`Invalid timecode: ${tcInput}`);
      process.exit(1);
    }

    let bestDist = Infinity;
    let bestIdx = -1;
    let bestMessages = null;
    let bestSession = null;

    for (const info of getAllSessions()) {
      const messages = loadSession(info.path);
      for (let i = 0; i < messages.length; i++) {
        const ts = utcToLocal(messages[i].timestamp);
        if (!ts) continue;
        const dist = Math.abs(ts - target);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
          bestMessages = messages;
          bestSession = info;
        }
      }
    }

    if (!bestMessages) {
      console.log("No messages found.");
      break;
    }

    console.log(`${DIM}Session: ${C}${bestSession.sessionId}${R}`);
    console.log(`${DIM}Nearest match is ${Math.round(bestDist / 1000)}s from target${R}\n`);

    const start = Math.max(0, bestIdx - ctx);
    const end = Math.min(bestMessages.length, bestIdx + ctx + 1);

    for (let i = start; i < end; i++) {
      const msg = bestMessages[i];
      const ts = utcToLocal(msg.timestamp);
      const tc = fmtTC(ts, fmt);
      const content = extractText(msg.message?.content || "");
      const marker = i === bestIdx ? " >>> " : "     ";
      const roleColor = msg.type === "user" ? G : B;
      const role = msg.type === "user" ? "You" : "Claude";

      console.log(`${marker}${Y}[${tc}]${R} ${roleColor}${BOLD}${role}:${R}`);
      console.log(`       ${truncate(content, 200)}`);
      console.log();
    }
    break;
  }

  case "export": {
    const { pos, opts } = parseOpts(1);
    const sessionId = pos[0];
    if (!sessionId) {
      console.error("Usage: claude-timecodes export <session-id>");
      process.exit(1);
    }
    const file = findSessionFile(sessionId);
    if (!file) {
      console.error(`Session not found: ${sessionId}`);
      process.exit(1);
    }

    const messages = loadSession(file);
    if (!messages.length) {
      console.error("No messages in session.");
      process.exit(1);
    }

    const firstTs = utcToLocal(messages[0].timestamp);
    const titleDate = firstTs ? formatTimecode(firstTs) : "Unknown";
    const stem = file.split("/").pop().replace(".jsonl", "");

    const lines = [`# Claude Session — ${titleDate}`, `Session ID: \`${stem}\``, ""];

    for (const msg of messages) {
      const ts = utcToLocal(msg.timestamp);
      const tc = formatTimecode(ts);
      const role = msg.type === "user" ? "You" : "Claude";
      const content = extractText(msg.message?.content || "");
      lines.push(`### \`[${tc}]\` **${role}**`, "", content, "");
    }

    const output = lines.join("\n");
    if (opts.output) {
      const { writeFileSync } = await import("fs");
      writeFileSync(opts.output, output);
      console.error(`Exported to ${opts.output}`);
    } else {
      console.log(output);
    }
    break;
  }

  case "web": {
    const { opts } = parseOpts(0);
    const port = opts.port || 8420;
    const { startServer } = await import("../lib/server.js");
    startServer(port);
    break;
  }

  case "install": {
    const { installHooks } = await import("../lib/install.js");
    const { loadConfig, saveConfig, getSystemTimezone } = await import("../lib/config.js");
    installHooks();
    const config = loadConfig();
    if (!config._initialized) {
      const tz = getSystemTimezone();
      config.homeTimezone = tz;
      config._initialized = true;
      saveConfig(config);
      const abbr = new Date().toLocaleString("en-US", { timeZoneName: "short", timeZone: tz }).split(" ").pop();
      console.log(`\nHome timezone set to ${tz} (${abbr})`);
      console.log(`Change anytime with: claude-timecodes config --timezone America/New_York`);
    }
    break;
  }

  case "uninstall": {
    const { uninstallHooks } = await import("../lib/install.js");
    uninstallHooks();
    break;
  }

  case "config": {
    const { loadConfig, saveConfig, getSystemTimezone } = await import("../lib/config.js");
    const { opts } = parseOpts(0);
    if (opts.timezone) {
      // Validate timezone
      try {
        Intl.DateTimeFormat("en-US", { timeZone: opts.timezone });
      } catch {
        console.error(`Invalid timezone: ${opts.timezone}`);
        console.error("Examples: America/Chicago, America/New_York, Europe/London, Asia/Tokyo");
        process.exit(1);
      }
      const config = loadConfig();
      config.homeTimezone = opts.timezone;
      saveConfig(config);
      const abbr = new Date().toLocaleString("en-US", { timeZoneName: "short", timeZone: opts.timezone }).split(" ").pop();
      console.log(`Home timezone set to ${opts.timezone} (${abbr})`);
    } else {
      const config = loadConfig();
      const sysTz = getSystemTimezone();
      const traveling = sysTz !== config.homeTimezone;
      console.log(`Home timezone: ${config.homeTimezone}`);
      console.log(`System timezone: ${sysTz}`);
      if (traveling) {
        console.log(`Status: Traveling (timestamps will show both zones)`);
      } else {
        console.log(`Status: Home`);
      }
    }
    break;
  }

  default:
    console.log(HELP);
    break;
}
