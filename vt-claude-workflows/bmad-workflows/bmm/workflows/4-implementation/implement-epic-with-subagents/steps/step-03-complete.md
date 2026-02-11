---
name: 'step-03-complete'
description: 'Generate epic completion report, create PR, and handle worktree cleanup'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-03-complete.md'
workflowFile: '{workflow_path}/workflow.md'

# Task References
reportTemplate: '{workflow_path}/templates/epic-completion-report.md'

# State files
sidecarFolder: '{output_folder}/epic-executions'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'

# Output
reportOutputFolder: '{output_folder}/epic-reports'

# Cleanup
agentCleanupEnabled: true

# Retrospective
retrospectiveWorkflow: '_bmad/bmm/workflows/4-implementation/retrospective'

# PR creation
baseBranch: 'main'
---

# Step 3: Epic Completion

## STEP GOAL:

To generate the Epic Completion Report, create a Pull Request, handle worktree cleanup, update final status, and gracefully conclude the epic execution workflow.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator

### Orchestrator-Specific Rules:

- 🛑 NEVER modify completed story results
- 🔄 CRITICAL: Generate report from actual execution data
- 📋 YOU ARE FINALIZING the epic execution

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator completing the workflow
- ✅ You summarize execution results accurately
- ✅ You generate comprehensive but concise reports
- ✅ You provide actionable next steps

### Step-Specific Rules:

- 🎯 Focus ONLY on reporting and finalization
- 🚫 FORBIDDEN to execute additional stories
- 💬 Present clear summary to user
- 🚪 Archive or preserve sidecar as appropriate
- 🧹 Handle worktree cleanup with user confirmation

## EXECUTION PROTOCOLS:

- 🎯 Gather all data from sidecar file
- 💾 Generate report using template
- 📖 Update sprint-status with epic completion
- 🚫 FORBIDDEN to modify historical execution data

## CONTEXT BOUNDARIES:

- **Sidecar path:** Use `sidecar_path` from router context (step-01-init). In worktree mode, the sidecar is in the main repo's `_bmad-output/epic-executions/`, NOT the worktree's folder.
- Sidecar file contains complete execution history
- All story outcomes recorded in execution_log
- Sprint-status reflects final story states
- Report is the primary output of this step
- Worktree cleanup requires user confirmation

---

## COMPLETION SEQUENCE:

### 1. Load Execution Data

Read the sidecar file using `sidecar_path` from router context (passed through step-01-init → step-01b/02):

**Note:** In worktree mode, this path points to the main repo's sidecar location, not the worktree's.

Gather:
- `epic_execution_state.epic_file`, `epic_execution_state.epic_name`
- `epic_execution_state.epic_number`
- `epic_execution_state.total_stories`
- `epic_execution_state.stories_completed` - count and list
- `epic_execution_state.stories_skipped` - count and list
- `epic_execution_state.stories_failed` - count and list
- `epic_execution_state.execution_log` - per-story details
- `epic_execution_state.started_at`, `epic_execution_state.completed_at`
- `specialist_agents_available` - agents used
- `execution_mode.type` - "worktree" | "main"
- `worktree_config` (if worktree mode):
  - `worktree_path`
  - `branch_name`
  - `main_repo_path`

Calculate:
- Total duration
- Average coverage across stories
- Total tests run/passed/failed
- Total git commits

### 2. Determine Completion Status

Based on execution results:

**Status: Completed**
- All stories finished (none skipped or failed)

**Status: Partial**
- Some stories completed, some skipped or failed

**Status: Failed**
- Critical failure caused early termination

### 3. Generate Completion Report

Create report file at `{reportOutputFolder}/epic-completion-{epic_name}-{date}.md`

Use template structure:

