---
description: 'Analyze local branches, cleanup merged branches, push changes, and create PRs'
---

IT IS CRITICAL THAT YOU FOLLOW THIS WORKFLOW EXACTLY.

<workflow CRITICAL="TRUE">

## Phase 0: Pre-flight Checks

Before any operations, verify the environment is safe:

1. **Check gh authentication**: Run `gh auth status`. If not authenticated, STOP and inform user.

2. **Check for uncommitted changes**: Run `git status --porcelain`. If output is non-empty, STOP and inform user to commit or stash changes first.

3. **Detect git directory** (worktree-compatible):
   - Run `git rev-parse --git-dir` to get the actual git directory path
   - This works correctly in both main and linked worktrees (where `.git` is a file, not a directory)
   - Store this path for use in step 4

4. **Check for in-progress operations**: Using the git directory from step 3, check if any of these exist:
   - `<git-dir>/rebase-merge` or `<git-dir>/rebase-apply` (rebase in progress)
   - `<git-dir>/MERGE_HEAD` (merge in progress)
   - `<git-dir>/CHERRY_PICK_HEAD` (cherry-pick in progress)
   If any exist, STOP and inform user to complete or abort the operation.

5. **Detect remote name**: Run `git remote` and use the first result (usually `origin`).

6. **Detect default branch**: Run `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`. Fallback to `main` if this fails.

7. **Record current branch and worktree**:
   - Run `git branch --show-current` to get current branch name
   - **If empty (detached HEAD)**: Run `git rev-parse HEAD` to save the commit SHA instead
   - Run `git rev-parse --show-toplevel` to record the current worktree path
   - Track whether we started in detached HEAD state for Phase 6 restoration

8. **Build worktree inventory**: Run `git worktree list --porcelain` to detect all worktrees.
   - Parse the output to build a map: `{ branch_name -> worktree_path }`
   - **For each worktree path:**
     a) Verify the directory exists on the filesystem
     b) If it exists, verify git metadata is valid: `git -C <path> rev-parse --git-dir 2>/dev/null`
     c) If directory exists but git command fails, this is a **stale worktree** (metadata broken but directory remains)
   - **If any paths don't exist OR have invalid git metadata, run `git worktree prune` to clean up before continuing**
   - After pruning, re-run `git worktree list --porcelain` to get the updated inventory
   - Identify which worktree is the main worktree vs linked worktrees
   - For each branch, record if it's checked out in a worktree and where

9. **Check for uncommitted changes in other worktrees**: For each linked worktree (not the current one):
   - Run `git -C <worktree-path> status --porcelain`
   - If any worktree has uncommitted changes, WARN the user (but do not block)
   - Track which worktrees have uncommitted changes for later phases

10. **Display worktree overview** (if multiple worktrees exist):
    ```
    Worktrees detected:
      /path/to/main (main) - this worktree
      /path/to/feature (feature-x) - clean
      /path/to/docs (docs-update) - uncommitted changes!
    ```

11. **Initialize operation log**: Create an in-memory log to track all operations performed.
    - This log will be used for error recovery if something fails mid-workflow
    - Track: operation type, target (branch/worktree), status (success/failed)
    - Log each destructive operation as it completes (worktree removal, branch deletion, push, PR creation)

If any pre-flight check fails, STOP and clearly explain what the user needs to do.

---

## Phase 1: Branch Analysis

Gather comprehensive information about all branches:

1. Run `git fetch <remote>` to get latest remote state
2. Run `git branch -a` to list all branches
3. Run `git branch -a --merged <remote>/<default-branch>` to identify merged branches
4. Detect squash-merged branches:
   - Get merged PR branch names: `gh pr list --state merged --limit 100 --json headRefName,number,mergedAt`
   - For each local branch, check if its name matches a merged PR's `headRefName`
   - **If branch name matches a merged PR, trust the GitHub API - mark as "squash-merged"**
   - **Do NOT use `git rev-list` to verify** (commit ancestry doesn't work for squash merges since commits are rewritten into a single new commit)
5. Run `git branch -vv` and look for `: gone]` to find orphaned tracking branches
6. For each local branch with a remote, run `git rev-list --left-right --count <remote>/<branch>...<branch>` to detect sync status
7. Run `gh pr list --state open` to check for open PRs
8. Run `gh pr list --state open --json number,createdAt,headRefName` to identify stale PRs (>30 days old)
9. **Cross-reference with worktree inventory** (from Phase 0): For each branch, note if it's checked out in a worktree

**Present a summary table to the user with these columns:**
| Branch | Location | Sync Status | Open PR | Worktree | Recommendation |

**Worktree column values:**
- `-` - Not checked out in any worktree
- `/path/to/worktree` - Path where branch is checked out
- `/path/to/worktree (this)` - Checked out in the current worktree
- `/path/to/worktree (dirty)` - Checked out in a worktree with uncommitted changes

**Sync Status values:**
- `merged` - Already merged to default branch
- `synced` - Local and remote are identical
- `ahead` - Local has unpushed commits (show count)
- `behind` - Remote has commits not in local (show count)
- `diverged` - Both ahead and behind (show counts)
- `local-only` - No remote tracking branch
- `orphaned` - Remote tracking branch was deleted

**Recommendation adjustments for worktrees:**
- If branch is `merged` AND in a worktree → "remove worktree first, then delete"
- If branch is `merged` AND in current worktree → "switch to default, then delete"
- If branch is in a worktree with uncommitted changes → include "(worktree has changes)" warning

---

## Phase 2: WIP Identification

Use the `AskUserQuestion` tool with `multiSelect: true` to ask the user which branches are Work-In-Progress and should be skipped.

Present all non-merged branches as options with worktree context:
- **Current worktree branch**: Auto-select as WIP with description "(current worktree)"
- **Branches in other worktrees**: Include worktree path in description, e.g., "(in worktree: /path/to/feature)"
- **Branches with uncommitted worktree changes**: Add warning "(worktree has uncommitted changes)"

Example multi-select presentation:
```
Select WIP branches to skip:
[x] feature-current (current worktree) ← auto-selected
[ ] feature-x (in worktree: /path/to/feature-x)
[ ] feature-y (in worktree: /path/to/feature-y - has uncommitted changes!)
[ ] bugfix-1
[ ] docs-update
```

Store the WIP branches list for use in subsequent phases. Also maintain a separate list of branches that are in worktrees (regardless of WIP status) for Phase 3 handling.

---

## Phase 3: Cleanup Merged Branches

**Note on GitHub auto-delete:** Many repositories have "Automatically delete head branches" enabled in GitHub settings. When enabled, merged/squash-merged PR branches are automatically deleted from the remote. The workflow handles this gracefully - if remote deletion fails because the branch is already gone, it continues normally.

For all branches identified as merged (via regular merge OR squash merge):

### Step 1: Categorize merged branches by worktree status

**Category A - No worktree (safe to delete directly):**
- Branches not checked out in any worktree
- These can be deleted with standard `git branch -d`

**Category B - In linked worktrees (requires worktree handling first):**
- Branches checked out in worktrees OTHER than the current one
- Cannot delete until worktree is removed or switched to different branch

**Category C - In current worktree:**
- The branch you're currently on (if it's merged)
- Requires checkout to default branch first

### Step 2: Present categorized list to user

```
Merged branches to clean up:

A) Ready to delete (no worktree):
   - old-feature (last commit: abc123, 5 days ago)
   - bugfix-123 (last commit: def456, 2 weeks ago)

B) In linked worktrees (need handling first):
   - feature-x at /path/to/feature-x (clean)
   - docs-update at /path/to/docs (has uncommitted changes!)

C) In current worktree:
   - hotfix-1 (will switch to <default-branch> first)
```

### Step 3: Handle Category C (current worktree)

If the current branch is in the delete list:
- Run `git checkout <default-branch>` first
- Then proceed to delete the branch

### Step 4: Handle Category B (branches in linked worktrees)

For EACH branch in a linked worktree, use `AskUserQuestion` to ask:

```
Branch '<branch>' is checked out in worktree at '<path>'.

Options:
1. Remove worktree and delete branch (Recommended)
2. Skip this branch
3. Switch worktree to <default-branch>, then delete branch
```

**If option 1 (Remove worktree):**
1. Check for uncommitted changes: `git -C <worktree-path> status --porcelain`
2. If uncommitted changes exist:
   - WARN: "Worktree at '<path>' has uncommitted changes that will be LOST"
   - Ask for explicit confirmation: "Proceed anyway?" / "Skip this worktree"
   - If skip, move to next branch
