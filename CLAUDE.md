# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

**vt-spells** is a Claude Code toolkit for solo developers who want team-speed productivity. At the moment, it ships as two npm packages under the `@torka` namespace that install slash commands, agents, skills, and hooks into any project's `.claude/` directory.

**Repository**: https://github.com/thevarun/vt-spells

| Package | Version | Description |
|---------|---------|-------------|
| `@torka/claude-workflows` | 0.13.1 | Commands, agents, and skills for epic automation, git management, story execution, and design workflows |
| `@torka/claude-qol` | 0.4.5 | Auto-approve hooks, context monitoring, session analysis, and workflow optimization |

Each package is a standalone npm module in its own subdirectory with independent versioning.

## Development Commands

Both packages are distribution-only with no build/test/lint steps. The only scripts are:

```bash
# Test installation scripts locally
node npm-claude-workflows/install.js
node npm-claude-workflows/uninstall.js

node npm-claude-qol/install.js
node npm-claude-qol/uninstall.js
```

## Architecture

### Package Distribution Model

Both packages use postinstall/preuninstall hooks to copy files to the user's `.claude/` directory:
- **Project-level install**: Files go to `<project>/.claude/`
- **Global install**: Files go to `~/.claude/`

The install scripts handle:
- New files: copied
- Changed files: backed up (`.backup`), then updated
- Identical files: skipped (no-op)
- Protected user config files: preserved (see `PROTECTED_FILES` arrays in each `install.js`)

Protected files (never overwritten):
- `claude-workflows`: `vt-preferences.md`
- `claude-qol`: `auto_approve_safe.rules.json`, `nash-learnings.md`

### Directory Structure

```
vt-spells/
├── package.json                 # Root workspace config (private)
├── UPSTREAM_DEPS.yaml           # Dependency manifest (run /update-self)
├── npm-claude-workflows/        # @torka/claude-workflows
│   ├── .claude-plugin/
│   │   └── plugin.json          # Plugin manifest (commands, agents, skills, hooks, statusLine)
│   ├── commands/                # Slash commands (7 markdown files)
│   ├── agents/                  # Agent definitions (3 markdown files)
│   ├── skills/
│   │   ├── agent-creator/       # Sub-agent creation skill
│   │   │   └── expertise/       # Domain expertise profiles
│   │   ├── designer-founder/    # UI/UX design workflow
│   │   │   ├── steps/           # Multi-step workflow files
│   │   │   ├── templates/       # Design artifact templates
│   │   │   └── tools/           # Tool integrations (Stitch, SuperDesign, etc.)
│   │   ├── product-architect/   # PRD + Architecture skill
│   │   │   ├── agents/          # PM and Architect agent definitions
│   │   │   └── references/      # Escalation guide
│   │   ├── deep-audit/          # Multi-agent codebase audit
│   │   │   ├── agents/          # 11 audit agent prompt files (incl. consolidate-and-triage)
│   │   │   ├── shared-agent-instructions.md  # Output format, confidence rules, tool guidelines
│   │   │   └── templates/       # Report, findings, agent-output, state, and theme-generator templates
│   │   └── fix-audit-findings/  # Execute refactoring themes from deep-audit
│   │       ├── steps/           # 4-step workflow (plan, continue, execute, complete)
│   │       └── templates/       # Enrichment, implementation, fix, and theme-generator prompts
│   ├── bmad-workflows/          # BMAD Method integration
│   ├── examples/
│   │   └── settings.local.example.json
│   ├── install.js
│   └── uninstall.js
│
├── npm-claude-qol/              # @torka/claude-qol
│   ├── .claude-plugin/
│   │   └── plugin.json          # Plugin manifest (commands, skills)
│   ├── scripts/
│   │   ├── auto_approve_safe.py           # PreToolUse auto-approve hook
│   │   ├── auto_approve_safe.rules.json   # User-customizable approve rules
│   │   ├── auto_approve_safe_rules_check.py  # Rules linter/validator
│   │   └── context-monitor.py             # Status line script
│   ├── commands/                # Slash commands (3 markdown files)
│   ├── skills/
│   │   └── nash/                # Session transcript analysis skill
│   │       ├── SKILL.md
│   │       ├── OPUS-ANALYSIS-PROMPT.md
│   │       ├── prune_transcript.py
│   │       ├── nash-learnings.md
│   │       ├── nash-sources.example.yaml
│   │       └── tmp/             # Temp dir for pruned transcripts
│   ├── examples/
│   │   └── settings.local.example.json
│   ├── install.js
│   └── uninstall.js
│
└── oz-skills/                   # Autonomous Warp Oz skills (not npm-distributed)
    ├── weekly-analyst/          # Weekly session analysis + improvement reports
    │   ├── SKILL.md             # 11-phase autonomous workflow
    │   ├── analysis-framework.md
    │   ├── scripts/             # extract_sessions.py, summarize_session.py, prune_transcript.py
    │   ├── templates/           # weekly-report.md template
    │   ├── memory/              # Persistent learnings (user-profile, insights, backlog, digests)
    │   └── reports/             # Weekly analysis output
    ├── knowledge-curator/       # Weekly NotebookLM curation
    │   ├── SKILL.md             # 10-phase workflow with 20-min budget
    │   └── memory/              # source-registry.yaml, curation-log.md
    └── nlm-skill/               # NotebookLM CLI reference
        └── SKILL.md
```

