---
name: 'step-01b-continue'
description: 'Resume epic execution from previous session using sidecar state'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-01b-continue.md'
nextStepFile: '{workflow_path}/steps/step-02-orchestrate.md'
completionStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/workflow.md'

# State files
sidecarFolder: '{output_folder}/epic-executions'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'
---

# Step 1B: Epic Execution Continuation

## STEP GOAL:

To resume epic execution from a previous session by loading the sidecar state, determining the exact resume point (which story, which phase), and seamlessly continuing autonomous execution.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Orchestrator-Specific Rules:

- 🛑 NEVER modify completed story results
- 🔄 CRITICAL: Determine exact resume point from sidecar state
- 📋 YOU ARE AN ORCHESTRATOR resuming execution

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator
- ✅ You are resuming a previously started epic execution
- ✅ You maintain execution continuity without loss of progress
- ✅ You communicate resume status clearly

### Step-Specific Rules:

- 🎯 Focus ONLY on analyzing state and resuming
- 🚫 FORBIDDEN to re-execute completed stories
- 💬 Confirm resume point with user
- 🚪 DETECT if all stories are already complete

## EXECUTION PROTOCOLS:

- 🎯 Show current state analysis before resuming
- 💾 Update sidecar with resume timestamp
- 📖 Preserve all completed story data
- 🚫 FORBIDDEN to modify historical execution data

## CONTEXT BOUNDARIES:

- Sidecar file contains complete execution state
- Previous stories may be completed, in-progress, or pending
- Current phase indicates where to resume within a story
- Sprint-status.yaml reflects actual story states
- Worktree context affects where execution continues

## CONTINUATION SEQUENCE:

### 0. Context Awareness

**Note:** This step is routed from step-01-init which already detected:
- Whether we're in a worktree or main repo
- Which sidecar file to use (passed as `sidecar_path` context)

If `sidecar_path` was NOT specified by router (edge case):

```bash
# Detect worktree context
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
GIT_COMMON=$(git rev-parse --git-common-dir 2>/dev/null)
CURRENT_PATH=$(pwd)

# Determine sidecar search location
if [ "$GIT_DIR" != "$GIT_COMMON" ]; then
  # In worktree - sidecar is in main repo
  MAIN_REPO_PATH=$(dirname "$GIT_COMMON")
  SIDECAR_FOLDER="$MAIN_REPO_PATH/_bmad-output/epic-executions"
else
  # In main repo - use local folder
  SIDECAR_FOLDER="{sidecarFolder}"
fi

# Find sidecar with matching worktree_path (if in worktree)
# Parse each epic-*-state.yaml and match worktree_config.worktree_path == CURRENT_PATH
```

**Worktree-specific notes:**
- Sidecar files are ALWAYS created in the **main repo's** `_bmad-output/epic-executions/`
- When in a worktree, you must derive the main repo path to find the sidecar
- `worktree_config.worktree_path` in sidecar identifies which worktree it belongs to

### 1. Load Sidecar State

Read the sidecar file at the path determined above (use `sidecar_path` from router context, or derive it as shown in section 0):

Extract:
- `epic_execution_state.epic_file`: Path to epic being executed
- `epic_execution_state.epic_name`: Name of the epic
- `epic_execution_state.epic_number`: Epic number
- `epic_execution_state.current_story`: Story that was being processed (may be null)
- `epic_execution_state.current_phase`: Phase within story (create/dev/visual/review/commit)
- `epic_execution_state.stories_completed`: List of finished stories
- `epic_execution_state.stories_pending`: List of remaining stories
- `epic_execution_state.stories_skipped`: List of skipped stories
- `epic_execution_state.stories_failed`: List of failed stories
- `epic_execution_state.started_at`: Original start timestamp
- `epic_execution_state.last_updated`: Last activity timestamp
- `execution_mode.type`: "worktree" | "main"
- `worktree_config` (if worktree mode):
  - `worktree_path`: Absolute path to worktree
  - `branch_name`: Feature branch name
  - `main_repo_path`: Path to main repository

### 2. Validate Execution Context

**If sidecar indicates worktree mode:**

Check current working directory matches expected worktree:

```bash
EXPECTED_PATH=$(grep 'worktree_path:' sidecar.yaml | awk '{print $2}')
CURRENT_PATH=$(pwd)

if [ "$CURRENT_PATH" != "$EXPECTED_PATH" ]; then
  # Wrong directory - warn user
fi
```

