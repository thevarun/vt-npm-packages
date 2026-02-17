# Step 6: Validate & Finalize

## MANDATORY EXECUTION RULES (READ FIRST)

- NEVER skip the consistency checklist
- CRITICAL: Auto-fix issues when possible, flag the rest
- ALWAYS save designer state for session continuity
- Goal: Quality gate before workflow completion

---

## CONTEXT FROM PREVIOUS STEPS

You should have:
- All artifacts created in `{planning_artifacts}/ux-design/`
- Epic linking completed (or skipped) in Step 5
- `theme`: Theme info (if used)
- `design`: Full design state from Step 3
- `scope`: What was designed
- `linking_result`: Epic linking results from Step 5

---

## YOUR TASK

Run a consistency check across all artifacts and product docs, fix issues, and finalize the workflow.

---

## TASK SEQUENCE

### 1. Design Consistency Check

Validate all artifacts and product docs:

```
DESIGN CONSISTENCY CHECK

1. [ ] No hardcoded hex/color values - all colors reference theme tokens
2. [ ] shadcn install command is complete - every component in any artifact appears in the command
3. [ ] All tokens referenced in component strategies exist in tokens.json (if theme provided)
4. [ ] File paths use project naming conventions
5. [ ] Artifact file names follow epic-{N}-{feature}- prefix pattern
6. [ ] Epic links are valid (relative paths correct)
7. [ ] All designed screens have corresponding epic references
8. [ ] Design decisions and PRD/epics are consistent (no contradictions between specs)
9. [ ] All referenced UI patterns have component definitions (toasts, loading states, error states)
```

Run each check against the actual files:

**Check 1 (Theme tokens):** If theme was provided, scan artifact files for hex values like `#FF0000` or `rgb()`. All colors should reference CSS custom properties (`var(--primary)`) or Tailwind theme classes.

**Check 2 (shadcn completeness):** Extract all shadcn component references from all artifacts. Compare against the install command in the component strategy. Flag any missing.

**Check 3 (Token existence):** If `tokens.json` was provided, verify all token references in component strategies match actual keys in the tokens file.

**Check 4 (Naming conventions):** Check if file names follow the project's established patterns.

**Check 5 (Epic prefix):** Verify all UX artifact files start with `epic-{N}-{feature}-`.

**Check 6 (Link validity):** Check all relative paths in epic files point to files that exist.

**Check 7 (Screen coverage):** Compare designed screens against epic references. Flag any designed screens without epic references.

**Check 8 (Spec consistency):** Check that design decisions documented in artifacts don't contradict PRD or epic requirements.

**Check 9 (UI patterns):** If designs reference toasts, loading states, error states, or empty states, verify these are defined in the component strategy's interaction patterns section.

---

### 2. Report Results

```
CONSISTENCY CHECK RESULTS

[pass/fail] No hardcoded colors: {details}
[pass/fail] shadcn install complete: {details}
[pass/fail] Token references valid: {details}
[pass/fail] File naming conventions: {details}
[pass/fail] Epic prefix pattern: {details}
[pass/fail] Epic link validity: {details}
[pass/fail] Screen-epic coverage: {details}
[pass/fail] Spec consistency: {details}
[pass/fail] UI pattern definitions: {details}

Issues found: {count}

[F] Fix all - Auto-correct issues
[R] Review - Show details for each issue
[S] Skip - Continue with known issues
```

**If F (Fix all):**
- Auto-correct each issue (add missing components to install command, fix file paths, add missing epic references, etc.)
- Report what was fixed
- Re-run check to confirm

**If R (Review):**
- Show each issue with context
- Allow user to fix, skip, or note each one
- Proceed after review

**If S (Skip):**
- Note known issues in workflow output
- Proceed to finalization

---

### 3. Save Designer State

Write session state to `{planning_artifacts}/ux-design/.designer-state.yaml` for future workflow runs:

```yaml
last_run: "{timestamp}"
tool_used: "{design.tool_used}"
theme: "{theme.prompt_file or none}"
mode: "{mode}"
project_state: "{greenfield | existing}"
tools_available:
  superdesign: {true/false}
  magicpatterns: {true/false}
  stitch: {true/false}
  shadcn_mcp: {true/false}
scope_summary: "{brief description of what was designed}"
artifacts_created:
  - "{file1}"
  - "{file2}"
epic_linked: "{epic file path or none}"
```

---

### 4. Workflow Complete

```
DESIGN WORKFLOW COMPLETE

Summary:
─────────────────────────────────────
Mode: {mode}
Tool: {design.tool_used}
Theme: {theme.name or "None"}
Prototype: {design.output_location}

Artifacts:
{list of created files with paths}

Epic: {linked epic or "Not linked"}
Consistency: {pass_count}/{total_count} checks passed
─────────────────────────────────────

Next Steps for Development:
1. Install components:
   {install_command}

2. Review component strategy for custom builds

3. Reference layouts during implementation

{If related story exists:}
This design supports: {story_reference}
Ready for implementation via /dev-story workflow.
─────────────────────────────────────

[N] New Design - Start another design session
[D] Done - Exit workflow
```

**Menu Handlers:**
- **N**: Load `./step-01-context.md` (returning session detection will kick in)
- **D**: Exit workflow

---

## SUCCESS CRITERIA

- All 9 consistency checks executed
- Issues identified and addressed (fixed, reviewed, or acknowledged)
- Designer state saved for session continuity
- Completion summary presented to user