### Component Inventory

**Commands (10 distributed + 1 repo-local)**

| Command | Package | Description | Dependencies |
|---------|---------|-------------|--------------|
| `/git-local-cleanup-push-pr` | workflows | Branch cleanup, push changes, create PRs | Standalone |
| `/github-pr-resolve` | workflows | Process, fix, and merge open PRs | Standalone |
| `/plan-parallelization` | workflows | Identify epics that can run in parallel Git worktrees | Standalone |
| `/implement-epic-with-subagents` | workflows | Orchestrate sub-agents to execute all stories in an epic | BMAD Method |
| `/dev-story-backend` | workflows | TDD backend story executor (red-green-refactor) | Standalone |
| `/dev-story-fullstack` | workflows | Hybrid fullstack story executor (auto-detects UI vs backend) | Standalone |
| `/dev-story-ui` | workflows | Design-first UI story executor with screenshot validation | Standalone |
| `/optimize-auto-approve-hook` | qol | Analyze auto-approve decisions, identify safe patterns | Standalone |
| `/docs-quick-update` | qol | Detect code changes, suggest targeted doc updates | Standalone |
| `/fresh-eyes` | qol | Mid-session fresh-eyes review using an Opus subagent | Standalone |
| `/update-self` | _(repo-local)_ | Scan upstream deps for staleness, propose changes | Not distributed |

**Skills (6)**

| Skill | Package | Description | Dependencies |
|-------|---------|-------------|--------------|
| `/agent-creator` | workflows | Create custom Claude Code sub-agents with expertise profiles | Standalone |
| `/designer-founder` | workflows | Transform ideas into dev-ready frontend artifacts (multi-step) | Standalone |
| `/product-architect` | workflows | Agent team (PM + Architect) creates PRD + Architecture from notes | BMAD Method |
| `/deep-audit` | workflows | Multi-agent codebase audit with finding triage and theme-based reporting. Supports `--agent <name>` for single-agent runs. Serena MCP-aware. | Standalone |
| `/fix-audit-findings` | workflows | Execute refactoring themes from a deep-audit with sub-agent orchestration | Standalone (reads `_bmad-output/deep-audit/`) |
| `/nash` | qol | Review session transcripts to extract learnings and improve workflows | `~/.claude/nash-sources.yaml` |

**Agents (3)**

| Agent | Package | Description | Dependencies |
|-------|---------|-------------|--------------|
| `principal-code-reviewer` | workflows | Expert-level code review after completing stories | BMAD Method workflows |
| `story-prep-master` | workflows | Create, refine, prepare user stories for development | BMAD Method workflows |
| `desk-check-gate` | workflows | Visual quality gate for UI stories (blocks on major issues) | Standalone |

**Scripts/Hooks (4)**

| Script | Package | Description |
|--------|---------|-------------|
| `auto_approve_safe.py` | qol | PreToolUse hook: intelligent command auto-approval with pattern matching |
| `auto_approve_safe.rules.json` | qol | User-customizable rules for auto-approve (protected file) |
| `auto_approve_safe_rules_check.py` | qol | Linter/validator for rules.json |
| `context-monitor.py` | qol | Status line: real-time context usage with color-coded warnings |

**Oz Skills (3)** — Autonomous skills that run on Warp Oz (cloud), not distributed via npm

