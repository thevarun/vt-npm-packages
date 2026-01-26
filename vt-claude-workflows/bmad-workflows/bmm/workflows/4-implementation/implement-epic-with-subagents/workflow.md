---
name: implement-epic-with-subagents
description: "Automate entire epic execution by orchestrating sub-agents to execute all stories sequentially with minimal human intervention"
web_bundle: true
---

# Implement Epic with Sub-Agents

**Goal:** Automate entire epic execution by orchestrating specialized sub-agents to implement all stories sequentially, with minimal human intervention. This workflow coordinates story preparation, development, quality verification, and code review agents to complete an epic autonomously. Supports optional git worktree isolation for parallel development.

**Your Role:** In addition to your name, communication_style, and persona, you are also an Epic Execution Orchestrator collaborating with developers and project managers. This is a partnership, not a client-vendor relationship. You bring multi-agent coordination expertise, state management, and failure handling capabilities, while the user brings their epic file, project context, and decision authority for escalations. Work together as equals.

> **Meta-Workflow Notice:** This is an autonomous orchestration workflow designed for minimal human intervention during execution. Unlike standard BMAD workflows that use frequent user checkpoints, this workflow operates autonomously once initiated, only pausing for critical escalations or failures. This is an intentional design choice for the meta-workflow/orchestrator pattern.

---

## WORKFLOW ARCHITECTURE

This uses **step-file architecture** with autonomous execution patterns:

### Core Principles

- **Micro-file Design**: Each step is a self-contained instruction file that is part of an overall workflow that must be followed exactly
- **Just-In-Time Loading**: Only the current step file is in memory - never load future step files until directed
- **Sequential Enforcement**: Sequence within step files must be completed in order, no skipping or optimization allowed
- **State Tracking**: Document progress in epic-specific sidecar state files (`epic-{N}-state.yaml`) for execution tracking and resumption
- **Append-Only Building**: Build completion reports by appending content as directed to output files

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order, never deviate
3. **WAIT FOR INPUT**: At initialization and escalation points, halt and wait for user input
4. **CHECK CONTINUATION**: Proceed to next step only when current step logic completes
5. **SAVE STATE**: Update sidecar state file before transitioning between steps or phases
6. **LOAD NEXT**: When directed, load, read entire file, then execute the next step file

### Critical Rules (NO EXCEPTIONS)

- **NEVER** load multiple step files simultaneously
- **ALWAYS** read entire step file before execution
- **NEVER** skip steps or optimize the sequence
- **ALWAYS** update sidecar state after every phase completion
- **ALWAYS** follow the exact instructions in the step file
- **ALWAYS** halt at escalation points and wait for user input
- **NEVER** proceed after quality gate failure without retry or escalation

### Autonomous Execution Pattern

This workflow uses an **autonomous loop pattern** in step-02-orchestrate:
- Stories are processed sequentially without user confirmation between stories
- User intervention occurs only at: initialization, failures, escalations, and completion
- Progress is reported after each story completion
- State is persisted to allow resumption if interrupted

---

## INITIALIZATION SEQUENCE

### 1. Configuration Loading

Load and read full config from `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `output_folder`, `user_name`, `communication_language`, `document_output_language`, `implementation_artifacts`

Additional configuration is available in `workflow.yaml` including:
- Agent references (story-prep, quality-gate, code-reviewer, specialists)
- Execution settings (coverage threshold, max retries, auto-commit)
- Input/output file paths

### 2. First Step Execution

Load, read the full file and then execute `{workflow_path}/steps/step-01-init.md` to begin the workflow.

If a sidecar state file exists with pending work, step-01 will automatically route to `step-01b-continue.md` for resumption.

---

## WORKFLOW STEPS

| Step | File | Purpose |
|------|------|---------|
| 1 | step-01-init.md | Entry router - detect context (worktree/main), discover sidecars, route to appropriate step |
| 1b | step-01b-continue.md | Resume from previous session using sidecar state |
| 1c | step-01c-new.md | New epic setup - mode selection, worktree creation, prerequisites, agent creation |
| 2 | step-02-orchestrate.md | Main autonomous loop - execute all stories with sub-agents |
| 3 | step-03-complete.md | Generate completion report, create PR, handle worktree cleanup |

---

## AGENT COORDINATION

This workflow orchestrates specialized agents per story:

| Agent | Purpose | Handoff |
|-------|---------|---------|
| **story-prep-master** | Create developer-ready story file from epic | Story file path |
| **specialist/dev agent** | Implement story with tests (TDD) | Files changed, coverage, test results |
| **desk-check-gate** | Visual quality gate for UI stories | Check status, screenshots |
| **principal-code-reviewer** | Code review, quality assessment, auto-fixes | Approval status, findings |

Each agent receives fresh context and returns structured handoff messages for orchestration.
