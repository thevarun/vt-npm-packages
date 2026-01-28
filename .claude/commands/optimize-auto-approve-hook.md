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

1. **Read the decision log** at `.claude/auto_approve_safe.decisions.jsonl`
   - If missing or empty: Stop with message "No decision log found. Run some operations first to generate decisions."

2. **Read the rules file** at `.claude/scripts/auto_approve_safe.rules.json`
   - If missing: Warn but continue (will create recommendations only)

3. **Display summary to user:**
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
| Pipe to shell | `| bash`, `| sh`, `| zsh` | HIGH |

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
```

### Phase 3: Analyze DENY Decisions (Check for False Positives)

Identify overly broad deny patterns that might block safe operations:

**Look for:**
- Non-recursive `rm` blocked by recursive pattern (e.g., `rm file.txt` blocked by `rm.*-rf`)
- Safe paths incorrectly matching `sensitive_paths` (e.g., `src/utils/tokenizer.ts` matching `token`)
- Common dev commands that should be allowed (e.g., `npm run build` blocked)

**Output format:**
```
POTENTIAL FALSE POSITIVES
=========================
[ ] Pattern: "\\brm\\s+.*(-r|-rf)" may be too broad
    Blocked: rm file.txt (no -r flag)
    Suggestion: Use "\\brm\\s+.*\\s+(-r|-rf|--recursive)\\b" instead

[ ] Pattern: "\\btoken" in sensitive_paths
    Blocked: src/utils/tokenizer.ts
    Suggestion: Use "\\btoken(?!izer)" or "\\btokens?\\b"
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

**Process each unique ASK pattern:**
1. Count occurrences
2. Check all criteria
3. If all pass, generate a specific regex pattern
4. Include sample commands that would match

**Pattern Generation Heuristics:**

| Observed Pattern | Generated Regex | Notes |
|-----------------|-----------------|-------|
| `npx tsx script.ts` | `^npx\\s+tsx\\s+[^\\|;&]+$` | No pipes or chains |
| `npm run custom-script` | `^npm\\s+run\\s+[\\w-]+$` | Word chars and hyphen only |
| `cat package.json` | Already covered by existing rules | Skip |
| `rm file.txt` (non-recursive) | `^rm\\s+(?!.*(-r\\|-rf))\\S+$` | Negative lookahead for -r |

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

Display a structured summary of all recommendations:

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
```bash
rm .claude/auto_approve_safe.decisions.jsonl
# Hook will recreate on next decision
```

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
5. **Prefer specific patterns** over broad ones (e.g., `^npm run build$` over `^npm run .*$`)
6. **Always provide revert instructions** so user can undo changes easily
7. **Back up before modifying** - Read the file content before editing so it can be restored if needed

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
