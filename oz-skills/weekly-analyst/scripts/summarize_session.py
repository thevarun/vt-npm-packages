#!/usr/bin/env python3
"""
Extract metadata from a single Claude Code session JSONL file.

Usage:
    python3 summarize_session.py <session.jsonl>

Single-pass extraction — no LLM needed. Outputs JSON to stdout with:
event counts, tool usage, commands/skills detected, errors, timestamps, etc.
"""

import json
import sys
import os
import re
from collections import defaultdict
from datetime import datetime


COMMAND_PATTERN = re.compile(r"<command-name>(/[^<]+)</command-name>")
MAX_ERROR_SAMPLES = 5
MAX_ERROR_SAMPLE_LEN = 200


def summarize_session(filepath):
    file_size = os.path.getsize(filepath)
    session_id = os.path.basename(filepath).replace(".jsonl", "")

    event_counts = defaultdict(int)
    tool_counts = defaultdict(int)
    total_tool_calls = 0
    commands_detected = set()
    skills_detected = set()
    error_samples = []
    error_count = 0
    git_branches = set()
    has_sidechains = False
    first_timestamp = None
    last_timestamp = None
    line_count = 0
    user_message_count = 0

    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            line_count += 1

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type", "unknown")
            event_counts[event_type] += 1

            # Track timestamps
            ts_str = event.get("timestamp")
            if ts_str:
                try:
                    ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    if first_timestamp is None or ts < first_timestamp:
                        first_timestamp = ts
                    if last_timestamp is None or ts > last_timestamp:
                        last_timestamp = ts
                except ValueError:
                    pass

            # Track git branches
            branch = event.get("gitBranch")
            if branch:
                git_branches.add(branch)

            # Track sidechains
            if event.get("isSidechain"):
                has_sidechains = True

            msg = event.get("message", {})
            content = msg.get("content", "")

            # User messages
            if event_type == "user" and not event.get("isMeta"):
                user_message_count += 1

                # Detect commands
                if isinstance(content, str):
                    matches = COMMAND_PATTERN.findall(content)
                    commands_detected.update(matches)

            # Assistant messages
            elif event_type == "assistant" and isinstance(content, list):
                for item in content:
                    if not isinstance(item, dict):
                        continue

                    item_type = item.get("type", "")

                    # Count tool calls
                    if item_type == "tool_use":
                        tool_name = item.get("name", "unknown")
                        tool_counts[tool_name] += 1
                        total_tool_calls += 1

                        # Detect skill invocations
                        if tool_name == "Skill":
                            skill_input = item.get("input", {})
                            skill_name = skill_input.get("skill", "")
                            if skill_name:
                                skills_detected.add(skill_name)

                    # Count errors
                    if item.get("is_error"):
                        error_count += 1
                        error_text = item.get("content", "")
                        if isinstance(error_text, str) and len(error_samples) < MAX_ERROR_SAMPLES:
                            error_samples.append(
                                error_text[:MAX_ERROR_SAMPLE_LEN]
                            )

                    # Also check tool_result for errors
                    if item_type == "tool_result" and item.get("is_error"):
                        error_count += 1
                        error_text = item.get("content", "")
                        if isinstance(error_text, str) and len(error_samples) < MAX_ERROR_SAMPLES:
                            error_samples.append(
                                error_text[:MAX_ERROR_SAMPLE_LEN]
                            )

    # Calculate duration
    duration_minutes = None
    if first_timestamp and last_timestamp:
        duration_minutes = round(
            (last_timestamp - first_timestamp).total_seconds() / 60
        )

    output = {
        "session_id": session_id,
        "line_count": line_count,
        "file_size_bytes": file_size,
        "duration_minutes": duration_minutes,
        "event_counts": dict(event_counts),
        "user_message_count": user_message_count,
        "tool_calls": {
            "total": total_tool_calls,
            "by_tool": dict(
                sorted(tool_counts.items(), key=lambda x: x[1], reverse=True)
            ),
        },
        "commands_detected": sorted(commands_detected),
        "skills_detected": sorted(skills_detected),
        "errors": {
            "count": error_count,
            "samples": error_samples,
        },
        "git_branches": sorted(git_branches),
        "has_sidechains": has_sidechains,
        "first_timestamp": first_timestamp.isoformat() if first_timestamp else None,
        "last_timestamp": last_timestamp.isoformat() if last_timestamp else None,
    }

    return output


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <session.jsonl>", file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"Error: file not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    result = summarize_session(filepath)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
