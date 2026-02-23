# Theme Enrichment Prompt Template

=== THEME ENRICHMENT TASK ===

You are enriching refactoring theme {theme_id}: {theme_name} with concrete implementation details.

## Theme Data (from report)
{full theme block: id, name, effort, risk, steps, files, tests_before, tests_after, coverage_gate, blast_radius}

## Related Findings (from findings.md)
{for each finding_id: full finding block}

## Instructions

Analyze the theme and its findings, then produce an enriched version with these additions:

1. CROSS-REFERENCE steps with findings:
   - For each finding_id, verify the finding's `suggestion` is reflected in the theme's `steps`
   - Note any gaps where a finding's suggestion isn't covered

2. CONCRETE tests_before:
   - Search for existing test files related to the affected code
   - Determine exact `npm test` filter commands (e.g. `npm test -- src/libs/api`)
   - If coverage_gate is REQUIRED: specify what characterization tests to write (file path, what to assert)

3. CONCRETE tests_after:
   - Specify exact new test files/cases needed based on what the theme changes
   - Include what each test should assert

4. UI CHANGES detection:
   - Check if any file in the theme's `files` list is a .tsx file under src/app/, src/features/, or src/components/
   - Report: ui_changes: true/false

5. VALIDATE affected files:
   - Check each file in `files` exists in the project
   - Flag any stale references (file doesn't exist or path has changed)

6. ANTI-PATTERN VALIDATION (ground-truth check):
   - If theme touches >10 files: flag "Large blast radius" in Enrichment Notes
   - If coverage_gate=REQUIRED but no test-writing step: add test-writing as step 1
   - If steps mix structural refactoring AND behavior changes: flag "Mixed concerns"

## Output Requirement

You MUST write a self-contained implementation brief to this file:
**`{enrichment_output_file}`**

Create the parent directory if it does not exist.

The brief must follow the template structure at `{enrichment_output_template}` exactly.
It should be SELF-CONTAINED — an implementation agent reading only this file should have
ALL context needed to execute the theme: metadata, enriched steps, full finding details,
validated file list, and concrete test specs.

Write the file using the Write tool. This is the primary deliverable of your task.
=== END TASK ===
