#!/usr/bin/env python3
"""
Extract and index Claude Code sessions for a given ISO week.

Usage:
    python3 extract_sessions.py <data_dir> [--week 2026-W09]

Parses history.jsonl and scans project directories to build a structured
session index. Defaults to the current ISO week if --week is not specified.

Output: JSON to stdout.
"""

import json
import sys
import os
import argparse
from datetime import datetime, timezone, timedelta
from collections import defaultdict


def iso_week_bounds(week_str):
    """Return (start, end) datetimes for an ISO week string like '2026-W09'."""
    year, week = week_str.split("-W")
    # Monday of the given ISO week
    jan4 = datetime(int(year), 1, 4, tzinfo=timezone.utc)
    start_of_week1 = jan4 - timedelta(days=jan4.isoweekday() - 1)
    start = start_of_week1 + timedelta(weeks=int(week) - 1)
    end = start + timedelta(days=7)
    return start, end


def current_iso_week():
    """Return current ISO week as string like '2026-W09'."""
    now = datetime.now(timezone.utc)
    year, week, _ = now.isocalendar()
    return f"{year}-W{week:02d}"


def decode_project_name(encoded_dir):
    """
    Decode project name from path-encoded directory name.
    e.g., '-Users-varuntorka-Coding-FamilyTree' → 'FamilyTree'
    """
    parts = encoded_dir.strip("-").split("-")
    # The project name is typically the last component after 'Coding' or similar
    # Heuristic: take everything after the last path-like separator
    # Common pattern: -Users-<user>-Coding-<project>
    for i, part in enumerate(parts):
        if part.lower() == "coding" and i + 1 < len(parts):
            return "-".join(parts[i + 1 :])
    # Fallback: last component
    return parts[-1] if parts else encoded_dir


def parse_history(data_dir, week_start, week_end):
    """Parse history.jsonl and return entries within the given week."""
    history_path = os.path.join(data_dir, "history.jsonl")
    entries = []

    if not os.path.exists(history_path):
        return entries

    with open(history_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            ts_ms = entry.get("timestamp")
            if ts_ms is None:
                continue

            ts = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
            if week_start <= ts < week_end:
                entries.append(
                    {
                        "display": entry.get("display", "").strip(),
                        "timestamp": ts.isoformat(),
                        "project": entry.get("project", ""),
                    }
                )

    return entries


def scan_project_sessions(data_dir, week_start, week_end):
    """
    Scan data/projects/ for JSONL files and check their timestamps.
    Returns a dict mapping (project_dir, session_id) to session info.
    """
    projects_dir = os.path.join(data_dir, "projects")
    sessions = {}

    if not os.path.exists(projects_dir):
        return sessions

    for project_dir in os.listdir(projects_dir):
        project_path = os.path.join(projects_dir, project_dir)
        if not os.path.isdir(project_path):
            continue

        # Walk to find all .jsonl files (including in subagents/ subdirs)
        for root, dirs, files in os.walk(project_path):
            for fname in files:
                if not fname.endswith(".jsonl"):
                    continue

                fpath = os.path.join(root, fname)
                session_id = fname.replace(".jsonl", "")
                file_size = os.path.getsize(fpath)

                # Quick timestamp check: read first and last few lines
                first_ts = None
                last_ts = None

                try:
                    with open(fpath, "r") as f:
                        for line in f:
                            line = line.strip()
                            if not line:
                                continue
                            try:
                                event = json.loads(line)
                                ts_str = event.get("timestamp")
                                if ts_str:
                                    ts = datetime.fromisoformat(
                                        ts_str.replace("Z", "+00:00")
                                    )
                                    if first_ts is None:
                                        first_ts = ts
                                    last_ts = ts
                            except (json.JSONDecodeError, ValueError):
                                continue
                except Exception:
                    continue

                if first_ts is None:
                    continue

                # Check if session overlaps with the target week
                if last_ts < week_start or first_ts >= week_end:
                    continue

                # Determine if this is a subagent session
                rel_path = os.path.relpath(fpath, projects_dir)
                is_subagent = "subagents" in rel_path

                key = (project_dir, session_id)
                if key not in sessions or not is_subagent:
                    sessions[key] = {
                        "session_id": session_id,
                        "project": decode_project_name(project_dir),
                        "project_dir": project_dir,
                        "file_path": os.path.relpath(fpath, data_dir),
                        "file_size_bytes": file_size,
                        "timestamp_first": first_ts.isoformat(),
                        "timestamp_last": last_ts.isoformat() if last_ts else None,
                        "is_subagent": is_subagent,
                        "display_texts": [],
                    }

    return sessions


def main():
    parser = argparse.ArgumentParser(
        description="Extract Claude Code sessions for a given ISO week"
    )
    parser.add_argument("data_dir", help="Path to the data directory")
    parser.add_argument(
        "--week",
        default=current_iso_week(),
        help="ISO week (e.g., 2026-W09). Defaults to current week.",
    )
    args = parser.parse_args()

    week_start, week_end = iso_week_bounds(args.week)

    # Parse history for display texts
    history_entries = parse_history(args.data_dir, week_start, week_end)

    # Build a map of project path → display texts
    project_displays = defaultdict(list)
    for entry in history_entries:
        project_path = entry["project"]
        if entry["display"]:
            project_displays[project_path].append(entry["display"])

    # Scan project directories for sessions
    sessions = scan_project_sessions(args.data_dir, week_start, week_end)

    # Attach display texts from history to sessions
    for key, session in sessions.items():
        project_dir = session["project_dir"]
        # Try to match history entries by project path
        for project_path, displays in project_displays.items():
            encoded = project_path.replace("/", "-")
            if encoded == project_dir or project_dir in encoded:
                session["display_texts"] = displays[:10]  # cap at 10
                break

    # Build output
    session_list = sorted(
        sessions.values(),
        key=lambda s: s.get("timestamp_first", ""),
        reverse=True,
    )

    # Summary stats
    total_size = sum(s["file_size_bytes"] for s in session_list)
    project_counts = defaultdict(int)
    for s in session_list:
        if not s["is_subagent"]:
            project_counts[s["project"]] += 1

    output = {
        "week": args.week,
        "period": {
            "start": week_start.strftime("%Y-%m-%d"),
            "end": (week_end - timedelta(days=1)).strftime("%Y-%m-%d"),
        },
        "sessions": session_list,
        "summary": {
            "total_sessions": len([s for s in session_list if not s["is_subagent"]]),
            "total_sessions_with_subagents": len(session_list),
            "total_size_mb": round(total_size / 1_000_000, 1),
            "projects": dict(project_counts),
        },
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
