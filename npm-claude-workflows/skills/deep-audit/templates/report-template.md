<!-- TEMPLATE INSTRUCTIONS (do not include in final output):
     Replace {{VARIABLE}} with actual values.
     {{#IF_X}}...{{/IF_X}} = include the section only if X > 0.
     {{#EACH_X}}...{{/EACH_X}} = repeat the section for each item in X.
     Delete all template syntax and these instructions from the final output. -->

<!-- SCORING REFERENCE (use for calculations, do not include in final output):

     Each dimension is scored 1-10:
     | Score | Label      | Meaning                                                              |
     |-------|------------|----------------------------------------------------------------------|
     | 9-10  | Excellent  | No findings or only minor nitpicks; production-ready                 |
     | 7-8   | Good       | Minor issues; low risk, easy fixes                                   |
     | 5-6   | Adequate   | Notable gaps; some P2 findings that should be addressed              |
     | 3-4   | Concerning | Significant issues; P1 findings present; needs attention             |
     | 1-2   | Critical   | Severe problems; multiple P1 findings; immediate action required     |

     Overall Health Score = weighted average of audited dimensions:
     - Security: weight 3
     - Error Handling: weight 2
     - Architecture: weight 2
     - Simplification: weight 1
     - AI Slop: weight 1
     - Dependency Health: weight 1
     - Performance: weight 2 (full mode only)
     - Test Coverage: weight 2 (full mode only)
     - Test Efficiency: weight 1 (full mode only)
     - Type Design: weight 1 (full mode only)
     - Data Layer: weight 2 (full mode only)
     - API Contracts: weight 1 (full mode only)
     - SEO & Accessibility: weight 1 (full mode only)

     Formula: overall = sum(score × weight) / sum(weights) for audited dimensions only.
     Round to 1 decimal. Map to label using the score table above. -->

# Deep Audit — {{DATE}}

## Scope

| Field | Value |
|-------|-------|
| **Mode** | {{MODE}} |
| **Scope** | {{SCOPE_DESCRIPTION}} |
| **Agents Run** | {{AGENT_COUNT}} |
| **Stack** | {{DETECTED_STACK}} |
| **Duration** | {{DURATION}} |
| **Commit** | `{{COMMIT_HASH}}` |

## Scorecard

| Dimension | Score | P1 | P2 | P3 | Assessment |
|-----------|------:|---:|---:|---:|------------|
{{SCORECARD_ROWS}}

**Overall Health: {{OVERALL_SCORE}}/10** — {{OVERALL_LABEL}}

## Findings

{{#IF_P1_COUNT}}
### P1 — Critical

{{#EACH_P1_THEME}}
#### {{THEME_NAME}} ({{FINDING_COUNT}} findings)

{{THEME_FINDINGS}}

{{/EACH_P1_THEME}}
{{/IF_P1_COUNT}}

{{#IF_P2_COUNT}}
### P2 — Important

{{#EACH_P2_THEME}}
#### {{THEME_NAME}} ({{FINDING_COUNT}} findings)

{{THEME_FINDINGS}}

{{/EACH_P2_THEME}}
{{/IF_P2_COUNT}}

{{#IF_P3_COUNT}}
### P3 — Minor

{{#EACH_P3_THEME}}
#### {{THEME_NAME}} ({{FINDING_COUNT}} findings)

{{THEME_FINDINGS}}

{{/EACH_P3_THEME}}
{{/IF_P3_COUNT}}

{{#IF_NO_FINDINGS}}
No findings above the confidence threshold. The codebase looks healthy across all audited dimensions.
{{/IF_NO_FINDINGS}}

### Finding Detail Template

<!-- Each finding renders as: -->
<!--
##### F-NNN: {{TITLE}} ({{SEVERITY}})

| | |
|---|---|
| **File** | `{{FILE}}:{{LINE}}` |
| **Dimension** | {{DIMENSION}} |
| **Confidence** | {{CONFIDENCE}}% |
| **Agent** | {{AGENT}} |

{{DESCRIPTION}}

**Suggestion:** {{SUGGESTION}}

---
-->

## Skipped Findings

| ID | Title | Severity | Category | Reason |
|----|-------|----------|----------|--------|
{{SKIPPED_FINDINGS_ROWS}}

## Invalid Findings

| ID | Title | Invalidity Reason |
|----|-------|--------------------|
{{INVALID_FINDINGS_ROWS}}

## Next Steps

Run `/fix-audit-findings` to execute the refactoring themes phase-by-phase.

## Statistics

| Metric | Value |
|--------|-------|
| Total Findings | {{TOTAL_FINDINGS}} |
| Accepted | {{ACCEPTED_COUNT}} |
| Skipped | {{SKIPPED_COUNT}} |
| Invalid | {{INVALID_COUNT}} |
| P1 (Critical) | {{P1_COUNT}} |
| P2 (Important) | {{P2_COUNT}} |
| P3 (Minor) | {{P3_COUNT}} |
| Agents Run | {{AGENT_COUNT}} |
| Dimensions Covered | {{DIMENSION_COUNT}} |

### Per-Agent Breakdown

| Agent | Findings | P1 | P2 | P3 | Dimensions |
|-------|--------:|---:|---:|---:|------------|
{{AGENT_BREAKDOWN_ROWS}}

## Refactoring Plan

<!-- Structured theme data for machine consumption by /fix-audit-findings.
     Generated using cross-severity grouping — a single theme may contain
     P1, P2, and P3 findings if they relate to the same area. -->

{{THEME_BLOCKS}}

{{EXECUTION_ORDER_BLOCK}}
