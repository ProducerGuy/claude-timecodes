import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { CLAUDE_DIR } from "./paths.js";

const CONFIG_PATH = join(CLAUDE_DIR, "timecodes.json");

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
