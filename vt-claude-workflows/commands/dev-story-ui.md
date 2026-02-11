---
description: 'Design-first UI story executor. Loads story, validates MCPs, implements visual-first approach with screenshot validation.'
---

# Dev Story UI Workflow

Execute UI stories using a **design-first approach** with visual validation via Playwright.

**Usage**: `/dev-story-ui {story-identifier}`

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
   - Design references (MagicPatterns links, Figma, screenshots)
5. VALIDATE: Story file exists and has required sections (Tasks, Acceptance Criteria)
   - If missing → OUTPUT: "ERROR: Story file missing or invalid. Path: {path}"
   - HALT
```

---

## Step 2: MCP Availability Protocol

**PROBE for required MCPs based on story content:**

### 2.1 Parse Story for Component Mentions

Scan story content (tasks, dev notes, acceptance criteria) for:
- `MagicPatterns` or `magicpatterns.com` link → REQUIRE MagicPatterns MCP
- `ShadCN` or `shadcn` or component names (Button, Card, etc.) → REQUIRE shadcn MCP
- No component guidance → DEFAULT to shadcn MCP (assume UI stories need it)

### 2.2 Required MCPs for UI Stories

| MCP | Purpose | Probe Command |
|-----|---------|---------------|
| shadcn | Component library | `mcp__shadcn__get_project_registries({})` |
| Playwright | Visual validation | `mcp__playwright__playwright_navigate({ url: "about:blank" })` |

### 2.3 Optional MCPs (graceful degradation)

| MCP/Skill | Purpose | Fallback |
|-----------|---------|----------|
| Context7 | Library docs | Web search |
| MagicPatterns | Design code fetch | Manual implementation from design |
| Stitch | Design screen conversion | Manual implementation |
| react-best-practices (skill) | React/Next.js performance | Standard implementation |
| Stitch react-components (skill) | Converting Stitch designs to React code | Standard implementation |

### 2.4 Probe Execution

```
FOR EACH required MCP:
  1. Call probe command
  2. IF error or unavailable:
     - OUTPUT: "ESCALATE: Required MCP '{name}' not available"
     - OUTPUT: "Suggested action: Enable {name} MCP in Claude settings"
     - HALT immediately
  3. IF available:
     - Log: "MCP {name}: available"

Document in Dev Agent Record:
  - Available MCPs: [list]
  - Unavailable (optional): [list with fallback notes]
```

---

## Step 3: Load Project Context

```
1. Check for docs/project-context.md or project-context.md
2. IF exists:
   - Read and extract: coding standards, patterns, conventions
   - Note project-specific rules for implementation
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
   - "Design Review"
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

## Step 6: Design Analysis

```
1. Extract design references from story:
   - MagicPatterns links
   - Stitch screen references
   - Figma links
   - Screenshot paths
   - Component specifications in Dev Notes

2. IF MagicPatterns link provided:
   - CRITICAL: Fetch code via MCP (NEVER build from scratch)
   - Adapt for project structure

2. IF Stitch screen reference (stitch.new or stitch: prefix):
   - Extract target component name from reference
   - CHECK IF COMPONENT EXISTS:
     * Look for: .stitch/{ComponentName}.tsx  
     * Look for: src/components/{ComponentName}.tsx
     * Look for: src/app/**/components/{ComponentName}.tsx
   - IF component exists:
     * Log: "Component {name} already exists - using existing"
     * SKIP Stitch fetch
   - IF component NOT exists AND Stitch MCP available:
     * Fetch via Stitch MCP
     * Run validation: npm run validate <file_path>
   - IF Stitch MCP unavailable:
     * Log: "Stitch MCP not configured - manual implementation"

4. IF shadcn components needed:
   - Call mcp__shadcn__search_items_in_registries for relevant components
   - Note component names for implementation

5. Document design decisions:
   - Components to use
   - Styling approach
   - Layout patterns

6. Log design analysis in Dev Agent Record
```

---

## Step 7: Implement Visual First (Per Task)

