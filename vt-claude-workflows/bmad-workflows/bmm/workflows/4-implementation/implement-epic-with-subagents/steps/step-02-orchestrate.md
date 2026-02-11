---
name: 'step-02-orchestrate'
description: 'Main orchestration loop - execute all stories autonomously with sub-agents'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-02-orchestrate.md'
nextStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/workflow.md'

# Template References
spawnStoryPrepTemplate: '{workflow_path}/templates/spawn-story-prep.md'
spawnDevAgentTemplate: '{workflow_path}/templates/spawn-dev-agent.md'
spawnCodeReviewTemplate: '{workflow_path}/templates/spawn-code-review.md'

# Task References
# (orchestration uses sub-agents, not BMAD tasks)

# State files
sidecarFolder: '{output_folder}/epic-executions'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'

# Agent references
storyPrepAgent: '.claude/agents/story-prep-master.md'
codeReviewAgent: '.claude/agents/principal-code-reviewer.md'
deskCheckAgent: '.claude/agents/desk-check-gate.md'
specialistAgentsFolder: '.claude/agents/vt-bmad-dev-agents/'
fallbackDevAgent: '_bmad/bmm/agents/dev.md'

# Desk check configuration
screenshotsFolder: '{implementation_artifacts}/screenshots'

# Configuration
coverageThreshold: 80
maxRetries: 3
---

# Step 2: Story Orchestration Loop

## STEP GOAL:

To autonomously execute all pending stories in the epic by orchestrating specialized sub-agents through the complete implementation pipeline: create → develop → desk-check (UI only) → review → commit → finalize.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Orchestrator-Specific Rules (Autonomous Execution):

- 🛑 PAUSE execution only on critical blockers or user-required decisions
- 📖 CRITICAL: Execute stories sequentially, one at a time
- 🔄 CRITICAL: Update sidecar state after EVERY phase completion
- 📋 YOU ARE THE ORCHESTRATOR - spawn agents, parse results, manage flow

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator
- ✅ You spawn sub-agents with fresh context for each task
- ✅ You parse handoff messages to determine next actions
- ✅ You handle failures gracefully with retry or escalation
- ✅ You output brief progress after each story completion

### Orchestrator Tool Guidance:

As orchestrator, your primary tool is Task (spawning agents). Avoid using Edit or Bash
on source code files - delegate ALL development work to sub-agents.

When a phase produces issues that need fixing (review rejections, test failures, desk-check
changes requested), spawn the dev agent again with the fix context rather than editing
code yourself.

**Reserve direct Edit for:** sidecar files and sprint-status.yaml only.
**Reserve direct Bash for:** git commands and file existence checks only.

### Step-Specific Rules:

- 🎯 Execute stories in linear order from pending list
- 🚫 FORBIDDEN to skip phases within a story
- 💬 Output brief status after each story completes
- 🚪 ESCALATE to user only when required (blockers, complex failures)

## EXECUTION PROTOCOLS:

- 🎯 Update sidecar before each phase starts
- 💾 Parse agent handoff messages for status
- 📖 Verify sprint-status matches sidecar state
- 🚫 NEVER proceed if code review rejected without retry/escalate

## CONTEXT BOUNDARIES:

- **Sidecar path:** Use `sidecar_path` from router context (step-01-init). In worktree mode, the sidecar is in the main repo's `_bmad-output/epic-executions/`, NOT the worktree's folder.
- Sidecar file tracks current story and phase
- Each agent gets fresh context with specific instructions
- Sprint-status.yaml is source of truth for story states
- Handoff messages provide phase completion status

**CRITICAL for worktree mode:** All sidecar updates must use the absolute `sidecar_path` passed from step-01-init. Do NOT use `{sidecarFolder}` directly as it resolves to the wrong location in worktrees.

---

## STORY EXECUTION LOOP

For each story in `stories_pending`:

### PHASE A: Create Story

