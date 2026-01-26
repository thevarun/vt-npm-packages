---
description: 'Autonomously process, fix, and merge all open PRs with minimal user interaction'
---

IT IS CRITICAL THAT YOU FOLLOW THIS WORKFLOW EXACTLY.

<workflow CRITICAL="TRUE">

## Phase 0: Pre-flight Checks

Before any operations, verify the environment is safe:

1. **Check gh authentication**: Run `gh auth status`. If not authenticated, STOP and inform user.

2. **Detect remote name**: Run `git remote` and use the first result (usually `origin`).

3. **Detect default branch**: Run `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`. Fallback to `main` if this fails.

4. **Detect repository merge strategy**:
   - Run: `gh repo view --json squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed`
   - Determine preferred strategy in order: squash > merge > rebase
   - Store for use in Phase 4 merge commands
   - Default to `--squash` if detection fails

5. **Record current branch and worktree**:
   - Run `git branch --show-current` to get current branch name
   - **If empty (detached HEAD)**: Run `git rev-parse HEAD` to save the commit SHA instead
   - Run `git rev-parse --show-toplevel` to record the current worktree path

6. **Build worktree inventory**: Run `git worktree list --porcelain` to detect all worktrees.

7. **Check for uncommitted changes**: Run `git status --porcelain`.
   - If output is non-empty, WARN the user but continue

8. **Initialize tracking**:
   - Create counters: merged=0, skipped=0, failed=0, auto_fixed=0
   - Create lists: merged_prs[], skipped_prs[], failed_prs[]

If gh authentication fails, STOP and clearly explain what the user needs to do.

---

## Phase 1: PR Discovery & Batch Planning

**Goal**: Assess all PRs and start batch processing immediately.

1. **Fetch all open PRs**:
   ```bash
   gh pr list --state open --json number,title,headRefName,baseRefName,statusCheckRollup,reviewDecision,isDraft,url,author,mergeStateStatus,mergeable,state
   ```

2. **For each PR, categorize**:

   | Category | Detection | Auto-Action |
   |----------|-----------|-------------|
   | Ready to Merge | CI passed, mergeable=true | Merge immediately |
   | CI Pending | statusCheckRollup has IN_PROGRESS | Wait and poll |
   | CI Failed - Lint | Failed with lint/format errors | Auto-fix |
   | CI Failed - Other | Tests/types/build failed | Skip with log |
   | Behind Main | mergeStateStatus=BEHIND | Update branch, wait for CI |
   | Conflicts | mergeable=CONFLICTING | Skip, warn user |
   | Draft | isDraft=true | Skip |
   | Already Merged | state=MERGED | Log and skip |

3. **Present summary** (informational only, no blocking):
   ```
   Processing X open PRs...

   | # | Title | Author | Status | Action |
   |---|-------|--------|--------|--------|
   | 42 | bump cross-env | dependabot | CI Passed | Will merge |
   | 35 | bump sharp | dependabot | CI Pending | Will wait |
   | 32 | bump linting | dependabot | CI Failed | Will auto-fix |
   | 28 | new feature | user | Draft | Will skip |
   | 25 | refactor auth | user | Conflicts | Will skip |
   ```

4. **Check for blockers** - ONLY pause if:
   - There are PRs with merge conflicts (warn user which ones will be skipped)
   - There are draft PRs (inform user they will be skipped)
   - All PRs have non-auto-fixable failures

   Otherwise, proceed automatically.

5. **Sort PRs by priority**:
   1. Infrastructure PRs first (CI/workflow changes)
   2. PRs with passing CI
   3. PRs with pending CI
   4. PRs needing fixes

---

## Phase 2: Review Comments Handling

**Note**: This phase only runs if PRs have pending review comments. For batch processing of simple dependency bumps, this phase is typically skipped.

For PRs with `reviewDecision: CHANGES_REQUESTED`:

1. Fetch review comments
2. If all comments are trivial (typos, formatting, docstrings) - auto-fix
3. If comments require logic changes - skip PR and inform user
4. Push fixes without asking for confirmation

---

## Phase 3: CI Loop (Autonomous)

**Configuration:**
- Polling interval: 30 seconds
- Max wait per PR: 10 minutes
- Max fix attempts: 2 per PR

**For each PR, process in a loop:**

### Step 1: Check Current State
```bash
gh pr view <number> --json state,statusCheckRollup,mergeStateStatus,mergeable
```

- If `state=MERGED`: Log `[X/N] PR #<number> - Already merged`, continue to next
- If `state=CLOSED`: Log and skip

### Step 2: Handle Branch Behind Main

If `mergeStateStatus=BEHIND`:
```
      -> Updating branch to latest main...
```
```bash
gh api repos/{owner}/{repo}/pulls/{number}/update-branch -X PUT
```
Then wait 30s and re-check CI.

### Step 3: Wait for CI

While CI is pending and elapsed < 10 minutes:
```
      -> Waiting for CI... (Xs)
```
- Sleep 30 seconds
- Re-check status

