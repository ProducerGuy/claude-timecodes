#!/bin/bash
# Claude Timecodes — injects timestamps into every conversation exchange
INPUT=$(cat /dev/stdin)
LOCAL_TC=$(date "+%Y-%m-%d %I:%M:%S %p %Z")
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')

# Check for home timezone config
CONFIG="$HOME/.claude/timecodes.json"
if [ -f "$CONFIG" ]; then
  HOME_TZ=$(jq -r '.homeTimezone // empty' "$CONFIG")
  SYS_TZ=$(date "+%Z")
  if [ -n "$HOME_TZ" ]; then
    HOME_ABBR=$(TZ="$HOME_TZ" date "+%Z")
    if [ "$SYS_TZ" != "$HOME_ABBR" ]; then
      HOME_TC=$(TZ="$HOME_TZ" date "+%I:%M:%S %p %Z")
      LOCAL_TC="$LOCAL_TC ($HOME_TC)"
    fi
  fi
fi

if [ "$EVENT" = "UserPromptSubmit" ]; then
  jq -n --arg tc "[TIMECODE $LOCAL_TC]" '{"additionalContext": $tc}'
elif [ "$EVENT" = "Stop" ]; then
  jq -n --arg tc "$LOCAL_TC" '{"systemMessage": $tc}'
elif [ "$EVENT" = "PostToolUse" ]; then
  TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
  jq -n --arg tc "[TIMECODE $LOCAL_TC] tool:$TOOL" '{"additionalContext": $tc}'
fi
