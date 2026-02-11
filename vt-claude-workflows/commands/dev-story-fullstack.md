---
description: 'Hybrid fullstack story executor. Detects task type and applies UI (design-first) or backend (TDD) methodology per task.'
---

# Dev Story Fullstack Workflow

Execute fullstack stories using a **hybrid approach** - applying design-first methodology for UI tasks and TDD for backend tasks.

**Usage**: `/dev-story-fullstack {story-identifier}`

---

## Step 1: Load Story & Validate

```
1. Parse story identifier (e.g., "3.2", "S3.2", "story-3.2", or story name)
2. Read sprint-status.yaml to locate story path (or accept direct file path)
3. Read and parse story file completely
4. Extract:
   - Tasks and subtasks (checkbox items)
   - Acceptance criteria
   - Dev Notes section
   - Design references AND API specifications
5. VALIDATE: Story file exists and has required sections (Tasks, Acceptance Criteria)
   - If missing → OUTPUT: "ERROR: Story file missing or invalid. Path: {path}"
   - HALT
```

---

## Step 2: MCP Availability Protocol

**Check MCPs for both UI and backend work:**

### 2.1 Required MCPs (for UI tasks)

| MCP | Purpose | Probe Command |
|-----|---------|---------------|
| shadcn | Component library | `mcp__shadcn__get_project_registries({})` |
| Playwright | Visual validation | `mcp__playwright__playwright_navigate({ url: "about:blank" })` |

### 2.2 Optional MCPs (graceful degradation)

| MCP/Skill | Purpose | Fallback |
|-----------|---------|----------|
| Context7 | Library docs | Web search |
| MagicPatterns | Design code fetch | Manual implementation |
| Stitch | Design screen conversion | Manual implementation |
| Serena | Codebase analysis | Manual Glob/Grep |
| react-best-practices (skill) | React/Next.js performance | Standard implementation |
| Stitch react-components (skill) | Converting Stitch designs to React code | Standard implementation |

### 2.3 Probe Execution

```
1. Scan story for task types:
   - IF any UI tasks → probe shadcn and Playwright as REQUIRED
   - IF only backend tasks → skip UI MCP checks

2. FOR EACH required MCP:
   - Call probe command
   - IF unavailable:
     - OUTPUT: "ESCALATE: Required MCP '{name}' not available"
     - HALT immediately

3. FOR EACH optional MCP:
   - Attempt probe
   - Log availability with fallback notes

Document in Dev Agent Record:
  - Available MCPs: [list]
  - Unavailable (optional): [list with fallback notes]
  - Task type breakdown: {ui_count} UI, {backend_count} backend
```

---

## Step 3: Load Project Context

```
1. Check for docs/project-context.md or project-context.md
2. IF exists:
   - Read and extract: coding standards, patterns, conventions
   - Note BOTH UI patterns AND backend patterns
3. Check Dev Notes for architecture/tech-spec references
4. Load referenced documents for context
5. This context applies to ALL implementation decisions
```

---

## Step 4: Detect Restart or Review Continuation

### 4.1 Check for Incomplete Story

```
1. Scan all Tasks and Subtasks for checkbox status
2. Count: completed [x] vs incomplete [ ]
3. IF mix of completed/incomplete:
   - This is a RESTART
   - Find FIRST incomplete task → resume from there
   - Log: "RESTART: Resuming from task {X.Y}"
4. IF all incomplete:
   - This is a FRESH START
   - Log: "FRESH START: Beginning implementation"
```

### 4.2 Check for Review Feedback

```
1. Search story file for review sections:
   - "Desk Check Feedback" or "Desk Check Review"
   - "Senior Developer Review (AI)" or "Code Review"
   - "Design Review"
   - "Review Follow-ups (AI)"

2. IF review section exists:
   - Parse for unresolved items
   - IF unresolved items found:
     - Log: "Acting on {review-type} feedback"
     - Prioritize fixing review items BEFORE new implementation
3. IF no review section or all resolved:
   - Proceed with normal implementation
```

### 4.3 Document Status

```
Dev Agent Record update:
  - Execution type: "Restart from task X.Y" | "Fresh start"
  - Review action: "Acting on {type} feedback" | "No pending reviews"
```

---

## Step 5: Mark Story In-Progress

```
1. Read current status from story file
2. IF status is "ready-for-dev" or "Draft":
   - Update sprint-status.yaml → set story status to "in-progress"
   - Update story file Status field → "in-progress"
   - Log: "Status updated: in-progress"
3. IF status already "in-progress":
   - This is a restart, no update needed
   - Log: "Status unchanged (restart)"
4. IF no sprint-status.yaml:
   - Note: "No sprint tracking file found"
   - Continue without sprint updates
```

