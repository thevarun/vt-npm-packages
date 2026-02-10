# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo using npm workspaces, containing two npm packages under the `@torka` namespace:

**Repository**: https://github.com/thevarun/vt-npm-packages

| Package | Description |
|---------|-------------|
| `@torka/claude-workflows` | Claude Code workflow helpers for epic automation, git management, and developer productivity |
| `@torka/claude-qol` | Claude Code quality-of-life improvements: auto-approve hooks, context monitoring |

Each package is a standalone npm module in its own subdirectory with independent versioning.

## Development Commands

Both packages are distribution-only with no build/test/lint steps. The only scripts are:

```bash
# Test installation scripts locally
node vt-claude-workflows/install.js
node vt-claude-workflows/uninstall.js

node vt-claude-qol/install.js
node vt-claude-qol/uninstall.js
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
- Protected user config files: preserved (e.g., `auto_approve_safe.rules.json`)

### Directory Structure

```
vt-npm-packages/
├── package.json                 # Root workspace config (private)
├── UPSTREAM_DEPS.yaml           # Dependency manifest (run /update-self)
├── vt-claude-workflows/         # @torka/claude-workflows package
│   ├── commands/                # Slash commands (markdown)
│   ├── agents/                  # AI agent definitions (markdown)
│   ├── skills/                  # Interactive skill workflows
│   ├── bmad-workflows/          # BMAD Method integration
│   ├── install.js               # Post-install script
│   └── uninstall.js             # Pre-uninstall script
│
└── vt-claude-qol/               # @torka/claude-qol package
    ├── hooks/                   # PreToolUse hooks (Python)
    ├── scripts/                 # Utility scripts (Python)
    ├── commands/                # Slash commands (markdown)
    ├── install.js               # Post-install script
    └── uninstall.js             # Pre-uninstall script
```

### Key Files

**claude-workflows:**
- `install.js` - Copies workflow files to `.claude/`, manages `.gitignore` entries, creates backups when updating
- `.claude-plugin/plugin.json` - Claude Code plugin manifest defining commands, agents, skills
- `commands/*.md` - Slash command definitions (git-local-cleanup-push-pr, plan-parallelization, etc.)
- `skills/designer-founder/` - Multi-step UI/UX design workflow with tools and templates

**claude-qol:**
- `install.js` - Copies QoL files to `.claude/scripts/`, preserves user config files
- `hooks/auto_approve_safe.py` - PreToolUse hook for intelligent command auto-approval
- `scripts/context-monitor.py` - Status line script showing context usage with color-coded warnings
- `commands/*.md` - Slash commands (optimize-auto-approve-hook, docs-quick-update, fresh-eyes)
- `.claude-plugin/plugin.json` - Claude Code plugin manifest defining commands

### Workflow File Format

Workflows are defined as markdown files with:
- YAML frontmatter for metadata (name, description, model)
- Step-based sequential execution
- XML-style workflow markers (`<workflow>`, `<steps>`)
- State tracking via sidecar YAML files for resumption

### Component Dependencies

| Component | Standalone |
|-----------|------------|
| `/git-local-cleanup-push-pr` | Yes |
| `/github-pr-resolve` | Yes |
| `/plan-parallelization` | Yes |
| `/update-self` | Yes (repo-local, not distributed) |
| `/agent-creator` skill | Yes |
| `/designer-founder` skill | Yes |
| `/implement-epic-with-subagents` | Requires BMAD Method |
| `principal-code-reviewer` agent | Requires BMM workflows |
| `story-prep-master` agent | Requires BMM workflows |

### BMAD Integration

BMAD workflows are installed to `_bmad/bmm/workflows/4-implementation/` (separate from the `.claude/` directory).

## Publishing Notes

- **npm 2FA enabled**: Publishing requires 2FA. Do not run `npm publish` directly—inform the user to run it manually with their OTP code.
- **Versioning**: Each package has independent semver versioning in its own `package.json`.
- **Workspaces**: Run `npm install` from root to link packages during development.
- **Pre-publish check**: Run `/update-self` before publishing new package versions to catch stale upstream dependencies.