### Step 4: Handle CI Results

**If CI passes**: Proceed to Phase 4 (merge)

**If CI fails**:
1. Get failure logs:
   ```bash
   gh run list --branch <branch> --status failure --limit 1 --json databaseId -q '.[0].databaseId'
   gh run view <id> --log-failed 2>&1 | head -100
   ```

2. Analyze failure type:

   **Lint/Formatting errors** (auto-fixable):
   ```
      X CI failed (lint errors)
      -> Auto-fixing lint errors...
   ```
   - Checkout branch (handle worktree)
   - Run `npm install && npm run lint -- --fix`
   - If changes exist:
     ```bash
     git add -A
     git commit -m "fix: auto-fix lint errors"
     git push
     ```
   - Wait for CI to re-run
   - Decrement retry counter
   - If this is the 2nd consecutive failure with same error: skip PR

   **Type errors / Test failures / Build errors** (NOT auto-fixable):
   ```
      X CI failed (type errors) - skipping
   ```
   - Add to skipped_prs with reason
   - Continue to next PR immediately

   **Secrets unavailable** (Dependabot):
   - Try updating branch first (may get new CI workflow)
   - If still fails after update: skip with note

### Step 5: Timeout Handling

If 10 minutes elapsed and CI still pending:
```
      ! CI timed out after 10 minutes - skipping
```
- Add to skipped_prs
- Continue to next PR

---

## Phase 4: Merge (No Confirmation Needed)

For each PR that passed CI:

### Pre-merge Verification
```bash
gh pr view <number> --json state,mergeStateStatus,mergeable
```

- If `state=MERGED`: Log and continue (already merged)
- If `mergeable=CONFLICTING`: Skip (conflicts appeared)

### Execute Merge

```bash
gh pr merge <number> --squash --delete-branch
```

(Use detected strategy from Phase 0: --squash, --merge, or --rebase)

**Handle results:**
- Success: Log `Merged`, increment counter
- "Already merged" error: Log as success, continue
- Other error: Log error, add to failed_prs, continue to next PR

**Output format:**
```
[1/8] PR #42 "bump cross-env"
      -> CI passed -> merged

[2/8] PR #35 "bump sharp"
      -> Waiting for CI... (45s)
      -> CI passed -> merged

[3/8] PR #32 "bump linting group"
      X CI failed (lint errors)
      -> Auto-fixing lint errors...
      -> Pushed fix, waiting for CI... (30s)
      -> CI passed -> merged

[4/8] PR #28 "new feature"
      - Skipped (draft PR)

[5/8] PR #25 "refactor auth"
      - Skipped (merge conflicts)
```

---

## Phase 5: Cleanup & Summary (Automatic)

### Step 1: Auto-cleanup (no prompts)

1. Prune remote refs:
   ```bash
   git fetch --prune
   ```

2. For each merged PR's branch, delete local if exists:
   ```bash
   git branch -d <branch> 2>/dev/null || true
   ```

3. Prune worktrees:
   ```bash
   git worktree prune
   ```

### Step 2: Return to original context

- If original branch exists: `git checkout <original-branch>`
- If it was merged: checkout default branch
- If was detached HEAD: `git checkout <original-sha>`

### Step 3: Display Final Summary

```
=====================================================
        PR Resolution Complete
=====================================================

RESULTS:
  Merged: X PRs
  - #42 "bump cross-env"
  - #35 "bump sharp"
  - #32 "bump linting group" (auto-fixed lint)

  Skipped: X PRs
  - #28 "new feature" (draft)
  - #25 "refactor auth" (merge conflicts)

  Failed: X PRs
  - #20 "breaking change" (type errors - needs manual fix)

AUTO-FIXES APPLIED:
  - X lint errors fixed automatically

REMAINING WORK:
  - PR #25 has merge conflicts at: src/auth.ts
  - PR #20 needs manual fix for type errors

=====================================================
```

</workflow>

## Safety Rules

### ALWAYS Auto-fix
- Lint errors (`npm run lint -- --fix`)
- Formatting errors

### NEVER Auto-fix
- Type errors (TypeScript)
- Test failures
- Build errors
- Logic changes in review comments

### Branch Safety
- NEVER use force push
- ALWAYS preserve user's starting context
- ALWAYS use detected merge strategy

### Timing
- 30 second polling interval
- 10 minute max wait per PR
- 2 max fix attempts before skipping

### Error Handling
- "Already merged" is a success, not an error
- Continue to next PR on any error
- Log all failures for summary
- Never block on a single PR failure

---

## Error Recovery

If the workflow fails at any point:

1. **Show completed operations**
2. **Show current state**: `git branch --show-current`, `git status --porcelain`
3. **Re-run is safe**: The workflow is idempotent - merged PRs show as "Already merged"

**Common issues:**
- "Already merged" - Normal, PR was auto-merged externally
- CI timeout - Re-run later or check GitHub Actions
- Merge conflicts - Resolve manually, then re-run
