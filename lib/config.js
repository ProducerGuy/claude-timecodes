import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { CLAUDE_DIR } from "./paths.js";

const CONFIG_PATH = join(CLAUDE_DIR, "timecodes.json");
const CLAUDE_JSON = join(homedir(), ".claude.json");

function detectDisplayName() {
  try {
    const data = JSON.parse(readFileSync(CLAUDE_JSON, "utf-8"));
    const name = data?.oauthAccount?.display_name;
    if (name && name.trim()) return name.trim();
  } catch {}
  return null;
}

const DEFAULTS = {
  homeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function loadConfig() {
  try {
    return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

export function getHomeTimezone() {
  return loadConfig().homeTimezone;
}

export function getSystemTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function isTraveling() {
  return getSystemTimezone() !== getHomeTimezone();
}

export function getDisplayName() {
  const config = loadConfig();
  if (config.displayName) return config.displayName;
  return detectDisplayName() || "You";
}

export { detectDisplayName };
