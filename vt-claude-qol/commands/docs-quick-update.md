---
description: 'Detect code changes and suggest targeted documentation updates'
---

# Docs Quick Update

You are a documentation maintenance assistant. Analyze code changes and suggest targeted documentation updates for affected docs.

## Overview

This command intelligently detects code changes and proposes documentation updates:
1. Detects change scope (uncommitted, branch diff, or recent commits)
2. Analyzes what changed (features, APIs, config, refactors)
3. Finds docs that reference changed code
4. Detects dead references (deleted/renamed code still mentioned)
5. Generates an update plan with user confirmation

## CLI Arguments

| Argument | Description |
|----------|-------------|
| (none) | Smart auto-detect: uncommitted → branch diff → recent commits |
| `--uncommitted` | Only analyze staged/unstaged changes |
| `--branch` | Compare current branch vs main |
| `--yolo` | Skip confirmation, apply all updates directly |

## Target Documents (Auto-Detected)

The command scans for these doc locations:
- `./docs/` folder (if exists)
- `CLAUDE.md`
- `AGENTS.md`
- `README.md`

---

## Workflow Phases

<steps>

### Phase 0: Pre-flight Checks

1. **Verify git repository**
   - Run `git rev-parse --is-inside-work-tree`
   - If not a git repo: Stop with message "Not a git repository. This command requires git to detect changes."

2. **Parse CLI arguments**
   - Check if `$ARGUMENTS` contains `--branch`, `--uncommitted`, or `--yolo`
   - Store flags for later use

3. **Discover existing docs**
   - Check for `./docs/` folder
   - Check for `CLAUDE.md`, `AGENTS.md`, `README.md` at project root
   - Build list of doc paths that exist
   - If no docs found: Stop with message "No documentation files found. Expected: docs/, CLAUDE.md, AGENTS.md, or README.md"

4. **Display pre-flight summary:**
   ```
   Docs Quick Update
   =================
   Flags: {--branch | --uncommitted | --yolo | auto-detect}
   Docs found: {list of doc paths}
   ```

### Phase 1: Smart Change Detection

Determine which changes to analyze based on flags or auto-detection:

**If `--uncommitted` flag:**
- Use: `git diff HEAD` (staged + unstaged)
- Scope label: "Uncommitted changes"

**If `--branch` flag:**
- Detect main branch: `git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo "main"`
- Use: `git diff {main}...HEAD`
- Scope label: "Branch diff vs {main}"

**If no flag (auto-detect):**
1. Check for uncommitted changes: `git status --porcelain`
   - If changes exist → use uncommitted scope
2. Check if on feature branch: `git branch --show-current`
   - If not main/master → suggest branch diff, ask user to confirm
3. Fallback: use last 5 commits on main
   - Use: `git diff HEAD~5...HEAD`
   - Scope label: "Recent commits (last 5)"

**Display scope summary:**
```
Change Scope
============
Mode: {scope label}
Command: {git diff command used}

Proceed with this scope? [Y/n]
```

Unless `--yolo` flag is set, use `AskUserQuestion` to confirm or let user override:
```
header: "Scope"
question: "Use this change scope for doc analysis?"
options:
  - label: "Yes, proceed"
    description: "{scope label}"
  - label: "Use uncommitted only"
    description: "Staged and unstaged changes"
  - label: "Use branch diff"
    description: "All commits on current branch vs main"
```

### Phase 2: Analyze Changes

1. **Run the git diff command** determined in Phase 1
   - Capture full diff output

2. **Parse diff output** and extract:
   - Files added/modified/deleted
   - Function/class names changed (look for `function`, `class`, `def`, `const`, `export`)
   - File renames (look for `rename from`/`rename to` in diff)

3. **Categorize changes:**

   | Category | Detection Signals |
   |----------|-------------------|
   | New features | New files, new exports, new functions |
   | API changes | Modified function signatures, changed exports |
   | Config changes | Changes to `*.config.*`, `package.json`, env files |
   | Refactors | Renamed files, moved code, internal changes |
   | Deletions | Removed files, removed exports, removed functions |

4. **Build change summary:**
   ```
   Change Analysis
   ===============
   Files changed: {count}

   By category:
   - New features: {list}
   - API changes: {list}
   - Config changes: {list}
   - Refactors: {list}
   - Deletions: {list}

   Key identifiers affected:
   - Functions: {list}
   - Exports: {list}
   - Files renamed: {old} → {new}
   ```

### Phase 3: Doc Discovery & Relevance

1. **Read each discovered doc file**

2. **For each doc, cross-reference with changes:**
   - Search for mentions of changed file paths
   - Search for mentions of changed function/class names
   - Search for mentions of deleted/renamed identifiers

3. **Detect dead references:**
   - If doc mentions a deleted file → flag as dead reference
   - If doc mentions a renamed file by old name → flag as dead reference
   - If doc mentions a deleted function/export → flag as dead reference

4. **Rank docs by update priority:**

   | Priority | Criteria |
   |----------|----------|
   | HIGH | Contains dead references (deleted/renamed code) |
   | MEDIUM | References files/functions that changed |
   | LOW | General project docs that might need refresh |

5. **Build relevance map:**
   ```
   Doc Relevance Analysis
   ======================

   [HIGH] README.md
     - Dead reference: mentions deleted function `oldHelper()`
     - Stale: references `src/utils.js` (renamed to `src/helpers.js`)

   [MEDIUM] CLAUDE.md
     - References modified: `install.js`
     - May need update for new export `newFeature`

   [LOW] docs/api.md
     - General API docs, no direct references found
   ```

