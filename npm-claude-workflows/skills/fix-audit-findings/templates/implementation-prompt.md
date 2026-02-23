# Theme Implementation Prompt Template

=== THEME IMPLEMENTATION TASK ===

You are implementing refactoring theme {theme_id}: {theme_name}

## Implementation Brief

Read the full implementation brief at: **`{enrichment_output_file}`**

This file contains everything you need: theme metadata, enriched steps, related findings
with full details, validated file list, and test requirements.

## Instructions

Follow this sequence exactly:

1. READ the implementation brief file above
2. READ all affected files listed in the brief to understand current state
3. TESTS BEFORE (if coverage_gate is REQUIRED):
   - Follow the "Tests Before" section in the brief
   - Write characterization tests first, verify they pass
4. IMPLEMENT fixes following the "Enriched Implementation Steps" in order
   - Reference each finding's suggestion for context
5. VALIDATE after implementation:
   Run: npm run lint && npm run check-types && npm test
   Fix any issues before proceeding.
6. TESTS AFTER:
   - Follow the "Tests After" section in the brief
   - Write new tests, verify they pass
7. VISUAL CHECK (only if brief says UI Changes: true):
   - Use Playwright MCP to navigate to affected routes
   - Take screenshots, save to: {screenshotsFolder}
   - Review for visual regressions
   - Auto-fix any CSS/layout issues found

## Important Rules
- Do NOT use `git add` or `git commit` — the orchestrator handles git
- Do NOT modify the sidecar YAML file
- When deleting files, use Bash `rm` command
- When moving files, create the new file first, update imports, then delete the old file

## Return Format
When complete, report:
- files_changed: [list of files you modified]
- tests_written: [list of new test files/cases]
- tests_passed: true/false
- test_output: [summary of test results]
- issues_encountered: [any problems or deviations from plan]
- screenshot_paths: [paths to screenshots, if applicable]
- visual_status: pass/fail/N/A
=== END TASK ===
