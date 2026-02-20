---
description: 'Analyze auto-approve decisions to identify safe patterns for auto-allowing and validate existing rules'
---

# Auto-Approve Hook Optimizer

You are a security-conscious CLI analyst. Analyze the auto-approve decision log to identify patterns that can be safely auto-allowed, validate existing rules, and maintain the log file.

## Overview

This command performs a comprehensive analysis of the auto-approve hook's decision log to:
1. Validate that existing ALLOW rules aren't too permissive
2. Identify frequently asked commands that could be safely auto-allowed
3. Check for overly broad DENY patterns causing false positives
4. Clean up the decision log after analysis

## Files Involved

| File | Purpose |
|------|---------|
| `.claude/auto_approve_safe.decisions.jsonl` | Decision log (read, then archive/clear) |
| `.claude/scripts/auto_approve_safe.rules.json` | Rules config (read, then edit) |
| `.claude/auto_approve_safe.decisions.archived.jsonl` | Archive file (create/append) |

---

## Workflow Phases

<steps>

### Phase 0: Pre-flight Checks

1. **Check hook configuration** by reading `.claude/settings.json` (project) or `~/.claude/settings.json` (global).
   - Look for `auto_approve_safe.py` in the hooks configuration
   - If not found: Stop with message "Hook not configured in settings.json. Install @torka/claude-qol and configure the PreToolUse hook first."

2. **Read the decision log** at `.claude/auto_approve_safe.decisions.jsonl`
   - If missing or empty: Stop with message "No decision log found. Run some operations first to generate decisions."
   - For large files (>2000 lines), use Read tool with offset/limit to process in chunks

3. **THEN read the rules file** at `.claude/scripts/auto_approve_safe.rules.json`
   - Read this AFTER the decision log (sequential, not parallel) to avoid cascade failures
   - If missing: Warn but continue (will create recommendations only)

4. **Display summary to user:**
   ```
   Decision Log Summary
   ====================
   Total entries: {count}
   Date range: {earliest} to {latest}

   By decision type:
   - ALLOW: {count} ({percentage}%)
   - DENY:  {count} ({percentage}%)
   - ASK:   {count} ({percentage}%)

   By tool:
   - Bash:  {count}
   - Read:  {count}
   - Write: {count}
   - Edit:  {count}
   - Other: {count}
   ```

### Phase 1: Parse and Categorize

**IMPORTANT**: Parse the decision log using the Read tool and your own reasoning.
Do NOT use `python3 -c` or bash commands to parse JSONL — these trigger the
auto-approve hook and cause self-referential ASK prompts. Each line of the JSONL
file is a standalone JSON object that you can parse directly from the Read output.

Parse all JSONL entries and group by decision type:

**For Bash commands:**
- Extract the `command` field from `input`
- Normalize: collapse whitespace, extract base command and flags
- Group similar commands (e.g., all `npm run *` together)

**For File operations (Read/Write/Edit):**
- Extract the `file_path` field from `input`
- Identify path patterns (e.g., `src/**/*.ts`, `docs/*.md`)
- Group by directory structure

**Create internal data structures:**
```
allow_entries: [{ts, tool, input, reason}]
deny_entries:  [{ts, tool, input, reason}]
ask_entries:   [{ts, tool, input, reason}]
```

### Phase 2: Analyze ALLOW Decisions (Validate Safety)

Review all ALLOW decisions and flag potentially unsafe patterns:

| Red Flag | Detection Logic | Severity |
|----------|-----------------|----------|
| Outside project dir | Path contains `..` or absolute path not under cwd | HIGH |
| Arbitrary code exec | `eval`, `exec`, backticks without known safe args | HIGH |
| Network with dynamic URL | `curl`/`wget` with variable/constructed URLs | MEDIUM |
| Dangerous flags | `--force`, `-f`, `--no-verify`, `--hard` | MEDIUM |
| Recursive delete | `rm -r` or `rm -rf` (should be deny) | HIGH |
| Sensitive file deletion | `rm` targets .env, .key, credentials, etc. | HIGH |
| Pipe to shell | `| bash`, `| sh`, `| zsh` | HIGH |
| Broad allow without deny | Program-head allow (e.g., `^npm\s+`) exists but no deny for dangerous subcommands | MEDIUM |

