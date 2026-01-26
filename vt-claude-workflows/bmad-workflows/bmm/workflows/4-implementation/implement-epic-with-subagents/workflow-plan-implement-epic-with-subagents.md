---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
planApproved: true
outputFormatDesigned: true
structureDesigned: true
buildComplete: true
status: COMPLETE
completionDate: 2026-01-04
---

# Workflow Creation Plan: implement-epic-with-subagents

## Initial Project Context

- **Module:** bmm (BMAD Method Module)
- **Phase:** 4-implementation
- **Target Location:** `_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/`
- **Created:** 2026-01-03

## Workflow Overview

**Name:** implement-epic-with-subagents
**Purpose:** Automate entire epic execution by orchestrating sub-agents to execute all stories sequentially, with minimal human intervention.

## Problem Statement

Epic execution currently requires:
- Significant time investment
- Constant human-in-the-loop to manage agent session changes
- Manual coordination between different workflow phases

## Target Users

- Entrepreneurs
- Full stack developers
- Semi-tech Builders

---

## Key Requirements

### Workflow Type Classification

- **Primary Type:** Meta-Workflow (coordinates other workflows/agents)
- **Secondary Type:** Autonomous Workflow (runs with minimal human input)
- **Execution Model:** Fully autonomous with critical checkpoint pauses

### Core Workflow Flow

**Pattern: Sequential Epic Executor (Enhanced)**

```
Load Epic
  → Parse all stories from epic file
  → For each story (in sequence):
      → Create-story (story-prep-master agent)
      → Execute dev-story (specialist/dev agent)
      → Quality-gate (quality-gate-verifier agent)    ← Independent verification
      → Code-review (principal-code-reviewer agent)
      → Git commit
      → Update sprint-status.yaml
  → Generate Epic Completion Report
  → Epic Complete
```

### Agent Orchestration

| Step | Agent | Invocation Pattern | Source |
|------|-------|-------------------|--------|
| Create Story | story-prep-master | "Create story N.M" | `.claude/agents/story-prep-master.md` |
| Implement | **Dynamic Selection** | "Develop story N.M" | See Agent Selection Logic below |
| Quality Gate | quality-gate-verifier | "Verify story N.M" | `.claude/agents/quality-gate-verifier.md` |
| Review | principal-code-reviewer | "Review story N.M" | `.claude/agents/principal-code-reviewer.md` |

**Agent Context Rules:**
- Each agent starts with fresh context
- Agents receive explicit task instructions
- No accumulated context between agent invocations

### Development Agent Selection Logic

**Primary Source:** `.claude/agents/vt-bmad-dev-agents/`

The workflow should automatically determine the correct specialist dev agent based on:
- Story title and description
- Task types within the story
- Technology stack involved (e.g., frontend, backend, database, API)

**Selection Algorithm:**
1. Parse story content (title, tasks, dev notes)
2. Scan `.claude/agents/vt-bmad-dev-agents/` for available specialist agents
3. Match story requirements to agent specializations (based on agent descriptions)
4. If match found → invoke specialist agent
5. If no match found → fallback to `dev` (Amelia) agent at `_bmad/bmm/agents/dev.md`

**Example Specialist Agents (to be created):**
- `frontend-specialist.md` - React, Next.js, UI components
- `backend-specialist.md` - API routes, server logic
- `database-specialist.md` - Schema, migrations, queries
- `integration-specialist.md` - External APIs, third-party services

### Specialist Agent Format

Each specialist agent in `.claude/agents/vt-bmad-dev-agents/` must follow this structure:

```markdown
---
name: frontend-specialist
specialty: React/Next.js UI components and frontend architecture
description: Specialist dev agent for frontend implementation...
model: sonnet
---

## Specialty Context

**Domain:** Frontend Development
**Technologies:** React, Next.js, TypeScript, Tailwind CSS, Shadcn/UI
**Story Types:** UI components, pages, client-side logic, styling
**Keywords:** component, page, UI, form, button, modal, layout, responsive

## Matching Criteria
- Story title contains: "UI", "component", "page", "frontend"
- Tasks involve: React components, CSS, client-side state
- Dev Notes reference: src/components/*, src/app/*
```

