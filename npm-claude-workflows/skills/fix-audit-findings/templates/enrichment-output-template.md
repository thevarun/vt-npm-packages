# Implementation Brief: {theme_id} — {theme_name}

## Theme Metadata
- **ID**: {theme_id}
- **Name**: {theme_name}
- **Effort**: {effort}
- **Risk**: {risk}
- **Coverage Gate**: {coverage_gate}
- **Blast Radius**: {blast_radius}
- **Warnings**: {warnings or "None"}

## Enriched Implementation Steps

{Original steps from theme, enhanced with:
 - Gap fills from findings whose suggestions weren't covered
 - Cross-references to finding IDs (e.g. "Step 3 addresses F-005")
 - Any reordering needed for dependency correctness}

## Related Findings

{For each finding_id in the theme, include the complete block:}

### F-XXX: {title}
- **Severity**: {P1/P2/P3}
- **File**: {file}
- **Line**: {line}
- **Description**: {description}
- **Suggestion**: {suggestion}

## Affected Files (Validated)

{List of files from theme, with stale entries removed. Note any removals:}
- src/path/to/file.ts
- ~~src/stale/path.ts~~ (REMOVED: file does not exist)

## Test Requirements

### Tests Before (Characterization)
{If coverage_gate is REQUIRED:
 - Specific test file paths to create
 - What each test should assert about current behavior
 - Exact npm test filter commands}

{If coverage_gate is ADEQUATE:
 - Just run: npm test}

### Tests After (Verification)
{Specific new test files/cases:
 - File path for each new test
 - What it should assert
 - How it verifies the finding is fixed}

## Enrichment Notes
- **UI Changes**: true/false
- **Stale Files Removed**: [list, or "None"]
- **Gaps Found**: [finding suggestions not covered by steps, or "None"]
