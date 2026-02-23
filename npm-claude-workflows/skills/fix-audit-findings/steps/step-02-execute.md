---
name: 'step-02-execute'
description: 'Autonomous orchestration loop — execute refactoring themes via sub-agents'
workflow_path: '{project-root}/.claude/skills/fix-audit-findings'
thisStepFile: '{workflow_path}/steps/step-02-execute.md'
completeStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/SKILL.md'
output_folder: '{project-root}/_bmad-output/deep-audit'
findings_file: '{output_folder}/findings.md'
state_file: '{output_folder}/state.json'
sidecar_file: '{output_folder}/audit-fix-state.yaml'
sidecar_template: '{workflow_path}/sidecar-template.yaml'
screenshotsFolder: '{project-root}/_bmad-output/implementation-artifacts/screenshots'
maxRetries: 2
enrichment_prompt_template: '{workflow_path}/templates/enrichment-prompt.md'
enrichment_output_template: '{workflow_path}/templates/enrichment-output-template.md'
enrichment_output_folder: '{output_folder}/enrichment'
implementation_prompt_template: '{workflow_path}/templates/implementation-prompt.md'
fix_prompt_template: '{workflow_path}/templates/fix-prompt.md'
---

# Step 2: Execute — Autonomous Theme Orchestration

## STEP GOAL:
Execute each refactoring theme in sequence by spawning focused sub-agents, validating results, committing changes, and tracking progress in the sidecar state.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- NEVER generate content without user input
- CRITICAL: Read this complete step file before taking any action
- CRITICAL: When loading next step, read the entire next step file first
- YOU ARE A FACILITATOR, not a content generator
- Follow the sequence exactly for EACH theme — do not skip phases

### Orchestrator Constraints (from SKILL.md)
- Primary tool: **Task** (spawning sub-agents for implementation work)
- Direct **Edit** ONLY for: sidecar state file updates
- Direct **Bash** ONLY for: git commands, validation commands, file-existence checks
- **NEVER** directly edit source code — ALL implementation is delegated to sub-agents
- **NEVER** run validation separately before commit — pre-commit hooks handle this (except for the post-theme full validation in Phase D)

### Autonomy Model
| Risk | Before Execution | After Execution |
|------|-----------------|-----------------|
| LOW | Auto-proceed | Auto-commit if validation passes |
| MEDIUM | Display theme summary, then auto-proceed | Auto-commit if validation passes |
| HIGH | PAUSE — wait for user `[C] Continue \| [S] Skip \| [X] Stop` | Auto-commit if validation passes |

### Model Selection Rule
Determine the sub-agent model ONCE per theme (applies to enrichment, implementation, and fix agents):

| Condition | Model |
|-----------|-------|
| risk = HIGH | opus |
| risk = MEDIUM | opus |
| blast_radius = WIDE | opus |
| Otherwise (LOW risk, non-WIDE blast) | sonnet |

Evaluate top-to-bottom; first match wins.

## EXECUTION PROTOCOLS

### Sidecar Update Protocol
After EVERY state change, update `{sidecar_file}`:
- Update `last_updated` timestamp
- Update `current_theme`, `current_phase`
- Move themes between `themes_pending`/`themes_completed`/`themes_skipped`/`themes_failed`
- Append to `execution_log`

### Failure Recovery
- Sub-agent implementation failure → spawn retry with error context (up to `{maxRetries}`)
- Validation failure → spawn fix agent with error details (up to `{maxRetries}`)
- After max retries → HALT with `[R] Retry \| [V] Revert and skip \| [X] Stop`

## Sequence of Instructions

### 0. Load State

Read `{sidecar_file}` to get:
- `themes_pending` (ordered execution list)
- `themes_completed`, `themes_skipped`, `themes_failed`
- `git.branch`
- `current_phase`, `current_theme`

Read `{state_file}` to get `report_path`. Read the report file for theme details.
Read `{findings_file}` to have finding details available.

If `themes_pending` is empty:
- Load and execute `{completeStepFile}`
- STOP

### 1. THEME EXECUTION LOOP

For each theme ID in `themes_pending` (in order):

---

#### Phase A: Pre-Check