The orchestrator scans:
1. `specialty` field (one-liner in frontmatter)
2. `Specialty Context` section for detailed matching

### Agent Handoff Contract

**Dual Communication Model:**

**PRIMARY: File Artifacts**
- `story-{N.M}.md` - created/updated by agents
- `sprint-status.yaml` - status field updated atomically
- `completion-report-{N.M}.md` - optional detailed log

**SECONDARY: Structured Handoff Message**

Each agent outputs a parseable handoff block at completion:

```
=== AGENT HANDOFF ===
agent: dev | story-prep-master | principal-code-reviewer
story: N.M
status: completed | failed | blocked
files_changed:
  - path/to/file1.tsx
  - path/to/file2.test.tsx
tests_passed: true | false
tests_run: 12
tests_failed: 0
coverage: 92%
blockers: none | ["db_migration_required", "architecture_decision"]
next_action: proceed | escalate | retry
error_summary: null | "Brief description of failure"
=== END HANDOFF ===
```

**Orchestrator Validation:**
1. Parse structured handoff message
2. Verify against sprint-status.yaml
3. Double-check = reliable status determination

### Quality Gate Agent

**Agent:** `quality-gate-verifier`
**Location:** `.claude/agents/quality-gate-verifier.md`
**Purpose:** Independent verification of implementation quality before code review

**Why Separate Agent:**
- Fresh context for objective verification
- Preserves orchestrator's context window
- Independent verification (doesn't trust dev agent's self-reporting)

**Agent Responsibilities:**
1. Run test suite independently (`npm test` or equivalent)
2. Generate and parse coverage report
3. Compare actual results with dev agent's handoff message
4. Detect discrepancies (if dev agent misreported)
5. Check for test quality indicators (not just pass/fail)
6. Validate no skipped or pending tests

**Checks:**
- All tests pass (independently verified)
- Coverage meets threshold (configurable, default 80%)
- No skipped/pending tests
- Handoff message matches actual results
- No unresolved blockers in code (TODO/FIXME checks)

**Handoff Output:**
```
=== QUALITY GATE HANDOFF ===
agent: quality-gate-verifier
story: N.M
verification_status: passed | failed | suspicious
tests_run: 12
tests_passed: 12
tests_failed: 0
tests_skipped: 0
coverage: 92%
dev_handoff_match: true | false
issues_found:
  - none | [list of issues]
recommendation: proceed | retry | escalate
notes: "Optional verification notes"
=== END HANDOFF ===
```

**Actions:**
- Pass → proceed to code-review
- Fail (simple) → retry dev-story (up to 3 attempts)
- Fail (complex) → escalate to human
- Suspicious (handoff mismatch) → escalate with warning

### Input Requirements

| Input | Format | Source |
|-------|--------|--------|
| Epic File | BMAD epics-template format | `_bmad/bmm/workflows/3-solutioning/create-epics-and-stories/templates/epics-template.md` |
| Sprint Status | YAML status tracking | `_bmad/bmm/workflows/4-implementation/sprint-planning/sprint-status-template.yaml` |
| Project Context | Markdown (optional) | `**/project-context.md` |

**Story Format Reference:** `_bmad/bmm/workflows/4-implementation/create-story/template.md`

### Output Specifications

| Output | Description |
|--------|-------------|
| Updated sprint-status.yaml | Status updated after each story phase |
| Story files | Created by story-prep-master for each story |
| Epic Completion Report | Simple summary of execution (stories completed, failed, time, issues) |

### Autonomy & Human Checkpoint Rules