**FOR EACH task/subtask (starting from first incomplete):**

### 7.1 MagicPatterns Implementation

```
IF MagicPatterns link provided for this task:
  1. Fetch code via MCP
  2. Adapt for project:
     - Update imports to match project structure
     - Apply project's Tailwind config/CSS variables
     - Integrate with project's patterns
  3. Preserve design intent from MagicPatterns
```

### 7.2 ShadCN Component Implementation

```
IF using shadcn components:
  1. ALWAYS call mcp__shadcn__get_item_examples_from_registries FIRST
     - Query: "{component-name}-demo" or "{component-name} example"
  2. Review demo output:
     - Available variants, sizes, props
     - Required imports
     - Composition patterns
  3. Implement following EXACT patterns from demo
  4. NEVER guess component APIs
```

### 7.3 Build UI

```
1. Create/modify component files
2. Focus on visual fidelity FIRST
3. Use semantic HTML
4. Apply consistent styling (Tailwind classes)
5. Ensure accessibility basics (alt text, labels, ARIA)

IF react-best-practices skill available:
  - Apply skill guidance during implementation
  - The skill provides built-in priority and "when to use" guidance
```

---

## Step 8: Visual Validation Loop

**FOR EACH page/route affected:**

```
1. Ensure dev server running:
   - Check if http://localhost:3000 accessible
   - IF not: Run `npm run dev` and wait for ready

2. Navigate to affected page:
   mcp__playwright__playwright_navigate({ url: "http://localhost:3000/{route}" })

3. Take screenshot:
   mcp__playwright__playwright_screenshot({
     name: "{page-name}-{timestamp}",
     fullPage: true
   })

4. Check console for errors:
   mcp__playwright__playwright_console_logs({ type: "error" })

5. Analyze results:
   - Compare screenshot against design intent
   - Review any console errors

6. IF issues found:
   - Fix the issue
   - Repeat steps 2-5
   - MAX 3 iterations per issue

7. IF still issues after 3 iterations:
   - Document limitation in Dev Agent Record
   - Continue to next task (don't block indefinitely)

8. Document in Dev Agent Record:
   - Screenshot paths captured
   - Console output (errors if any)
   - Limitations noted
```

---

## Step 9: Add Behavioral Tests

```
Now that UI is visually correct, add tests:

1. E2E Tests (Playwright):
   - Test critical user flows (click, navigate, submit)
   - Test error states and edge cases
   - Test responsive behavior if applicable
   - Location: tests/{feature}.spec.ts

2. Unit Tests (if business logic exists):
   - Component prop validation
   - State management logic
   - Utility functions
   - Location: co-located with component (Component.test.tsx)

3. Run targeted tests for the tests you just wrote:
   npm test -- --filter "{test-file}"
   (The full suite runs ONCE at Step 11.1 Final Verification after ALL tasks are complete.)

4. Ensure targeted tests pass before marking task complete
```

---

## Step 10: Validate & Mark Task Complete

**FOR EACH task:**

### Validation Gates (ALL must pass)

```
- [ ] Visual output matches design intent (screenshot reviewed)
- [ ] Console shows no errors from changed code
- [ ] Tests exist for the functionality
- [ ] Tests pass 100%
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
   - "{timestamp}: Task X.Y completed - {brief summary}"

4. IF this was a review follow-up task:
   - Mark corresponding review item as resolved

5. Proceed to next incomplete task (or Step 11 if all done)
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

## Step 11: Story Completion & Summary

### 11.1 Final Verification

```
1. Re-scan story file for any unmarked tasks
2. IF any [ ] tasks remain:
   - Return to Step 7 for those tasks
   - Do NOT proceed until all [x]

3. Run full regression suite:
   npm test
   npm run test:e2e

4. Verify ALL tests pass
```

### 11.2 Execute Definition of Done Checklist

```
## UI Story DoD Checklist

### Visual Validation
- [ ] Visual output matches design intent
- [ ] Screenshot captured and reviewed
- [ ] Console shows no JS errors from changed code
- [ ] Responsive behavior verified (if applicable)