---

## Step 6: Task Type Detection & Execution

**FOR EACH task/subtask (starting from first incomplete):**

### 6.1 Detect Task Type

```
Analyze task text for type indicators:

UI TASK indicators:
  - Keywords: "component", "page", "UI", "visual", "layout", "form", "button", "modal"
  - File paths: src/components/, src/app/[locale]/, *.tsx with UI
  - References: MagicPatterns link, design reference, screenshot

BACKEND TASK indicators:
  - Keywords: "API", "endpoint", "service", "database", "schema", "migration"
  - Keywords: "validation", "authentication", "authorization", "middleware"
  - File paths: src/libs/, src/models/, src/api/, route.ts, *.service.ts

MIXED/UNCLEAR:
  - If task mentions both UI and backend → treat as BACKEND (TDD first, then UI)
  - If still unclear → ask user or check file paths in implementation notes

Log: "Task {X.Y} detected as: {UI|BACKEND}"
```

### 6.2 UI Task Execution (Design-First)

```
IF task type is UI:

1. Design Analysis:
   - Check for MagicPatterns link
   - Check for Stitch screen reference
   - Check for shadcn component mentions
   - Identify visual requirements

2. Component Implementation:
   IF MagicPatterns link:
     - Fetch code via MCP
     - Adapt for project structure
   IF Stitch screen :
     * IF component already exists → Log: "using existing" → SKIP Stitch
     * IF component NOT exists →
         - Fetch via Stitch MCP
         - Convert to React components using Stitch react-components skill
         - Run validation scripts
   IF shadcn components:
     - ALWAYS call get_item_examples_from_registries FIRST
     - Review demo output
     - Implement with correct patterns

3. Apply Performance Patterns:
   IF react-best-practices skill available:
     - Apply skill guidance during implementation

4. Visual Validation:
   - Navigate to affected page via Playwright
   - Take screenshot
   - Check console for errors
   - Fix and retry if issues (max 3 iterations)

5. Add Tests (after visual validation):
   - E2E tests for user flows
   - Unit tests for component logic

6. Run targeted tests for affected test files:
   npm test -- --filter "{test-file}"
   (The full suite runs ONCE at Step 8.1 Final Verification after ALL tasks are complete.)
```

### 6.3 Backend Task Execution (TDD)

```
IF task type is BACKEND:

1. RED Phase - Write Failing Tests:
   - Analyze task requirements
   - Write tests BEFORE implementation
   - Run tests, confirm they fail

2. GREEN Phase - Minimal Implementation:
   - Implement only what's needed to pass tests
   - Follow project patterns
   - Handle error conditions

3. REFACTOR Phase - Improve Code:
   - Clean up while keeping tests green
   - Remove duplication
   - Improve naming

4. Run targeted tests for affected test files:
   npm test -- --filter "{test-file}"
   (The full suite runs ONCE at Step 8.1 Final Verification after ALL tasks are complete.)
```

### 6.4 Track Task Type Counts

```
Maintain counters:
  - ui_tasks_completed: [count]
  - backend_tasks_completed: [count]

Update after each task completion.
```

---

## Step 7: Validate & Mark Task Complete

**FOR EACH task:**

### Validation Gates

**For UI Tasks:**
```
- [ ] Visual output matches design intent
- [ ] Console shows no errors from changed code
- [ ] Tests exist and pass
```

**For Backend Tasks:**
```
- [ ] TDD cycle completed (red → green → refactor)
- [ ] All tests pass 100%
- [ ] No regressions
```

**For Both:**
```
- [ ] Acceptance criteria for this task satisfied
```

### IF ALL GATES PASS:

```
1. IMMEDIATELY edit story file:
   - Change task checkbox from [ ] to [x]
   - Save the file

2. Update File List section in story

3. Add note to Dev Agent Record → Debug Log:
   - "{timestamp}: Task X.Y ({UI|BACKEND}) completed"

4. Update task type counters:
   - ui_tasks_completed += 1  OR  backend_tasks_completed += 1

5. Proceed to next incomplete task (or Step 8 if all done)
```

### IF GATES FAIL:

```
1. Document failure reason in Debug Log
2. Attempt to fix (max 3 tries)
3. IF cannot resolve:
   - HALT with status: blocked
   - Output blocker details
```

---

## Step 8: Story Completion & Summary

### 8.1 Final Verification

