---
description: 'Multi-agent codebase audit across security, architecture, error handling, and more'
---

# /deep-audit

Comprehensive multi-agent codebase audit. Spawns parallel review agents across multiple dimensions and produces a consolidated report.

**Usage:**
```
/deep-audit                     # Quick mode (3 agents) on full project
/deep-audit --full              # Full mode (9 agents) on full project
/deep-audit --pr 42             # Audit a specific PR diff
/deep-audit --since abc123f     # Audit changes since a commit hash
/deep-audit --since 2025-01-15  # Audit changes since a date
/deep-audit --full --pr 42      # Full mode on a specific PR
```

<workflow CRITICAL="TRUE">

IT IS CRITICAL THAT YOU FOLLOW THIS WORKFLOW EXACTLY.

## Phase 0: Argument Parsing

Parse `$ARGUMENTS` to determine:

1. **Mode**: Check for `--full` flag
   - If `--full` present → `mode = "full"` (9 agents)
   - Otherwise → `mode = "quick"` (3 agents)

2. **Scope**: Check for scope flags (mutually exclusive)
   - `--pr <number>` → `scope = "pr"`, `scope_value = <number>`
   - `--since <value>` → detect format:
     - If matches date pattern (YYYY-MM-DD) → `scope = "since-date"`, `scope_value = <date>`
     - Otherwise → `scope = "since-commit"`, `scope_value = <hash>`
   - No scope flag → `scope = "full-project"`

If conflicting scope flags are provided, warn the user and use the first one.

---

## Phase 1: Scope Resolution & Resume Detection

### Step 1: Record current state

Run these commands to capture the current project context:
- `git rev-parse HEAD` → `current_commit`
- `git rev-parse --show-toplevel` → `project_root`
- Detect project stack by scanning for key files:
  - `package.json` → Node.js/JavaScript
  - `tsconfig.json` → TypeScript
  - `next.config.*` → Next.js
  - `requirements.txt` / `pyproject.toml` → Python
  - `go.mod` → Go
  - `Cargo.toml` → Rust
  - `pom.xml` / `build.gradle` → Java
  - Store as `detected_stack` (comma-separated list)

### Step 2: Check for resume

Check if `_bmad-output/deep-audit/state.json` exists:

- **If exists AND `status` != "completed"**:
  - Read `state.json` → `previous_state`
  - If `previous_state.start_commit` == `current_commit`:
    - **AUTO-RESUME**: Set `resume = true`
    - Identify which agents are still pending from `previous_state.agents`
    - Print: `Resuming interrupted audit (same commit). X of Y agents remaining.`
  - If commits differ:
    - **FRESH START**: Set `resume = false`
    - Print: `Previous audit was on a different commit. Starting fresh.`
- **If no state.json OR status == "completed"**:
  - **FRESH START**: Set `resume = false`

### Step 3: Build scope context

Generate the `scope_context` string that will be injected into every agent prompt:

**For `full-project`:**
```
SCOPE: Full project audit
PROJECT ROOT: <project_root>
STACK: <detected_stack>
INSTRUCTIONS: Review the entire codebase. Focus on source files, configuration, and infrastructure. Skip node_modules, dist, build, .git, and vendor directories.
```

**For `pr`:**
- Run: `gh pr diff <number> --name-only` → file list
- Run: `gh pr diff <number>` → full diff
- Build scope_context with the diff and file list:
```
SCOPE: PR #<number> audit
PROJECT ROOT: <project_root>
STACK: <detected_stack>
CHANGED FILES:
<file list>
DIFF:
<full diff>
INSTRUCTIONS: Focus your review on the changed files and their immediate dependencies. For architectural review, also consider how changes fit into the broader codebase.
```

**For `since-commit` or `since-date`:**
- For commit: `git diff <hash>...HEAD --name-only` and `git diff <hash>...HEAD`
- For date: `git log --since="<date>" --format="%H" | tail -1` → oldest_hash, then `git diff <oldest_hash>...HEAD --name-only` and `git diff <oldest_hash>...HEAD`
- Build scope_context similarly to PR scope.

Store `scope_context` for injection into agent prompts.

---

## Phase 2: Load Agent Definitions

Read the SKILL.md file at the path relative to this command:

```
skills/deep-audit/SKILL.md
```