**Output format:**
```
POTENTIAL UNSAFE ALLOWS
=======================
[HIGH] Command: rm -rf node_modules
       Reason: Matched "Matches safe allowlist" but contains recursive delete
       Recommendation: Add to deny_patterns or remove from allow_patterns

[MEDIUM] Command: curl https://example.com/script.sh
         Reason: Network command allowed but URL could vary
         Recommendation: Review if URL should be restricted

DENY COVERAGE GAPS
==================
[MEDIUM] Broad allow: "^npm\\s+\\S+(\\s+.*)?$"
         Missing deny for: npm publish, npm unpublish
         Recommendation: Add "^npm\\s+(publish|unpublish)\\b" to deny_patterns
```

### Phase 3: Analyze DENY Decisions (Check for False Positives)

Identify overly broad deny patterns that might block safe operations:

**Look for:**
- Commands blocked by overly broad deny patterns (e.g., `kill <pid>` blocked by `pkill -9` pattern)
- Safe paths incorrectly matching `sensitive_paths` (e.g., `src/utils/tokenizer.ts` matching `token`)
- Git command variants not covered by the git allowlist (e.g., `git config --get` blocked)
- Common dev commands that should be allowed (e.g., `npm run build` blocked)

**Output format:**
```
POTENTIAL FALSE POSITIVES
=========================
[ ] Pattern: "\\bpkill\\s+-9" may be too broad
    Blocked: kill 12345 (targeted PID, not mass kill)
    Suggestion: Add "^kill\\s+\\d+$" to allow_patterns

[ ] Pattern: sensitive_paths matching development files
    Blocked: src/utils/token-schema.ts
    Suggestion: Sensitive path pattern should use file extension anchoring
```

### Phase 4: Analyze ASK Decisions (Auto-Allow Candidates)

**This is the most valuable optimization phase.**

Identify commands that were asked repeatedly and could be safely auto-allowed.

**Criteria for safe auto-allow:**

| Criterion | Threshold | Rationale |
|-----------|-----------|-----------|
| Frequency | 3+ occurrences | Indicates common workflow |
| Containment | All paths within project | No system-wide impact |
| Predictable scope | No shell expansion, no `*` in dangerous positions | Bounded behavior |
| Reversibility | File ops can be undone, commands are read-only or local | Low risk |
| No dangerous flags | No `--force`, `-f` unless safe context | Explicit caution |

**Pre-filter: Splitter-Bug Artifacts**

Before analyzing ASK decisions, identify entries where the "reason" field contains
a fragment that looks like a split artifact (partial quoted string, trailing backslash,
unmatched parenthesis). These were caused by the old splitter splitting inside quotes
and are now auto-resolved. Report count but skip from analysis.

Example artifacts to detect:
- reason contains `\"` or `\'` (partial quote)
- reason segment ends with `\` (truncated escape)
- reason segment starts with a lowercase word that isn't a known command
- reason contains a jq-style filter fragment (e.g., `.[] | .path`)

**Pre-filter: Redirect-Suffix Artifacts**

Before analyzing ASK decisions, identify entries where the command would match an
allow pattern if `2>&1`, `2>/dev/null`, or trailing `&` were stripped. These are now
auto-resolved by `strip_safe_suffixes()` and require no pattern changes. Report count
but skip from analysis.

Example artifacts to detect:
- Command ends with `2>&1` or `2>/dev/null`
- Command ends with `&` (backgrounding)
- Same command without suffix matches an existing allow pattern

**Process each unique ASK pattern:**
1. Count occurrences
2. Check all criteria
3. If all pass, generate a specific regex pattern
4. Include sample commands that would match

**Pattern Generation Heuristics:**

| Observed Pattern | Action | Notes |
|-----------------|--------|-------|
| `npm run custom-script` | Already covered | Broad npm allow handles all npm subcommands |
| `git stash pop` | Already covered | Broad git allow handles all git subcommands |
| `npx tsx script.ts` | Add to npx allowlist | npx requires explicit package allowlisting |
| `docker compose up` | Add to docker allow | Docker operational commands need explicit allow |
| `node -e "code"` | Skip (leave as ask) | Inline execution stays as ask by design |
| `python3 -c "code"` | Skip (leave as ask) | Inline execution stays as ask by design |
| `vercel ls` | Add allow pattern | New program not yet in allowlist |

**Output format:**
```
AUTO-ALLOW CANDIDATES
=====================
[ ] 1. Pattern: "^npx\\s+tsx\\s+[^|;&]+$"
       Matches: npx tsx script.ts, npx tsx src/test.ts
       Occurrences: 4
       Safety: All within project, no shell operators