```markdown
# Epic Completion Report: {epic_name}

## Execution Summary

| Field | Value |
|-------|-------|
| **Epic File** | {epic_file} |
| **Epic Number** | {epic_number} |
| **Execution Mode** | {execution_mode.type} |
| **Worktree Path** | {worktree_path or "N/A"} |
| **Branch** | {branch_name} |
| **Started** | {started_at} |
| **Completed** | {completed_at} |
| **Duration** | {total_duration} |
| **Status** | {completion_status} |

## Stories Execution

| Story | Title | Status | Agent | Coverage | Tests | Duration |
|-------|-------|--------|-------|----------|-------|----------|
[For each story in execution_log]
| {story} | {title} | {status} | {agent} | {coverage}% | {passed}/{total} | {duration} |

### Stories Completed: {completed_count}/{total_count}

## Quality Metrics

- **Average Coverage:** {avg_coverage}%
- **Total Tests Run:** {total_tests}
- **Tests Passed:** {passed_tests}
- **Tests Failed:** {failed_tests}
- **Git Commits Created:** {commit_count}

## Agent Selection Summary

| Agent | Stories Handled | Selection Reason |
|-------|-----------------|------------------|
[For each unique agent used]
| {agent_name} | [{story_list}] | {selection_reason} |

## Issues & Escalations

### Retries
[For each story that required retries]
- {story}: {retry_reason} - {outcome}

### Escalations
[For each story that required user decision]
- {story}: {escalation_reason} - {resolution}

### Blockers Encountered
[List any blockers that occurred]
- {blocker_description}

## Session Information

- **Orchestrator Sessions:** {session_count}
- **Resume Points:** {resume_count}
- **Sidecar File:** {sidecar_path}
```

### 4. Update Sprint Status

Update `{sprintStatus}` to reflect epic completion:

```yaml
epic-N: done  # or partial
epic-N-retrospective: optional
```

### 4.5 Cleanup Specialist Agents

Remove epic-specific agents created during initialization:

**1. Read from sidecar:**
```yaml
specialist_agents_created:
  - name: "auth-specialist"
    path: ".claude/agents/vt-bmad-dev-agents/auth-specialist.md"
```

**2. Delete each agent file:**
```bash
rm .claude/agents/vt-bmad-dev-agents/auth-specialist.md
rm .claude/agents/vt-bmad-dev-agents/frontend-forms.md
...
```

**3. Log cleanup:**
Add to report:
```markdown
## Agent Cleanup
- Deleted: auth-specialist.md
- Deleted: frontend-forms.md
- Total agents cleaned up: X
```

**4. Verify cleanup:**
```bash
ls .claude/agents/vt-bmad-dev-agents/
```
- If empty or only contains non-epic agents → success
- If files remain unexpectedly → warn user

### 5. Handle Sidecar File

Present option to user:

"Epic execution complete! The execution state file contains detailed logs.

Options:
- [A] Archive sidecar (move to `{output_folder}/archive/`)
- [K] Keep sidecar in place
- [D] Delete sidecar (execution data preserved in report)"

### 5.5 Conduct Retrospective

Run retrospective workflow for completed epic:

**Ask user:**
"Would you like to run a retrospective for this epic?
- [Y] Yes, run retrospective
- [N] No, skip retrospective"

**If Yes:**
1. Invoke `/retrospective` skill with epic context
2. Wait for retrospective completion
3. Store output path in report:
```markdown
## Retrospective
- Completed: Yes
- Output: {implementation_artifacts}/epic-N-retro-{date}.md
```

**If No:**
- Update sprint-status: `epic-N-retrospective: skipped`
- Note in report: "Retrospective: Skipped by user"

### 6. Create Pull Request

Generate and create PR for this epic's work:

**1. Gather PR content:**
- Title: "Epic {N}: {epic_name}"
- Body from completion report:
  - Stories completed count
  - Quality metrics summary
  - Agent usage summary
  - Link to completion report

**2. Create PR:**
```bash
gh pr create \
  --title "Epic {N}: {epic_name}" \
  --base {baseBranch} \
  --body "$(cat <<'EOF'
## Summary
Automated implementation of Epic {N}: {epic_name}

### Stories Completed
- {completed_count}/{total_count} stories implemented
- Coverage: {avg_coverage}%
- Tests: {passed_tests}/{total_tests} passed

### Quality Metrics
| Metric | Value |
|--------|-------|
| Avg Coverage | {avg_coverage}% |
| Total Tests | {total_tests} |
| Git Commits | {commit_count} |

### Files Changed
[List from execution log]

### Reports
- Completion Report: {report_path}
- Retrospective: {retro_path}

---
Generated by implement-epic-with-subagents workflow
EOF
)"
```

**3. Display result:**
```
Pull Request Created
   PR #123: Epic {N}: {epic_name}
   URL: https://github.com/{org}/{repo}/pull/123
```

**4. Store in report:**
```markdown
## Pull Request
- PR Number: #123
- URL: [link]
- Created: [timestamp]
```

