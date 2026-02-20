# @torka/claude-qol

Claude Code quality-of-life improvements: auto-approve hooks, context monitoring, and workflow optimization.

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Approve Hook** | Intelligent command auto-approval for solo dev workflows |
| **Context Monitor** | Real-time context usage status line with visual indicators |
| **Completion Notifications** | Desktop notifications + sound when tasks complete |
| **Optimize Command** | Analyze auto-approve decisions and refine rules |
| **Fresh Eyes Review** | Mid-session fresh-eyes review using an Opus subagent |
| **Docs Quick Update** | Detect code changes and suggest targeted documentation updates |
| **Nash** | Session transcript analysis to extract learnings and optimize workflows |

## Installation

### Project-level (recommended)

```bash
npm install --save-dev @torka/claude-qol
```

### Global

```bash
npm install -g @torka/claude-qol
```

The installer automatically copies files to your `.claude/` directory:
- **Project-level**: Files go to `<project>/.claude/`
- **Global**: Files go to `~/.claude/`

## Recommended Placement

Some features work best at user-level (`~/.claude/settings.json`), while others are project-specific:

| Feature | Recommended Level | Why |
|---------|------------------|-----|
| **Status Line** | User-level | Universally useful; gracefully degrades (no git = no branch shown). Projects can override. |
| **Notifications** | User-level | You always want to know when tasks finish. Don't also define at project level — hooks stack, causing double notifications. |
| **Auto-Approve Hook** | Project-level | Rules are project-specific. Uses `$CLAUDE_PROJECT_DIR` to find rules file. |

## Post-Installation Setup

### 1. Configure Auto-Approve Hook (recommended)

Add to your `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Read|Grep|Glob|Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/scripts/auto_approve_safe.py"
          }
        ]
      }
    ]
  }
}
```

### 2. Configure Status Line (recommended)

Add to your `.claude/settings.local.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/scripts/context-monitor.py"
  }
}
```

This shows a real-time context usage bar with percentage and warnings.

### 3. Completion Notifications (recommended)

Get notified when Claude Code finishes a task:

```json
{
  "hooks": {

    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/Sounds/Glass.aiff"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/Sounds/Glass.aiff"
          }
        ]
      }
    ]
  }
}
```

**Platform support:**
- macOS: Native notifications via `osascript` + sound via `afplay`
- Linux: Desktop notifications via `notify-send`

## Components

### Auto-Approve Hook

PreToolUse hook that intelligently auto-approves safe commands:

**Allowed by default:**
- Read-only commands (`ls`, `cat`, `head`, `tail`, `tree`)
- Git read operations (`git status`, `git diff`, `git log`, `git branch`)
- Development commands (`npm test`, `npm run build`, `pnpm test`, `pytest`)
- Search tools (`grep`, `rg`, `find`, `fd`, `jq`)
- File system operations (`mkdir`, `touch`, `cp`, `mv`)
- Git write operations (`git add`, `git commit`, `git push`)
- GitHub CLI (`gh pr`, `gh issue`, `gh repo`)

**Denied automatically:**
- Dangerous commands (`sudo`, `rm -rf`, `mkfs`, `shutdown`)
- System modifications (`chmod 777`, `chown :* /`)
- Pipe to shell (`curl | bash`, `wget | sh`)
- Fork bombs and kill commands

**Prompted (normal permission system):**
- Everything else defers to Claude Code's built-in permissions

#### Customizing Rules

Edit `.claude/scripts/auto_approve_safe.rules.json`:

```json
{
  "allow_patterns": [
    "^your-custom-safe-command"
  ],
  "deny_patterns": [
    "^your-dangerous-command"
  ],
  "sensitive_paths": [
    "\\.secret$"
  ]
}
```

#### Auto-approving non-Bash tools

The auto-approve hook handles `Bash`, `Read`, `Write`, `Edit`, `Grep`, and `Glob` tools.
For other tools (WebSearch, WebFetch, MCP tools like Playwright), use Claude Code's
built-in permission system by adding them to your `settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "WebFetch",
      "mcp__playwright__*",
      "mcp__context7__*",
      "mcp__stitch__*"
    ]
  }
}
```

This is faster than routing through the hook (zero latency) and works for any tool type.
See `examples/settings.local.example.json` for a complete example.

#### Rules Lint (optional)

Check for invalid, duplicate, or dead patterns in the hook rules:

```bash
python3 npm-claude-qol/scripts/auto_approve_safe_rules_check.py
```

By default this checks `npm-claude-qol/scripts/auto_approve_safe.rules.json`. To lint the installed copy, pass it explicitly:

```bash
python3 npm-claude-qol/scripts/auto_approve_safe_rules_check.py .claude/scripts/auto_approve_safe.rules.json
```

### Context Monitor

Status line script showing:
- Current model name (e.g., `[Claude Opus 4]`)
- Working directory
- Git branch with visual indicator
- Context usage bar with percentage
- Color-coded warnings:
  - 🟢 Green: < 50% usage
  - 🟡 Yellow: 50-75% usage
  - 🟠 Light red: 75-90% usage
  - 🔴 Red: 90-95% usage
  - 🔴 Blinking: > 95% usage (CRITICAL)

### Optimize Command

Run `/optimize-auto-approve-hook` to:
1. Analyze the decision log (`.claude/auto_approve_safe.decisions.jsonl`)
2. Validate existing ALLOW rules aren't too permissive
3. Identify frequently-asked commands that could be safely auto-allowed
4. Check for overly broad DENY patterns causing false positives
5. Generate new regex patterns for safe commands
6. Clean up and archive the decision log

## Decision Logging

When `ENABLE_DECISION_LOG = True` (default), the hook logs all decisions to:
```
.claude/auto_approve_safe.decisions.jsonl
```

Each entry includes:
- Timestamp
- Tool name
- Decision (allow/deny/ask)
- Reason for decision
- Input summary

Use `/optimize-auto-approve-hook` to analyze this log and improve your rules.

## File Structure

After installation, files are placed in:

```
.claude/
├── scripts/
│   ├── auto_approve_safe.py
│   ├── auto_approve_safe.rules.json
│   ├── auto_approve_safe_rules_check.py
│   └── context-monitor.py
├── commands/
│   ├── optimize-auto-approve-hook.md
│   ├── docs-quick-update.md
│   └── fresh-eyes.md
└── skills/
    └── nash/
        ├── SKILL.md
        ├── OPUS-ANALYSIS-PROMPT.md
        ├── prune_transcript.py
        ├── nash-learnings.md
        └── nash-sources.example.yaml
```

## Uninstallation

```bash
npm uninstall @torka/claude-qol
```

**Manual cleanup** (if files remain after uninstall):

```bash
rm -f .claude/scripts/auto_approve_safe.py \
      .claude/scripts/auto_approve_safe.rules.json \
      .claude/scripts/auto_approve_safe_rules_check.py \
      .claude/scripts/context-monitor.py \
      .claude/commands/optimize-auto-approve-hook.md \
      .claude/commands/docs-quick-update.md \
      .claude/commands/fresh-eyes.md
rm -rf .claude/skills/nash
```

**Note**: Your `settings.local.json` is not modified—you may want to manually remove hook/statusLine configurations.

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
- [npm Package](https://www.npmjs.com/package/@torka/claude-qol)
