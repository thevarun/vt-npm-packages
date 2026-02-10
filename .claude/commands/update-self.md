---
description: 'Scan upstream dependencies for staleness, check for updates, and propose changes'
---

# Update Self

You are a dependency maintenance assistant for this monorepo. Your job is to scan all `vt-*/` package directories for external dependencies, check them against `UPSTREAM_DEPS.yaml`, detect upstream changes, and help the user keep workflows current.

## Overview

Single invocation, no flags. Runs everything automatically, only pauses for user decisions.

This command auto-discovers package directories by globbing `vt-*/` at the repo root — future packages are picked up automatically.

---

## Workflow Phases

<steps>

### Phase 0: Pre-flight

1. **Find the manifest**
   - Locate `UPSTREAM_DEPS.yaml` at the git root (`git rev-parse --show-toplevel`)
   - If missing: create a starter template with `schema_version: 1`, empty `dependencies: []`, and today's date — then **STOP** with message:
     ```
     Created starter UPSTREAM_DEPS.yaml at repo root.
     Populate it with your dependencies, then run /update-self again.
     ```

2. **Check `gh` CLI availability**
   - Run `gh auth status` to verify authentication
   - If `gh` is not installed or not authenticated: warn "GitHub checks will be skipped — only date-based staleness will be used." Continue execution.

3. **Show pre-flight summary:**
   ```
   UPDATE-SELF
   ===========
   Manifest: UPSTREAM_DEPS.yaml (schema v{version})
   Total deps: {count}
   Last full check: {last_full_check} ({N} days ago)
   GitHub API: {available | unavailable}
   Package dirs: {list of vt-*/ dirs found}
   ```

### Phase 1: Auto-detect Dependency Changes

Scan all `vt-*/` package source directories (NOT `.claude/` or `_bmad/` installed copies) to find current dependencies and compare against the manifest.

**Scan techniques:**

| What | How | Where |
|------|-----|-------|
| MCP tools (by call) | Grep for `mcp__(\w+)__` → extract unique server names from capture group | `vt-*/**/*.md` |
| MCP tools (by name) | Grep for `(\w+)\s+MCP` → extract tool names | `vt-*/**/*.md` |
| External skills | Grep for `npx skills add` or `npx @anthropic-ai/skills` | `vt-*/install.js`, `vt-*/**/*.md` |
| Peer dependencies | Parse `peerDependencies` from JSON | `vt-*/package.json` |
| Community repos | Grep for `github.com/` URLs | `vt-*/**/COMMUNITY-REPOS.md` |
| Claude Code API surfaces | Grep for `PreToolUse`, `PostToolUse`, `status_line`, `plugin.json` | `vt-*/**/*.py`, `vt-*/**/*.json`, `vt-*/**/*.md` |
| BMAD references | Grep for `bmad` or `BMAD` | `vt-*/**/*.md`, `vt-*/**/*.js` |

**For each existing dep in the manifest:** auto-update its `local_files` array with the files where it's referenced. Use relative paths from repo root.

**If new deps are found** that don't match any manifest entry:
- Show list of unrecognized deps
- Use `AskUserQuestion` to confirm: "Add these as new dependencies?" with options for each

**If manifest deps have zero `local_files` after scan** (no longer referenced):
- Show list of orphaned deps
- Use `AskUserQuestion` to confirm: "Remove these stale dependencies?" with options for each

Update `UPSTREAM_DEPS.yaml` with any confirmed additions/removals and the refreshed `local_files`.

### Phase 2: Check Upstream

For each dependency, use the best available check method:

| Has `upstream.github`? | Has `upstream.npm`? | Action |
|---|---|---|
| Yes | — | `gh api repos/{owner}/{repo}/releases/latest` for latest release; `gh api repos/{owner}/{repo}/commits?per_page=5` for recent activity |
| — | Yes | `npm view {package} version` for latest published version |
| No | No | Flag as **STALE** if `verified.date` is > 30 days ago |

