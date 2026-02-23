# Deep Audit — Multi-Agent Codebase Audit

Comprehensive multi-agent codebase audit. Spawns parallel review agents across multiple dimensions and produces a consolidated report with finding triage and theme-based grouping.

**Usage:**
```
/deep-audit                              # Quick mode (3 agents)
/deep-audit --full                       # Full mode (up to 9 agents)
/deep-audit --pr 42                      # Audit a specific PR diff
/deep-audit --since abc123f              # Audit changes since a commit hash
/deep-audit --since 2025-01-15           # Audit changes since a date
/deep-audit --full --pr 42              # Full mode on a specific PR
/deep-audit --agent security-and-error-handling     # Run only one agent
/deep-audit --agent performance-profiler --pr 42    # Single agent on a PR
```

## Agent Roster

### Quick Mode (default — 3 agents)

| Agent File | Dimensions | Model | Rationale |
|------------|-----------|-------|-----------|
| `security-and-error-handling.md` | Security, Error Handling | opus | Unhandled errors ARE security issues; one agent reasoning about both produces better findings |
| `architecture-and-complexity.md` | Architecture, Simplification | opus | Architecture decisions need deepest reasoning; over-engineering IS an architecture problem |
| `code-health.md` | AI Slop Detection, Dependency Health | sonnet | Both smell neglect — slop detection and dependency rot share the same instinct |

### Full Mode (adds up to 6 more agents — `--full` flag)

| Agent File | Dimension | Model |
|------------|-----------|-------|
| `performance-profiler.md` | Performance | sonnet |
| `test-strategy-analyst.md` | Test Coverage, Test Efficiency | opus |
| `type-design-analyzer.md` | Type Design | sonnet |
| `data-layer-reviewer.md` | Data Layer & Database | opus |
| `api-contract-reviewer.md` | API Contracts & Interface Consistency | sonnet |
| `seo-accessibility-auditor.md` | SEO & Accessibility | sonnet |

> **Note**: `documentation-health.md` is temporarily excluded from the roster. It will be re-added after its scope and budget strategy have been validated in isolation. Run it standalone with `--agent documentation-health` if needed.

## Key File References

| File | Purpose |
|------|---------|
| `shared-agent-instructions.md` | Output format, confidence rules, false positives, tool guidelines — agents read this directly |
| `agents/consolidate-and-triage.md` | Consolidation + triage agent prompt |
| `templates/agent-output.md` | Per-agent output file template |
| `templates/findings.md` | Combined consolidated findings + triage results template |
| `templates/report-template.md` | Final report template (includes scoring reference) |
| `templates/state.json.template` | State tracking structure |

<workflow CRITICAL="TRUE">

IT IS CRITICAL THAT YOU FOLLOW THIS WORKFLOW EXACTLY.

## Phase 0: Argument Parsing

Parse `$ARGUMENTS` to determine:

1. **Mode**: Check for `--full` flag
   - If `--full` present → `mode = "full"` (up to 9 agents)
   - Otherwise → `mode = "quick"` (3 agents)

2. **Single Agent**: Check for `--agent <name>` flag
   - If `--agent <name>` present → `single_agent = "<name>"`
   - Otherwise → `single_agent = null`
   - If both `--full` and `--agent` are present: warn that `--full` is ignored in single-agent mode, set `mode = "single"`, ignore `--full`
   - If `--agent` is present without `--full`: set `mode = "single"`

3. **Scope**: Check for scope flags (mutually exclusive)
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

Generate the `scope_context` string that will be injected into every agent prompt.

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
- Write the full diff to `_bmad-output/deep-audit/scope-diff.md`
- Build scope_context with the file list and a reference to the diff file:
```
SCOPE: PR #<number> audit
PROJECT ROOT: <project_root>
STACK: <detected_stack>
CHANGED FILES:
<file list>
DIFF: Read `_bmad-output/deep-audit/scope-diff.md` for the full unified diff.
INSTRUCTIONS: Focus your review on the changed files and their immediate dependencies. For architectural review, also consider how changes fit into the broader codebase.
```

**For `since-commit` or `since-date`:**
- For commit: `git diff <hash>...HEAD --name-only` and `git diff <hash>...HEAD`
- For date: `git log --since="<date>" --format="%H" | tail -1` → oldest_hash, then `git diff <oldest_hash>...HEAD --name-only` and `git diff <oldest_hash>...HEAD`
- Write the full diff to `_bmad-output/deep-audit/scope-diff.md`
- Build scope_context similarly to PR scope (file list + diff file reference).

