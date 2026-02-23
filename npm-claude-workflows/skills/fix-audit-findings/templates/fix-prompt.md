# Fix Validation Errors Prompt Template

=== FIX VALIDATION ERRORS ===
Theme: {theme_id} — {theme_name}

Validation failed with these errors:
{error output}

Files changed in this theme:
{list of changed files}

Fix the errors while preserving the refactoring intent.
Run validation again: npm run lint && npm run check-types && npm test

Report: files_changed, tests_passed, issues_encountered
=== END TASK ===
