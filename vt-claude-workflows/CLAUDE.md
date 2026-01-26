# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@torka/claude-workflows` - an npm package that provides Claude Code workflow helpers for epic automation, git management, code review, and developer productivity. It distributes markdown-based workflow files, commands, agents, and skills that extend Claude Code's capabilities.

## Development Commands

This is a distribution-only package with no build/test/lint steps. The only scripts are:
- `npm run postinstall` - Runs `install.js` to copy workflow files to `.claude/` directory
- `npm run preuninstall` - Runs `uninstall.js` to remove installed files

To test installation locally:
```bash
node install.js          # Test install script
node uninstall.js        # Test uninstall script
```

## Architecture

### Package Distribution Model

The package uses postinstall/preuninstall hooks to copy workflow files to the user's `.claude/` directory:
- **Project-level install**: Files go to `<project>/.claude/`
- **Global install**: Files go to `~/.claude/`
- BMAD workflows are installed to `_bmad/bmm/workflows/4-implementation/`

### Directory Structure

```
├── .claude-plugin/plugin.json   # Claude Code plugin manifest
├── commands/                     # Slash commands (markdown)
├── agents/                       # AI agent definitions (markdown)
├── skills/                       # Interactive skill workflows (markdown + YAML)
├── bmad-workflows/              # BMAD Method integration
├── examples/                     # Configuration templates
├── install.js                    # Post-install script
└── uninstall.js                  # Pre-uninstall script
```

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
| `/agent-creator` skill | Yes |
| `/designer-founder` skill | Yes |
| `/implement-epic-with-subagents` | Requires BMAD Method |
| `principal-code-reviewer` agent | Requires BMM workflows |
| `story-prep-master` agent | Requires BMM workflows |

## Key Files

- **`install.js`**: Handles file copying to `.claude/` with non-destructive behavior (creates backups when updating, manages `.gitignore` entries)
- **`uninstall.js`**: Cleans up installed files and empty directories
- **`.claude-plugin/plugin.json`**: Defines all commands, agents, skills, and hooks for Claude Code
- **`commands/git-local-cleanup-push-pr.md`**: Local git cleanup, push, and PR creation
- **`commands/github-pr-resolve.md`**: PR lifecycle with review comment handling
- **`bmad-workflows/`**: Contains the epic orchestration workflow with state management

## Conventions

- **Commits**: Use Conventional Commits format (feat:, fix:, chore:)
- **Versioning**: Semantic versioning
- **Markdown**: Primary format for all workflow definitions
- **State files**: YAML format for workflow state persistence

## Project Notes

- **No Git remote**: This project has no Git remote configured. Do not attempt to push commits.
- **npm 2FA enabled**: npm publish requires 2FA. Do not run `npm publish` directly - inform the user to run it manually in their terminal with the OTP code.