**Fully Autonomous Unless:**
- Database migration required
- New architecture decision needed (rare)
- Critical blocker encountered
- Complex failure that cannot be auto-resolved

**Human has pre-reviewed epic** - no need for approval checkpoints during normal execution.

### Failure Handling Strategy

| Failure Type | Action |
|--------------|--------|
| Simple (lint, type errors, fixable test failures) | Auto-retry up to 3 attempts |
| Moderate (test failures requiring code changes) | Agent attempts fix, escalate after 2 failed attempts |
| Complex (architectural issues, missing dependencies) | Stop immediately, escalate with full context |

**Escalation Information:**
- Error logs and stack traces
- What was attempted
- Suggested fixes (if identifiable)
- Full context of the story being executed

### Progress Tracking

- Use existing BMAD sprint-status.yaml format
- Update status after each phase:
  - `backlog` → `ready-for-dev` (after story creation)
  - `ready-for-dev` → `in-progress` (during dev)
  - `in-progress` → `review` (after dev complete)
  - `review` → `done` (after code review passes)

### Story Execution Order

- **Linear execution** - stories processed in order as they appear in epic
- No complex dependency handling required
- If a story fails and escalates, workflow pauses at that story

### Instruction Style

- **Intent-Based** for orchestration logic (flexible, adaptive)
- **Prescriptive** for agent invocation (exact commands)

### Success Criteria

1. All stories in epic reach `done` status
2. All code reviews pass
3. Sprint-status.yaml accurately reflects completion
4. Completion report generated
5. No unhandled failures or silent errors

---

## Tools Configuration

### Core LLM Features (Required)

| Tool | Status | Purpose |
|------|--------|---------|
| **Sub-Agents** | ✅ Required | Core orchestration - spawn story-prep-master, dev agents, principal-code-reviewer |
| **File I/O** | ✅ Required | Read epic files, update sprint-status.yaml, create/update story files |
| **Web-Browsing** | ✅ Included | Research documentation, troubleshoot issues, access current information |

### Memory Systems

| Tool | Status | Purpose |
|------|--------|---------|
| **Sidecar File** | ✅ Included | Persist epic execution state across session boundaries, track progress, enable resume |

**Sidecar File Schema:**
```yaml
epic_execution_state:
  epic_file: "path/to/epic.md"
  current_story: "2.3"
  stories_completed: ["2.1", "2.2"]
  stories_pending: ["2.3", "2.4", "2.5"]
  last_action: "dev-story"
  last_status: "in-progress"
  started_at: "2026-01-03T10:00:00Z"
  last_updated: "2026-01-03T14:30:00Z"
```

### Core BMAD Tools

| Tool | Status | Reason |
|------|--------|--------|
| **Party-Mode** | ❌ Excluded | Not needed for autonomous execution |
| **Advanced Elicitation** | ❌ Excluded | Not needed for autonomous execution |
| **Brainstorming** | ❌ Excluded | Not a creative workflow |

### External Integrations

| Tool | Status | Implementation | Purpose |
|------|--------|----------------|---------|
| **Git Auto-Commit** | ✅ Included | Bash tool (`git add . && git commit`) | Commit after each story completion |
| **Context-7 MCP** | ✅ Required | MCP server | Access up-to-date API docs and library references |
| **Playwright MCP** | ⚪ Optional | MCP server (if installed) | E2E testing automation |

### Git Auto-Commit Integration

After each story reaches `done` status:
```bash
git add .
git commit -m "feat(story-N.M): [story title]

Implemented via implement-epic-with-subagents workflow.
Agent: [dev-agent-name]
Coverage: [X]%
Tests: [passed/total]

Co-Authored-By: [agent-name] <noreply@anthropic.com>"
```

**Commit Timing:**
- After code-review passes
- Before moving to next story
- Include structured commit message with story context

### Installation Requirements

| Tool | Requires Install | Status |
|------|------------------|--------|
| Context-7 MCP | Yes | Required - must be configured |
| Playwright MCP | Yes | Optional - use if available |
| All other tools | No | Built-in LLM capabilities |

