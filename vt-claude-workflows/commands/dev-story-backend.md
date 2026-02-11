---
description: 'TDD backend story executor. Loads story, validates context, implements with red-green-refactor discipline.'
---

# Dev Story Backend Workflow

Execute backend stories using a **Test-Driven Development (TDD) approach** with red-green-refactor discipline.

**Usage**: `/dev-story-backend {story-identifier}`

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
   - API specifications, database schema references
5. VALIDATE: Story file exists and has required sections (Tasks, Acceptance Criteria)
   - If missing → OUTPUT: "ERROR: Story file missing or invalid. Path: {path}"
   - HALT
```

---

## Step 2: MCP Availability Protocol

**All MCPs are optional for backend work - graceful degradation available:**

| MCP | Purpose | Fallback |
|-----|---------|----------|
| Context7 | Library documentation | Web search |
| Serena | Codebase analysis | Manual Glob/Grep exploration |

### Probe Execution

```
FOR EACH optional MCP:
  1. Attempt probe:
     - Context7: mcp__context7__resolve-library-id({ libraryName: "test", query: "test" })
     - Serena: [check if available in tool list]

  2. IF available:
     - Log: "MCP {name}: available"

  3. IF unavailable:
     - Log: "MCP {name}: unavailable - using fallback"
     - Note fallback approach

No critical MCPs for backend - all have fallbacks.
Document in Dev Agent Record.
```

---

## Step 3: Load Project Context

```
1. Check for docs/project-context.md or project-context.md
2. IF exists:
   - Read and extract: coding standards, patterns, conventions
   - Note API patterns, error handling conventions
   - Note database/ORM patterns
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
1. Search story file for these sections:
   - "Desk Check Feedback" or "Desk Check Review"
   - "Senior Developer Review (AI)" or "Code Review"
   - "Review Follow-ups (AI)"

2. IF review section exists:
   - Parse for unresolved items (unchecked boxes, open issues)
   - IF unresolved items found:
     - Log: "Acting on {review-type} feedback"
     - Prioritize fixing review items BEFORE new implementation
     - Create mental task list from review items
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

## Step 6: Implement with TDD (Per Task)

**FOR EACH task/subtask (starting from first incomplete):**

### 6.1 RED Phase - Write Failing Tests First

```
1. Analyze task requirements:
   - What behavior should be implemented?
   - What are the expected inputs/outputs?
   - What error conditions should be handled?

2. Write test(s) BEFORE any implementation:
   - Test file location: co-located (e.g., service.test.ts) or tests/ directory
   - Use project's testing framework (Vitest/Jest)
   - Cover happy path AND edge cases

3. Run tests and CONFIRM they fail:
   npm test -- --filter "{test-file}"

   - IF tests pass (shouldn't happen yet):
     - Tests may be wrong - review test logic
     - Ensure testing actual new behavior

4. Log: "RED: {count} failing tests for task {X.Y}"
```

### 6.2 GREEN Phase - Minimal Implementation

```
1. Implement ONLY what's needed to pass the tests:
   - Follow project patterns from project-context.md
   - Use existing utilities/helpers where available
   - Handle error conditions from task spec

2. Run tests after each change:
   npm test -- --filter "{test-file}"

3. Continue until ALL tests pass:
   - Focus on making tests green
   - Don't optimize yet

4. Log: "GREEN: All tests passing for task {X.Y}"
```

### 6.3 REFACTOR Phase - Improve Code Quality

```
1. With tests passing, improve the code:
   - Remove duplication
   - Improve naming
   - Extract functions if needed
   - Ensure consistent style

2. After EACH refactor, run targeted tests:
   npm test -- --filter "{test-file}"

   - Tests MUST stay green
   - IF tests fail: revert last change, try different approach

3. Log: "REFACTOR: Code improved, tests still green"
```

### 6.4 Task Completion Check

```
IMPORTANT: Do NOT run the full test suite after each individual task.
The full suite runs ONCE at Step 8.1 (Final Verification) after ALL tasks are complete.

1. Verify targeted tests for this task pass:
   npm test -- --filter "{test-file}"

2. IF targeted tests fail:
   - Fix immediately
   - Do not proceed with failing tests

3. Proceed to next task (or Step 7 validation gates)
```

