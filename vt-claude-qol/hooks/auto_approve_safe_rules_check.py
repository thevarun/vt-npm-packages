#!/usr/bin/env python3
"""
Lint auto_approve_safe rules for duplicates, invalid regex, and likely-dead patterns.

Usage:
  python3 vt-claude-qol/hooks/auto_approve_safe_rules_check.py [path ...]
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Iterable


DEFAULT_RULES = [
    Path(__file__).resolve().parent / "auto_approve_safe.rules.json",
]


def load_rules(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def iter_patterns(rules: dict) -> Iterable[tuple[str, str]]:
    for key in ("allow_patterns", "deny_patterns", "sensitive_paths"):
        for pattern in rules.get(key, []):
            yield key, pattern


def compile_patterns(section: str, patterns: list[str]) -> list[str]:
    errors: list[str] = []
    flags = re.IGNORECASE if section in ("allow_patterns", "deny_patterns") else 0
    for pattern in patterns:
        try:
            re.compile(pattern, flags)
        except re.error as exc:
            errors.append(f"{section}: {pattern} -> {exc}")
    return errors


def find_duplicates(patterns: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    dups: list[str] = []
    for pattern in patterns:
        seen[pattern] = seen.get(pattern, 0) + 1
    for pattern, count in sorted(seen.items()):
        if count > 1:
            dups.append(f"{pattern} (x{count})")
    return dups


def find_dead_by_split(patterns: list[str]) -> list[str]:
    """Flag patterns containing literal && or ; outside character classes."""
    dead: list[str] = []
    for pattern in patterns:
        # Strip character classes [...]  before checking for && / ;
        stripped = re.sub(r"\[.*?\]", "", pattern)
        if "&&" in stripped or re.search(r"(?<!\\);", stripped):
            dead.append(pattern)
    return dead


def extract_command_heads(pattern: str) -> set[str]:
    """
    Heuristic extraction of leading command(s) for overlap checks.
    Handles ^cmd and ^(cmd1|cmd2|...)\\s+ forms.
    """
    if not pattern.startswith("^"):
        return set()

    group_match = re.match(r"^\^\(([^)]+)\)\\s+", pattern)
    if group_match:
        heads = set()
        for token in group_match.group(1).split("|"):
            token = token.strip()
            if re.fullmatch(r"[A-Za-z0-9_-]+", token):
                heads.add(token)
        return heads

    word_match = re.match(r"^\^([A-Za-z0-9_-]+)\\b", pattern)
    if word_match:
        return {word_match.group(1)}

    return set()


def find_potential_overlaps(patterns: list[str]) -> list[str]:
    """
    Conservative, heuristic warnings: flags permissive patterns that may
    subsume more specific ones for the same command head.
    """
    by_head: dict[str, list[str]] = {}
    for pattern in patterns:
        for head in extract_command_heads(pattern):
            by_head.setdefault(head, []).append(pattern)

    warnings: list[str] = []
    permissive_markers = (".*", "(\\s+.*)?")
    for head, group in sorted(by_head.items()):
        permissive = [p for p in group if any(m in p for m in permissive_markers)]
        if permissive and len(group) > 1:
            warnings.append(
                f"{head}: permissive patterns may overlap others -> "
                + ", ".join(permissive)
            )
    return warnings


def main() -> int:
    paths = [Path(p) for p in sys.argv[1:]] or DEFAULT_RULES
    any_fail = False

    for path in paths:
        if not path.exists():
            print(f"[missing] {path}")
            any_fail = True
            continue

        rules = load_rules(path)
        print(f"\n== {path} ==")

        for section in ("allow_patterns", "deny_patterns", "sensitive_paths"):
            patterns = rules.get(section, [])
            errors = compile_patterns(section, patterns)
            if errors:
                any_fail = True
                print(f"[invalid regex] {section}")
                for err in errors:
                    print(f"  - {err}")

            dups = find_duplicates(patterns)
            if dups:
                print(f"[duplicates] {section}")
                for dup in dups:
                    print(f"  - {dup}")

        allow = rules.get("allow_patterns", [])
        dead = find_dead_by_split(allow)
        if dead:
            print("[dead by split] allow_patterns")
            for pattern in dead:
                print(f"  - {pattern}")

        overlaps = find_potential_overlaps(allow)
        if overlaps:
            print("[possible overlaps] allow_patterns")
            for warning in overlaps:
                print(f"  - {warning}")

        allow_set = set(allow)
        deny_set = set(rules.get("deny_patterns", []))
        both = sorted(allow_set & deny_set)
        if both:
            print("[allow/deny conflict]")
            for pattern in both:
                print(f"  - {pattern}")

    return 1 if any_fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