---

## Output Format Design

### Output Documents Summary

| Output | Format Type | Template Source |
|--------|-------------|-----------------|
| Story files | Strict | Existing BMAD template (`create-story/template.md`) |
| Sidecar state file | Strict | YAML schema (defined in Tools Configuration) |
| Epic Completion Report | Structured | New template (below) |

### Epic Completion Report Template

**Format Type:** Structured (required sections, flexible content)
**File Format:** Markdown
**Location:** `{output_folder}/epic-reports/epic-completion-{epic-name}-{date}.md`

```markdown
# Epic Completion Report: {epic_name}

## Execution Summary

| Field | Value |
|-------|-------|
| **Epic File** | {epic_file_path} |
| **Started** | {start_timestamp} |
| **Completed** | {end_timestamp} |
| **Duration** | {total_duration} |
| **Status** | Completed | Partial | Failed |

## Stories Execution

| Story | Title | Status | Agent | Coverage | Tests | Duration |
|-------|-------|--------|-------|----------|-------|----------|
| N.M | {title} | done/failed | {agent_name} | X% | P/T | Xm |

### Stories Completed: {completed_count}/{total_count}

## Quality Metrics

- **Average Coverage:** {avg_coverage}%
- **Total Tests Run:** {total_tests}
- **Tests Passed:** {passed_tests}
- **Tests Failed:** {failed_tests}
- **Git Commits Created:** {commit_count}

## Agent Selection Summary

| Agent | Stories Handled | Selection Reason |
|-------|-----------------|------------------|
| {agent_name} | [N.M, N.M] | {matching_criteria} |

## Issues & Escalations

### Retries
- {story}: {retry_reason} - {outcome}

### Escalations
- {story}: {escalation_reason} - {resolution}

### Blockers Encountered
- {blocker_description}

## Session Information

- **Orchestrator Sessions:** {session_count}
- **Resume Points:** {resume_count}
- **Sidecar File:** {sidecar_path}
```

### Template Placeholders

| Placeholder | Source |
|-------------|--------|
| `{epic_name}` | Parsed from epic file |
| `{start_timestamp}` | Workflow initialization |
| `{end_timestamp}` | Final story completion |
| `{agent_name}` | Dynamic agent selection |
| `{coverage}` | Quality gate handoff |

---

## Workflow Structure Design

### Step Architecture Overview

```
step-01-init.md ─────→ step-02-orchestrate.md ─────→ step-03-complete.md
       │                        ↑
       ↓                        │
step-01b-continue.md ───────────┘
```

### Step Definitions

#### Step 1: Initialization (`step-01-init.md`)

**Purpose:** Load epic, validate prerequisites, initialize execution state

**Sequence:**
1. Load epic file (prompt user for path or auto-detect)
2. Parse all stories from epic (N.1, N.2, N.3...)
3. Validate prerequisites:
   - story-prep-master agent exists
   - quality-gate-verifier agent exists
   - principal-code-reviewer agent exists
   - Specialist agents folder exists (or fallback dev agent)
   - Context-7 MCP available
4. Load sprint-status.yaml
5. Check for existing sidecar file:
   - If exists → route to step-01b-continue
   - If not → create new sidecar file
6. Present execution plan summary
7. Menu: [C] Start Epic Execution

**Outputs:**
- Initialized sidecar state file
- Parsed story list in memory

---

#### Step 1b: Continuation (`step-01b-continue.md`)

**Purpose:** Resume epic execution from previous session

**Sequence:**
1. Load sidecar state file
2. Determine resume point:
   - Current story (N.M)
   - Current phase (create/dev/quality/review)
   - Stories completed vs pending
3. Display progress summary
4. Confirm with user
5. Menu: [C] Continue from Story N.M | [R] Restart Epic

**Outputs:**
- Updated sidecar with resume timestamp