[ ] 2. Pattern: "^python3?\\s+[\\w/.-]+\\.py$"
       Matches: python script.py, python3 src/tools/gen.py
       Occurrences: 3
       Safety: Simple script execution, no args could be dangerous
```

### Phase 5: Present Consolidated Recommendations

**Deny Shadowing Check**

Before presenting allow pattern recommendations, test each proposed pattern against
all existing deny_patterns. If a deny pattern would match the same commands:

- Flag the conflict: "Warning: This pattern would be shadowed by deny pattern: {deny_regex}"
- Either: drop the recommendation, OR suggest a deny pattern carve-out if safe
- Never recommend an allow pattern that would be entirely blocked by deny

First, display the splitter fix impact and redirect-suffix fix impact (from pre-filtered entries in Phase 4):

```
SPLITTER FIX IMPACT
====================
{N} ASK entries were caused by the old quote-splitting bug.
These are now automatically resolved and require no pattern changes.

REDIRECT-SUFFIX FIX IMPACT
===========================
{N} ASK entries were caused by redirect suffixes (2>&1, 2>/dev/null).
These are now automatically resolved by strip_safe_suffixes() and require no pattern changes.
```

Then display a structured summary of all recommendations:

```
==============================================
AUTO-APPROVE HOOK OPTIMIZATION RECOMMENDATIONS
==============================================

ALLOW PATTERNS TO ADD:
[ ] 1. "^npx\\s+tsx\\s+[^|;&]+$"
       Sample: npx tsx script.ts (4 occurrences)

[ ] 2. "^python3?\\s+[\\w/.-]+\\.py$"
       Sample: python script.py (3 occurrences)

DENY PATTERNS TO FIX:
[ ] 1. Current: "\\brm\\s+.*(-r|-rf)"
       Replace: "\\brm\\s+.*\\s+(-r|-rf|--recursive)\\b"
       Reason: Current pattern matches non-recursive rm

SENSITIVE PATHS TO ADD:
[ ] None identified

DENY PATTERNS TO ADD:
[ ] 1. "^npm\\s+(publish|unpublish)\\b"
       Reason: Broad npm allow covers these; need explicit deny for registry operations

WARNINGS (Manual Review Needed):
! 2 potentially unsafe ALLOW decisions detected
  See Phase 2 output for details
```

### Phase 6: User Confirmation

Use `AskUserQuestion` tool with `multiSelect: true` to let user select changes:

**Question 1: Pattern Selection**
```
header: "Patterns"
question: "Which patterns would you like to add to the allow list?"
options:
  - label: "All recommended patterns"
    description: "Add all {N} patterns identified as safe"
  - label: "Select individually"
    description: "Review and select patterns one by one"
  - label: "None"
    description: "Skip pattern changes"
```

If "Select individually" chosen, ask about each pattern.

**Question 2: Log Cleanup**
```
header: "Log cleanup"
question: "How should the decision log be handled after analysis?"
options:
  - label: "Archive"
    description: "Move entries to .archived.jsonl file, clear active log"
  - label: "Delete"
    description: "Remove log file entirely (hook will recreate)"
  - label: "Keep"
    description: "Leave log unchanged for future analysis"
```

### Phase 7: Apply Changes

Based on user selections:

1. **Read current rules JSON** (if it exists)

2. **For each approved pattern to add:**
   - Append to the appropriate array (`allow_patterns`, `deny_patterns`, or `sensitive_paths`)
   - Validate the regex is syntactically correct before adding

3. **For each pattern to fix:**
   - Find and replace the old pattern with the new one
   - Verify the replacement was made

4. **Write the updated JSON file**
   - Use proper JSON formatting (2-space indent)
   - Preserve comments if any (though JSON doesn't support them)

5. **Validate the written file:**
   - Read it back
   - Parse as JSON to ensure validity
   - If invalid, restore from backup and report error

### Phase 8: Decision Log Cleanup

Based on user's cleanup selection:

**Archive:**
```bash
# Append current entries to archive
cat .claude/auto_approve_safe.decisions.jsonl >> .claude/auto_approve_safe.decisions.archived.jsonl
# Clear active log
echo "" > .claude/auto_approve_safe.decisions.jsonl
```

**Delete:**
Use the Write tool to write an empty string to `.claude/auto_approve_safe.decisions.jsonl`.
This clears the log without triggering the auto-approve hook.
Do NOT use `rm` — it triggers ASK for paths containing `/`.

**Keep:**
- No action taken
- Log remains for future analysis

### Phase 9: Summary Report

Display final summary:

```
=================================
AUTO-APPROVE OPTIMIZATION COMPLETE
=================================

