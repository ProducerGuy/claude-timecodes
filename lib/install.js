import { readFileSync, writeFileSync, copyFileSync, chmodSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CLAUDE_DIR } from "./paths.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = join(CLAUDE_DIR, "settings.json");
const HOOK_SRC = join(__dirname, "..", "hooks", "timecode.sh");
const HOOK_DST = join(CLAUDE_DIR, "timecode.sh");

const HOOK_EVENTS = ["UserPromptSubmit", "Stop", "PostToolUse"];

function makeHookEntry() {
  return {
    hooks: [
      {
        type: "command",
        command: "~/.claude/timecode.sh",
      },
    ],
  };
}

export function installHooks() {
  // Copy hook script
  copyFileSync(HOOK_SRC, HOOK_DST);
  chmodSync(HOOK_DST, 0o755);
  console.log(`Installed hook script → ${HOOK_DST}`);

  // Read or create settings
  let settings = {};
  try {
    settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
  } catch {
    // fresh settings
  }

  if (!settings.hooks) settings.hooks = {};

  let changed = false;
  for (const event of HOOK_EVENTS) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = [makeHookEntry()];
      changed = true;
    } else {
      // Check if our hook is already there
      const hasOurs = settings.hooks[event].some((entry) =>
        entry.hooks?.some((h) => h.command?.includes("timecode.sh"))
      );
      if (!hasOurs) {
        settings.hooks[event].push(makeHookEntry());
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
    console.log(`Updated ${SETTINGS_PATH}`);
  } else {
    console.log("Hooks already installed.");
  }

  console.log("\nTimecodes are now active for all Claude Code sessions.");
  console.log("Events hooked: UserPromptSubmit, Stop, PostToolUse");
}

export function uninstallHooks() {
  let settings;
  try {
    settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
  } catch {
    console.log("No settings file found.");
    return;
  }

  if (!settings.hooks) {
    console.log("No hooks configured.");
    return;
  }

  let changed = false;
  for (const event of HOOK_EVENTS) {
    if (!settings.hooks[event]) continue;
    const filtered = settings.hooks[event].filter(
      (entry) => !entry.hooks?.some((h) => h.command?.includes("timecode.sh"))
    );
    if (filtered.length !== settings.hooks[event].length) {
      settings.hooks[event] = filtered;
      if (!filtered.length) delete settings.hooks[event];
      changed = true;
    }
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  if (changed) {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
    console.log(`Removed timecode hooks from ${SETTINGS_PATH}`);
  } else {
    console.log("No timecode hooks found to remove.");
  }
}