---

#### Step 2: Orchestration Loop (`step-02-orchestrate.md`)

**Purpose:** Execute all stories autonomously with sub-agents

**Sequence:**
For each pending story in epic:

```
┌─────────────────────────────────────────────────────────────┐
│ STORY EXECUTION LOOP                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PHASE A: Create Story                                      │
│  ├── Update sidecar: current_phase = "create"               │
│  ├── Spawn: story-prep-master agent                         │
│  ├── Instruction: "Create story N.M from epic"              │
│  ├── Parse handoff message                                  │
│  ├── Update sprint-status: story → ready-for-dev            │
│  └── If failed → handle failure                             │
│                                                             │
│  PHASE B: Develop Story                                     │
│  ├── Update sidecar: current_phase = "dev"                  │
│  ├── Select specialist agent (or fallback to dev)           │
│  ├── Spawn: selected dev agent                              │
│  ├── Instruction: "Develop story N.M"                       │
│  ├── Parse handoff message                                  │
│  ├── Update sprint-status: story → in-progress              │
│  └── If failed → handle failure                             │
│                                                             │
│  PHASE C: Quality Gate                                      │
│  ├── Update sidecar: current_phase = "quality"              │
│  ├── Spawn: quality-gate-verifier agent                     │
│  ├── Instruction: "Verify story N.M"                        │
│  ├── Parse handoff message                                  │
│  ├── If failed → retry dev (up to 3x) or escalate           │
│  └── If passed → proceed                                    │
│                                                             │
│  PHASE D: Code Review                                       │
│  ├── Update sidecar: current_phase = "review"               │
│  ├── Spawn: principal-code-reviewer agent                   │
│  ├── Instruction: "Review story N.M"                        │
│  ├── Parse handoff message                                  │
│  ├── Update sprint-status: story → review                   │
│  └── If failed → handle failure                             │
│                                                             │
│  PHASE E: Git Commit                                        │
│  ├── Update sidecar: current_phase = "commit"               │
│  ├── Execute: git add . && git commit                       │
│  └── Commit message with story context                      │
│                                                             │
│  PHASE F: Finalize Story                                    │
│  ├── Update sprint-status: story → done                     │
│  ├── Update sidecar: add to stories_completed               │
│  ├── Output brief status to user                            │
│  └── Proceed to next story                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Failure Handling:**

```
On failure (after retries exhausted):
  1. Determine failure type (simple/moderate/complex)
  2. If simple: auto-retry (already handled)
  3. If requires human input:
     a. Display failure context
     b. Present options: [S] Skip this story | [X] Stop execution
     c. Wait for user decision
     d. If Skip: mark story as skipped, continue
     e. If Stop: save state, proceed to step-03 (partial)
```

**Progress Reporting:**

After each story completion:
```
✅ Story N.M: [title]
   Agent: [agent-name] | Coverage: X% | Tests: P/T | Duration: Xm
```

**Outputs:**
- Created story files
- Git commits
- Updated sprint-status.yaml
- Updated sidecar state

---

#### Step 3: Completion (`step-03-complete.md`)

**Purpose:** Generate completion report, finalize epic

**Sequence:**
1. Gather all execution data from sidecar
2. Generate Epic Completion Report (using template)
3. Save report to output folder
4. Update sprint-status: epic → done (or partial)
5. Optionally archive/delete sidecar file
6. Present summary to user

**Outputs:**
- Epic Completion Report (markdown)
- Final sprint-status.yaml update

---

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Escalation Handling** | Pause in same session | User can resolve immediately without context loss |
| **Progress Reporting** | Brief status per story | Keeps user informed without verbose output |
| **Story Failure** | Ask user to skip or stop | User decides based on epic context and dependencies |

### Interaction Patterns

| Phase | User Interaction Level |
|-------|------------------------|
| Init | Interactive (confirm epic, start) |
| Continue | Interactive (confirm resume) |
| Orchestration | Autonomous (interrupt only on blocker) |
| Failure | Interactive (skip/stop decision) |
| Complete | Interactive (review summary) |

### File Structure

```
implement-epic-with-subagents/
├── workflow.yaml           # Workflow configuration
├── workflow.md             # Main workflow entry (optional)
├── steps/
│   ├── step-01-init.md
│   ├── step-01b-continue.md
│   ├── step-02-orchestrate.md
│   └── step-03-complete.md
├── templates/
│   └── epic-completion-report.md
└── validation/
    └── checklist.md        # Pre-execution validation