**Rate limits:** Maximum 20 `gh api` calls total across all deps. If a `gh api` call fails (404, rate limit), fall back to date-based check for that dep.

**Classify each dep:**
- **[CHANGED]** — new release or significant commits since `verified.version`
- **[STALE]** — no check method available AND > 30 days since last review
- **[OK]** — checked, no changes detected

For **[OK]** deps: silently update `verified.date` to today in the manifest.

### Phase 3: Staleness Report

Show a summary report grouped by status:

```
UPDATE-SELF REPORT
===================
[CHANGED] {dep name} — {old version} → {new version} ({release date})
  Local files: {comma-separated list}

[STALE] {dep name} — {N} days since last review
  Local files: {comma-separated list}

[OK] {count} other deps — no changes detected

Summary: {changed} changed | {stale} stale | {ok} ok
```

If everything is **[OK]**: update `last_full_check` to today, save manifest, skip to Phase 5.

### Phase 4: Analyze Changes & Propose Updates

For each **[CHANGED]** or **[STALE]** dep, launch a **sub-agent** (using the Task tool with `subagent_type: general-purpose`) to analyze it. Launch multiple sub-agents in **parallel** when there are multiple deps to analyze.

**Each sub-agent receives this prompt (fill in the placeholders):**

> You are analyzing upstream changes for a dependency used in local workflow files.
>
> **Dependency:** {dep name}
> **Type:** {dep type}
> **Risk:** {dep risk}
> **Status:** {CHANGED: old_version → new_version | STALE: N days}
> **Upstream GitHub:** {upstream.github or "none"}
> **Upstream npm:** {upstream.npm or "none"}
> **Upstream URL:** {upstream.url or "none"}
> **API surfaces we depend on:** {surfaces list or "none specified"}
> **Local files using this dep:** {local_files list}
>
> ## Your Tasks
>
> 1. **Research upstream changes:**
>    - If GitHub repo is available: use `gh api` to fetch release notes, recent commits
>    - Use WebSearch for "{dep name} changelog", "{dep name} breaking changes {new version}", "{dep name} new features {new version}"
>    - If upstream URL is available: use WebFetch to check docs/changelog
>    - Maximum 3 web searches per dep
>
> 2. **Read all affected local files** listed above (use the Read tool)
>
> 3. **Cross-reference** upstream changes against local usage. Classify each finding:
>    - **BREAKING** — will cause failures or incorrect behavior in our files
>    - **ENHANCEMENT** — new capabilities we could leverage to improve our workflows
>    - **NO IMPACT** — changed upstream but our usage is unaffected
>
> 4. **For BREAKING and ENHANCEMENT findings:** propose specific changes with:
>    - File path
>    - What to change and why
>    - Suggested code/content (if applicable)
>
> 5. **Suggest new capabilities** — if upstream added features that could improve our workflows, describe the opportunity
>
> ## Output Format
>
> Return your analysis in this exact format:
>
> ```
> [CHANGED|STALE] {dep name} ({version info})
>   Source: {where you found the info}
>
>   BREAKING:
>     {file path}
>       {description of issue}
>       → {proposed fix}
>
>   ENHANCEMENT:
>     {file path}
>       {description of opportunity}
>       → {proposed change}
>
>   NEW CAPABILITIES:
>     {feature name}
>       → Opportunity: {how we could use it}
>
>   NO IMPACT:
>     {file path} — {reason it's unaffected}
> ```
>
> If no BREAKING, ENHANCEMENT, or NEW CAPABILITIES found, say so explicitly.
>
> ## Rules
> - Do NOT edit any files. This is research only.
> - Maximum 3 WebSearch calls and 3 gh api calls.
> - Be specific — reference exact file paths and line numbers when possible.

**After all sub-agents complete**, aggregate results and display:

```
PROPOSED CHANGES
=================

{sub-agent output for dep 1}

{sub-agent output for dep 2}

Summary: {breaking} breaking | {enhancements} enhancements | {new capabilities} new capability opportunities
```

**If there are actionable findings (BREAKING, ENHANCEMENT, or NEW CAPABILITIES):**

Use `AskUserQuestion` with `multiSelect: true`:
```
header: "Apply"
question: "Which changes should be applied?"
options:
  - label: "All breaking changes"
    description: "Apply fixes for breaking upstream changes"
  - label: "All enhancements"
    description: "Apply improvements from new upstream features"
  - label: "All new capability suggestions"
    description: "Implement suggested new capabilities"
  - label: "None — I'll handle manually"
    description: "Skip all changes, just update the manifest"
```

**For approved changes:** Launch sub-agent(s) to make the edits (one sub-agent per dep, parallel when possible). Each sub-agent reads the file, makes the edit, and verifies correctness.

**If no actionable findings:** Skip the question and proceed to Phase 5.

### Phase 5: Mark Reviewed

**If there were CHANGED or STALE deps:**

Use `AskUserQuestion` with `multiSelect: true`:
```
header: "Reviewed"
question: "Which dependencies are now up to date?"
options:
  - label: "{dep name} ({version})"
    description: "Mark as reviewed at {version}"
  ... (one option per CHANGED/STALE dep)
  - label: "None yet — I'll review later"
    description: "Skip — these will show up again next run"
```

For selected deps: update `verified.date` to today and `verified.version` to the latest version found.

**Always (regardless of status):**
- Update `last_full_check` to today
- Save `UPSTREAM_DEPS.yaml`

**Final output:**
```
UPDATE-SELF COMPLETE
====================
Manifest updated: UPSTREAM_DEPS.yaml
Last full check: {today}
Deps checked: {total}
Changes applied: {count or "none"}
Next action: {suggestion based on findings}
```

</steps>

---

## Safety Rules

**CRITICAL — These rules must NEVER be violated:**

1. **Always modifies `UPSTREAM_DEPS.yaml`** — manifest sync, `local_files` refresh, date bumps are automatic
2. **NEVER modifies workflow/hook/command files** without explicit user approval in Phase 4
3. **Maximum API calls per run:** 20 `gh api` calls + 5 web searches (across all sub-agents combined)
4. **Always confirms before adding/removing deps** from the manifest (Phase 1)
5. **Always confirms before editing any non-manifest file** (Phase 4)
6. **Scans only `vt-*/` source directories** — never `.claude/` or `_bmad/` installed copies

---

## Error Handling

| Scenario | Action |
|----------|--------|
| `UPSTREAM_DEPS.yaml` missing | Create starter template, stop |
| `gh` CLI not available | Warn, continue with date-based staleness |
| `gh api` rate limited | Fall back to date-based check for remaining deps |
| `gh api` returns 404 | Skip that dep's GitHub check, use date-based |
| `npm view` fails | Skip that dep's npm check, use date-based |
| No `vt-*/` directories found | Stop with error: "No package directories found" |
| Sub-agent times out | Report partial results, continue with other deps |
| WebSearch returns no results | Note "no upstream info found", classify as STALE |

---

## Scan Pattern Reference

These are the exact patterns used to detect dependencies in Phase 1:

```
# MCP tool calls — extract server name from capture group 1
Pattern: mcp__(\w+)__
Files:   vt-*/**/*.md

# MCP tool mentions by name — matches "Playwright MCP", "Serena MCP", etc.
Pattern: (\w+)\s+MCP
Files:   vt-*/**/*.md

# External skill installs
Pattern: npx\s+(skills\s+add|@anthropic-ai/skills)
Files:   vt-*/install.js, vt-*/**/*.md

# Peer dependencies
Method:  JSON parse peerDependencies
Files:   vt-*/package.json

# Community repos
Pattern: github\.com/[\w-]+/[\w-]+
Files:   vt-*/**/COMMUNITY-REPOS.md

# Claude Code API surfaces
Pattern: PreToolUse|PostToolUse|status.line|plugin\.json|\.claude-plugin
Files:   vt-*/**/*.py, vt-*/**/*.json, vt-*/**/*.md
```