From SKILL.md, build the agent list based on mode:

**Quick mode agents:**
```
agents = [
  { file: "security-and-error-handling.md", model: "opus",   dimensions: ["Security", "Error Handling"] },
  { file: "architecture-and-complexity.md", model: "opus",   dimensions: ["Architecture", "Simplification"] },
  { file: "code-health.md",                model: "sonnet", dimensions: ["AI Slop Detection", "Dependency Health"] }
]
```

**Full mode** — add these to the quick list:
```
additional_agents = [
  { file: "performance-profiler.md",     model: "sonnet", dimensions: ["Performance"] },
  { file: "test-coverage-analyst.md",    model: "sonnet", dimensions: ["Test Coverage"] },
  { file: "type-design-analyzer.md",     model: "sonnet", dimensions: ["Type Design"] },
  { file: "data-layer-reviewer.md",      model: "opus",   dimensions: ["Data Layer & Database"] },
  { file: "api-contract-reviewer.md",    model: "sonnet", dimensions: ["API Contracts & Interface Consistency"] },
  { file: "seo-accessibility-auditor.md", model: "sonnet", dimensions: ["SEO & Accessibility"] }
]
```

If resuming: filter `agents` to only those with status "pending" in `previous_state.agents`.

---

## Phase 3: Initialize State

Create `_bmad-output/deep-audit/` directory if it doesn't exist.

Write `_bmad-output/deep-audit/state.json`:

```json
{
  "status": "in_progress",
  "mode": "<quick|full>",
  "scope": "<scope type>",
  "scope_value": "<scope value or null>",
  "start_commit": "<current_commit>",
  "start_time": "<ISO timestamp>",
  "detected_stack": "<detected_stack>",
  "agents": {
    "<agent-file-name>": {
      "status": "pending",
      "model": "<model>",
      "dimensions": ["<dim1>", "<dim2>"],
      "started_at": null,
      "completed_at": null,
      "findings_count": 0,
      "raw_output": null
    }
  },
  "findings": [],
  "report_path": null
}
```