```

### State Management

**Sidecar File Updates:**
- On init: Create with epic info + story list
- On each phase start: Update current_story, current_phase
- On story complete: Add to stories_completed
- On failure: Record failure details
- On resume: Add resume timestamp

### Agent Spawning Pattern

```
Task tool invocation:
{
  subagent_type: "general-purpose",
  prompt: "[Agent instructions with story context]",
  description: "[Phase] story N.M"
}
```

Each agent receives:
- Story file path
- Sprint status path
- Project context path (if exists)
- Specific task instructions

---

## Build Summary

### Files Generated

**Workflow Files:**
| File | Path | Size |
|------|------|------|
| workflow.yaml | `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/workflow.yaml` | Main config |
| step-01-init.md | `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/steps/step-01-init.md` | Initialization |
| step-01b-continue.md | `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/steps/step-01b-continue.md` | Continuation |
| step-02-orchestrate.md | `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/steps/step-02-orchestrate.md` | Main loop |
| step-03-complete.md | `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/steps/step-03-complete.md` | Completion |

**Templates:**
| File | Path |
|------|------|
| epic-completion-report.md | `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/templates/epic-completion-report.md` |

**Validation:**
| File | Path |
|------|------|
| checklist.md | `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/validation/checklist.md` |

**New Agents Created:**
| Agent | Path |
|-------|------|
| quality-gate-verifier | `.claude/agents/quality-gate-verifier.md` |

**Folders Created:**
| Folder | Purpose |
|--------|---------|
| `.claude/agents/vt-bmad-dev-agents/` | Specialist dev agents (empty, ready for population) |

### Installation Notes

To install workflow to bmm module:
```bash
cp -r _bmad-output/bmb-creations/workflows/implement-epic-with-subagents _bmad/bmm/workflows/4-implementation/
```

### Next Steps

1. **Review generated files** - Verify content matches requirements
2. **Create specialist agents** - Populate `.claude/agents/vt-bmad-dev-agents/` with specialists
3. **Test workflow** - Run with a small epic to validate
4. **Install to bmm** - Copy to final location when ready

### Build Timestamp

Generated: 2026-01-04

---

## Fresh-Eyes Review (2026-01-04)

### Validation Results

| Category | Result |
|----------|--------|
| Configuration validation | ⚠️ PASSED with notes |
| Step compliance | ✅ PASSED |
| Cross-file consistency | ⚠️ PASSED with notes |
| Requirements verification | ✅ PASSED |

### Issues Found

**Warnings (2):**
1. **Config Path Assumption** - workflow.yaml references `_bmad/bmm/config.yaml`. Verify bmm config exists with `implementation_artifacts` before first run.
2. **Template Placeholder Syntax** - epic-completion-report.md uses `{{placeholder}}` while steps use `{variable}`. Minor inconsistency.

**Suggestions (2):**
1. Consider adding `validation/pre-flight.sh` script for automated checks
2. Include example specialist agent template in package

### Review Outcome

All critical checks passed. Workflow is ready for deployment and testing. Minor warnings are documented for awareness but do not block usage.

### Reviewer Notes

- All original requirements from plan are implemented
- Step files follow BMAD template structure
- Agent orchestration pattern is well-designed
- Failure handling is comprehensive
- Resume capability via sidecar is robust
