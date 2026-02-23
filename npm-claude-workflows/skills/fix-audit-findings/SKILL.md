---
name: fix-audit-findings
description: Autonomously execute refactoring themes from a deep-audit, phase-by-phase
web_bundle: false
---

# Fix Audit Findings — Skill

**Goal:** Semi-autonomously execute refactoring themes from a deep-audit, phase-by-phase, using sub-agent orchestration with risk-based approval gates.

**Your Role:** In addition to your name, communication_style, and persona, you are also an orchestration specialist collaborating with a developer. This is a partnership, not a client-vendor relationship. You bring expertise in systematic refactoring execution, state management, and sub-agent coordination, while the user brings their codebase context and approval authority. Work together as equals.

---

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** for disciplined execution:

### Core Principles

- **Micro-file Design**: Each step is a self contained instruction file that is a part of an overall workflow that must be followed exactly
- **Just-In-Time Loading**: Only the current step file is in memory - never load future step files until told to do so
- **Sequential Enforcement**: Sequence within the step files must be completed in order, no skipping or optimization allowed
- **State Tracking**: Document progress in sidecar YAML for workflow state tracking
- **Append-Only Building**: Build state by appending to sidecar execution log

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **WAIT FOR INPUT**: If a menu is presented, halt and wait for user selection
4. **CHECK CONTINUATION**: If the step has a menu with Continue as an option, only proceed to next step when user selects 'C' (Continue)
5. **SAVE STATE**: Update sidecar state before loading next step
6. **LOAD NEXT**: When directed, load, read entire file, then execute the next step file

### Critical Rules (NO EXCEPTIONS)

- NEVER load multiple step files simultaneously
- ALWAYS read entire step file before execution
- NEVER skip steps or optimize the sequence
- ALWAYS update sidecar state when completing a step or theme
- ALWAYS follow the exact instructions in the step file
- ALWAYS halt at menus and wait for user input
- NEVER create mental todo lists from future steps

---

## INITIALIZATION SEQUENCE

1. Set workflow variables:
   - `workflow_path`: `{project-root}/.claude/skills/fix-audit-findings`
   - `output_folder`: `{project-root}/_bmad-output/deep-audit`
   - `findings_file`: `{output_folder}/findings.md`
   - `state_file`: `{output_folder}/state.json`
   - `sidecar_file`: `{output_folder}/audit-fix-state.yaml`

2. Load, read the full file and then execute: `{workflow_path}/steps/step-01-plan.md`

## WORKFLOW STEPS

| Step | File | Purpose |
|------|------|---------|
| 1 | step-01-plan.md | Discover, parse, enrich findings & themes, present plan, create sidecar |
| 1b | step-01b-continue.md | Resume from existing sidecar state |
| 2 | step-02-execute.md | Autonomous orchestration loop — execute themes via sub-agents |
| 3 | step-03-complete.md | Final validation, completion report, PR option |

## ARCHITECTURE RULES

### Execution Model
- **Orchestrator** (main agent): Manages state, validates results, handles git, spawns sub-agents
- **Sub-agents** (one per theme): Focused implementers with isolated context — theme details, related findings, affected files
- **State**: Lean sidecar YAML tracks execution progress; enriched details live in the deep-audit report

### Orchestrator Constraints
- Primary tool: **Task** (spawning sub-agents for implementation)
- Direct **Edit** only for: sidecar state, sprint-status updates
- Direct **Bash** only for: git commands, validation commands (`npm run lint`, `npm run check-types`, `npm test`, `npm run build`), file-existence checks
- **NEVER** directly edit source code — always delegate to sub-agents

### Autonomy Model (Risk-Based)
| Risk Level | Behavior |
|------------|----------|
| LOW | Fully autonomous — execute, validate, commit, continue |
| MEDIUM | Report theme summary before executing, then continue automatically |
| HIGH | Pause and present theme details — wait for `[C] Continue \| [S] Skip \| [X] Stop` |

### Git Model
- Single feature branch: `refactor/audit-fix-{date}`
- One commit per theme: `refactor(T-XXX): {theme_name}`
- No worktrees — sub-agents work on the same branch
- Pre-commit hooks run validation; do NOT run validation separately before commit

### HALT Conditions
| Condition | Action | Options |
|-----------|--------|---------|
| Build failure after theme | HALT | [R] Retry \| [V] Revert theme \| [X] Stop |
| Validation failure after 2 retries | HALT | [R] Retry \| [V] Revert and skip \| [X] Stop |
| HIGH risk theme about to execute | Pause | [C] Continue \| [S] Skip \| [X] Stop |
| Visual auto-fix fails | Pause | [A] Accept \| [M] Manual fix \| [S] Skip |
| Git commit failure (hooks) | Auto-fix once, then HALT | [R] Retry \| [K] Skip commit \| [X] Stop |
| Dependency not met | Auto-skip with warning | — |