Store `scope_context` for injection into agent prompts.

---

## Phase 1.5: Agent Relevance Filter

**Skip this phase for `mode = "single"`.** Single-agent runs always proceed regardless of detected stack.

For `mode = "quick"` or `mode = "full"`, check `detected_stack` and project files to skip agents whose dimensions clearly don't apply:

| Agent | Skip if... |
|-------|-----------|
| `type-design-analyzer` | No `tsconfig.json` found |
| `data-layer-reviewer` | No DB-related deps in package.json (`prisma`, `drizzle`, `mongoose`, `pg`, `mysql`, `mysql2`, `sqlite3`, `better-sqlite3`, `typeorm`, `sequelize`, `knex`, `@prisma/client`) |
| `seo-accessibility-auditor` | No frontend framework detected (no `react`, `vue`, `svelte`, `angular`, `next`, `nuxt`, `@angular/core`, `solid-js`, `astro` in deps) |
| `api-contract-reviewer` | No route/API deps detected (no `express`, `fastify`, `hono`, `koa`, `@nestjs/core`, `restify` in deps) AND no `routes/` or `api/` directory found |

For each skipped agent:
- Set status to `"skipped"` in state.json (distinct from `"pending"` or `"failed"`)
- Print: `Skipping <agent-name> — <reason> (not detected in project)`

Note: These are conservative filters. If in doubt, do NOT skip — let the agent determine N/A during its review.

---

## Phase 2: Load Agent Definitions

Read all agent prompt files from `skills/deep-audit/agents/` **IN PARALLEL** (use multiple Read tool calls in a single response).

Build the complete agent roster:

**Quick mode agents:**
```
quick_agents = [
  { file: "security-and-error-handling.md", model: "opus",   dimensions: ["Security", "Error Handling"] },
  { file: "architecture-and-complexity.md", model: "opus",   dimensions: ["Architecture", "Simplification"] },
  { file: "code-health.md",                model: "sonnet", dimensions: ["AI Slop Detection", "Dependency Health"] }
]
```

**Full mode additional agents:**
```
full_agents = [
  { file: "performance-profiler.md",       model: "sonnet", dimensions: ["Performance"] },
  { file: "test-strategy-analyst.md",      model: "opus",   dimensions: ["Test Coverage", "Test Efficiency"] },
  { file: "type-design-analyzer.md",       model: "sonnet", dimensions: ["Type Design"] },
  { file: "data-layer-reviewer.md",        model: "opus",   dimensions: ["Data Layer & Database"] },
  { file: "api-contract-reviewer.md",      model: "sonnet", dimensions: ["API Contracts & Interface Consistency"] },
  { file: "seo-accessibility-auditor.md",  model: "sonnet", dimensions: ["SEO & Accessibility"] }
]
```

**Build the active agent list based on mode:**

- **If `mode = "single"`**: Search both `quick_agents` and `full_agents` for an agent whose filename (without `.md`) matches `single_agent`. Also check `documentation-health.md` (valid for single-agent runs even though excluded from roster). If found → `agents = [matched_agent]`. If NOT found → print the error below and **STOP** (do not proceed):
  ```
  Unknown agent: "<single_agent>"

  Available agents:
    Quick mode: security-and-error-handling, architecture-and-complexity, code-health
    Full mode:  performance-profiler, test-strategy-analyst, type-design-analyzer,
                data-layer-reviewer, api-contract-reviewer, seo-accessibility-auditor,
                documentation-health
  ```
- **If `mode = "quick"`**: `agents = quick_agents`
- **If `mode = "full"`**: `agents = quick_agents + full_agents`

Filter out agents that were marked as `"skipped"` in Phase 1.5.

If resuming: further filter `agents` to only those with status "pending" in `previous_state.agents`.

---

## Phase 3: Initialize State

Create `_bmad-output/deep-audit/` directory and `_bmad-output/deep-audit/agents/` subdirectory if they don't exist.

Write `_bmad-output/deep-audit/state.json` (reference `templates/state.json.template` for structure):

