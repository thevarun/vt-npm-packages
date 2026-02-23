---
name: 'step-01b-continue'
description: 'Resume audit-fix execution from existing sidecar state'
workflow_path: '{project-root}/.claude/skills/fix-audit-findings'
thisStepFile: '{workflow_path}/steps/step-01b-continue.md'
planStepFile: '{workflow_path}/steps/step-01-plan.md'
executeStepFile: '{workflow_path}/steps/step-02-execute.md'
completeStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/SKILL.md'
output_folder: '{project-root}/_bmad-output/deep-audit'
sidecar_file: '{output_folder}/audit-fix-state.yaml'
---

# Step 1b: Continue — Resume from Existing Session

## STEP GOAL:
Load the sidecar state file, present a resume summary, and route to the appropriate next step based on execution state.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- NEVER generate content without user input
- CRITICAL: Read this complete step file before taking any action
- CRITICAL: When loading the next step, read the entire next step file first
- YOU ARE A FACILITATOR, not a content generator
- Follow the sequence exactly — do not skip, reorder, or optimize

### Step-Specific Rules:
- NEVER modify source code in this step — resume routing only
- NEVER delete or overwrite the sidecar — only append/update fields
- If sidecar is corrupted or unparseable → offer to restart from step-01

## Sequence of Instructions

### 1. Load Sidecar State

Read `{sidecar_file}` and parse the YAML contents.

**If file is missing or corrupted:**
- Display: `Sidecar state file is missing or corrupted.`
- Ask: `[R] Restart planning from scratch | [X] Exit`
- On [R] → delete sidecar if exists, load `{planStepFile}`
- On [X] → exit workflow

Extract key state:
- `started_at`, `last_updated`
- `git.branch`, `git.base`
- `current_phase`, `current_theme`
- `themes_completed`, `themes_pending`, `themes_skipped`, `themes_failed`
- `execution_plan` (phase assignments)
- `execution_log`

### 2. Validate Git Context

Check current git branch:
```bash
git branch --show-current
```

**If not on the sidecar's `git.branch`:**
- Display: `Expected branch: {git.branch}, currently on: {current_branch}`
- Ask: `[S] Switch to {git.branch} | [C] Continue on current branch | [X] Exit`
- On [S]: `git checkout {git.branch}`
- On [C]: Update sidecar `git.branch` to current branch

### 3. Present Resume Summary

Display:
```
=== AUDIT FIX SESSION — RESUME ===

Started:    {started_at}
Last Active: {last_updated}
Branch:     {git.branch}

Progress:
  Completed: {count} themes  {list IDs}
  Pending:   {count} themes  {list IDs}
  Skipped:   {count} themes  {list IDs}
  Failed:    {count} themes  {list IDs}

Current Phase: {current_phase}
Current Theme: {current_theme or "none (between themes)"}
```

If `current_theme` is not null:
- Display: `Last session was interrupted during theme {current_theme}.`
- Display theme name and what phase of execution it was in

### 4. Show Recent Execution Log

Display the last 5 entries from `execution_log`:
```
Recent Activity:
  {timestamp} — {theme}: {event} ({details})
```

### 5. Present MENU OPTIONS

Display:
```
OPTIONS:
[C] Continue execution from where we left off
[P] Re-enter planning (view/modify the execution plan)
[L] Show full execution log
[X] Exit without executing
```

**On [C]:**
- Update sidecar `last_updated` to current timestamp
- Determine routing:
  - If `themes_pending` is empty AND `themes_failed` is empty → load `{completeStepFile}`
  - If `current_theme` is not null (interrupted mid-theme):
    - The theme will be re-attempted from scratch by the sub-agent
    - Ensure it's still in `themes_pending` (if it was moved, add it back)
  - Load `{executeStepFile}`

**On [P]:**
- Load `{planStepFile}` (will detect sidecar but allow re-planning)
- User can view themes, skip/restore, re-filter phases
- On re-confirm, sidecar is updated (not recreated)

**On [L]:**
- Display full execution log
- Return to menu

**On [X]:**
- Exit workflow

## SYSTEM SUCCESS/FAILURE METRICS

### SUCCESS:
- Sidecar loaded and validated
- User chose a routing option
- Routed to correct next step

### SYSTEM FAILURE:
- Sidecar could not be loaded or parsed
- Git state is irrecoverably mismatched
- User exited

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
