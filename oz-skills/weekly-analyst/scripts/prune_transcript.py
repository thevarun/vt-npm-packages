#!/usr/bin/env python3
"""
Nash transcript pruner — reduces large Claude Code session JSONL files
for analysis by the Opus subagent.

Usage:
    python3 prune_transcript.py <output_dir> <session_file> [session_file ...]

Size tiers:
    < 2MB   — pass through unchanged
    2-10MB  — prune: keep user messages, truncate tool I/O, drop metadata
    > 10MB  — aggressive: also collapse consecutive exploratory tool calls
"""

import json
import sys
import os
import copy


# JSONL structure reference:
#   Top-level: { type, message: { role, content }, uuid, timestamp, ... }
#   type='user':       message.content is a string (the user's text)
#   type='assistant':  message.content is a list of items:
#     - { type: 'text', text: '...' }
#     - { type: 'tool_use', name: '...', input: {...} }
#     - { type: 'tool_result', content: '...', is_error: bool }
#   type='progress'|'system'|'file-history-snapshot': metadata events (skip)


def prune_transcript(filepath):
    size = os.path.getsize(filepath)

    # Under 2MB: pass through unchanged
    if size < 2_000_000:
        with open(filepath, "r") as f:
            return f.read()

    aggressive = size > 10_000_000
    lines = []
    pruned_count = 0
    prev_was_explore = False

    with open(filepath, "r") as f:
        for raw_line in f:
            raw_line = raw_line.strip()
            if not raw_line:
                continue
            try:
                event = json.loads(raw_line)
            except json.JSONDecodeError:
                lines.append(raw_line)
                continue

            event_type = event.get("type", "")
            msg = event.get("message", {})
            content = msg.get("content", "")

            # Skip metadata events
            if event_type not in ("user", "assistant"):
                continue

            # Always keep user messages in full
            if event_type == "user":
                prev_was_explore = False
                lines.append(raw_line)
                continue

            # For assistant messages, content is a list of items
            if not isinstance(content, list):
                lines.append(raw_line)
                continue

            # Keep full event if any item is an error
            has_error = any(
                isinstance(item, dict) and item.get("is_error", False)
                for item in content
            )
            if has_error:
                prev_was_explore = False
                lines.append(raw_line)
                continue

            # Aggressive mode (>10MB): collapse consecutive exploratory tool calls
            if aggressive:
                tool_names = [
                    item.get("name", "")
                    for item in content
                    if isinstance(item, dict) and item.get("type") == "tool_use"
                ]
                is_explore = (
                    all(n in ("Glob", "Grep", "Read") for n in tool_names)
                    and len(tool_names) > 0
                )
                # Also treat events with only tool_results as exploratory
                if not tool_names:
                    is_explore = (
                        all(
                            isinstance(item, dict)
                            and item.get("type") == "tool_result"
                            for item in content
                            if isinstance(item, dict)
                        )
                        and len(content) > 0
                    )
                if is_explore and prev_was_explore:
                    pruned_count += 1
                    continue
                prev_was_explore = is_explore
            else:
                prev_was_explore = False

            # Truncate large content items
            event_copy = copy.deepcopy(event)
            msg_copy = event_copy["message"]
            modified = False

            for item in msg_copy["content"]:
                if not isinstance(item, dict):
                    continue
                item_type = item.get("type", "")

                # Truncate tool_use inputs (long string values in input dict)
                if item_type == "tool_use":
                    inp = item.get("input", {})
                    if isinstance(inp, dict):
                        for k, v in inp.items():
                            if isinstance(v, str) and len(v) > 500:
                                inp[k] = v[:200] + " [truncated]"
                                modified = True

                # Truncate tool_result content
                elif item_type == "tool_result":
                    val = item.get("content", "")
                    if isinstance(val, str) and len(val) > 1000:
                        item["content"] = val[:200] + " [truncated]"
                        modified = True

                # Truncate long text blocks
                elif item_type == "text":
                    val = item.get("text", "")
                    if isinstance(val, str) and len(val) > 2000:
                        item["text"] = val[:500] + " [truncated]"
                        modified = True

            if modified:
                lines.append(json.dumps(event_copy))
            else:
                lines.append(raw_line)

    result = "\n".join(lines)
    if pruned_count > 0:
        result = (
            f"[... {pruned_count} consecutive exploratory results pruned ...]\n"
            + result
        )
    return result


def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <output_dir> <session_file> [...]")
        sys.exit(1)

    outdir = sys.argv[1]
    os.makedirs(outdir, exist_ok=True)

    for filepath in sys.argv[2:]:
        result = prune_transcript(filepath)
        outpath = os.path.join(outdir, os.path.basename(filepath) + ".pruned")
        with open(outpath, "w") as f:
            f.write(result)
        orig_size = os.path.getsize(filepath)
        new_size = len(result)
        ratio = (1 - new_size / orig_size) * 100 if orig_size > 0 else 0
        print(
            f"{os.path.basename(filepath)}: "
            f"{orig_size / 1_000_000:.1f}MB -> {new_size / 1_000_000:.1f}MB "
            f"({ratio:.0f}% reduction)"
        )
        print(f"  -> {outpath}")


if __name__ == "__main__":
    main()