Changes Applied:
- Added {N} new allow patterns
- Fixed {N} deny patterns
- Added {N} sensitive paths

Log Cleanup:
- Action: {Archive|Delete|Keep}
- Entries processed: {count}
- Archive location: .claude/auto_approve_safe.decisions.archived.jsonl

To Revert Changes:
  git checkout .claude/scripts/auto_approve_safe.rules.json

Next Steps:
- Test the new patterns by running common commands
- Re-run /optimize-auto-approve-hook after more usage data
```

</steps>

---

## Safety Rules

**CRITICAL - These rules must NEVER be violated:**

1. **NEVER auto-apply changes** - Always require explicit user confirmation via AskUserQuestion
2. **NEVER remove deny patterns** without explicit warning that this could allow dangerous commands
3. **NEVER add patterns that match outside the project directory**
4. **Validate all regex patterns** before writing to ensure they're syntactically correct
5. **For programs with broad allows (git, npm, yarn, pnpm), recommend deny patterns** for dangerous subcommands rather than more allow patterns. For programs without broad allows (npx, docker, node), prefer specific allow patterns.
6. **Always provide revert instructions** so user can undo changes easily
7. **Back up before modifying** - Read the file content before editing so it can be restored if needed
8. **Check rm targets against sensitive_paths** - Never recommend auto-allowing rm commands that could target .env, .key, credentials, or other sensitive files

---

## Regex Pattern Guidelines

When generating regex patterns for `allow_patterns`:

| Goal | Pattern Technique | Example |
|------|-------------------|---------|
| Match exact command | Anchors `^...$` | `^npm run build$` |
| Allow arguments | Character class `[^|;&]+` | `^npx tsx [^|;&]+$` |
| Word boundary | `\\b` | `\\bgit\\b` prevents matching `digit` |
| Exclude dangerous | Negative lookahead `(?!...)` | `^rm (?!.*-rf)` |
| Optional spaces | `\\s+` or `\\s*` | `^npm\\s+run` |
| Filename only | `[\\w.-]+` | `^cat [\\w.-]+$` |
| Path characters | `[\\w/.@-]+` | `^cat [\\w/.@-]+$` |

**Escape requirements in JSON:**
- Single backslash in regex → double backslash in JSON string
- `\s` → `\\s`
- `\b` → `\\b`

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Decision log missing | Stop with helpful message |
| Rules file missing | Continue with recommendations only |
| Invalid JSON in rules | Report error, do not modify |
| Regex syntax error | Skip that pattern, warn user |
| Write permission denied | Report error with chmod suggestion |
| Archive file locked | Report error, suggest manual cleanup |

---

## Example Session

```
User: /optimize-auto-approve-hook

Claude: Analyzing auto-approve decision log...

Decision Log Summary
====================
Total entries: 153
Date range: 2026-01-15 to 2026-01-16

By decision type:
- ALLOW: 142 (92.8%)
- DENY:  3 (2.0%)
- ASK:   8 (5.2%)

[Phase 2-4 analysis output...]

AUTO-APPROVE HOOK OPTIMIZATION RECOMMENDATIONS
==============================================

ALLOW PATTERNS TO ADD:
[1] "^npx\\s+tsx\\s+[^|;&]+$"
    Sample: npx tsx _bmad-output/tmp/generate-theme.ts (4 occurrences)

[Question] Which patterns would you like to add?
> All recommended patterns

[Question] How should the decision log be handled?
> Archive

Applying changes...

AUTO-APPROVE OPTIMIZATION COMPLETE
==================================

Changes Applied:
- Added 1 new allow pattern

Log Cleanup:
- Action: Archive
- Entries processed: 153
- Archive location: .claude/auto_approve_safe.decisions.archived.jsonl

To Revert Changes:
  git checkout .claude/scripts/auto_approve_safe.rules.json
```
