# Analysis Framework

Reference document for the weekly analyst. Apply these dimensions when analyzing each session transcript and when synthesizing cross-session patterns.

## Finding Hierarchy

Prioritize findings in this order:

1. **Structural bugs** — steps that fail, produce wrong output, or skip critical validation
2. **Logic gaps** — missing error handling, race conditions, unhandled edge cases that actually occurred
3. **Friction points** — steps that caused confusion, retries, or user corrections
4. **Polish** — clarity improvements, better defaults, cosmetic fixes

Cosmetic suggestions are fine but must be clearly labeled as LOW priority. Don't pad findings — if structural issues are scarce, a short list is fine.

## Dimension 1: Session Purpose Classification

Classify each session into one or more categories:

| Category | Signals |
|----------|---------|
| **Feature development** | New files created, component code, API endpoints, UI work |
| **Bug fixing** | Error investigation, debugger use, "fix" in messages, test failures |
| **Planning** | /plan commands, architecture discussions, PRD creation, story writing |
| **Tooling** | Workflow modifications, config changes, script creation, CI/CD |
| **Design** | /designer-founder skill, Stitch/MagicPatterns, screenshot validation |
| **Maintenance** | Refactoring, dependency updates, cleanup, migration |

Assign a confidence level: HIGH (clear signals), MEDIUM (mixed signals), LOW (ambiguous).

## Dimension 2: Workflow Efficiency

For each session, evaluate:

- **Goal reached?** Did the user accomplish what they set out to do?
- **Retries needed?** How many corrections, backtracks, or restarts?
- **Unnecessary tool calls?** Read-then-read-same-file, redundant greps, etc.
- **Missed parallelism?** Sequential operations that could have been parallel
- **Time-to-goal** Estimated from first user message to goal completion (using timestamps)
- **Context efficiency** Did the session hit context limits? Could it have been structured to avoid that?

## Dimension 3: Friction Detection

Look for these friction indicators in transcripts:

### User Correction Signals
- "no, I meant...", "actually...", "wait...", "that's wrong"
- "let me clarify", "not what I asked"
- User re-stating the same instruction differently

### Error & Recovery Signals
- Tool call errors (is_error: true)
- Failed bash commands (exit code != 0)
- Multiple attempts at the same operation
- Workflow restarts or `/clear` commands

### Confusion Signals
- Long gaps between messages (>5 minutes, suggests external research)
- User asking "what happened?" or "why did you..."
- Clarification requests in either direction

### Resource Pressure Signals
- Context limit warnings
- Session restarts mid-task
- `/compact` or `/clear` usage
- Task continuation across multiple sessions

### Workflow Obstruction Signals
- Auto-approve hook blocking commands that should be safe
- Permission prompts interrupting flow
- Tool failures requiring workarounds

## Dimension 4: Pattern Recognition

Track these patterns across sessions and weeks:

- **Command sequences** — common workflows (e.g., always plan → implement → review)
- **Project-specific habits** — different approaches per project type
- **Time-of-day patterns** — when does deep work happen vs. quick fixes?
- **Tool usage evolution** — is the user adopting new tools or abandoning old ones?
- **Error type clusters** — same category of errors recurring across sessions
- **Session structure** — average session length, message frequency, tool density

## Dimension 5: Improvement Scoring

### Priority Levels

| Priority | Criteria |
|----------|----------|
| **HIGH** | Caused failure, significant time loss, or multiple retries. Observed across 2+ sessions. |
| **MEDIUM** | Caused confusion, required clarification, or added unnecessary steps. |
| **LOW** | Optimization opportunity — would make workflow faster/clearer but didn't cause problems. |

### Effort Levels

| Effort | Criteria |
|--------|----------|
| **Simple** | Single config or prompt change. <30 min to implement. |
| **Moderate** | Multiple files or requires careful design. 1-3 hours. |
| **Complex** | Architectural change or new tool/skill. Half-day or more. |

### Suggestion Format

Every suggestion must include:
```
## [PRIORITY] Brief Title

**Evidence:** [Specific session reference — what happened, when]
**Root Cause:** [Why this happened]
**Proposed Change:** [Specific, actionable recommendation]
**Expected Benefit:** [What improves]
**Effort:** Simple | Moderate | Complex
```

## Dimension 6: Cross-Week Trends

When prior digests are available, analyze:

- **Project momentum** — which projects are accelerating, decelerating, or dormant?
- **Friction trajectory** — are identified friction points getting better or worse?
- **Workflow adoption** — is the user trying new workflows or sticking to familiar ones?
- **Suggestion tracking** — which past suggestions were adopted (evidence in sessions)?
- **Improvement velocity** — how quickly do identified issues get resolved?

## Evidence Requirements

Every finding must reference specific evidence:
- Quote or paraphrase the relevant event
- Reference the session ID and approximate position
- Distinguish between one-off incidents and systemic patterns
- For cross-week patterns: cite the weeks where the pattern appeared

## Important Notes

1. **Be specific.** "Improve clarity" is not actionable. Show exactly what to change.
2. **Be practical.** Focus on changes with real impact, not theoretical improvements.
3. **Preserve what works.** Don't suggest changing things that are working well.
4. **Consider the user.** This is a solo developer who values efficiency. Optimize for their workflow.
5. **Scope appropriately.** Suggest changes to workflows/tools, not to the user's project code.
6. **Respect design philosophy.** If a workflow deliberately omits guardrails for speed, don't add friction without proportional benefit.
7. **Avoid absolute bans.** Prefer "warn if X" over "never do X."
8. **Mind truncation markers.** Content marked `[truncated]` or `[... N results pruned ...]` was removed during preprocessing. Focus on what's present.
