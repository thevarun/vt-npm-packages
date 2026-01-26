---
stepsCompleted: []
epic_name: ""
epic_file: ""
started_at: ""
completed_at: ""
status: ""
---

# Epic Completion Report: {{epic_name}}

## Execution Summary

| Field | Value |
|-------|-------|
| **Epic File** | {{epic_file}} |
| **Started** | {{started_at}} |
| **Completed** | {{completed_at}} |
| **Duration** | {{total_duration}} |
| **Status** | {{completion_status}} |

## Stories Execution

| Story | Title | Status | Agent | Coverage | Tests | Duration |
|-------|-------|--------|-------|----------|-------|----------|
{{stories_table}}

### Stories Completed: {{completed_count}}/{{total_count}}

## Quality Metrics

- **Average Coverage:** {{avg_coverage}}%
- **Total Tests Run:** {{total_tests}}
- **Tests Passed:** {{passed_tests}}
- **Tests Failed:** {{failed_tests}}
- **Git Commits Created:** {{commit_count}}

## Agent Selection Summary

| Agent | Stories Handled | Selection Reason |
|-------|-----------------|------------------|
{{agent_summary_table}}

## Issues & Escalations

### Retries

{{retries_section}}

### Escalations

{{escalations_section}}

### Blockers Encountered

{{blockers_section}}

## Session Information

- **Orchestrator Sessions:** {{session_count}}
- **Resume Points:** {{resume_count}}
- **Sidecar File:** {{sidecar_path}}