```json
{
  "status": "in_progress",
  "mode": "<quick|full|single>",
  "scope": "<scope type>",
  "scope_value": "<scope value or null>",
  "start_commit": "<current_commit>",
  "start_time": "<ISO timestamp>",
  "end_time": null,
  "detected_stack": "<detected_stack>",
  "agents": {
    "<agent-file-name>": {
      "status": "pending|skipped",
      "model": "<model>",
      "dimensions": ["<dim1>", "<dim2>"],
      "started_at": null,
      "completed_at": null,
      "findings_count": 0,
      "output_file": "_bmad-output/deep-audit/agents/<agent-file-name>.md"
    }
  },
  "triage": {
    "accepted_count": 0,
    "skipped_count": 0,
    "invalid_count": 0,
    "skipped_findings": []
  },
  "themes": [],
  "report_path": null
}
```

If resuming, merge pending agent statuses into the existing state (keep completed agents' data intact).

**[CHECKPOINT]** state.json written — safe to resume from Phase 4.

Print status:
```
[Phase 3 complete: State initialized]
Deep Audit — <mode> mode
Scope: <scope description>
Stack: <detected_stack>
Agent(s): <count> (<list of agent names>)
Skipped: <count> (<list of skipped agent names, if any>)
Commit: <short hash>
```

---

## Phase 4: Spawn Agents

Spawn agents in batches of up to 5 at a time using the Task tool. For each agent in the current batch:

1. Construct the full prompt by combining:
   - The agent prompt file content (already read in Phase 2)
   - The scope_context from Phase 1
   - Agents reference `skills/deep-audit/shared-agent-instructions.md` directly for output format, confidence rules, and tool guidelines — no need to inject that content

2. Spawn via Task tool:
   ```
   Tool: Task
   subagent_type: general-purpose
   model: <agent.model>
   max_turns: 50 (for documentation-health agent specifically)
   description: "deep-audit: <agent-name>"
   prompt: |
     <agent prompt content>

     ---
     ## Scope Context (injected by orchestrator)
     <scope_context>
   ```

3. After each agent completes:
   - Check for output file at `_bmad-output/deep-audit/agents/<name>.md`
   - **Fallback**: If the agent returned inline output but did not write to the file, write the output to the expected path
   - Update state.json: set agent status to "completed" with timestamp and findings_count
   - Print: `[N/TOTAL] <name> complete (<count> findings)`

4. After all agents complete:
   - Print: `[Phase 4 complete: all agents finished]`

If any agent fails (Task tool returns error):
- Log the error in the agent's state
- Set agent status to "failed"
- Continue with remaining agents (do not abort the audit)
- Report failed agents in the final summary

---

## Phase 5: Consolidate & Triage (subagent)

Spawn a dedicated subagent with a fresh context window. The orchestrator does NOT perform consolidation or triage itself — it delegates to preserve context budget for state management.

1. Read the consolidate-and-triage agent prompt from `skills/deep-audit/agents/consolidate-and-triage.md`
2. Spawn via Task tool:
   ```
   Tool: Task
   subagent_type: general-purpose
   model: opus
   description: "deep-audit: consolidate-and-triage"
   prompt: |
     <consolidate-and-triage.md content>
   ```

3. After the subagent completes:
   - Read `_bmad-output/deep-audit/findings.md`
   - Parse the Triage Summary section for counts
   - Update `state.triage` in state.json with accepted/skipped/invalid counts
   - Print: `[Phase 5 complete: X accepted, Y skipped, Z invalid, W dupes merged]`

---

## Phase 6: Generate Themes + Report (subagent)

Spawn a dedicated subagent with a fresh context window to perform two tasks in sequence: generate structured refactoring themes, then produce the final report incorporating those themes. The orchestrator does NOT generate themes or the report itself.

1. Read the report template from `skills/deep-audit/templates/report-template.md`
2. Read the theme generation instructions from `skills/deep-audit/templates/theme-generator-instructions.md`
3. Spawn via Task tool:
   ```
   Tool: Task
   subagent_type: general-purpose
   model: opus
   description: "deep-audit: themes-and-report"
   prompt: |
     You are the report generation agent for a multi-agent codebase audit. You have TWO tasks: first generate structured refactoring themes from the findings, then produce the final user-facing report that includes those themes.

     ## Task 1 — Generate Refactoring Themes

     1. Read the consolidated findings from: `_bmad-output/deep-audit/findings.md`
     2. Read the theme generation instructions from: `skills/deep-audit/templates/theme-generator-instructions.md`
     3. Following those instructions, group ALL accepted findings into cross-severity structured themes
     4. Generate the THEME blocks and EXECUTION ORDER block (exact formats are in the instructions file)
     5. Hold these blocks in memory for Task 2

     ## Task 2 — Generate Report

     1. Read the report template from: `skills/deep-audit/templates/report-template.md` — it contains both the template structure AND the scoring reference (weights and score-to-label mapping) in HTML comments at the top
     2. Read `_bmad-output/deep-audit/state.json` for mode, scope, start_time, detected_stack, start_commit, and agent list

     Fill in the report template:

     1. **Header fields**: date, mode, scope description, agent count, detected stack, duration, commit hash

     2. **Scorecard**: Build from DIMENSION SUMMARY data in findings.md
        - For each dimension: fill in score, P1/P2/P3 counts, assessment
        - Calculate overall health score using the weighted formula in the scoring reference comment
        - Map overall score to label using the score table in the scoring reference comment

     3. **Findings sections**: Use the themes you generated in Task 1 to organize findings
        - Structure: top-level = P1/P2/P3 sections, within each severity = findings grouped by theme
        - Render each finding using the Finding Detail Template in the report template

     4. **Skipped Findings appendix**: Copy from findings.md Skipped Findings table

     5. **Invalid Findings appendix**: Copy from findings.md Invalid Findings table

     6. **Next Steps**: Keep as-is (point to /fix-audit-findings)

     7. **Statistics**: Total findings, per-severity counts, agent count, dimension count, per-agent breakdown table

     8. **Refactoring Plan section**: Append the THEME blocks and EXECUTION ORDER block from Task 1 into the `## Refactoring Plan` section at the end of the report

     ## Output

     Determine the output path:
     - Base: `_bmad-output/deep-audit/deep-audit-<YYYY-MM-DD>.md`
     - If file exists, append suffix: `-2`, `-3`, etc.

     Write the filled report to the output path.
     After writing, print: `[REPORT WRITTEN] <output-path>`
   ```

3. After the subagent completes:
   - Capture the report path from its output
   - Read the report and parse THEME block IDs/names, populate `state.json.themes[]`
   - Update state.json with `report_path`
   - Print: `[Phase 6 complete: themes generated + report written]`

---

## Phase 7: Finalize State

Update `_bmad-output/deep-audit/state.json`:
- Set `status = "completed"`
- Set `end_time` to current ISO timestamp
- Set `report_path` to the report file path

Print: `[Phase 7 complete: state finalized]`

---

## Phase 8: Present Summary

Print a concise summary to the user:

```
═══════════════════════════════════════════════════
  DEEP AUDIT COMPLETE
═══════════════════════════════════════════════════

Mode: <quick|full|single> (<agent_count> agent(s))
Scope: <scope description>
Duration: <duration>

SCORECARD
─────────────────────────────────────────────────
<dimension>          <score>/10  (<P1> P1, <P2> P2, <P3> P3)
<dimension>          <score>/10  (<P1> P1, <P2> P2, <P3> P3)
...
─────────────────────────────────────────────────
Overall Health:      <overall>/10 — <label>

FINDINGS: <total_accepted> accepted (<P1_count> critical, <P2_count> important, <P3_count> minor)
Skipped: <skip_count> | Invalid: <invalid_count>

THEMES
1. <theme name> (<finding_count> findings, <severity breakdown>)
2. <theme name> (<finding_count> findings, <severity breakdown>)
...

Report: <report_path>
Findings: _bmad-output/deep-audit/findings.md
State:  _bmad-output/deep-audit/state.json

Suggest: Run /fix-audit-findings to execute refactoring themes
═══════════════════════════════════════════════════
```

If any agents failed, add a section:
```
WARNINGS
- Agent <name> failed: <error summary>
```

If any agents were skipped (Phase 1.5), add:
```
SKIPPED AGENTS
- <agent-name>: <reason>
```

</workflow>

## Error Recovery

If the workflow fails at any point:

1. **State is preserved**: `state.json` tracks which agents completed. Re-running `/deep-audit` with the same commit will auto-resume from where it left off.

2. **Manual recovery**: Read `_bmad-output/deep-audit/state.json` to see:
   - Which agents completed successfully (their output files are preserved)
   - Which agents were pending when the failure occurred

3. **Force fresh start**: Delete `_bmad-output/deep-audit/state.json` and re-run.

## Safety Rules

- NEVER modify source code. This is a read-only audit.
- NEVER execute project code or tests. Only use git, gh, and file reading tools.
- NEVER share audit findings outside the local report file.
- If a scope flag points to a non-existent PR or commit, inform the user and stop.
- If the project has no source files (empty repo), inform the user and stop.