3. Remove worktree: `git worktree remove --force <worktree-path>`
   - The `--force` flag is needed because worktrees often contain untracked build artifacts (.next, node_modules, coverage, etc.)
   - This is safe here because we already: (a) confirmed the branch is merged/squash-merged, (b) warned about uncommitted changes if any
4. If removal still fails (locked, etc.):
   a) Run `git worktree prune` to clean up stale metadata
   b) If directory still exists, inform user: "Leftover directory at '<path>' needs manual removal: `rm -rf '<path>'`"
   c) **Do NOT attempt `rm -rf` directly** - this may be blocked by safety hooks in some environments
   d) Continue with branch deletion if possible
5. Proceed to delete branch (now safe)

**If option 2 (Skip):**
- Skip this branch entirely
- Add to "skipped due to worktree" list for summary

**If option 3 (Switch worktree branch):**
1. Run `git -C <worktree-path> checkout <default-branch>`
2. If checkout fails, inform user and skip
3. Proceed to delete branch (now safe)

### Step 5: Delete Category A branches and handled Category B/C branches

For each branch now eligible for deletion:
- Delete local: `git branch -d <branch>` (use `-D` for squash-merged branches that git doesn't recognize as merged)
- Delete remote (if tracking branch exists):
  1. First check if remote branch exists: `git ls-remote --heads <remote> <branch>`
  2. If output is empty, remote branch is already deleted (likely by GitHub auto-delete) - skip remote deletion
  3. If remote branch exists: `git push <remote> --delete <branch>`

### Step 6: Clean up orphaned tracking branches

- Run `git branch -vv | grep ': gone]'` and delete them

---

## Phase 4: Push Local Changes to Remote

For branches that are NOT marked as WIP:

**Local-only branches:**
- Show the branch and its commits
- Confirm with user
- Run `git push -u <remote> <branch>`
- Note: Branches in worktrees CAN be pushed without issues - just note "(in worktree: /path)" in the confirmation

**Branches ahead of remote (unpushed commits):**
- Show commits that will be pushed: `git log <remote>/<branch>..<branch> --oneline`
- If branch is in a worktree, note: "(checked out at /path)"
- Confirm with user
- Run `git push <remote> <branch>`

**Diverged branches (both ahead and behind):**

*If branch is NOT in a worktree:*
- Warn user that rebase is needed
- Ask: "Skip this branch", "Attempt rebase", or "Manual fix"
- If rebase chosen:
  - Run `git checkout <branch>`
  - Run `git rebase <remote>/<branch>`
  - If rebase has conflicts:
    - Run `git rebase --abort`
    - Inform user of the conflict
    - Skip this branch
  - If rebase succeeds:
    - Run `git push <remote> <branch>`
- Return to original branch when done

*If branch IS in a linked worktree:*
- Cannot checkout branch (already checked out elsewhere)
- Ask user with `AskUserQuestion`:
  ```
  Branch '<branch>' has diverged and is checked out at '<path>'.

  Options:
  1. Rebase in that worktree (Recommended)
  2. Skip this branch
  3. Manual fix
  ```
- If option 1 (Rebase in worktree):
  - Check for uncommitted changes: `git -C <worktree-path> status --porcelain`
  - If uncommitted changes exist, WARN and ask to skip or proceed
  - Run `git -C <worktree-path> fetch <remote>`
  - Run `git -C <worktree-path> rebase <remote>/<branch>`
  - If rebase has conflicts:
    - Run `git -C <worktree-path> rebase --abort`
    - Inform user of the conflict
    - Skip this branch
  - If rebase succeeds:
    - Run `git -C <worktree-path> push <remote> <branch>`

*If branch is in the CURRENT worktree:*
- Handle same as non-worktree case (can checkout and rebase normally in current worktree)

**Behind branches:**
- Warn user these need to be updated before further work
- Skip from PR creation unless user explicitly requests

---

## Phase 5: Create PRs

Identify eligible branches:
- Have commits ahead of the default branch
- Don't already have an open PR
- Are NOT marked as WIP

**Before creating PRs:**
1. Build a summary table of all PRs to be created:
   | Branch | Proposed Title | # Commits | Age |
2. Show the table to user
3. Use `AskUserQuestion` to ask: "Create all X PRs?", "Let me select which ones", "Skip PR creation"
4. If "select", present branches as multi-select options
5. Proceed only with confirmed branches

For each confirmed branch:
1. Check divergence: `git rev-list --left-right --count <default-branch>...<branch>`
2. If behind default branch, warn user rebase may be needed after PR creation
3. For branches >30 days old, add note in PR body about age
4. Create PR: `gh pr create --head <branch> --title "<conventional commit title based on commits>" --body "<summary of changes>"`

---

## Phase 6: Local Cleanup & Summary

### Step 1: Clean up stale refs and worktree entries

1. Run `git fetch --prune` to clean up all stale remote refs
2. Run `git worktree prune` to clean up stale worktree admin entries

### Step 2: Return to original context

- **If original state was a branch**: Run `git checkout <original-branch>` (if it still exists, otherwise stay on default branch)
- **If original state was detached HEAD**: Run `git checkout <original-commit-sha>` to restore exact position
- If the original branch was deleted, inform user: "Your original branch '<branch>' was deleted. You are now on '<default-branch>'."

### Step 3: Display final summary

```
=====================================================
        Local Git Cleanup Complete!
=====================================================

BRANCHES:
✓ Deleted X merged branches (local + remote)
✓ Pushed X branches to remote
✓ Created X PRs
○ Skipped X WIP branches

WORKTREES:
✓ Removed X worktrees (merged branches)
✓ Pruned X stale worktree entries
○ Preserved X active worktrees

CURRENT STATE:
  Branch: <current-branch>
  Worktree: <current-worktree-path>

PRs CREATED:
  - PR #42: feature-x
  - PR #43: bugfix-1

REMAINING BRANCHES:
  - feature-wip (in worktree: /path/to/feature-wip)
  - bugfix-active (ahead 2)

ACTIVE WORKTREES:
  /path/to/main        main        (this worktree)
  /path/to/feature     feature-wip clean

NEXT STEPS:
  Run `/github-pr-resolve` to handle CI, reviews, and merging.
=====================================================
```

</workflow>

## Error Recovery

If the workflow fails at any point, display:

1. **Operations completed successfully** (from the operation log)
2. **The operation that failed** and the error message
3. **Current repository state**:
   - Current branch: `git branch --show-current`
   - Uncommitted changes: `git status --porcelain`
   - Any in-progress operations: check for rebase/merge/cherry-pick

4. **Recovery guidance based on failure point**:

   **If failed during worktree removal:**
   - Worktree may be partially removed
   - Run: `git worktree prune` to clean up
   - Branch was NOT deleted (safe)

   **If failed during branch deletion:**
   - Local branch may be deleted but remote still exists (or vice versa)
   - Check: `git branch -a | grep <branch>`
   - Manual cleanup: `git branch -d <branch>` or `git push origin --delete <branch>`

   **If failed during push:**
   - Changes are local, nothing lost
   - Retry: `git push <remote> <branch>`

   **If failed during PR creation:**
   - Branch is pushed, PR was not created
   - Retry: `gh pr create --head <branch>`

   **If failed during rebase:**
   - Rebase may be in progress
   - Check: `git status`
   - Abort if needed: `git rebase --abort`
   - Branch is in original state (safe)

5. **Always safe to re-run**: The workflow is idempotent - running it again will skip already-completed operations.

---

## Safety Rules

### Branch Safety Rules
- NEVER use force push (`--force` or `-f`)
- NEVER use force delete for branches (`-D`) unless confirmed squash-merged
- ALWAYS confirm with user before destructive operations
- ALWAYS preserve the user's working context (return to original branch)

### Worktree Safety Rules
- NEVER remove a worktree with uncommitted changes without explicit user confirmation
- `--force` flag for worktree removal IS allowed when: (a) branch is confirmed merged/squash-merged, AND (b) uncommitted changes have been checked and user warned if any exist. The `--force` is needed to handle untracked build artifacts (.next, node_modules, etc.)
- ALWAYS check worktree status (`git -C <path> status --porcelain`) before attempting branch deletion
- ALWAYS run `git worktree prune` after removing worktrees to clean up stale entries
- NEVER attempt to remove the main worktree (git will error, but check anyway)
- ALWAYS use `git -C <path>` for operations in linked worktrees (never cd into them)
- NEVER delete a branch without first handling its worktree (remove or switch branch)
- ALWAYS warn user if an operation will affect a worktree they're not currently in
- ALWAYS preserve at least one worktree (the main one cannot be removed)
- ALWAYS check for in-progress operations (rebase, merge, cherry-pick) in worktrees before operating on them
