# Opus Analysis Prompt Template

> **Usage:** Fill in the placeholders below and provide to an Opus subagent via the Task tool.

---

## Your Task

You are an expert workflow analyst reviewing a Claude Code session transcript. Your goal is to identify improvements that will make the workflow more efficient, clear, and effective for future runs.

## Context

### Project Information
```
{PROJECT_CLAUDE_MD}
```

### Workflow Being Analyzed
**Name:** `{WORKFLOW_NAME}`
**Type:** {WORKFLOW_TYPE} (command | skill | agent)
**Source:** {WORKFLOW_SOURCE} (project-specific | npm-package)

### Workflow Definition
```markdown
{WORKFLOW_CONTENT}
```

{ADDITIONAL_WORKFLOW_FILES}

---

## Session Transcript

The following is the session transcript in JSONL format. Each line is a JSON object representing an event (user message, assistant response, tool call, tool result, etc.).

```jsonl
{SESSION_TRANSCRIPT}
```

---

## Analysis Instructions

Analyze this session transcript against the workflow definition. Focus on practical, actionable improvements.

### 1. What Went Well

Identify aspects that worked smoothly:
- Steps that executed without confusion
- User satisfaction signals (thanks, approval, moving on quickly)
- Efficient tool usage (parallel calls, minimal retries)
- Good error recovery
- Clear communication

For each positive finding, note:
- What worked
- Evidence from transcript (quote or reference)
- Why it's worth preserving

### 2. What Could Be Better

Identify friction points and inefficiencies:

**Friction Indicators to Look For:**
- User corrections ("no, I meant...", "actually...", "wait...")
- Repeated attempts at the same operation
- Requests for clarification ("what do you mean by...", "can you explain...")
- Workflow restarts or backtracking
- Long pauses followed by clarifying questions
- Error messages and recovery attempts
- Unnecessary file reads or tool calls
- Sequential operations that could be parallel

**For each issue found, note:**
- What went wrong or was inefficient
- Direct quote or event reference from transcript
- Impact (time lost, confusion caused, goal blocked)
- Root cause in workflow definition (if identifiable)

### 3. Specific Improvement Suggestions

For each identified issue, propose a concrete improvement:

**Format:**
```
## [PRIORITY] Brief Title

**Evidence:**
> [Quote or description of the problematic event]

**Root Cause:**
[Why this happened - workflow instruction unclear, missing step, etc.]

**Proposed Change:**
- File: `{path-to-file}`
- Location: {section or line reference}
- Change:
  ```markdown
  [Specific edit - show before/after if possible]
  ```

**Expected Benefit:**
[What will improve after this change]

**Effort:** Simple | Moderate | Complex
```

**Priority Levels:**
- **HIGH**: Caused workflow failure, significant time loss, or required multiple retries
- **MEDIUM**: Caused confusion, required clarification, or added unnecessary steps
- **LOW**: Optimization opportunity - would make workflow faster or clearer but didn't cause problems

### 4. Patterns to Watch

Note any patterns that might indicate systemic issues:
- Same type of error appearing multiple times
- Consistent unclear instructions in certain step types
- Tool usage anti-patterns
- Communication style issues

---

## Output Format

Structure your response exactly as follows:

```markdown
# Workflow Analysis: {WORKFLOW_NAME}

## Session Summary
- **Duration:** [estimate from timestamps]
- **Workflow completed:** Yes/No/Partial
- **Overall smoothness:** [1-10 scale]

## What Went Well

### 1. [Title]
- **Evidence:** [quote/reference]
- **Why it works:** [explanation]

### 2. [Title]
...

## What Could Be Better

### 1. [Title]
- **Evidence:** [quote/reference]
- **Impact:** [description]
- **Root cause:** [if known]

### 2. [Title]
...

## Improvement Suggestions

### 1. [HIGH] [Title]
- **Evidence:** [quote]
- **Root Cause:** [explanation]
- **Proposed Change:**
  - File: [path]
  - Edit: [before → after]
- **Expected Benefit:** [description]
- **Effort:** [Simple/Moderate/Complex]

### 2. [MEDIUM] [Title]
...

### 3. [LOW] [Title]
...

## Patterns Observed

### Recurring Issues
- [pattern 1]
- [pattern 2]

### Success Patterns Worth Preserving
- [pattern 1]
- [pattern 2]

## Recommendations Summary

| Priority | Improvement | File | Effort |
|----------|-------------|------|--------|
| HIGH | [title] | [file] | [effort] |
| MEDIUM | [title] | [file] | [effort] |
| LOW | [title] | [file] | [effort] |
```

---

## Important Notes

1. **Be specific.** Vague suggestions like "improve clarity" are not actionable. Show exactly what text to change.

2. **Be evidence-based.** Every suggestion must reference specific events in the transcript.

3. **Be practical.** Focus on changes that will have real impact, not theoretical improvements.

4. **Preserve what works.** Don't suggest changing things that are working well.

5. **Consider the user.** This workflow is used by a solo developer who values efficiency. Optimize for their workflow, not for edge cases.

6. **Scope appropriately.** Suggest changes to the workflow files, not to Claude's core behavior or the user's project code.