### Phase 4: Generate Update Plan

For each doc needing updates, generate specific recommendations:

1. **For dead references:**
   - Identify exact line/section
   - Recommend: remove reference, or update to new name

2. **For stale content:**
   - Identify section that references changed code
   - Summarize what changed and suggest update

3. **Format update plan:**
   ```
   Documentation Update Plan
   =========================

   README.md (2 updates needed)
   ├── [1] Remove reference to deleted `oldHelper()` function
   │       Section: "API Reference"
   │       Action: Remove or replace with new equivalent
   │
   └── [2] Update file path `src/utils.js` → `src/helpers.js`
           Section: "Project Structure"
           Action: Find/replace old path with new

   CLAUDE.md (1 update needed)
   └── [1] Document new export `newFeature`
           Section: "Development Commands" or new section
           Action: Add brief description of new functionality

   Total: 3 updates across 2 files
   ```

### Phase 5: User Confirmation

**If `--yolo` flag:** Skip to Phase 6 (apply all updates)

**Otherwise:** Use `AskUserQuestion` with `multiSelect: true`:

```
header: "Updates"
question: "Which documentation updates should be applied?"
multiSelect: true
options:
  - label: "All updates"
    description: "Apply all {N} recommended updates"
  - label: "README.md updates"
    description: "{N} updates: {brief summary}"
  - label: "CLAUDE.md updates"
    description: "{N} updates: {brief summary}"
  - label: "Skip all"
    description: "Exit without making changes"
```

If user selects individual docs, confirm each update within that doc.

### Phase 6: Apply Updates

For each approved update:

1. **Read the target doc file**

2. **Make the specific edit:**
   - For dead reference removal: Delete the line/paragraph
   - For path updates: Find/replace old path with new
   - For new content: Add to appropriate section

3. **Preserve doc structure:**
   - Maintain existing headings and formatting
   - Only modify relevant sections
   - Don't reorganize or reformat unrelated content

4. **Track changes made:**
   - Record each edit for summary

### Phase 7: Completion Summary

Display final summary:

```
================================
DOCUMENTATION UPDATE COMPLETE
================================

Changes Applied:
- README.md: 2 updates
  ✓ Removed dead reference to `oldHelper()`
  ✓ Updated path `src/utils.js` → `src/helpers.js`

- CLAUDE.md: 1 update
  ✓ Added documentation for `newFeature` export

Suggested Commit Message:
  docs: update documentation for recent code changes

Files Changed:
- README.md
- CLAUDE.md

To Revert:
  git checkout README.md CLAUDE.md
```

</steps>

---

## Safety Rules

**CRITICAL - These rules must NEVER be violated:**

1. **NEVER edit docs without user confirmation** (unless `--yolo` flag is set)
2. **Always show the update plan** before applying changes (even with `--yolo`, show summary after)
3. **Preserve doc structure** - only update relevant sections, don't reorganize
4. **Don't add unverifiable content** - only document what can be confirmed from code changes
5. **Keep edits minimal** - fix specific issues, don't rewrite entire sections
6. **Always provide revert instructions** - user should be able to undo easily

---

## Change Category Detection

| Category | File Patterns | Code Patterns |
|----------|---------------|---------------|
| New features | New files in `src/`, `lib/` | `export`, new functions |
| API changes | Modified exports, signatures | `function.*\(`, `export {` |
| Config changes | `*.config.*`, `package.json` | JSON keys, env vars |
| Refactors | File renames, moves | Import path changes |
| Deletions | Removed files | Removed exports/functions |

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Not a git repo | Stop with clear error message |
| No docs found | Stop with message listing expected locations |
| No changes detected | Stop with message "No changes found in the specified scope" |
| Empty diff | Report "No code changes to analyze" |
| Doc file unreadable | Skip that file, warn user |
| Git command fails | Report error with the specific command |

---

## Example Session

```
User: /docs-quick-update

Claude: Docs Quick Update
=================
Flags: auto-detect
Docs found: README.md, CLAUDE.md, docs/

Change Scope
============
Mode: Uncommitted changes (auto-detected)
Files with changes: 3

[Analyzing changes...]

Change Analysis
===============
Files changed: 3
- Modified: src/install.js
- Renamed: src/utils.js → src/helpers.js
- Deleted: src/legacy.js

Documentation Update Plan
=========================

README.md (2 updates needed)
├── [1] Update file path `src/utils.js` → `src/helpers.js`
└── [2] Remove reference to deleted `src/legacy.js`

CLAUDE.md (1 update needed)
└── [1] Update "Key Files" section with renamed file

[Question] Which documentation updates should be applied?
> All updates

Applying updates...

DOCUMENTATION UPDATE COMPLETE
=============================
Changes Applied:
- README.md: 2 updates ✓
- CLAUDE.md: 1 update ✓

Suggested Commit Message:
  docs: update documentation for recent code changes
```

---

## Example with --yolo Flag

```
User: /docs-quick-update --yolo

Claude: Docs Quick Update (YOLO mode)
=====================================
Skipping confirmations, applying all updates directly...

[Auto-detected scope: uncommitted changes]
[Found 2 updates across 2 docs]
[Applying all updates...]

DOCUMENTATION UPDATE COMPLETE
=============================
Changes Applied:
- README.md: 1 update ✓
- CLAUDE.md: 1 update ✓

Suggested Commit Message:
  docs: update documentation for recent code changes
```
