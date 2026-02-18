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
   - Create counters: merged=0, skipped=0, failed=0, auto_fixed_lint=0, review_comments_assessed=0, review_comments_fixed=0, review_comments_logged=0
   - Create lists: merged_prs[], skipped_prs[], failed_prs[]

If gh authentication fails, STOP and clearly explain what the user needs to do.

---

## Phase 1: PR Discovery & Batch Planning

**Goal**: Assess all PRs and start batch processing immediately.

1. **Fetch all open PRs**:
   ```bash
   gh pr list --state open --json number,title,headRefName,baseRefName,statusCheckRollup,reviewDecision,isDraft,url,author,mergeStateStatus,mergeable,state,reviews,latestReviews
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
   | Has Review Comments | reviews/latestReviews non-empty OR reviewDecision set | Process in Phase 2 |

   > **Note**: "Has Review Comments" is an **overlay** category — a PR can be both "CI Passed" and "Has Review Comments". Phase 2 runs before merging regardless of CI status.

3. **Present summary** (does NOT pause for confirmation):
   ```
   Processing X open PRs...

   | # | Title | Author | Status | Reviews | Action |
   |---|-------|--------|--------|---------|--------|
   | 42 | bump cross-env | dependabot | CI Passed | - | Will merge |
   | 35 | bump sharp | dependabot | CI Pending | 2 bot comments | Will wait + assess reviews |
   | 32 | bump linting | dependabot | CI Failed | - | Will auto-fix |
   | 28 | new feature | user | Draft | 1 human review | Will skip |
   | 25 | refactor auth | user | Conflicts | - | Will skip |
   ```

4. **Log non-processable PRs** (no user prompt):
   - PRs with merge conflicts → log as skipped
   - Draft PRs → log as skipped
   - If ALL PRs are non-processable (conflicts, drafts, non-fixable failures) → inform user and end workflow
   - Otherwise, proceed automatically with processable PRs.

5. **Sort PRs by priority**:
   1. Infrastructure PRs first (CI/workflow changes)
   2. PRs with passing CI
   3. PRs with pending CI
   4. PRs needing fixes

---

## Phase 2: Review Comments Handling (Autonomous)

**Goal**: Assess and auto-fix review comments from ALL sources (bot and human inline comments). No user prompts in this phase.

For each PR with review data (reviews/latestReviews non-empty, or reviewDecision set), run the following steps:

### Step 1: Fetch All Review Data

GitHub PRs have three distinct comment endpoints. Fetch all three:

```bash
# Inline review comments (code-level, attached to diff hunks)
gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate

# Top-level review submissions (APPROVE, CHANGES_REQUESTED, COMMENTED bodies)
gh api repos/{owner}/{repo}/pulls/{number}/reviews --paginate