**Update sidecar:**
```yaml
current_story: "N.M"
current_phase: "create"
last_updated: "[timestamp]"
```

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Create story N.M"
  prompt: |
    You are the story-prep-master agent.
    Load and embody: {storyPrepAgent}

    Task: Create story N.M from the epic file.
    Epic file: [epic_path]
    Story location: {implementation_artifacts}/stories/
    Sprint status: {sprintStatus}

    Create a complete, developer-ready story file following BMAD story template.

    When complete, output handoff in this format:
    === AGENT HANDOFF ===
    agent: story-prep-master
    story: N.M
    status: completed | failed
    story_file: [path to created story]
    blockers: none | [list]
    next_action: proceed | escalate

    # Retrospective (for orchestrator learning)
    went_well: [what worked smoothly in this phase]
    challenges: [what was difficult or didn't go well]
    suggestions: [what could be improved for future stories]
    === END HANDOFF ===
```

**Parse handoff:**
- If status=completed → update sprint-status to `ready-for-dev`, proceed to Phase B
- If status=failed → handle failure (retry or escalate)

---

### PHASE B: Develop Story

**Update sidecar:**
```yaml
current_phase: "dev"
last_updated: "[timestamp]"
```

**Select specialist agent:**
1. Read story file content (title, tasks, dev notes)
2. Scan `{specialistAgentsFolder}` for agents
3. For each agent, read `specialty` field and `Specialty Context`
4. Match story content against agent specializations
5. If match found → use specialist
6. If no match → use fallback `{fallbackDevAgent}`

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Develop story N.M"
  prompt: |
    You are a specialized developer agent.
    Load and embody: [selected agent path]

    Task: Implement story N.M completely.
    Story file: [story_path]
    Sprint status: {sprintStatus}
    Project context: [project_context_path if exists]

    Follow the story's tasks/subtasks exactly.
    Write tests first (red-green-refactor).
    Mark tasks complete as you finish them.

    Test Strategy: Run TARGETED tests (npm test -- --filter "{test-file}")
    during development. The full test suite runs ONCE at the end of all tasks
    (Step 8.1 Final Verification). Do NOT run the full suite after each task.

    Available MCP Tools (use if available):
    - Serena MCP: Code intelligence for navigation, refactoring
    - Context7 MCP: Documentation lookup

    When complete, output handoff in this format:
    === AGENT HANDOFF ===
    agent: [agent_name]
    story: N.M
    status: completed | failed | blocked
    files_changed:
      - [list of files]
    tests_passed: true | false
    tests_run: [count]
    tests_failed: [count]
    coverage: [percentage]
    has_ui_changes: true | false
    ui_routes_affected: [list of routes or "none"]
    blockers: none | [list]
    next_action: proceed | escalate | retry
    error_summary: null | [description]

    # Retrospective (for orchestrator learning)
    went_well: [what worked smoothly in this phase]
    challenges: [what was difficult or didn't go well]
    suggestions: [what could be improved for future stories]
    === END HANDOFF ===
```

**Parse handoff:**
- If status=completed, tests_passed=true → proceed to Phase C (if has_ui_changes) or Phase D
- If status=failed, blockers contains critical → escalate to user
- If tests_passed=false → retry (up to maxRetries)

---

### PHASE C: Desk Check (Conditional)

**Skip this phase if:**
- `has_ui_changes` is false AND no UI-related files in `files_changed`

**Update sidecar:**
```yaml
current_phase: "desk_check"
last_updated: "[timestamp]"
```

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Desk check story N.M"
  prompt: |
    You are the desk-check-gate agent.
    Load and embody: {deskCheckAgent}

    Task: Visual desk check for story N.M
    Story file: [story_path]
    Dev handoff:
      files_changed: [list from dev handoff]
      has_ui_changes: [bool from dev handoff]
      ui_routes_affected: [list from dev handoff]

    Configuration:
      dev_server: {dev_server config from workflow.yaml}
      test_credentials: {test_credentials from workflow.yaml}
      screenshots_folder: {screenshotsFolder}/story-N.M/

    Perform visual inspection per agent protocol.

    Include these retrospective fields in your handoff:
    # Retrospective (for orchestrator learning)
    went_well: [what worked smoothly in this phase]
    challenges: [what was difficult or didn't go well]
    suggestions: [what could be improved for future stories]

    Output handoff when complete.
```

**Parse handoff and route:**
- `check_status: approved` → Phase D (Code Review)
- `check_status: changes_requested` → Spawn the dev agent (Opus) to fix visual issues:

  ```
  Task tool:
    subagent_type: "general-purpose"
    model: "opus"
    description: "Fix desk-check issues story N.M"
    prompt: |
      You are a developer agent fixing visual/desk-check issues.
      Load and embody: [same specialist agent path used in Phase B]

      Story file: [story_path]
      IMPORTANT: Re-read the story file FIRST. The desk-check agent may have
      annotated it with "Desk Check Feedback" or "Desk Check Review" sections
      containing specific notes and change requests. The dev-story commands
      (Step 4.2) already have review feedback detection - leverage this.

      Files that were changed: [files_changed from Phase B dev handoff]

      Desk-Check Findings to Fix:
      [paste the desk-check handoff findings/annotations]
      Screenshots: [screenshot paths if any]

      Fix all visual issues identified by the desk-check agent.
      Run targeted tests to verify fixes don't break anything.

      Output handoff using the standard AGENT HANDOFF format.
  ```

  After fix completes → re-run Phase C (desk check) for verification.
  Maximum desk-check fix cycles: {maxRetries}

- `check_status: rejected` → Escalate to user with `escalation_reason`

**Pass visual context to Code Review (Phase D):**
When spawning code review agent, include:
```
Visual check results:
  status: {desk_check_status}
  screenshots: {screenshot_paths from handoff}
  minor_fixed: {list of auto-fixed issues}

Include visual considerations in your review.
```

---

### PHASE D: Code Review

**Update sidecar:**
```yaml
current_phase: "review"
last_updated: "[timestamp]"
```

**Spawn agent:**
```
Task tool:
  subagent_type: "general-purpose"
  description: "Review story N.M"
  prompt: |
    You are the principal-code-reviewer agent.
    Load and embody: {codeReviewAgent}

    Task: Perform thorough code review for story N.M.
    Story file: [story_path]
    Files changed: [from dev handoff]

    Visual check results (if UI story):
      status: [desk_check_status from Phase C or "skipped"]
      screenshots: [screenshot_paths if any]
      minor_fixed: [list of auto-fixed CSS/Tailwind issues]

    Review for:
    - Code quality and patterns
    - Test coverage and quality
    - Security considerations
    - Performance implications
    - Adherence to project standards
    - Visual implementation quality (if screenshots provided)

    When complete, output handoff in this format:
    === CODE REVIEW HANDOFF ===
    agent: principal-code-reviewer
    story: N.M
    review_status: approved | changes_requested | rejected
    findings:
      critical: [count]
      major: [count]
      minor: [count]
      suggestions: [count]
    summary: [brief summary]
    next_action: proceed | fix_required | escalate

    # Retrospective (for orchestrator learning)
    went_well: [what worked smoothly in this phase]
    challenges: [what was difficult or didn't go well]
    suggestions: [what could be improved for future stories]
    === END HANDOFF ===
```

**Parse handoff:**
- If review_status=approved → proceed to Phase E
- If review_status=changes_requested → Spawn the dev agent (Opus) to fix code issues:

  ```
  Task tool:
    subagent_type: "general-purpose"
    model: "opus"
    description: "Fix review issues story N.M"
    prompt: |
      You are a developer agent fixing code review findings.
      Load and embody: [same specialist agent path used in Phase B]

      Story file: [story_path]
      IMPORTANT: Re-read the story file FIRST. The code reviewer may have
      annotated it with "Senior Developer Review (AI)", "Code Review", or
      "Review Follow-ups (AI)" sections containing specific findings and
      change requests. The dev-story commands (Step 4.2) already have
      review feedback detection - leverage this.

      Files that were changed: [files_changed from Phase B dev handoff]

      Code Review Findings to Fix:
      [paste the review findings from handoff]

      Fix all critical and major findings.
      Run targeted tests to verify fixes.
      Run full test suite once after all fixes.

      Output handoff using the standard AGENT HANDOFF format.
  ```

  After fix completes → re-submit to Phase D (code review) for verification.
  Maximum review fix cycles: {maxRetries}

- If review_status=rejected → escalate to user

---

### PHASE E: Git Commit

**Update sidecar:**
```yaml
current_phase: "commit"
last_updated: "[timestamp]"
```

**Execute git commit:**

Pre-commit hooks run the full test suite. Do NOT run tests separately before committing -
the hook handles it. If the commit hook fails tests, investigate and fix (spawn dev agent
if needed), then re-attempt the commit.

```bash
git add .
git commit -m "feat(story-N.M): [story title]

Implemented via implement-epic-with-subagents workflow.
Agent: [dev_agent_name]
Coverage: [coverage]%
Tests: [passed]/[total]

Co-Authored-By: [agent_name] <noreply@anthropic.com>"
```

**Verify commit success** - if fails, log error but continue.

---

### PHASE F: Finalize Story

**Update sidecar:**
```yaml
current_story: null
current_phase: "between_stories"
stories_completed: [..., "N.M"]
stories_pending: [remaining stories]
last_updated: "[timestamp]"
execution_log:
  - story: "N.M"
    agent: "[dev_agent_used]"
    coverage: [X]
    tests: "[passed]/[total]"
    duration: "[time]"
    completed_at: "[timestamp]"
```

**Update sprint-status.yaml:**
- Set story N.M status to `done`

**Output progress to user:**
```
✅ Story N.M: [story title]
   Agent: [agent-name] | Coverage: X% | Tests: P/T | Duration: Xm
```

**Continue to next story** - loop back to Phase A for next pending story.

---

## FAILURE HANDLING

### On Failure (After Retries Exhausted):

1. Determine failure type from handoff
2. Display failure context to user:

```
⚠️ Story N.M Failed

Phase: [phase where failure occurred]
Error: [error summary]
Attempts: [retry count]

Context:
[relevant details from handoff]

Options:
[S] Skip this story and continue
[X] Stop epic execution
```

3. Wait for user decision
4. If Skip:
   - Add story to `stories_skipped` in sidecar
   - Update sprint-status to `skipped`
   - Continue to next story
5. If Stop:
   - Update sidecar with current state
   - Route to step-03-complete (partial completion)

### On Blocker (Human Decision Required):

1. Display blocker context:

```
🛑 Human Decision Required

Story: N.M
Blocker: [blocker description]

This requires your input:
[specific question or decision needed]
```

2. Wait for user response
3. Apply user's decision
4. Continue execution

---

## LOOP COMPLETION

When `stories_pending` is empty:

1. Update sidecar:
```yaml
current_phase: "complete"
completed_at: "[timestamp]"
```

2. Output summary:
```
🎉 Epic Execution Complete!

Stories: [completed]/[total]
Skipped: [count]
Failed: [count]

Proceeding to generate completion report...
```

3. Load, read entire file, then execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All stories processed (completed, skipped, or failed with user decision)
- Sidecar updated after every phase
- Sprint-status reflects actual story states
- Git commits created for completed stories
- Progress reported after each story
- Graceful handling of failures

### ❌ SYSTEM FAILURE:

- Skipping phases within a story
- Not updating sidecar state
- Proceeding after code review rejection without retry/escalate
- Not parsing handoff messages
- Silent failures without user notification

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
