#!/usr/bin/env python3
"""
Claude Code Hook: Auto-approve safe tool usage for solo dev workflows.

Handles PreToolUse events to:
- Auto-allow known-safe commands (read-only, tests, linting)
- Deny obviously dangerous commands
- Defer everything else to normal permission system ("ask")

Install:
  1. mkdir -p ~/.claude/scripts && chmod 700 ~/.claude/scripts
  2. Save this file to ~/.claude/scripts/auto_approve_safe.py
  3. chmod +x ~/.claude/scripts/auto_approve_safe.py
  4. Add hook config to ~/.claude/settings.json
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Max-autonomy default:
# - Allow reads/searches
# - Allow edits/writes except for sensitive paths
# - Allow bash commands only if they match allowlist (supports simple compound commands)
#
# Debugging:
# Set this to True temporarily to log every decision to a local jsonl file.
ENABLE_DECISION_LOG = True


def load_rules() -> dict:
    """Load rules from global and project-specific config files."""
    rules = {"allow_patterns": [], "deny_patterns": [], "sensitive_paths": []}

    # # Load global rules
    # global_rules_path = Path.home() / ".claude" / "hooks" / "auto_approve_safe.rules.json"
    # if global_rules_path.exists():
    #     try:
    #         with open(global_rules_path) as f:
    #             global_rules = json.load(f)
    #             for key in rules:
    #                 rules[key].extend(global_rules.get(key, []))
    #     except (json.JSONDecodeError, IOError) as e:
    #         print(f"Warning: Could not load global rules: {e}", file=sys.stderr)

    # Load project-specific rules (merge with global)
    # Use __file__ to find rules relative to script location (works from subdirectories)
    project_rules_path = Path(__file__).parent / "auto_approve_safe.rules.json"
    if project_rules_path.exists():
        try:
            with open(project_rules_path) as f:
                project_rules = json.load(f)
                for key in rules:
                    rules[key].extend(project_rules.get(key, []))
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not load project rules: {e}", file=sys.stderr)

    return rules


def matches_any_pattern(text: str, patterns: list[str]) -> bool:
    """Check if text matches any of the given regex patterns."""
    for pattern in patterns:
        try:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        except re.error:
            continue
    return False


def check_sensitive_path(file_path: str, sensitive_patterns: list[str]) -> bool:
    """Check if file path matches sensitive path patterns."""
    if not file_path:
        return False
    return matches_any_pattern(file_path, sensitive_patterns)


def split_compound_shell_command(command: str) -> list[str]:
    """Split a shell command on compound operators, respecting quotes and subshells.

    Note: Patterns using (\\s*2>&1)?$ work because we do NOT split on > or bare &.
    Only &&, ||, ;, and | (outside quotes/subshells) trigger splits.
    """
    command = (command or "").strip()
    if not command:
        return []

    segments = []
    current = []
    in_single_quote = False
    in_double_quote = False
    in_backtick = False
    paren_depth = 0       # tracks $(...) and (...) nesting
    brace_depth = 0       # tracks ${...} and { ...; } nesting
    i = 0

    while i < len(command):
        ch = command[i]

        # Handle backslash escapes -- not inside single quotes
        if ch == '\\' and i + 1 < len(command) and not in_single_quote:
            current.append(ch)
            current.append(command[i + 1])
            i += 2
            continue

        # Track quote state
        if ch == "'" and not in_double_quote and not in_backtick:
            in_single_quote = not in_single_quote
            current.append(ch)
            i += 1
            continue
        if ch == '"' and not in_single_quote and not in_backtick:
            in_double_quote = not in_double_quote
            current.append(ch)
            i += 1
            continue
        if ch == '`' and not in_single_quote:
            in_backtick = not in_backtick
            current.append(ch)
            i += 1
            continue

        # Track subshell/brace depth when outside quotes
        if not in_single_quote and not in_double_quote and not in_backtick:
            if ch == '(':
                paren_depth += 1
            elif ch == ')' and paren_depth > 0:
                paren_depth -= 1
            elif ch == '{':
                brace_depth += 1
            elif ch == '}' and brace_depth > 0:
                brace_depth -= 1

        in_any_nesting = (in_single_quote or in_double_quote or in_backtick
                          or paren_depth > 0 or brace_depth > 0)

        # Only split on operators when completely outside all nesting
        if not in_any_nesting:
            # Check for && or ||
            if i + 1 < len(command) and command[i:i+2] in ('&&', '||'):
                seg = ''.join(current).strip()
                if seg:
                    segments.append(seg)
                current = []
                i += 2
                continue
            # Check for ; or |
            if ch in (';', '|', '\n'):
                seg = ''.join(current).strip()
                if seg:
                    segments.append(seg)
                current = []
                i += 1
                continue

        current.append(ch)
        i += 1

    seg = ''.join(current).strip()
    if seg:
        segments.append(seg)
    return segments


def is_shell_file_read_command(command: str) -> bool:
    """Detect shell file-read commands that could exfiltrate secrets.
    Excludes write/redirect patterns (cat > file, cat << EOF)."""
    cmd = (command or "").strip()
    if not re.search(r"^\s*(cat|head|tail|less)\b", cmd, re.IGNORECASE):
        return False
    # If > >> or << appears anywhere, it's a redirect/heredoc, not a read
    if re.search(r"\s(>|>>|<<)\s", cmd):
        return False
    return True


def is_shell_destructive_command(command: str) -> bool:
    """Detect shell commands that delete/overwrite files."""
    return bool(re.search(r"^\s*(rm|mv|>\s*)\b", command or "", re.IGNORECASE))


_SAFE_SUFFIX_RE = re.compile(
    r"(?:\s+2>&1|\s+2>/dev/null|\s+>/dev/null|\s+&>/dev/null|\s+2>&-)*"
    r"(?:\s+&)?\s*$"
)


def strip_safe_suffixes(segment: str) -> str:
    """Remove harmless redirections/backgrounding before allowlist matching."""
    return _SAFE_SUFFIX_RE.sub("", segment).rstrip()


def summarize_tool_input(tool_name: str, tool_input: dict) -> dict:
    """Small, reviewable summary for decision logs."""
    if tool_name == "Bash":
        return {"command": tool_input.get("command", "")}
    if tool_name in ("Read", "Write", "Edit", "MultiEdit"):
        return {"file_path": tool_input.get("file_path", "")}
    return {"tool_input_keys": list((tool_input or {}).keys())}


def log_decision(tool_name: str, tool_input: dict, decision: str, reason: str) -> None:
    """Append a decision record to a jsonl file when debugging is enabled."""
    if not ENABLE_DECISION_LOG:
        return

    # Use __file__ to find log path relative to script location (works from subdirectories)
    log_path = Path(__file__).parent.parent / "auto_approve_safe.decisions.jsonl"
    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "cwd": str(Path.cwd()),
        "tool_name": tool_name,
        "decision": decision,
        "reason": reason,
        "input": summarize_tool_input(tool_name, tool_input or {}),
    }

    try:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        # Never break tool execution because logging failed.
        print(f"Warning: Could not write decision log: {e}", file=sys.stderr)


def make_decision(tool_name: str, tool_input: dict, rules: dict) -> tuple[str, str]:
    """
    Determine permission decision for a tool call.

    Returns:
        tuple: (decision, reason)
            decision: "allow", "deny", or "ask"
            reason: Human-readable explanation

    Notes on integration with Claude Code:
      - "allow" short-circuits Claude Code prompts
      - "deny" blocks the tool
      - "ask" defers to Claude Code's built-in permission system

    This file is tuned for maximum autonomy by default, while:
      - denying obvious dangerous commands
      - blocking edits to sensitive paths
      - prompting for reads of sensitive paths
    """
    tool_input = tool_input or {}

    # Handle Bash commands
    if tool_name == "Bash":
        command = (tool_input.get("command", "") or "").strip()
        if not command:
            return "ask", "Empty command"

        segments = split_compound_shell_command(command)
        if not segments:
            return "ask", "Empty command"

        # Deny wins if any segment matches a deny pattern.
        for seg in segments:
            if matches_any_pattern(seg, rules["deny_patterns"]):
                return "deny", "Command matches dangerous pattern"

        # If a segment looks like it could read a file, apply sensitive path checks.
        # (Prevents silently allowing: `cat .env`, `head ~/.ssh/id_rsa`, etc.)
        for seg in segments:
            if is_shell_file_read_command(seg) and matches_any_pattern(seg, rules["sensitive_paths"]):
                return "ask", "Bash command may read sensitive data"

        # Block destructive commands targeting sensitive paths
        # (Prevents auto-approving: `rm .env`, `mv .key backup`, etc.)
        for seg in segments:
            if is_shell_destructive_command(seg) and matches_any_pattern(seg, rules["sensitive_paths"]):
                return "deny", "Destructive command targets sensitive file"

        # Max autonomy, but still require an allowlist match per segment.
        # Add common "glue" patterns that agents use.
        glue_allow_patterns = [
            r"^cd\s+\S+(\s+.*)?$",
            r"^pushd\s+\S+(\s+.*)?$",
            r"^popd$",
            r"^export\s+[A-Za-z_][A-Za-z0-9_]*=.*$",
            r"^[A-Za-z_][A-Za-z0-9_]*=.*$",  # bare var assignment
            r"^(true|false)$",
            r"^#.*$",  # shell comments
            r"^cat\s+/(?:private/)?tmp/claude-\d+/[^\s;|&]+$",  # Claude temp files
            r"^source\s+\S+$",
            r"^echo\s*('([^']*)'|\"([^\"]*)\")?\s*$",  # simple echo
            r"^wait(\s+\d+)*$",
            r"^command\s+-v\s+\S+$",  # POSIX which
            r"^printf\s+[^|;&]+$",
        ]

        for seg in segments:
            seg_stripped = strip_safe_suffixes(seg)
            if matches_any_pattern(seg, rules["allow_patterns"]):
                continue
            if seg_stripped != seg and matches_any_pattern(seg_stripped, rules["allow_patterns"]):
                continue
            if matches_any_pattern(seg, glue_allow_patterns):
                continue
            if seg_stripped != seg and matches_any_pattern(seg_stripped, glue_allow_patterns):
                continue
            return "ask", f"Command not in allowlist: {seg}"

        return "allow", "Matches safe allowlist"

    # Handle Read tool - check for sensitive files
    if tool_name == "Read":
        file_path = tool_input.get("file_path", "")
        if check_sensitive_path(file_path, rules["sensitive_paths"]):
            return "ask", "File may contain sensitive data"
        return "allow", "Read operations are generally safe"

    # Handle Grep/Glob - generally safe read-only operations
    if tool_name in ("Grep", "Glob"):
        return "allow", "Search operations are read-only"

    # Handle Write/Edit - max autonomy by default; still protect sensitive paths.
    if tool_name in ("Write", "Edit", "MultiEdit"):
        file_path = tool_input.get("file_path", "")
        if check_sensitive_path(file_path, rules["sensitive_paths"]):
            return "deny", "Cannot modify sensitive files"
        return "allow", "Write operations are generally safe"

    # Default: defer to normal permission system
    return "ask", "Unknown tool, deferring to permission system"


def output_decision(decision: str, reason: str) -> None:
    """Output the hook decision in Claude Code's expected format."""
    if decision == "ask":
        return  # No output = defer to Claude Code's internal permission system
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            "permissionDecisionReason": reason
        }
    }
    print(json.dumps(output))


def main():
    """Main entry point for the hook."""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            output_decision("ask", "No input received")
            return

        data = json.loads(input_data)

        # Extract tool information
        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {})

        # Load rules
        rules = load_rules()

        # Make decision
        decision, reason = make_decision(tool_name, tool_input, rules)

        # Optional debug log
        log_decision(tool_name, tool_input, decision, reason)

        # Output result
        output_decision(decision, reason)

    except json.JSONDecodeError as e:
        print(f"Error parsing input JSON: {e}", file=sys.stderr)
        output_decision("ask", "Failed to parse input")
    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        output_decision("ask", f"Hook error: {e}")


if __name__ == "__main__":
    main()