If resuming, merge pending agent statuses into the existing state (keep completed agents' data intact).

Print status:
```
Deep Audit — <mode> mode
Scope: <scope description>
Stack: <detected_stack>
Agents: <count> (<list of agent names>)
Commit: <short hash>
```

---

## Phase 4: Spawn Agents (Batched Parallel)

Spawn agents in batches of up to 5 at a time using the Task tool.

For each agent in the current batch:

1. Read the agent prompt file from `skills/deep-audit/agents/<agent-file>`
2. Construct the full prompt by combining:
   - The agent prompt file content
   - The scope_context from Phase 1
   - A reminder to follow SKILL.md output format exactly

3. Spawn via Task tool:
   ```
   Tool: Task
   subagent_type: general-purpose
   model: <agent.model>
   description: "deep-audit: <agent-name>"
   prompt: |
     <agent prompt content>

     ---
     ## Scope Context (injected by orchestrator)
     <scope_context>

     ---
     ## Output Format Reminder
     You MUST produce output using the exact format defined above:
     - === FINDING === blocks for each finding (confidence >= 80 only)
     - === DIMENSION SUMMARY === blocks for each dimension you cover
     Produce NO other output besides these blocks.
   ```

4. After each batch completes, for each agent response:
   - Parse `=== FINDING ===` blocks: extract agent, severity, confidence, file, line, dimension, title, description, suggestion
   - Parse `=== DIMENSION SUMMARY ===` blocks: extract dimension, score, p1_count, p2_count, p3_count, assessment
   - Store parsed findings in state.json `findings` array
   - Store raw output in agent's `raw_output` field
   - Update agent status to "completed" with timestamp and findings_count
   - Write updated state.json to disk

5. Print progress after each batch:
   ```
   Batch N complete: <agents in batch>
   Findings so far: X P1, Y P2, Z P3
   Remaining agents: <count>
   ```

If any agent fails (Task tool returns error):
- Log the error in the agent's state
- Set agent status to "failed"
- Continue with remaining agents (do not abort the audit)
- Report failed agents in the final summary

---

## Phase 5: Deduplicate Findings

After all agents complete:

1. Sort all findings by severity (P1 → P2 → P3), then by file path, then by line number
2. Deduplicate: merge findings that share ALL of these properties:
   - Same file (exact path match)
   - Same or overlapping line range (within 5 lines)
   - Similar title (>70% word overlap)
   - If merged, keep the higher severity and higher confidence, combine descriptions
3. Assign sequential IDs: F-001, F-002, F-003, ...
4. Store deduplicated findings back in state.json

Print dedup results:
```
Deduplication: <original count> findings → <deduped count> findings (<removed count> duplicates merged)
```

---

## Phase 6: Generate Report

Read the report template from:
```
skills/deep-audit/templates/report-template.md
```

Fill in the template:

1. **Header fields**: date, mode, scope description, agent count, detected stack, duration (now - start_time), commit hash

2. **Scorecard**: Build from DIMENSION SUMMARY data
   - For each dimension, fill in: score, P1/P2/P3 counts, assessment
   - Calculate overall health score using the weighted formula from SKILL.md:
     - `weighted_sum = sum(score * weight for each dimension)`
     - `total_weight = sum(weights for audited dimensions)`
     - `overall_score = weighted_sum / total_weight` (round to 1 decimal)
   - Map overall score to label: 9-10 "Excellent", 7-8 "Good", 5-6 "Adequate", 3-4 "Concerning", 1-2 "Critical"

3. **Findings sections**: Group deduplicated findings by severity
   - For each finding, render:
     ```
     #### F-NNN: <title> (<severity>)

     | | |
     |---|---|
     | **File** | `<file>:<line>` |
     | **Dimension** | <dimension> |
     | **Confidence** | <confidence>% |
     | **Agent** | <agent> |

     <description>

     **Suggestion:** <suggestion>

     ---
     ```

4. **Action Plan**: Select the top 5 findings (by severity, then confidence) and format as a numbered action list with brief description of what to fix and why.

5. **Statistics**: Total findings, per-severity counts, agent count, dimension count, per-agent breakdown table.

### Write the report

Determine the output path:
- Base: `_bmad-output/deep-audit/deep-audit-<YYYY-MM-DD>.md`
- If file exists, append suffix: `-2`, `-3`, etc.

Write the filled report to the output path.

Update state.json with `report_path`.

---

## Phase 7: Finalize State

Update `_bmad-output/deep-audit/state.json`:
- Set `status = "completed"`
- Set `end_time` to current ISO timestamp
- Set `report_path` to the report file path

---

## Phase 8: Present Summary

Print a concise summary to the user:

```
═══════════════════════════════════════════════════
  DEEP AUDIT COMPLETE
═══════════════════════════════════════════════════

Mode: <quick|full> (<agent_count> agents)
Scope: <scope description>
Duration: <duration>

SCORECARD
─────────────────────────────────────────────────
<dimension>          <score>/10  (<P1> P1, <P2> P2, <P3> P3)
<dimension>          <score>/10  (<P1> P1, <P2> P2, <P3> P3)
...
─────────────────────────────────────────────────
Overall Health:      <overall>/10 — <label>

FINDINGS: <total> total (<P1_count> critical, <P2_count> important, <P3_count> minor)

TOP ACTIONS
1. <action 1>
2. <action 2>
3. <action 3>

Report: <report_path>
State:  _bmad-output/deep-audit/state.json
═══════════════════════════════════════════════════
```

If any agents failed, add a section:
```
WARNINGS
- Agent <name> failed: <error summary>
```

</workflow>

## Error Recovery

If the workflow fails at any point:

1. **State is preserved**: `state.json` tracks which agents completed. Re-running `/deep-audit` with the same commit will auto-resume from where it left off.

2. **Manual recovery**: Read `_bmad-output/deep-audit/state.json` to see:
   - Which agents completed successfully (their findings are preserved)
   - Which agents were pending when the failure occurred
   - The raw output from each completed agent

3. **Force fresh start**: Delete `_bmad-output/deep-audit/state.json` and re-run.

## Safety Rules

- NEVER modify source code. This is a read-only audit.
- NEVER execute project code or tests. Only use git, gh, and file reading tools.
- NEVER share audit findings outside the local report file.
- If a scope flag points to a non-existent PR or commit, inform the user and stop.
- If the project has no source files (empty repo), inform the user and stop.
