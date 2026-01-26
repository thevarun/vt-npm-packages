# @torka/claude-workflows

Claude Code workflow helpers for epic automation, git management, and developer productivity.

## Features

| Feature | Description | Standalone |
|---------|-------------|------------|
| **Git Cleanup & Merge** | Intelligent branch management, PR creation, CI monitoring | Yes |
| **Parallelization Analysis** | Identify which epics can run in parallel with Git worktrees | Yes |
| **Agent Creator** | Design and deploy custom Claude Code agents | Yes |
| **Designer-Founder** | Transform ideas into dev-ready frontend artifacts | Yes |
| **Epic Orchestration** | Automate multi-story epic execution with sub-agents | Requires BMAD |
| **Code Review Agent** | Principal-level code review automation | Requires BMM |
| **Story Prep Agent** | Convert requirements to developer-ready specs | Requires BMM |

## Installation

### Project-level (recommended)

```bash
npm install --save-dev @torka/claude-workflows
```

### Global

```bash
npm install -g @torka/claude-workflows
```

The installer automatically copies files to your `.claude/` directory:
- **Project-level**: Files go to `<project>/.claude/`
- **Global**: Files go to `~/.claude/`

## Post-Installation Setup

After installation, try running one of the commands to test:

```bash
/git-cleanup-and-merge
/plan-parallelization
/designer-founder
```

## Usage

### Commands

#### `/git-cleanup-and-merge`

Comprehensive git branch management workflow:
- Analyzes all branches (merged, diverged, orphaned)
- Handles Git worktrees correctly
- Pushes unpushed commits
- Creates PRs for unpushed branches
- Waits for CI to pass
- Merges approved PRs
- Cleans up merged branches

```
/git-cleanup-and-merge
```

#### `/plan-parallelization`

Analyzes epic files to identify parallelization opportunities:
- Detects epic-to-epic dependencies
- Groups epics into execution phases
- Generates worktree commands for parallel execution
- Tracks progress against sprint status

```
/plan-parallelization
```

#### `/implement-epic-with-subagents`

> **Requires BMAD Method**

Orchestrates sub-agents to execute all stories in an epic sequentially with minimal intervention.

```
/implement-epic-with-subagents
```

### Agents

#### `principal-code-reviewer`

> **Requires BMM `/code-review` workflow**

Expert-level code review agent. Launch after completing code to validate:
- Code quality and correctness
- Test coverage
- Architecture compliance
- Security and performance

#### `story-prep-master`

> **Requires BMM `/create-story` workflow**

Converts product requirements into developer-ready specifications:
- Breaks down epics into actionable stories
- Ensures completeness with acceptance criteria
- Creates story files ready for development

### Skills

#### `/agent-creator`

Design and deploy custom Claude Code agents:
- Step-by-step agent creation workflow
- Templates for story-based and non-story agents
- Registry system for tracking created agents
- Community repository research guidance

```
/agent-creator
```

#### `/designer-founder`

Transform design ideas into production-ready frontend artifacts:
- UI/UX design workflow optimized for solo developers
- Component-first approach using shadcn/ui + Tailwind CSS
- Multiple design tools: wireframes, MagicPatterns, SuperDesign
- Dev-ready output: component strategies, layouts, user journeys

**Philosophy:**
- Library-first: Start from "what existing component can I use?"
- Decision-focused: Capture choices, not specifications
- Speed over perfection: Working prototype beats perfect mockup

```
/designer-founder
```

## Dependencies

Some components require the [BMAD Method](https://github.com/bmad-method) workflows:

| Component | Dependency |
|-----------|------------|
| `implement-epic-with-subagents` | `@_bmad/bmm/workflows/` |
| `principal-code-reviewer` | BMM `/code-review` workflow |
| `story-prep-master` | BMM `/create-story` workflow |

**Standalone components** (no external dependencies):
- `/git-cleanup-and-merge`
- `/plan-parallelization`
- `/agent-creator` skill
- `/designer-founder` skill

## File Structure

After installation, files are placed in:

```
.claude/
├── commands/
│   ├── implement-epic-with-subagents.md
│   ├── plan-parallelization.md
│   └── git-cleanup-and-merge.md
├── agents/
│   ├── principal-code-reviewer.md
│   └── story-prep-master.md
└── skills/
    ├── agent-creator/
    │   ├── SKILL.md
    │   ├── REGISTRY.yaml
    │   ├── STORY-AGENT-TEMPLATE.md
    │   ├── NON-STORY-AGENT-TEMPLATE.md
    │   └── COMMUNITY-REPOS.md
    └── designer-founder/
        ├── workflow.md
        ├── steps/
        ├── templates/
        └── tools/
```

## Uninstallation

```bash
npm uninstall @torka/claude-workflows
```

**Manual cleanup** (if files remain after uninstall):

```bash
# Remove installed files
rm -rf .claude/commands/implement-epic-with-subagents.md \
       .claude/commands/plan-parallelization.md \
       .claude/commands/git-cleanup-and-merge.md \
       .claude/agents/principal-code-reviewer.md \
       .claude/agents/story-prep-master.md \
       .claude/skills/agent-creator \
       .claude/skills/designer-founder
```

## Customization

### Creating Custom Agents

Use the `/agent-creator` skill to create project-specific agents:

1. Run `/agent-creator`
2. Follow the 5-step workflow
3. Agents are saved to `.claude/agents/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Varun Torka

## Links

- [Claude Code Documentation](https://code.claude.com/docs)
- [npm Package](https://www.npmjs.com/package/@torka/claude-workflows)