### 6.5 Manual Testing Recommendations

Generate a concise list of key items the user should manually test:

**Analysis approach:**
1. For each completed story, identify the primary user-facing feature or change
2. Prioritize items that involve:
   - New user flows (registration, form submission, navigation)
   - API integrations (external services, auth flows)
   - Visual/UI changes (responsive design, dark mode, new pages)
   - Data operations (CRUD, search, filtering)
3. Skip items that are purely internal/infrastructure

**Display format:**
```
## Recommended Manual Testing

Before merging, verify these key flows:

1. **[Feature name]** (Story N.M)
   - [ ] [Specific action to test]
   - [ ] [Expected result to verify]

2. **[Feature name]** (Story N.M)
   - [ ] [Specific action to test]
   - [ ] [Expected result to verify]

Environment: {dev_server config}
Test credentials: {test_credentials if applicable}
```

**Purpose:** Complement automated tests with human verification of
end-to-end user experience before PR merge.

### 6.6 Worktree Cleanup (Conditional)

**Skip this section if:**
- `execution_mode.type` = "main" (not using worktree)

**If worktree mode:**

Mark sidecar for cleanup (but don't delete yet):
```yaml
cleanup:
  marked_for_removal: true
  agents_cleaned: true
  pr_created: true
  pr_number: {pr_number}
```

**Display cleanup instructions:**
```
═══════════════════════════════════════════════════════════════
                    WORKTREE CLEANUP
═══════════════════════════════════════════════════════════════

Your epic work is complete and PR #{pr_number} has been created!

The worktree at:
  {worktree_path}

Can now be removed. Since you cannot remove a worktree from inside it,
run these commands from your MAIN repository:

  cd {main_repo_path}
  git worktree remove {worktree_relative_path}

Or to force removal if there are uncommitted changes:
  git worktree remove --force {worktree_relative_path}

After removal, you can also clean up the sidecar file:
  rm {sidecarFolder}/epic-{epic_number}-state.yaml

═══════════════════════════════════════════════════════════════

Would you like me to add these commands to your clipboard?
[Y] Yes, copy commands | [N] No, I'll handle it manually
```

**If user selects Y:**
- Output the commands in a code block for easy copying
- Note: Cannot execute removal from inside worktree

**Update report with cleanup info:**
```markdown
## Worktree Cleanup

- **Worktree Path:** {worktree_path}
- **Status:** Marked for removal
- **Cleanup Commands Provided:** Yes

**To remove worktree (run from main repo):**
```bash
cd {main_repo_path}
git worktree remove {worktree_relative_path}
rm {sidecarFolder}/epic-{epic_number}-state.yaml
```
```

### 7. Present Final Summary

Display to user:

```
═══════════════════════════════════════════════════════════════
                    EPIC EXECUTION COMPLETE
═══════════════════════════════════════════════════════════════

Epic: {epic_name}
Status: {completion_status}
Duration: {total_duration}
Mode: {execution_mode.type}

Stories:
  Completed: {completed_count}
  Skipped: {skipped_count}
  Failed: {failed_count}

Quality:
  Average Coverage: {avg_coverage}%
  Tests: {passed_tests}/{total_tests} passed
  Git Commits: {commit_count}

Report saved to:
  {report_path}

Pull Request: #{pr_number}
   {pr_url}

{If worktree mode:}
Worktree Cleanup:
  Commands provided above. Run from main repo when ready.

═══════════════════════════════════════════════════════════════

Next Steps:
- Review PR and request changes if needed
- Merge when ready
{If worktree: "- Remove worktree using commands above"}
- Continue with next epic: [N] Start Epic {next_epic} | [E] Exit

Thank you for using the Epic Execution Orchestrator!
```

### 8. Workflow Complete

The workflow ends here. No further steps to load.

If user has questions, respond helpfully and remind them the report contains full details.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Completion report generated accurately
- All execution data preserved in report
- Sprint-status updated with epic completion
- Sidecar handled per user preference
- PR created successfully
- Worktree cleanup instructions provided (if applicable)
- Clear summary presented to user
- Workflow concluded gracefully

### ❌ SYSTEM FAILURE:

- Inaccurate report data
- Not updating sprint-status
- Losing execution history
- Attempting to execute more stories
- Not presenting clear summary
- Not providing worktree cleanup instructions (when applicable)
- Attempting to remove worktree from inside it

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
