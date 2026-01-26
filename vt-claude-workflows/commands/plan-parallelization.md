---
description: 'Analyze epic files to identify which epics can run in parallel Git worktrees'
---

# Epic Parallelization Analysis Command

You are a project planning analyst. Analyze the provided epic files to identify which **epics** can be worked on in parallel using Git worktrees. Each epic is treated as an atomic unit that will be implemented in a separate work session.

**Key assumption**: Stories within an epic are handled sequentially in their own worktree session. This analysis focuses on epic-to-epic dependencies only.

## Input Handling

The user may provide one or more of:
- Epic files (markdown files with story definitions)
- Sprint status YAML file
- Epic folder path

<steps>
1. **Context Detection (Auto)**

   **Always check for sprint-status.yaml:**
   - Look in `_bmad-output/implementation-artifacts/sprint-status.yaml`
   - If found, read to get current epic/story status
   - Determine epic-level status: an epic is "done" only if ALL its stories are done
   - An epic is "in-progress" if ANY story is in-progress
   - Otherwise epic is "pending"

   **Check for previous parallelization plan:**
   - Glob for `_bmad-output/planning-artifacts/parallelization-analysis-*.md`
   - If found, read the most recent one
   - This enables delta/comparison in the output

2. **Identify and Load Input Files**
   - If a folder is provided, glob for `epic-*.md` files
   - Read all provided epic files completely
   - If no specific input given, default to `_bmad-output/planning-artifacts/epics/`

3. **Parse Epics (Treat as Atomic Units)**
   For each epic file:
   - Extract epic number and title from filename/header
   - Parse all `## Story N.M:` sections to understand scope
   - Capture ALL acceptance criteria across ALL stories (for dependency detection)
   - Determine epic status from sprint-status (done/in-progress/pending)
   - If file parsing fails, log warning and skip (don't crash)

4. **Categorize Epics by Status**

   | Epic Status | Condition | Include in Plan? |
   |-------------|-----------|-----------------|
   | done | ALL stories done | No (summary only) |
   | in-progress | ANY story in-progress | Yes (active section) |
   | pending | No stories started | Yes (pending section) |

5. **Analyze Epic-to-Epic Dependencies**

   Scan ALL acceptance criteria within an epic for CAPABILITY REFERENCES:

   | When any story AC mentions... | Epic depends on... | How to find it |
   |-------------------------------|-------------------|----------------|
   | "email is sent", "verification email", "password reset email" | Email epic | Epic with *Email* in title |
   | "user is authenticated", "signed in", "session", "logged in" | Auth epic | Epic with *Auth* in title |
   | "admin user", "admin role", "admin access" | Admin epic | Epic with *Admin* in title |
   | "analytics", "track event", "metrics" | Analytics epic | Epic with *Analytics* in title |
   | "I have verified my email", "email verified" | Auth epic | Epic with *Auth* in title |
   | "payment", "subscription", "billing" | Payments epic | Epic with *Payment* or *Billing* in title |
   | "notification", "notify user" | Notifications epic | Epic with *Notification* in title |

   **Key insight**: Match capability names in epic TITLES, not epic numbers.
   This makes detection project-agnostic.

   **Handle completed dependencies:**
   - If a dependency epic is already "done", don't block waiting epics
   - Mark as "dependency satisfied"

6. **Build Epic Execution Plan for Worktrees**
   Group remaining (non-done) epics into phases:
   - **In Progress**: Epics currently being worked on
   - **Phase 1**: Foundation epics (no pending dependencies) - can start worktrees in parallel
   - **Phase 2+**: Epics that depend on earlier phases
   - **Parallel Groups**: Epics within a phase that can have concurrent worktrees

7. **Generate Output**
   Create markdown report with:
   - Context summary (what was detected)
   - Epic-level progress summary
   - What's changed since last analysis (if prior plan exists)
   - Worktree execution phases (which epics can run in parallel)
   - Epic dependency matrix
   - Recommended worktree strategy

8. **Save Report**
   Write to: `_bmad-output/planning-artifacts/parallelization-analysis-{YYYY-MM-DD-HHmm}.md`
   (Includes timestamp to prevent same-day collisions)
</steps>

## Output Template

Use this structure for the report:

```markdown
# Epic Parallelization Analysis
Generated: {date}

## Context
- **Sprint Status**: Found / Not Found
- **Previous Plan**: Found ({date}) / Not Found
- **Analysis Mode**: Fresh / Incremental
- **Parse Warnings**: None / [list of skipped files]

## Epic Progress Summary
| Status | Epics | Stories | Percentage |
|--------|-------|---------|------------|
| Completed | X | Y | Z% |
| In Progress | X | Y | Z% |
| Pending | X | Y | Z% |
| **Total** | X | Y | 100% |

## What's Changed Since Last Analysis
<!-- Only include if previous plan was found -->
- **New Epics**: [list or "None"]
- **Completed Epics**: [list of epics that moved to done]
- **Status Changes**: [epics that changed status]

## Currently In Progress (Active Worktrees)
<!-- Epics with any in-progress stories -->
| Epic | Title | Stories Done | Blocked By |
|------|-------|--------------|------------|
| 2 | User Authentication | 2/5 | None |

## Worktree Execution Plan

### Phase 1: Foundation Epics
These epics have no pending dependencies - **start worktrees in parallel**:

| Epic | Title | Stories | Depends On | Notes |
|------|-------|---------|------------|-------|
| 1 | Core Infrastructure | 3 | None | Foundation |
| 3 | Email System | 4 | None | Independent |

**Worktree commands:**
```bash
git worktree add ../epic-1-core-infrastructure feature/epic-1
git worktree add ../epic-3-email-system feature/epic-3
```

### Phase 2: Dependent Epics
**Requires**: Phase 1 completion (or specific epics noted)

| Epic | Title | Stories | Depends On | Can Parallel With |
|------|-------|---------|------------|-------------------|
| 2 | User Auth | 5 | Epic 1 | Epic 4 |
| 4 | Admin Dashboard | 3 | Epic 1 | Epic 2 |

### Phase 3+
[Continue pattern for remaining phases...]

## Completed Epics
<details>
<summary>X epics completed (Y stories)</summary>

| Epic | Title | Stories |
|------|-------|---------|
| ... | ... | ... |

</details>

## Epic Dependency Matrix

| Epic | Title | Depends On | Dependency Status |
|------|-------|------------|-------------------|
| 2 | User Auth | Epic 1 (Infrastructure) | Pending |
| 5 | Analytics | Epic 2 (Auth) | Pending |

## Worktree Strategy Recommendations
- **Max parallel worktrees**: [recommended number based on dependencies]
- **Critical path**: Epic X → Epic Y → Epic Z
- **Bottleneck epics**: [epics that block the most others]
- **Quick wins**: [small epics that can be completed to unblock others]
```

## Important Notes
- **Epic-level focus**: Treat each epic as an atomic unit for a separate worktree
- Stories within an epic are NOT analyzed for cross-epic parallelization
- Auto-detect context: never require user to specify "mode"
- Sprint status is source of truth for completion (parse slugs: `2-1-foo` → `2.1`)
- Epic is "done" only when ALL its stories are done
- Epic is "in-progress" if ANY story is in-progress
- Done epics are excluded from dependency blocking
- Highlight NEW epics when comparing to prior plan
- Match dependencies by CAPABILITY (epic titles like "Email", "Auth") not epic numbers
- Gracefully skip malformed files with warnings
- Include worktree commands for easy copy-paste
- Identify critical path and bottleneck epics
- Keep output concise but actionable
