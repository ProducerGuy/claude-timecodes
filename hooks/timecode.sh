#!/bin/bash
# Claude Timecodes — injects timestamps into every conversation exchange
INPUT=$(cat /dev/stdin)
LOCAL_TC=$(date "+%Y-%m-%d %I:%M:%S %p %Z")
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')

# Read config
CONFIG="$HOME/.claude/timecodes.json"
USER_NAME="You"
MODEL_LABEL="Claude"
if [ -f "$CONFIG" ]; then
  # Display name
  NAME=$(jq -r '.displayName // empty' "$CONFIG")
  if [ -n "$NAME" ]; then
    USER_NAME="$NAME"
  fi

  # Model name
  MODEL=$(jq -r '.currentModel // empty' "$CONFIG")
  if [ -n "$MODEL" ]; then
    MODEL_LABEL="$MODEL"
  fi

  # Travel timezone
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

if [ "$EVENT" = "SessionStart" ]; then
  # Capture model name at session start
  RAW_MODEL=$(echo "$INPUT" | jq -r '.model // empty')
  if [ -n "$RAW_MODEL" ] && [ -f "$CONFIG" ]; then
    # Format: claude-opus-4-6 → Claude Opus 4.6
    FORMATTED=$(echo "$RAW_MODEL" | sed 's/^claude-//' | sed 's/-[0-9]\{8\}$//' | awk -F- '{printf "Claude %s", toupper(substr($1,1,1)) substr($1,2); if(NF>=2) printf " %s",$2; for(i=3;i<=NF;i++) printf ".%s",$i; print ""}')
    jq --arg m "$FORMATTED" '.currentModel = $m' "$CONFIG" > "${CONFIG}.tmp" && mv "${CONFIG}.tmp" "$CONFIG"
  fi
elif [ "$EVENT" = "UserPromptSubmit" ]; then
  jq -n --arg ctx "[TIMECODE $LOCAL_TC]" --arg msg "$USER_NAME · $LOCAL_TC" \
    '{"additionalContext": $ctx, "systemMessage": $msg}'
elif [ "$EVENT" = "Stop" ]; then
  jq -n --arg msg "$MODEL_LABEL · $LOCAL_TC" '{"systemMessage": $msg}'
elif [ "$EVENT" = "PostToolUse" ]; then
  TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
  jq -n --arg ctx "[TIMECODE $LOCAL_TC] tool:$TOOL" --arg msg "$MODEL_LABEL · $LOCAL_TC · $TOOL" \
    '{"additionalContext": $ctx, "systemMessage": $msg}'
fi