**If mismatch detected:**
```
⚠️ Context Mismatch

This epic execution was configured for worktree mode:
  Expected: {worktree_path}
  Current:  {current_path}

Options:
[P] Proceed anyway (may cause issues)
[X] Exit and navigate to correct directory
```

### 3. Analyze Execution State

Determine resume scenario:

**Scenario A: Mid-Story Resume**
If `current_story` is set and `current_phase` is not "between_stories":
- Resume at the specific phase of that story
- Example: Story 2.3 was in "dev" phase → resume dev

**Scenario B: Between Stories**
If `current_story` is null or phase is "between_stories":
- Start next story from `stories_pending[0]`

**Scenario C: All Stories Complete**
If `stories_pending` is empty:
- Route to step-03-complete for report generation and cleanup

### 4. Display Resume Summary

```
**Welcome Back!**

**Epic:** {epic_name} (Epic {epic_number})
**Mode:** {execution_mode.type}
**Started:** {started_at}
**Last Activity:** {last_updated}

**Location:**
{If worktree: "Worktree: {worktree_path}"}
{If main: "Main repository"}

**Progress:**
- ✅ Completed: {X} stories
- ⏸️ Skipped: {X} stories
- ❌ Failed: {X} stories
- ⏳ Pending: {X} stories

**Resume Point:**
{Based on scenario - describe where we'll resume}

Example outputs:
- 'Resuming Story 2.3 at development phase'
- 'Starting Story 2.4 (previous story completed)'
- 'All stories complete - ready to generate report'
```

### 5. Validate Resume Readiness

Quick prerequisite check:
- Epic file still exists and readable
- Sprint-status.yaml accessible
- Required agents still available
- If worktree: worktree still exists and is valid

If any critical issue → report and ask user how to proceed.

### 6. Confirm Continuation Intent

```
**Ready to continue?**

Options:
[C] Continue from {resume point}
[R] Restart epic from beginning (will lose progress)
[S] Show detailed execution log
```

### 7. Handle Menu Selection

#### IF C (Continue):
1. CRITICAL: Execution log entries in the sidecar are **immutable history**.
   When updating the sidecar, APPEND new entries to the `execution_log` array -
   **never replace or truncate** the existing entries. All completed story records
   must be preserved through session continuations. Use a read-modify-append
   pattern: read the current execution_log, then add new entries at the end.

2. Update sidecar (APPEND to existing execution_log):
   ```yaml
   execution_log:
     # ... all existing entries preserved ...
     - event: "session_resumed"
       timestamp: "{current_timestamp}"
       from_phase: "{current_phase}"
   last_updated: "{current_timestamp}"
   ```
3. Route based on scenario:
   - Scenario A/B → load, read entire file, then execute `{nextStepFile}`
   - Scenario C → load, read entire file, then execute `{completionStepFile}`

#### IF R (Restart):
1. Confirm: "This will clear all progress. Are you sure? [Y/N]"
2. If Y:
   - If worktree mode: Also ask about worktree cleanup
   - Delete sidecar file
   - Route to step-01-init.md (will go to step-01c for new setup)
3. If N: Redisplay menu

#### IF S (Show Log):
1. Display execution_log entries with timestamps
2. Show per-story details:
   ```
   Execution Log:

   [timestamp] Session started
   [timestamp] Story 2.1 - create phase completed
   [timestamp] Story 2.1 - dev phase completed (auth-specialist)
   [timestamp] Story 2.1 - review approved
   [timestamp] Story 2.1 - committed
   [timestamp] Session interrupted
   [timestamp] Session resumed ← current
   ```
3. Redisplay menu

### 8. Present MENU OPTIONS

Display: **Select an Option:** [C] Continue | [R] Restart | [S] Show Log

#### EXECUTION RULES:

- ALWAYS halt and wait for user selection
- Confirm restart with double-check
- Show execution context before continuing

#### Menu Handling Logic:

- IF C: Update sidecar with resume timestamp, then:
  - If stories pending → load `{nextStepFile}`
  - If all complete → load `{completionStepFile}`
- IF R: Confirm and handle restart
- IF S: Display log and redisplay menu
- IF Any questions: Respond and redisplay menu

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Sidecar state loaded and analyzed correctly
- Worktree context validated (if applicable)
- Resume point determined accurately
- User confirmed continuation
- Proper routing to next step
- Resume timestamp recorded

### ❌ SYSTEM FAILURE:

- Not loading complete sidecar state
- Not validating worktree context
- Incorrect resume point determination
- Re-executing completed stories
- Not confirming with user before resuming
- Modifying historical execution data

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN user selects [C] and sidecar is updated with resume info, will you then load the appropriate next step file based on execution state.
