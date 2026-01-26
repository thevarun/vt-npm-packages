---
name: 'step-01-init'
description: 'Entry router - detect context and route to appropriate initialization path'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-01-init.md'
continueFile: '{workflow_path}/steps/step-01b-continue.md'
newSetupFile: '{workflow_path}/steps/step-01c-new.md'
workflowFile: '{workflow_path}/workflow.md'

# State files
sidecarFolder: '{output_folder}/epic-executions'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'
---

# Step 1: Entry Router

## STEP GOAL:

To detect the execution context (worktree vs main repo), discover any existing epic execution state, and route to the appropriate next step.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip detection steps
- 📖 CRITICAL: Read the complete step file before taking any action
- 📋 YOU ARE A ROUTER, not an executor

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator
- ✅ This step ONLY detects context and routes
- ✅ All initialization logic is in step-01c
- ✅ All continuation logic is in step-01b

### Step-Specific Rules:

- 🎯 Focus ONLY on detection and routing
- 🚫 FORBIDDEN to start epic setup in this step
- 🚫 FORBIDDEN to start story execution in this step
- 🚪 ROUTE to appropriate step based on detection results

## DETECTION SEQUENCE:

### 1. Detect Worktree Context

Execute git commands to determine if running in a worktree:

```bash
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
GIT_COMMON=$(git rev-parse --git-common-dir 2>/dev/null)
```

**Interpretation:**
- If `$GIT_DIR` != `$GIT_COMMON` → Running in a WORKTREE
- If `$GIT_DIR` == `$GIT_COMMON` → Running in MAIN REPO

**Store context:**
```
is_worktree: true | false
current_path: $(pwd)
```

### 2. Discover Sidecar Files

Scan for existing epic execution state files.

**IMPORTANT:** When running in a worktree, the sidecar was created in the **main repo** before session restart. You must search the main repo's sidecar folder, not just the local worktree folder.

**If running in MAIN REPO (`is_worktree` = false):**
```bash
ls -la {sidecarFolder}/epic-*-state.yaml 2>/dev/null
```

**If running in WORKTREE (`is_worktree` = true):**
```bash
# Derive main repo path from git
MAIN_REPO_PATH=$(dirname "$(git rev-parse --git-common-dir)")
MAIN_SIDECAR_FOLDER="$MAIN_REPO_PATH/_bmad-output/epic-executions"

# Search main repo sidecar folder (canonical location where setup created it)
ls -la "$MAIN_SIDECAR_FOLDER"/epic-*-state.yaml 2>/dev/null
```

**Store main repo sidecar path for later use:**
```
main_sidecar_folder: "$MAIN_SIDECAR_FOLDER"  # Only when is_worktree=true
```

**For each sidecar found, extract:**
- Epic number (from filename pattern)
- `current_phase` value
- `worktree_config.worktree_path` (if present)
- `stories_pending` count
- `sidecar_path` (full path to the sidecar file)

**Build sidecar list:**
```
sidecars_found:
  - file: "epic-2-state.yaml"
    sidecar_path: "/main/repo/_bmad-output/epic-executions/epic-2-state.yaml"
    epic_number: 2
    phase: "executing"
    worktree_path: "/path/to/worktree" | null
    pending_stories: 5
```

### 3. Route Decision

Based on detection results, determine the appropriate path:

#### Scenario A: In Worktree with Matching Sidecar

**Conditions:**
- `is_worktree` = true
- Found sidecar where `worktree_config.worktree_path` == `current_path`
- Sidecar has `stories_pending` > 0

**Action:** Route to `{continueFile}` with matched sidecar

**Display:**
```
Detected: Running in worktree for Epic {N}
Found matching execution state with {X} stories pending.
Sidecar location: {sidecar_path}

Routing to continuation...
```

→ Pass `sidecar_path` context for subsequent steps to use
→ Load, read entire file, then execute `{continueFile}`

---

#### Scenario B: In Worktree, Awaiting Session Restart

**Conditions:**
- `is_worktree` = true
- Found sidecar where `worktree_config.worktree_path` == `current_path`
- Sidecar has `current_phase` = "awaiting_session_restart"

**Action:** Update sidecar phase to "executing", route to orchestration

**Display:**
```
Detected: Fresh session in worktree for Epic {N}
Setup was completed in previous session.

Ready to begin story execution...
```

→ Update sidecar at `{sidecar_path}` (the matched sidecar's full path): `current_phase: "executing"`
→ Load, read entire file, then execute step-02-orchestrate.md

---

#### Scenario C: In Worktree, No Matching Sidecar

**Conditions:**
- `is_worktree` = true
- No sidecar matches `current_path`

**Action:** Error state - worktree exists but no state found

**Display:**
```
⚠️ Warning: Running in a worktree but no matching execution state found.

This worktree may have been created manually or state was lost.

Options:
[N] Start new epic setup (will use this worktree)
[X] Exit and investigate
```

- IF N: Route to `{newSetupFile}` (skip worktree creation, use current)
- IF X: EXIT workflow

---

#### Scenario D: In Main Repo with Pending Sidecars

**Conditions:**
- `is_worktree` = false
- Found sidecars with `stories_pending` > 0

**Action:** Show existing executions, ask user intent

**Display:**
```
Found existing epic execution(s):

  Epic 2: "Auth Experience" - 5 stories pending
    └─ Worktree: ../vt-saas-template-epic-2-auth/
  Epic 3: "User Onboarding" - 7 stories pending (main repo)

Options:
[1] Continue Epic 2 (requires: cd ../vt-saas-template-epic-2-auth/)
[2] Continue Epic 3
[N] Start NEW epic execution
```

- IF number selected for worktree epic: Display cd command and exit
- IF number selected for main repo epic: Route to `{continueFile}`
- IF N: Route to `{newSetupFile}`

---

#### Scenario E: In Main Repo, No Active Sidecars

**Conditions:**
- `is_worktree` = false
- No sidecars found OR all sidecars have `current_phase` = "complete"

**Action:** Fresh start - route to new epic setup

**Display:**
```
Welcome to the Epic Execution Orchestrator!

No active epic executions found.
Starting new epic setup...
```

→ Load, read entire file, then execute `{newSetupFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Correctly detected worktree vs main repo context
- Found and parsed all existing sidecar files
- Routed to appropriate step based on scenario
- User given clear options when multiple paths exist

### ❌ SYSTEM FAILURE:

- Starting epic setup directly (that's step-01c's job)
- Starting continuation directly (that's step-01b's job)
- Not detecting worktree context
- Not scanning for existing sidecars
- Making assumptions without detection

**Master Rule:** This step ONLY detects and routes. All execution logic belongs in subsequent steps.
