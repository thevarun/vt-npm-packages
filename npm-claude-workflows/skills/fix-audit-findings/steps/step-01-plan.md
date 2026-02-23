---
name: 'step-01-plan'
description: 'Discover audit artifacts, parse findings & themes, present plan to user, create sidecar'
workflow_path: '{project-root}/.claude/skills/fix-audit-findings'
thisStepFile: '{workflow_path}/steps/step-01-plan.md'
continueStepFile: '{workflow_path}/steps/step-01b-continue.md'
executeStepFile: '{workflow_path}/steps/step-02-execute.md'
workflowFile: '{workflow_path}/SKILL.md'
output_folder: '{project-root}/_bmad-output/deep-audit'
findings_file: '{output_folder}/findings.md'
state_file: '{output_folder}/state.json'
sidecar_file: '{output_folder}/audit-fix-state.yaml'
sidecar_template: '{workflow_path}/sidecar-template.yaml'
theme_generator_prompt: '{workflow_path}/templates/theme-generator-prompt.md'
---

# Step 1: Plan — Discover, Parse & Present

## STEP GOAL:
Parse the deep-audit artifacts (findings.md, report with themes), validate cross-references, present the execution plan to the user, and create the sidecar state file on confirmation. Theme enrichment happens just-in-time in step-02 via sub-agents to preserve orchestrator context.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:
- NEVER generate content without user input
- CRITICAL: Read this complete step file before taking any action
- CRITICAL: When loading the next step with 'C', read the entire next step file first
- YOU ARE A FACILITATOR, not a content generator
- Follow the sequence of instructions exactly — do not skip, reorder, or optimize

### Step-Specific Rules:
- NEVER modify source code in this step — planning only
- If `audit-fix-state.yaml` exists with pending work → route to `step-01b-continue.md`
- Do NOT enrich themes here — enrichment is delegated to sub-agents in step-02
- All file path references must be validated against the actual project

## EXECUTION PROTOCOLS

### Error Handling
- If `findings.md` not found → prompt user for correct path
- If parsing fails on a block → warn user, skip block, continue with rest
- If cross-reference validation finds orphans → report but don't block

### Context Boundaries
- This step reads: `findings.md`, deep-audit report (for themes), project file structure
- This step writes: `audit-fix-state.yaml` (from `{sidecar_template}`)
- This step does NOT: modify source code, run tests, create branches, enrich themes

## Sequence of Instructions

### 1. Check for Existing Sidecar (Resume Detection)

Check if `{sidecar_file}` exists.

**If sidecar exists AND has themes in `themes_pending` or `themes_failed`:**
- Display: `Found existing audit-fix session. Routing to resume flow.`
- Load and execute: `{continueStepFile}`
- STOP this step

**If sidecar exists but all themes are in `themes_completed` or `themes_skipped`:**
- Display: `Previous session is fully complete. Starting fresh planning.`
- Continue with step 2

**If no sidecar exists:**
- Continue with step 2

### 2. Verify Audit Artifacts

Check that `{findings_file}` exists. Read `{state_file}` to get `report_path`.

Check that the report file (from `report_path` in state.json) exists.

**If findings_file is missing:**
- Display which file is missing
- Ask user: `Please provide the path to your findings.md:`
- Update path accordingly

**If report is missing or has no `=== THEME ===` blocks** (older deep-audit without integrated themes):
- Display: `The deep-audit report does not contain structured themes.`
- Offer: `[G] Generate themes now | [X] Exit`
- On [G]: Spawn an opus sub-agent using `{theme_generator_prompt}` that reads `{findings_file}` and generates THEME + EXECUTION ORDER blocks. The sub-agent appends the blocks to the report file (or writes a standalone `{output_folder}/refactoring-themes.md` if no report exists). After generation, re-read the file containing themes and continue.
- On [X]: Exit workflow

### 3. Git Status & Branch Setup

Run `git status` to check working directory state.

**If dirty working directory:**
- Display warning: `Working directory has uncommitted changes. These may conflict with refactoring.`
- Ask: `[C] Continue anyway | [X] Exit to handle changes first`

Create feature branch:
```bash
git checkout -b refactor/audit-fix-$(date +%Y%m%d)
```

If branch already exists, ask user whether to use existing or create with suffix.

### 4. Run Baseline Validation

Execute:
```bash
npm run lint && npm run check-types && npm test && npm run build
```

Record results. **If baseline fails:**
- Display: `Baseline validation has failures. Fixes during refactoring may be harder to attribute.`
- Display the specific failures
- Ask: `[C] Continue with known failures | [X] Exit to fix baseline first`

Record baseline status for later comparison.

### 5. Parse Findings

Read `{findings_file}` and parse all `=== FINDING ===` blocks.

For each finding, extract:
- `id` (F-NNN)
- `agent`
- `severity` (P1/P2/P3)
- `confidence`
- `file`
- `line`
- `dimension`
- `title`
- `description`
- `suggestion`