---

## Step 7: Validate & Mark Task Complete

**FOR EACH task:**

### Validation Gates (ALL must pass)

```
- [ ] Tests exist for the functionality (written FIRST)
- [ ] TDD cycle completed (red → green → refactor)
- [ ] All targeted tests pass 100%
- [ ] No regressions in targeted tests (full suite verified at Step 8.1)
- [ ] Acceptance criteria for this task satisfied
```

### IF ALL GATES PASS:

```
1. IMMEDIATELY edit story file:
   - Change task checkbox from [ ] to [x]
   - Save the file

2. Update File List section in story:
   - Add any new/modified files

3. Add note to Dev Agent Record → Debug Log:
   - "{timestamp}: Task X.Y completed (TDD) - {brief summary}"

4. IF this was a review follow-up task:
   - Mark corresponding review item as resolved

5. Proceed to next incomplete task (or Step 8 if all done)
```

### IF GATES FAIL:

```
1. Document failure reason in Debug Log
2. Attempt to fix (max 3 tries per issue)
3. IF cannot resolve after 3 tries:
   - Document blocker clearly
   - HALT with status: blocked
   - Output blocker details for user
```

---

## Step 8: Story Completion & Summary

### 8.1 Final Verification

```
1. Re-scan story file for any unmarked tasks
2. IF any [ ] tasks remain:
   - Return to Step 6 for those tasks
   - Do NOT proceed until all [x]

3. Run full regression suite:
   npm test

4. Verify ALL tests pass
```

### 8.2 Execute Definition of Done Checklist

```
## Backend Story DoD Checklist

### TDD Compliance
- [ ] Tests written BEFORE implementation (for each task)
- [ ] Red-green-refactor cycle followed
- [ ] All tests pass 100%
- [ ] No test skips or `.only` left in code

### Implementation
- [ ] All tasks/subtasks marked [x]
- [ ] Implementation matches acceptance criteria
- [ ] Error handling per spec
- [ ] No scope creep (only implemented what was specified)
- [ ] Follows project patterns from project-context.md

### Security
- [ ] No hardcoded secrets or credentials
- [ ] Input validation on external data (API inputs, user data)
- [ ] SQL injection prevention (parameterized queries)
- [ ] Proper authentication/authorization checks (if applicable)

### Documentation
- [ ] File List updated in story
- [ ] Completion Notes written (see below)
- [ ] Change Log updated (if exists)
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

**Architecture Notes** (if applicable):
- [Patterns followed]
- [Dependencies added]

**Known Limitations** (if any):
- [Any compromises or TODOs for future]

**Testing**:
- [Test types added: unit, integration]
- [Test count and coverage summary]
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
tests_passed: true | false
tests_run: [count]
tdd_compliance: true | false
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

## TDD Best Practices Reference

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should handle happy path', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle edge case X', () => {
      // ...
    });

    it('should throw on invalid input', () => {
      // ...
    });
  });
});
```

### What to Test

**Always Test:**
- Happy path (expected behavior)
- Edge cases (empty inputs, boundary values)
- Error conditions (invalid inputs, missing data)
- Integration points (API calls, database operations)

**Test Isolation:**
- Mock external dependencies (APIs, databases)
- Each test should be independent
- Clean up after tests

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --filter "service.test"

# Run with coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch
```

---

## MCP Best Practices Reference

### Context7 MCP (Optional)

```
1. mcp__context7__resolve-library-id({ libraryName: "...", query: "..." })
   - Get library ID first
2. mcp__context7__query-docs({ libraryId: "...", query: "..." })
   - Query specific patterns
3. Limit to 3 calls per question
4. Fallback: WebSearch for documentation
```

### Serena MCP (Optional)

```
1. Use for codebase-wide analysis
2. Query for related code patterns before implementation
3. Find similar implementations
4. Fallback: Glob + Grep for manual exploration
```

### Database/ORM Patterns

```
1. Use project's ORM (Drizzle in this project)
2. Follow schema patterns from src/models/Schema.ts
3. Use migrations for schema changes: npm run db:generate
4. Test database operations with proper mocking or test database
```