| Skill | Schedule | Description |
|-------|----------|-------------|
| `weekly-analyst` | Weekly (Mon 10 AM) | Analyzes Claude Code session data, detects patterns/friction, researches improvements, produces reports with persistent memory |
| `knowledge-curator` | Weekly | Maintains Agentic Engineering NotebookLM notebook — researches sources, evaluates quality, manages 40-source limit |
| `nlm-skill` | Reference only | NotebookLM CLI usage rules and command reference (not an autonomous skill) |

### Cross-Package Dependencies

The `claude-workflows` plugin.json declares `hooks` (PreToolUse: `auto_approve_safe.py`) and `statusLine` (`context-monitor.py`) — but these scripts are distributed by the `claude-qol` package. Both packages should typically be installed together for full functionality.

If only `claude-workflows` is installed, hooks and statusLine entries in its plugin.json will have no effect (the referenced scripts won't exist).

### Configuration

**Example settings files** — both packages include `examples/settings.local.example.json`:
- `claude-qol` example: PreToolUse hook, PostToolUse auto-format (eslint/prettier), Stop notifications, statusLine
- `claude-workflows` example: basic git/npm permission allow-list

**Nash global config**: `~/.claude/nash-sources.yaml` — installed from `nash-sources.example.yaml` on first install if it doesn't exist. User edits paths for their setup.

### External Skill Auto-Installation

During `claude-workflows` postinstall, `install.js` runs `npx skills add` for two external skills:
1. **react-best-practices** from `vercel-labs/agent-skills` — 57 React/Next.js performance rules
2. **react-components** from `google-labs-code/stitch-skills` — HTML-to-React conversion for Stitch

Both are non-blocking on failure (catches errors, prints manual install instructions). Tracked in `UPSTREAM_DEPS.yaml`.

### Workflow File Format

Workflows are defined as markdown files with:
- YAML frontmatter for metadata (name, description, model)
- Step-based sequential execution
- XML-style workflow markers (`<workflow>`, `<steps>`)
- State tracking via sidecar YAML files for resumption

### BMAD Integration

BMAD workflows are installed to `_bmad/bmm/workflows/4-implementation/` (separate from the `.claude/` directory).

## Adding New Components

### Adding a Command

1. Create `commands/<name>.md` in the package directory
2. Register in `.claude-plugin/plugin.json` → `commands` array
3. Add `'commands/<name>.md'` to `install.js` → `gitignoreEntries` array
4. Add `'<name>.md'` to `uninstall.js` → `INSTALLED_FILES.commands` array
5. Update Component Inventory in this file

### Adding a Skill

1. Create `skills/<name>/SKILL.md` (+ supporting files) in the package directory
2. Register in `.claude-plugin/plugin.json` → `skills` array
3. Add `'skills/<name>/'` to `install.js` → `gitignoreEntries` array
4. Add file entries to `uninstall.js` → `INSTALLED_FILES` under `'skills/<name>'` key
5. Update Component Inventory in this file

### Adding an Agent

1. Create `agents/<name>.md` in the package directory
2. Register in `.claude-plugin/plugin.json` → `agents` array
3. Add `'agents/<name>.md'` to `install.js` → `gitignoreEntries` array
4. Add `'<name>.md'` to `uninstall.js` → `INSTALLED_FILES.agents` array
5. Update Component Inventory in this file

### Adding a Script (QoL)

1. Create `scripts/<name>.py` in the package directory
2. Add `'scripts/<name>.py'` to `install.js` → `gitignoreEntries` array
3. Add `'<name>.py'` to `uninstall.js` → `INSTALLED_FILES.scripts` array
4. If user-customizable, add filename to `PROTECTED_FILES` array in `install.js`
5. Update Component Inventory in this file

## Publishing Notes

- **npm 2FA enabled**: Publishing requires 2FA. Do not run `npm publish` directly — inform the user to run it manually with their OTP code.
- **Versioning**: Each package has independent semver versioning in its own `package.json`.
- **Version skew**: `plugin.json` versions are NOT synced with `package.json` (e.g., workflows plugin.json 0.1.0 vs package.json 0.13.0). `package.json` is the npm source of truth; only bump that for releases.
- **Workspaces**: Run `npm install` from root to link packages during development.
- **Pre-publish check**: Run `/update-self` before publishing new package versions to catch stale upstream dependencies.
