import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { PROJECTS_DIR } from "./paths.js";
import { getHomeTimezone, getSystemTimezone } from "./config.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function formatModelName(modelId) {
  if (!modelId) return "Claude";
  // claude-opus-4-6 → Claude Opus 4.6
  // claude-sonnet-4-6 → Claude Sonnet 4.6
  // claude-haiku-4-5-20251001 → Claude Haiku 4.5
  const cleaned = modelId
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, ""); // strip date suffix
  const parts = cleaned.split("-");
  if (parts.length >= 3) {
    const family = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const version = parts.slice(1).join(".");
    return `Claude ${family} ${version}`;
  }
  return "Claude";
}

export function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((b) => {
        if (b.type === "text") return b.text || "";
        if (b.type === "tool_use") return `[tool: ${b.name || "?"}]`;
        if (b.type === "tool_result") return "[tool result]";
        return "";
      })
      .join(" ");
  }
  return content ? String(content) : "";
}

export function truncate(text, len = 120) {
  const flat = text.replace(/\n/g, " ").trim();
  return flat.length > len ? flat.slice(0, len) + "..." : flat;
}

export function utcToLocal(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr);
  } catch {
    return null;
  }
}

function fmtInZone(date, fmt, tz) {
  const opts12 = {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, timeZoneName: "short", timeZone: tz,
  };
  const opts24 = { ...opts12, hour12: false };
  const optsShort = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: tz };

  if (fmt === "short") return date.toLocaleTimeString("en-US", optsShort);
  if (fmt === "24h") return date.toLocaleString("en-US", opts24);
  return date.toLocaleString("en-US", opts12);
}

export function formatTimecode(date, fmt = "full") {
  if (!date) return "[NO TIMECODE]";

  const sysTz = getSystemTimezone();
  const homeTz = getHomeTimezone();
  const local = fmtInZone(date, fmt, sysTz);

  if (sysTz === homeTz) return local;

  // Traveling — show home time with timezone abbreviation in parentheses
  const homeTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, timeZoneName: "short", timeZone: homeTz,
  });
  return `${local} (${homeTime})`;
}

export function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hours}h${rem}m`;
}

export function loadSession(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  const messages = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.type === "user" || entry.type === "assistant") {
        messages.push(entry);
      }
    } catch {
      continue;
    }
  }
  return messages;
}

export function getAllSessions() {
  const sessions = [];
  let projectDirs;
  try {
    projectDirs = readdirSync(PROJECTS_DIR);
  } catch {
    return sessions;
  }

  for (const projName of projectDirs) {
    const projPath = join(PROJECTS_DIR, projName);
    try {
      if (!statSync(projPath).isDirectory()) continue;
    } catch {
      continue;
    }

    for (const file of readdirSync(projPath)) {
      if (!file.endsWith(".jsonl")) continue;
      const stem = file.slice(0, -6);
      if (!UUID_RE.test(stem)) continue;
      sessions.push({
        path: join(projPath, file),
        sessionId: stem,
        project: projName,
      });
    }
  }
  return sessions;
}

export function enrichSession(info) {
  const messages = loadSession(info.path);
  if (!messages.length) return null;

  const firstTs = utcToLocal(messages[0].timestamp);
  const lastTs = utcToLocal(messages[messages.length - 1].timestamp);

  let preview = "";
  for (const msg of messages) {
    if (msg.type === "user") {
      preview = truncate(extractText(msg.message?.content || ""), 80);
      break;
    }
  }

  return {
    ...info,
    firstTs,
    lastTs,
    messageCount: messages.length,
    preview,
  };
}

export function findSessionFile(sessionId) {
  let projectDirs;
  try {
    projectDirs = readdirSync(PROJECTS_DIR);
  } catch {
    return null;
  }

  for (const projName of projectDirs) {
    const projPath = join(PROJECTS_DIR, projName);
    try {
      if (!statSync(projPath).isDirectory()) continue;
    } catch {
      continue;
    }

    // Exact match
    const exact = join(projPath, `${sessionId}.jsonl`);
    try {
      statSync(exact);
      return exact;
    } catch {
      // try partial
    }

    // Partial match
    for (const file of readdirSync(projPath)) {
      if (file.endsWith(".jsonl") && file.includes(sessionId)) {
        return join(projPath, file);
      }
    }
  }
  return null;
}
