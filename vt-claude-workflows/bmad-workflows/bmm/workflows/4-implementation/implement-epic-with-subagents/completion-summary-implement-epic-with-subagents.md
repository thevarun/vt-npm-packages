---
workflowName: implement-epic-with-subagents
creationDate: 2026-01-04
module: bmm
phase: 4-implementation
status: COMPLETE
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
reviewPassed: true
reviewDate: 2026-01-04
---

# Workflow Creation Summary

## Workflow Information

- **Name:** implement-epic-with-subagents
- **Module:** bmm (BMAD Method Module)
- **Phase:** 4-implementation
- **Created:** 2026-01-04
- **Location:** `_bmad-output/bmb-creations/workflows/implement-epic-with-subagents/`
- **Target Installation:** `_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents/`

## Purpose

Automate entire epic execution by orchestrating sub-agents to execute all stories sequentially, with minimal human intervention.

## Generated Files

### Workflow Configuration
- `workflow.yaml` - Main workflow configuration

### Step Files
- `steps/step-01-init.md` - Epic initialization and prerequisite validation
- `steps/step-01b-continue.md` - Session resumption and state recovery
- `steps/step-02-orchestrate.md` - Main orchestration loop (story execution)
- `steps/step-03-complete.md` - Completion and report generation

### Templates
- `templates/epic-completion-report.md` - Epic completion report template

### Validation
- `validation/checklist.md` - Pre-execution validation checklist

## Quick Start Guide

### 1. Install the Workflow

```bash
cp -r _bmad-output/bmb-creations/workflows/implement-epic-with-subagents _bmad/bmm/workflows/4-implementation/
```

### 2. Create Required Agents

Before running, ensure these agents exist:
- `.claude/agents/story-prep-master.md`
- `.claude/agents/quality-gate-verifier.md`
- `.claude/agents/principal-code-reviewer.md`

### 3. Optional: Create Specialist Dev Agents

Populate `.claude/agents/vt-bmad-dev-agents/` with specialist agents for automatic agent selection based on story requirements.

### 4. Run the Workflow

The workflow will:
1. Load and parse the epic file
2. For each story: create → develop → quality gate → code review → git commit
3. Update sprint-status.yaml throughout
4. Generate completion report

## Key Features

- **Autonomous Execution:** Runs with minimal human intervention
- **Smart Agent Selection:** Automatically picks specialist dev agents based on story content
- **Quality Gate:** Independent verification via quality-gate-verifier agent
- **Resume Capability:** Sidecar file enables session recovery
- **Auto-Commit:** Git commits after each story completion

## Failure Handling

| Failure Type | Action |
|--------------|--------|
| Simple (lint, types) | Auto-retry up to 3 attempts |
| Moderate (test failures) | Agent attempts fix, escalate after 2 failures |
| Complex (architectural) | Stop immediately, escalate with context |

## Next Steps

1. **Install to bmm module** - Copy to final location
2. **Create quality-gate-verifier agent** - Required for quality gate phase
3. **Optionally create specialist agents** - For automatic agent matching
4. **Test with small epic** - Validate workflow before full use
5. **Configure Context-7 MCP** - Required for documentation access

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Context-7 MCP | Required | Must be configured |
| Playwright MCP | Optional | Use if available |
| story-prep-master | Required | Create if not exists |
| quality-gate-verifier | Required | Create if not exists |
| principal-code-reviewer | Required | Create if not exists |