---

## Dependency Matching Rules

When matching scan results to manifest entries, use these rules:

| Scan Result | Matches Manifest Entry |
|-------------|----------------------|
| `mcp__playwright__*` | "Playwright MCP" |
| `mcp__shadcn__*` | "shadcn MCP" |
| `mcp__context7__*` | "Context7 MCP" |
| `mcp__stitch__*` | "Stitch MCP" |
| `mcp__magicpatterns__*` | "MagicPatterns MCP" |
| `mcp__claude-in-chrome__*` | "Chrome MCP" |
| `Serena MCP` (name match) | "Serena MCP" |
| `npx skills add vercel-labs/agent-skills` | "Vercel react-best-practices" |
| `npx skills add google-labs-code/stitch-skills` | "Google stitch-skills" |
| `peerDependencies.bmad-method` | "BMAD Method" |
| `PreToolUse` / `PostToolUse` / `status_line` / `plugin.json` | "Claude Code API" |
| `github.com/` URLs in COMMUNITY-REPOS.md | "Community agent repos" |

---

## Example Session

```
User: /update-self

Claude:
UPDATE-SELF
===========
Manifest: UPSTREAM_DEPS.yaml (schema v1)
Total deps: 12
Last full check: 2026-02-10 (0 days ago)
GitHub API: available
Package dirs: vt-claude-workflows/, vt-claude-qol/

[Scanning vt-*/ directories for dependencies...]

Scan complete. 12 deps matched, 0 new, 0 orphaned.
Updated local_files for all deps.

[Checking upstream for 12 dependencies...]

UPDATE-SELF REPORT
===================
[CHANGED] Claude Code API — v1.0.31 → v1.1.0 (2026-02-05)
  Local files: auto_approve_safe.py, context-monitor.py, plugin.json (x2)

[STALE] MagicPatterns MCP — 45 days since last review
  Local files: designer-founder/tools/magicpatterns.md

[OK] 10 other deps — no changes detected

Summary: 1 changed | 1 stale | 10 ok

[Launching analysis sub-agents...]

PROPOSED CHANGES
=================

[CHANGED] Claude Code API (v1.0.31 → v1.1.0)
  Source: https://github.com/anthropics/claude-code/releases/tag/v1.1.0

  BREAKING:
    vt-claude-qol/scripts/context-monitor.py
      Line 15: context_window payload now includes `cache_creation` field
      → Update token calculation to include cache_creation

  NEW CAPABILITIES:
    PostToolUse hooks now available
      → Opportunity: add hook to auto-log tool execution stats

  NO IMPACT:
    vt-claude-qol/hooks/auto_approve_safe.py — forward-compatible

[STALE] MagicPatterns MCP (45 days)
  Source: web search

  ENHANCEMENT:
    vt-claude-workflows/skills/designer-founder/tools/magicpatterns.md
      create_design now supports `style` parameter
      → Document new style param, add usage example

Summary: 1 breaking | 1 enhancement | 1 new capability opportunity

[Question] Which changes should be applied?
> All breaking changes, All enhancements

[Applying changes...]
✓ Updated context-monitor.py token calculation
✓ Updated magicpatterns.md with style parameter docs

[Question] Which dependencies are now up to date?
> Claude Code API (v1.1.0), MagicPatterns MCP

UPDATE-SELF COMPLETE
====================
Manifest updated: UPSTREAM_DEPS.yaml
Last full check: 2026-02-10
Deps checked: 12
Changes applied: 2
Next action: Consider implementing PostToolUse hook for tool stats logging
```
