---
name: 'step-03-complete'
description: 'Final validation, completion report, PR creation option'
workflow_path: '{project-root}/.claude/skills/fix-audit-findings'
thisStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/SKILL.md'
output_folder: '{project-root}/_bmad-output/deep-audit'
findings_file: '{output_folder}/findings.md'
state_file: '{output_folder}/state.json'
sidecar_file: '{output_folder}/audit-fix-state.yaml'
---

# Step 3: Complete — Report & Finalize

## STEP GOAL:
Run final validation, generate a comprehensive completion report, and offer PR creation.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- NEVER generate content without user input
- CRITICAL: Read this complete step file before taking any action
- CRITICAL: When loading next step, read the entire next step file first
- YOU ARE A FACILITATOR, not a content generator
- Follow the sequence exactly

### Step-Specific Rules:
- Do NOT modify source code in this step
- Report generation is the primary output
- If final validation fails, report it but do not attempt fixes (that was step 2's job)

## Sequence of Instructions

### 1. Load Final State

Read `{sidecar_file}` to get:
- All execution data: `themes_completed`, `themes_skipped`, `themes_failed`
- `execution_log` entries
- `git.branch`, `git.base`
- `started_at`

Read `{findings_file}` for the full findings registry.
Read `{state_file}` to get `report_path`. Read the report file for theme details.

### 2. Run Final Validation

Execute:
```bash
npm run lint && npm run check-types && npm test && npm run build
```

Record result as `final_validation: pass/fail` with details.

If validation fails:
- Display warning: `Final validation has failures. These may have been present in baseline or introduced during refactoring.`
- Display the specific errors
- Continue with report generation (do not attempt fixes)

### 3. Calculate Statistics

Compute:
- `total_themes`: count of all themes (completed + skipped + failed)
- `themes_completed_count`, `themes_skipped_count`, `themes_failed_count`
- `total_findings`: count of all findings from `findings.md`
- `findings_addressed`: unique finding IDs across all completed themes' `findings_addressed` fields
- `findings_unaddressed`: findings not in `findings_addressed`
- `files_changed`: unique files across all completed themes
- `total_commits`: count of execution_log entries with a `commit` field
- `completion_percentage`: `themes_completed_count / total_themes * 100`

### 4. Generate Completion Report

Create report at `{output_folder}/audit-fix-report-{date}.md`:

```markdown
# Audit Fix Completion Report

Generated: {timestamp}

## Summary

| Metric | Value |
|--------|-------|
| Started | {started_at} |
| Completed | {now} |
| Branch | {git.branch} → {git.base} |
| Themes Attempted | {total_themes} |
| Themes Completed | {themes_completed_count} |
| Themes Skipped | {themes_skipped_count} |
| Themes Failed | {themes_failed_count} |
| Findings Addressed | {findings_addressed_count} / {total_findings} |
| Files Changed | {files_changed_count} |
| Commits | {total_commits} |
| Final Validation | {pass/fail} |

## Completion: {completion_percentage}%

## Per-Theme Results

### Completed

| Theme | Name | Phase | Risk | Findings | Files Changed | Commit |
|-------|------|-------|------|----------|--------------|--------|
{for each completed theme from execution_log}
| {id} | {name} | {phase} | {risk} | {finding_ids} | {file_count} | {commit_hash} |

### Skipped

| Theme | Name | Reason |
|-------|------|--------|
{for each skipped theme}

### Failed

| Theme | Name | Reason |
|-------|------|--------|
{for each failed theme}

## Findings Coverage

### Addressed ({count})
{list of addressed finding IDs with titles, grouped by severity}

### Unaddressed ({count})
{list of unaddressed finding IDs with titles and severity}
{note which theme would have addressed each, if applicable}

## Execution Log

{chronological log entries from sidecar}

## Final Validation
{pass/fail with details}
```

### 5. Update Sidecar

Update `{sidecar_file}`:
- Set `completed_at: "{timestamp}"`
- Set `current_phase: "complete"`
- Update `last_updated`

### 6. Present Summary & Menu

Display:
```
=== AUDIT FIX COMPLETE ===

Themes: {completed}/{total} completed ({completion_percentage}%)
Findings: {addressed}/{total_findings} addressed
Branch: {git.branch}
Report: {report_path}
Final Validation: {PASS/FAIL}
```

If there are skipped or failed themes:
```
Remaining work:
  Skipped: {count} themes ({list IDs})
  Failed:  {count} themes ({list IDs})
```

Display menu:
```
OPTIONS:
[P] Create Pull Request
[D] Show git diff summary (vs {git.base})
[R] View full report
[X] Exit
```

**On [P]:**

Get diff stats and commit log:
```bash
git diff --stat {git.base}...HEAD
git log --oneline {git.base}...HEAD
```

Create PR:
```bash
gh pr create --title "refactor: fix audit findings ({themes_completed_count}/{total_themes} themes)" --body "$(cat <<'EOF'
## Summary
Automated refactoring from deep-audit findings.

- **Themes completed**: {themes_completed_count}/{total_themes}
- **Findings addressed**: {findings_addressed_count}/{total_findings}
- **Final validation**: {pass/fail}

### Themes Implemented
{for each completed theme: "- {id}: {name} ({finding_count} findings)"}

### Skipped/Failed
{if any: list with reasons}

## Test plan
- [ ] CI passes (lint, types, tests, build)
- [ ] Manual smoke test of affected areas
{if any ui_changes themes: "- [ ] Visual review of UI changes"}
- [ ] Review individual commits for per-theme changes

Full report: `{report_path}`
EOF
)"
```

Display PR URL when created.

**On [D]:**
```bash
git diff --stat {git.base}...HEAD
```
Display result, return to menu.

**On [R]:**
Display full report contents, return to menu.

**On [X]:**
Display: `Session state saved. Run /fix-audit-findings to resume or review.`
Exit workflow.

## SYSTEM SUCCESS/FAILURE METRICS

### SUCCESS:
- Completion report generated with accurate statistics
- Sidecar marked as complete
- User presented with actionable next steps

### SYSTEM FAILURE:
- Report generation failed
- Statistics are inconsistent with actual state

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