**A1. Verify git branch:**
```bash
git branch --show-current
```
If not on `{git.branch}` → `git checkout {git.branch}`

**A2. Check dependencies:**
- Read theme's `dependencies` field
- For each dependency theme ID: verify it exists in `themes_completed`
- If any dependency is NOT met:
  - Display: `Skipping {theme_id}: dependency {dep_id} not yet completed`
  - Move theme to end of `themes_pending` (will retry after deps complete)
  - If theme has been deferred more than once already → move to `themes_skipped` with reason "unmet dependency: {dep_id}"
  - Continue to next theme

**A3. Risk gate:**
- Read theme's `risk` field
- **LOW**: No action, proceed silently
- **MEDIUM**: Display summary:
  ```
  EXECUTING: {theme_id} — {theme_name}
  Risk: MEDIUM | Effort: {effort} | Findings: {finding_count} | Files: {file_count}
  ```
  Proceed automatically.
- **HIGH**: Display full summary and PAUSE:
  ```
  HIGH RISK THEME: {theme_id} — {theme_name}
  Risk: HIGH | Effort: {effort} | Blast Radius: {blast_radius}
  Findings: {list finding IDs and titles}
  Files affected: {list files}
  Warnings: {any warnings}

  [C] Continue with this theme
  [S] Skip this theme
  [X] Stop execution
  ```
  Wait for user input. On [S] → move to `themes_skipped`, continue loop. On [X] → save state, exit.

**A4. Update sidecar:**
- Set `current_theme: {theme_id}`
- Set `current_phase` to the theme's phase number
- Update `last_updated`

**A5. Determine sub-agent model:**
Apply the Model Selection Rule above. Store result as `{theme_model}` (either `"opus"` or `"sonnet"`).
Display: `Model: {theme_model}` (append to MEDIUM/HIGH risk summaries).

---

#### Phase B: Enrich Theme (Sub-Agent)

Enrichment happens just-in-time before implementation. The enrichment agent writes a **self-contained implementation brief** to a file that the implementation agent reads directly.

**B1. Ensure enrichment output directory exists:**
```bash
mkdir -p {enrichment_output_folder}
```

**B2. Spawn enrichment sub-agent using Task tool** with `subagent_type: "general-purpose"`, `model: "{theme_model}"`, `max_turns: 150`:

Load the enrichment prompt template from `{enrichment_prompt_template}` and substitute:
- `{theme_id}`, `{theme_name}`, theme block data, related finding blocks (as before)
- `{enrichment_output_file}` = `{enrichment_output_folder}/{theme_id}-enrichment.md`
- `{enrichment_output_template}` = path to the output template file

The enrichment agent will write a self-contained implementation brief to the output file.

**B3. Verify enrichment output file exists:**
```bash
test -f {enrichment_output_folder}/{theme_id}-enrichment.md && echo "EXISTS" || echo "MISSING"
```

If MISSING: Sub-agent failed to write output. Retry up to `{maxRetries}` times. If still missing after retries, move theme to `themes_failed` with reason "enrichment output not written" and continue to next theme.

**B4. Read enrichment output file** and verify it contains the `# Implementation Brief:` header.

---

#### Phase C: Spawn Sub-Agent for Implementation

The implementation agent reads the self-contained brief written by Phase B. The orchestrator does NOT need to reassemble context.

**Spawn sub-agent using Task tool** with `subagent_type: "general-purpose"`, `model: "{theme_model}"`, `max_turns: 300`:

Load the implementation prompt template from `{implementation_prompt_template}` and substitute:
- `{theme_id}`, `{theme_name}`
- `{enrichment_output_file}` = `{enrichment_output_folder}/{theme_id}-enrichment.md`
- `{screenshotsFolder}`

The implementation agent will read the brief file directly to get all theme details, findings, steps, and test requirements.

---

#### Phase D: Validate Results

**D1. Run full validation:**
```bash
npm run lint && npm run check-types && npm test && npm run build
```

**D2. If UI changes flagged:**
- Review sub-agent's reported screenshot paths and visual_status
- If visual_status is "fail" and sub-agent couldn't auto-fix:
  - Spawn another sub-agent (Task, general-purpose) focused on fixing the visual regression, providing screenshot paths and the specific issues
  - After fix attempt, re-run validation
  - If still failing → PAUSE: `[A] Accept as-is | [M] Manual fix needed | [S] Skip theme`

