# Step 1b: Continue Existing Session

## PURPOSE

Handle resumption of an interrupted designer-founder workflow session.

---

## DETECTION

This step is loaded when:
- User invokes designer-founder workflow
- Existing design session state is detected
- User confirms they want to continue (not start fresh)

---

## TASK SEQUENCE

### 1. Detect Previous State

Check for indicators of previous session:
- Recent files in `{planning_artifacts}/ux-design/` matching current date
- Incomplete artifacts (missing expected files)
- SuperDesign files created recently in `.superdesign/design_iterations/`

### 2. Present Recovery Options

```
EXISTING SESSION DETECTED

I found evidence of a previous design session:
- {list what was found}

Would you like to:

[C] Continue - Resume from where we left off
[R] Review - Show me what was created
[N] New - Start fresh (previous work preserved)
```

### 3. If Continue

Reconstruct state:
```yaml
mode: {infer from artifacts}
scope: {infer from artifact names}
design:
  tool_used: {infer from output files}
  output_location: {found files}
last_completed_step: {infer from artifacts present}
```

Route to appropriate step:
- Only design brief exists → Step 3 (Design) or Step 4 (Artifacts)
- Component strategy exists but incomplete → Step 4
- All artifacts exist → Offer to refine or start new

### 4. If Review

Display summary of found artifacts and their contents.
Return to recovery options after review.

### 5. If New

Proceed to `step-01-context.md` for fresh start.
Do not delete previous work.

---

## NEXT STEP

Based on user selection, route to:
- Appropriate step for continuation
- `step-01-context.md` for fresh start