```
1. Re-scan story file for any unmarked tasks
2. IF any [ ] tasks remain:
   - Return to Step 6 for those tasks

3. Run full test suite:
   npm test
   npm run test:e2e (if available)

4. Verify ALL tests pass
```

### 8.2 Execute Definition of Done Checklist

```
## Fullstack Story DoD Checklist

### UI Tasks
- [ ] Visual validation passed (screenshots captured)
- [ ] Component library used (not built from scratch)
- [ ] Console shows no JS errors

### Backend Tasks
- [ ] TDD compliance verified (tests first)
- [ ] All tests pass
- [ ] Security checks passed (no hardcoded secrets, input validation)

### Integration
- [ ] End-to-end flow works (UI → API → response)
- [ ] API contracts validated (request/response shapes)
- [ ] Error handling verified across the stack

### Common
- [ ] All tasks/subtasks marked [x]
- [ ] Implementation matches acceptance criteria
- [ ] No scope creep
- [ ] Completion Notes written
- [ ] Status set to "review"

FOR EACH unchecked item:
  - Fix the issue
  - Re-run validation
```

### 8.3 Write Completion Notes

```
Add to Dev Agent Record or story file:

## Completion Notes

**Summary**: [1-2 sentence description of what was built]

**Key Decisions**:
- [Decision 1 and rationale]
- [Decision 2 and rationale]

**UI Components Added**:
- [shadcn/MagicPatterns components]

**Backend Services Added**:
- [APIs, services, database changes]

**Integration Notes**:
- [How UI and backend connect]
- [Data flow description]

**Known Limitations** (if any):
- [Any compromises or TODOs for future]

**Testing**:
- [Test types: unit, integration, E2E]
- [Test count and coverage]
```

### 8.4 Update Status

```
1. Update story file Status → "review"
2. Update sprint-status.yaml → set story status to "review"
3. Log: "Story completed, status: review"
```

---

## Step 9: Completion Handoff

**Output this structured handoff:**

```
=== AGENT HANDOFF ===
agent: {agent-name}
story: [story number, e.g., "3.2"]
status: completed | failed | blocked
files_changed:
  - [list all modified/created files]
ui_tasks_completed: [count]
backend_tasks_completed: [count]
visual_validation:
  screenshots: [list paths] | "N/A"
  console_errors: none | [list]
tests_passed: true | false
tests_run: [count]
tdd_compliance: true | false | "partial" (if mixed)
dod_checklist: passed | failed
completion_notes: written | skipped
blockers: none | [list blockers]
next_action: proceed | fix_required | escalate
=== END HANDOFF ===
```

**Status Definitions:**
- `completed`: All tasks done, DoD passed, ready for review
- `failed`: Errors encountered that could not be resolved
- `blocked`: External dependency prevents completion

**Next Action:**
- `proceed`: Story ready for code review / quality gate
- `fix_required`: Minor issues need attention
- `escalate`: Requires human intervention

---

## Task Type Detection Reference

### UI Task Patterns

| Pattern | Example |
|---------|---------|
| Component keywords | "Add Button component", "Create Card layout" |
| Page keywords | "Build dashboard page", "Create settings view" |
| Visual keywords | "Style the header", "Add responsive grid" |
| File paths | `src/components/`, `src/app/[locale]/` |
| Design refs | MagicPatterns link, Figma, screenshot |

### Backend Task Patterns

| Pattern | Example |
|---------|---------|
| API keywords | "Create /api/users endpoint", "Add POST handler" |
| Database keywords | "Add user table", "Create migration" |
| Service keywords | "Implement auth service", "Add validation" |
| File paths | `src/libs/`, `src/models/`, `route.ts` |
| Security keywords | "Add authentication", "Validate input" |

### Mixed Task Handling

```
When task is clearly mixed (e.g., "Add form with API submission"):

1. Identify backend component first
2. Implement backend with TDD
3. Then implement UI with design-first
4. Integrate and test end-to-end

This ensures API contract is defined before UI consumes it.
```

---

## MCP Best Practices Reference

### shadcn MCP (UI Tasks)

```
1. get_project_registries - Verify setup
2. search_items_in_registries - Find components
3. get_item_examples_from_registries - ALWAYS call before implementing
4. get_add_command_for_items - Get install command
5. get_audit_checklist - Run after adding
```

### Playwright MCP (UI Tasks)

```
1. playwright_navigate - Go to page
2. playwright_screenshot - Capture for validation
3. playwright_console_logs - Check for errors
4. playwright_close - Clean up
```

### Context7 MCP (Both)

```
1. resolve-library-id - Get library ID first
2. query-docs - Query patterns
3. Fallback: WebSearch
```