**D3. If ALL validation passes** → proceed to Phase E

**D4. If validation FAILS:**
- **Attempt 1**: Spawn sub-agent with `subagent_type: "general-purpose"`, `model: "{theme_model}"`, `max_turns: 100` and error details:
  Load the fix prompt template from `{fix_prompt_template}` and substitute: {theme_id}, {theme_name}, validation error output, and list of changed files.
  Re-run full validation after fix.

- **Attempt 2**: If still failing, spawn one more fix attempt with accumulated error context.

- **After {maxRetries} failures**: HALT
  ```
  VALIDATION FAILED after {maxRetries} retries for {theme_id}: {theme_name}

  Errors:
  {latest error output}

  [R] Retry (spawn another fix attempt)
  [V] Revert all changes from this theme and skip it
  [X] Stop execution entirely
  ```
  - On [R]: one more retry
  - On [V]: `git checkout -- .` to revert, move theme to `themes_failed`, continue
  - On [X]: save state, exit

---

#### Phase E: Commit

**E1. Update sidecar (pre-commit):**
Before staging, update `{sidecar_file}`:
- Remove theme from `themes_pending`
- Add theme to `themes_completed`
- Set `current_theme: null`
- Append to `execution_log`:
  ```yaml
  - theme: "{theme_id}"
    name: "{theme_name}"
    phase: {phase_number}
    risk: {risk}
    findings_addressed: [{finding_ids}]
    files_changed: [{list from sub-agent}]
    validation: pass
    visual_check: {pass/fail/N/A}
    commit: "{commit_hash}"
    model: "{theme_model}"
    completed_at: "{timestamp}"
  ```
- Update `last_updated`

**E2. Stage and commit:**
Use the sub-agent's reported `files_changed` list PLUS the sidecar file — do NOT use `git add -A`.
```bash
git add {files_changed_from_sub_agent} {sidecar_file}
git commit -m "refactor({theme_id}): {theme_name}

Findings addressed: {comma-separated finding_ids}
Phase: {phase_number} | Risk: {risk} | Effort: {effort}"
```

**E3. If commit fails (pre-commit hooks):**
- Read the hook error output
- Spawn sub-agent to fix the issues
- Re-stage and commit
- If second commit also fails → HALT:
  ```
  Commit failed for {theme_id}. Hook errors:
  {error output}

  [R] Retry after fix
  [K] Skip commit (changes remain staged)
  [X] Stop execution
  ```

**E4. Capture commit hash:**
```bash
git rev-parse --short HEAD
```

**E5. Backfill commit hash in sidecar:**
The execution_log entry written in E1 used a placeholder for `commit`. Now update it with the actual hash from E4.

---

#### Phase F: Report Progress

**F1. Report progress:**
```
COMPLETED: {theme_id} — {theme_name} | Commit: {commit_hash} | Model: {theme_model} | Progress: {completed}/{total} ({percentage}%)
```

**F2. Phase transition check:**
If all themes in the current phase are now in `themes_completed` or `themes_skipped`:
```
--- Phase {N} Complete ---
Completed: {count} themes | Skipped: {count} | Failed: {count}
Moving to Phase {N+1}...
```

**F3. Continue loop** → next theme in `themes_pending`

---

### 2. Loop Completion

When `themes_pending` is empty:

Update sidecar:
- Set `current_phase: "complete"`
- Set `current_theme: null`
- Update `last_updated`

Display:
```
=== ALL THEMES PROCESSED ===
Completed: {count} | Skipped: {count} | Failed: {count}
Generating completion report...
```

Load and execute: `{completeStepFile}`

## SYSTEM SUCCESS/FAILURE METRICS

### SUCCESS:
- All themes in `themes_pending` processed (completed, skipped, or failed)
- Each completed theme has a clean commit
- Sidecar state is consistent and up-to-date
- Routed to step 3

### SYSTEM FAILURE:
- Orchestrator directly edited source code (constraint violation)
- Sidecar state is inconsistent with actual git state
- User chose to stop execution mid-way (partial success — state is saved for resume)

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