# General PR conversation comments (some bots post here instead of inline)
gh api repos/{owner}/{repo}/issues/{number}/comments --paginate
```

Never rely on `reviewDecision` alone. If all three return empty arrays, skip to Phase 3 for this PR.

### Step 2: Handle Formal CHANGES_REQUESTED

If `reviewDecision: CHANGES_REQUESTED` AND the reviewer is a human (not a bot) → **auto-skip PR entirely**. Add to `skipped_prs` with reason "human requested changes". This is the only hard stop.

### Step 3: Assess ALL Comments Uniformly

Read the `diff_hunk` context for each comment. Classify into one of four buckets:

**Valid + straightforward** → auto-fix:
- "Unused import `fs` on line 12" → remove it
- "Missing null check before accessing `user.name`" → add the guard
- "Variable `x` should be `userCount`" → rename it
- "Missing `await` on async call" → add it
- "Typo: `recieve` → `receive`" → fix it

**Valid + complex** → log, proceed to merge:
- "Consider refactoring this into a strategy pattern"
- "This function does too much — split into smaller functions"
- "Should we add retry logic here?"
- Any comment phrased as a question requiring design decisions
- Any suggestion touching multiple files or changing control flow

**Invalid / false positive** → dismiss, log:
- Bot references code that no longer exists in the current diff
- Suggestion would introduce a bug or break existing behavior
- Comment is about a different file/context than the one it's attached to

**Cosmetic only** → auto-fix if single-line, otherwise log:
- "Add trailing comma" → auto-fix
- "Reorder imports alphabetically" → auto-fix if simple, log if many files

**Conservative default**: when uncertain, always classify as "valid + complex" (log, don't fix). The cost of logging instead of fixing is near zero. The cost of botching an architectural change is a broken PR.

Bot and human inline comments are treated identically. The only distinction is formal `CHANGES_REQUESTED` (Step 2).

Increment `review_comments_assessed` for each comment processed.

### Step 4: Auto-fix via Sub-agent

For PRs with fixable comments, launch a **Task sub-agent** to apply fixes. This preserves the main workflow's context window for orchestration.

Sub-agent receives:
- PR number, branch name, repo owner/name
- List of fixable comments (file path, line number, `diff_hunk`, suggestion text, classification)
- Instruction: checkout branch, read relevant files, apply fixes, commit as `"fix: address review feedback"`, push

Sub-agent returns: summary of changes made (files modified, comments addressed).

Main workflow waits for sub-agent completion, then marks PR for CI re-check in Phase 3.

Process PRs with fixable comments **sequentially** (one sub-agent at a time). Parallel sub-agents deferred to v2 — multiple git checkouts risk worktree conflicts and harder debugging.

Increment `review_comments_fixed` for each comment addressed by the sub-agent.

### Step 5: Log Remaining Comments

For all non-fixed comments (valid + complex, invalid/dismissed, cosmetic-but-skipped):
- Record: PR number, comment author, file path, snippet of comment body, classification reason
- Increment `review_comments_logged` for each

These are included in the Phase 5 final summary.

**No user prompts in this phase. Fully autonomous.**

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

### Step 2b: Rerun vs Update-branch Decision

When CI needs re-triggering, choose the right action:

| Scenario | Action |
|----------|--------|
| Branch behind main | `gh api repos/{owner}/{repo}/pulls/{number}/update-branch -X PUT` |
| Flaky test (same code passed before) | `gh run rerun --failed` |
| CI workflow changed on main | `update-branch` (picks up new workflow) |
| Secrets unavailable (Dependabot) | `update-branch` first |

**Rule**: prefer `update-branch` over `rerun` unless confirmed flaky test on an up-to-date branch.

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
  - X review comments auto-resolved (from Y assessed)
  - Z review comments logged (not auto-fixable)

REVIEW COMMENTS LOGGED (not auto-fixed):
  - PR #35 [codex-bot] src/utils.ts: "Consider extracting to helper" (valid+complex)
  - PR #35 [codex-bot] src/index.ts: "Stale reference to removed fn" (invalid/dismissed)

REMAINING WORK:
  - PR #25 has merge conflicts at: src/auth.ts
  - PR #20 needs manual fix for type errors
  - PR #18 skipped: human reviewer formally requested changes

=====================================================
```

</workflow>

## Safety Rules

### ALWAYS Auto-fix
- Lint errors (`npm run lint -- --fix`)
- Formatting errors
- Review comments (bot or human) assessed as valid + straightforward

### NEVER Auto-fix
- Type errors (TypeScript)
- Test failures
- Build errors
- Logic/architectural changes in review comments
- PRs where a human reviewer formally requested changes (auto-skip entire PR)

### Branch Safety
- NEVER use force push
- ALWAYS preserve user's starting context
- ALWAYS use detected merge strategy

### Timing
- 30 second polling interval
- 10 minute max wait per PR
- 2 max fix attempts before skipping

### Review Comment Handling
- ALWAYS fetch inline comments via API (never rely solely on `reviewDecision`)
- NEVER merge a PR where a human formally requested changes (auto-skip)
- ALWAYS assess ALL comments (bot and human) for validity before applying
- Treat bot and human inline comments identically — assess, auto-fix if straightforward
- NEVER prompt the user for review comment decisions
- ALWAYS log dismissed/skipped comments for the final summary

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