### Component Library
- [ ] Used component library (shadcn/MagicPatterns) - NOT built from scratch
- [ ] Component APIs verified via demos before implementation

### Implementation
- [ ] All tasks/subtasks marked [x]
- [ ] Implementation matches acceptance criteria
- [ ] No scope creep (only implemented what was specified)

### Testing
- [ ] E2E tests for critical user flows
- [ ] Unit tests for business logic (if applicable)
- [ ] All tests pass

### Documentation
- [ ] File List updated in story
- [ ] Completion Notes written (see below)
- [ ] Change Log updated (if exists)
- [ ] Status set to "review"

FOR EACH unchecked item:
  - Fix the issue
  - Re-run validation
```

### 11.3 Write Completion Notes

```
Add to Dev Agent Record or story file:

## Completion Notes

**Summary**: [1-2 sentence description of what was built]

**Key Decisions**:
- [Decision 1 and rationale]
- [Decision 2 and rationale]

**Components Used**:
- [shadcn/MagicPatterns components added]

**Known Limitations** (if any):
- [Any compromises or TODOs for future]

**Testing**:
- [Test types added: E2E, unit, etc.]
- [Test count and pass rate]
```

### 11.4 Update Status

```
1. Update story file Status → "review"
2. Update sprint-status.yaml → set story status to "review"
3. Log: "Story completed, status: review"
```

---

## Step 12: Completion Handoff

**Output this structured handoff:**

```
=== AGENT HANDOFF ===
agent: {agent-name}
story: [story number, e.g., "3.2"]
status: completed | failed | blocked
files_changed:
  - [list all modified/created files]
visual_validation:
  screenshots: [list screenshot paths]
  console_errors: none | [list errors]
tests_passed: true | false
tests_run: [count]
dod_checklist: passed | failed
completion_notes: written | skipped
blockers: none | [list blockers]
next_action: proceed | fix_required | escalate
=== END HANDOFF ===
```

**Status Definitions:**
- `completed`: All tasks done, DoD passed, ready for review
- `failed`: Errors encountered that could not be resolved
- `blocked`: External dependency prevents completion (missing MCP, unclear requirements)

**Next Action:**
- `proceed`: Story ready for code review / quality gate
- `fix_required`: Minor issues need attention
- `escalate`: Requires human intervention

---

## MCP Best Practices Reference

### shadcn MCP

```
1. mcp__shadcn__get_project_registries({}) - Verify setup
2. mcp__shadcn__search_items_in_registries({ registries: ["@shadcn"], query: "{term}" }) - Find components
3. mcp__shadcn__get_item_examples_from_registries({ registries: ["@shadcn"], query: "{name}-demo" }) - ALWAYS call before implementing
4. mcp__shadcn__get_add_command_for_items({ items: ["@shadcn/{name}"] }) - Get install command
5. mcp__shadcn__get_audit_checklist({}) - Run after adding components
```

### Playwright MCP

```
1. mcp__playwright__playwright_navigate({ url: "..." }) - Navigate to page
2. mcp__playwright__playwright_screenshot({ name: "...", fullPage: true }) - Capture for validation
3. mcp__playwright__playwright_console_logs({ type: "error" }) - Check for JS errors
4. mcp__playwright__playwright_get_visible_html({}) - Inspect DOM
5. mcp__playwright__playwright_close({}) - Clean up when done
```

### MagicPatterns MCP

```
1. NEVER build from scratch when MagicPatterns link provided
2. Fetch generated code via MCP
3. Adapt for project: imports, styling tokens, component structure
4. Preserve design intent, adapt implementation details
```

### Context7 MCP

```
1. mcp__context7__resolve-library-id({ libraryName: "...", query: "..." }) - Get library ID first
2. mcp__context7__query-docs({ libraryId: "...", query: "..." }) - Query specific patterns
3. Limit to 3 calls per question
4. Fallback: Use WebSearch if unavailable
```