Build a findings registry (map of id → finding data).

Report: `Parsed {N} findings: {P1_count} P1, {P2_count} P2, {P3_count} P3`

### 6. Parse Themes

Read the report file (path from `report_path` in state.json) and parse all `=== THEME ===` blocks.

For each theme, extract:
- `id` (T-NNN)
- `name`
- `effort` (S/M/L)
- `risk` (LOW/MEDIUM/HIGH)
- `finding_ids` (comma-separated)
- `dependencies`
- `phase` (1-4)
- `steps`
- `files`
- `tests_before`
- `tests_after`
- `coverage_gate` (REQUIRED/ADEQUATE)
- `blast_radius` (WIDE/MODERATE/CONTAINED)
- `warnings` (optional)
- `summary`

Build a themes registry (map of id → theme data).

Report: `Parsed {N} themes across {phase_count} phases`

### 7. Parse Execution Order

Find the `=== EXECUTION ORDER ===` block in the report file.

Extract:
- Phase assignments (which themes in which phase)
- Quick wins list
- Dependency chain

### 8. Cross-Reference Validation

Validate:
1. Every `finding_id` referenced in themes exists in findings registry
2. Every `theme_id` in execution order exists in themes registry
3. Every `dependency` theme ID exists in themes registry
4. No circular dependencies in dependency chain
5. Every file listed in theme `files` exists in the project

Report any issues found:
- Missing finding references
- Missing theme references
- Circular dependencies
- Stale file references (files that don't exist)

**Do not block on warnings** — report them and continue.

### 9. Build Execution Sequence

Create ordered execution list:
1. Group themes by phase (1 → 2 → 3 → 4)
2. Within each phase, place quick wins first
3. Respect dependency ordering within phases
4. Flag any themes that can't be scheduled due to unmet deps

### 10. Present Plan to User

Display overview:
```
=== AUDIT FIX PLAN ===

Findings: {total} ({P1} critical, {P2} major, {P3} minor)
Themes:   {total} across {phase_count} phases
Effort:   {S_count} small, {M_count} medium, {L_count} large

Phase 1: {theme_count} themes (quick wins + low risk)
Phase 2: {theme_count} themes (core infrastructure)
Phase 3: {theme_count} themes (feature improvements)
Phase 4: {theme_count} themes (complex refactors)

Baseline: {PASS/FAIL with details}
Branch:   refactor/audit-fix-{date}

Note: Themes will be enriched just-in-time by sub-agents before execution.
```

Then for each phase, display theme list:
```
--- Phase {N} ---
{T-XXX} {name} | Risk: {risk} | Effort: {effort} | Findings: {count} | Files: {count}
```

Report any gaps:
- Stale file references (from cross-reference validation)
- Unresolved dependency issues
- Missing or empty test specifications

### 11. Present MENU OPTIONS

Display:
```
OPTIONS:
[V] View theme details (enter theme ID, e.g. V T-003)
[S] Skip a theme (enter theme ID, e.g. S T-005)
[R] Restore a skipped theme (enter theme ID, e.g. R T-005)
[F] Filter to specific phases only (e.g. F 1,2)
[C] Confirm and begin execution
[X] Exit without executing
```

**On [V]:** Display full theme details (steps, files, findings it addresses, tests_before/after)
**On [S]:** Move theme to skipped list, recalculate execution sequence, re-display plan
**On [R]:** Move theme back to pending, recalculate, re-display
**On [F]:** Filter display and execution to specified phases only; skipped themes in excluded phases
**On [C]:** Proceed to step 12
**On [X]:** Exit workflow

Loop back to menu after each action except [C] and [X].

### 12. Create Sidecar State File

On confirmation, read `{sidecar_template}` for the schema, then create `{sidecar_file}` populated with:
- `started_at`, `last_updated`: current timestamp
- `git.branch`: the branch created in step 3
- `git.base`: "main"
- `baseline_validation`: result from step 4
- `themes_pending`: ordered list of theme IDs from step 9
- `themes_skipped`: any themes skipped via menu
- `execution_plan`: phase assignments from step 7

### 13. Display Autonomy Reminder & Proceed

Display:
```
AUTONOMY MODEL:
  LOW risk themes  → Fully autonomous (execute, validate, commit, continue)
  MEDIUM risk themes → Report summary before executing, then continue
  HIGH risk themes  → Pause for your confirmation before executing

Starting execution...
```

Load and execute: `{executeStepFile}`

## SYSTEM SUCCESS/FAILURE METRICS

### SUCCESS:
- All findings and themes parsed without critical errors
- Cross-references validated
- User confirmed execution plan
- Sidecar state file created (from template)
- Routed to step 2

### SYSTEM FAILURE:
- Could not find or parse audit artifacts
- Critical cross-reference errors that block execution
- User exited without confirming
- Sidecar file creation failed

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
