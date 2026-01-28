---
name: nash
description: Workflow optimization loop that reviews Claude Code session transcripts to extract learnings and improve workflows. Run at end of sessions to create a continuous improvement cycle.
tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
---

# Nash: Workflow Optimization Loop

**Goal:** Review Claude Code session transcripts to extract learnings and improve workflows, creating a continuous improvement cycle.

---

## Configuration

### NPM Package Sources

When a workflow is from an NPM package, edits are made to the source directory:

| Package | Local Path |
|---------|------------|
| `@torka/claude-workflows` | `~/Coding/npm-torka/vt-claude-workflows/` |
| `@torka/claude-qol` | `~/Coding/npm-torka/vt-claude-qol/` |

### Workflow File Locations

| Type | Pattern |
|------|---------|
| Commands | `.claude/commands/{name}.md` |
| Skills | `.claude/skills/{name}/SKILL.md` |
| Agents | `.claude/agents/{name}.md` |
| BMAD | `.claude/commands/bmad/{module}/...` |

---

## How It Works

1. **Discovery** - Find the current session and detect which workflows were used
2. **Selection** - Choose which session/workflow to optimize
3. **Analysis** - Use Opus to deeply analyze the session transcript
4. **Review** - Present findings and prioritize improvements
5. **Execute** - Apply approved changes to workflow sources

---

## STEP 1: Discovery & Selection

### 1.1 Identify Current Context

Detect the current project and find recent sessions:

```bash
# Get current project path
PROJECT_PATH=$(pwd)

# Claude session files location
SESSIONS_DIR=~/.claude/projects

# List recent sessions (most recent first)
ls -lt "$SESSIONS_DIR"/*/*.jsonl 2>/dev/null | head -10
```

### 1.2 Parse Session for Workflows

Read the session JSONL file and extract workflow invocations. Look for:
- `/command-name` patterns in user messages
- `Skill` tool invocations
- `Task` tool invocations with workflow-related prompts

**Detection approach:**
```
For each line in session JSONL:
  - If user message: Look for /[\w:-]+ patterns (slash commands)
  - If assistant message with tool calls:
    - If Skill tool: Extract skill name from parameters
    - If Task tool: Note if it references a workflow
```

### 1.3 Present Options to User

Display discovered options:

```
=== NASH: Workflow Optimization ===

Current Session Analysis:
- Session: [session-uuid]
- Duration: [calculated from timestamps]
- Workflows detected: /dev-story, /code-review

Options:
1. [Default] Optimize from current session
   - Workflow: [first detected workflow]
   - Session: [current]

2. Recent sessions:
   a) [time ago] /create-story on vt-saas-template
   b) [time ago] /implement-epic on vt-saas-template

3. Manual selection
   - Specify workflow + session path

Select option [1-3]:
```

### CHECKPOINT 1

**Present to user:**
- Session identified (ID, duration, size)
- Workflows detected in session
- Options for what to optimize

**Use AskUserQuestion to get user selection before proceeding.**

---

## STEP 2: Load Context & Determine Source

### 2.1 Resolve Workflow Files

Based on user selection, locate all relevant workflow files:

```bash
# For commands
WORKFLOW_FILE=".claude/commands/{name}.md"

# For skills
WORKFLOW_FILE=".claude/skills/{name}/SKILL.md"
# Also check for additional files in the skill directory

# For agents
WORKFLOW_FILE=".claude/agents/{name}.md"
```

### 2.2 Dynamic NPM Package Detection

Determine if the workflow comes from an NPM package by reading `plugin.json` files:

```bash
# Known NPM package directories
NPM_PACKAGES=(
  "$HOME/Coding/npm-torka/vt-claude-workflows"
  "$HOME/Coding/npm-torka/vt-claude-qol"
)

# For each package, read plugin.json to find workflow sources
for pkg in "${NPM_PACKAGES[@]}"; do
  if [ -f "$pkg/.claude-plugin/plugin.json" ]; then
    cat "$pkg/.claude-plugin/plugin.json"
    # Parse the commands, agents, skills arrays
    # If workflow name matches, this is the source
  fi
done
```

**Detection logic:**
1. Read each package's `plugin.json`
2. Check if workflow name appears in `commands`, `agents`, or `skills` arrays
3. If match found → NPM package source (record package path)
4. If no match → Project-specific

### 2.3 Gather All Context Files

Collect:
1. **Session transcript** - The full JSONL file
2. **Primary workflow file** - The main workflow/command/skill definition
3. **Step files** - Any included steps (for skills)
4. **Template files** - Referenced templates
5. **Project CLAUDE.md** - For project context

### CHECKPOINT 2

**Confirm with user:**
- Workflow file path(s) to analyze
- Session file path
- Workflow source: `project-specific` or `npm-package: @torka/{name}`
- Context files that will be included

**Use AskUserQuestion for explicit confirmation before proceeding to analysis.**

---

## STEP 3: Analysis (Opus Subagent)

### 3.1 Prepare Analysis Context

Read the Opus prompt template:
```bash
cat .claude/skills/nash/OPUS-ANALYSIS-PROMPT.md
```

Populate the template with:
- `{PROJECT_CLAUDE_MD}` - Contents of project's CLAUDE.md
- `{WORKFLOW_NAME}` - Name of the workflow being analyzed
- `{WORKFLOW_TYPE}` - command | skill | agent
- `{WORKFLOW_SOURCE}` - project-specific | npm-package
- `{WORKFLOW_CONTENT}` - Full workflow file content
- `{ADDITIONAL_WORKFLOW_FILES}` - Step files, templates, etc.
- `{SESSION_TRANSCRIPT}` - Full JSONL content

### 3.2 Launch Opus Subagent

Use the Task tool to spawn an Opus subagent:

```
Task(
    subagent_type="general-purpose",
    model="opus",
    prompt=<populated OPUS-ANALYSIS-PROMPT>
)
```

### 3.3 Receive Structured Analysis

The Opus subagent returns findings in structured markdown:
- What Went Well (with evidence)
- What Could Be Better (with evidence)
- Specific Improvement Suggestions (prioritized)

### CHECKPOINT 3

**Analysis complete.** Opus findings received. Proceed to review.

---

## STEP 4: Review & Prioritize

### 4.1 Present Findings

Display the analysis results in an actionable format:

```
=== ANALYSIS COMPLETE ===

What Went Well:
- [finding 1]
- [finding 2]

Improvement Opportunities:
1. [HIGH] Add pre-validation step before X
   - Evidence: User had to restart 3 times due to missing file
   - Effort: Simple

2. [MEDIUM] Clarify step 3 instructions
   - Evidence: User asked clarifying question
   - Effort: Simple

3. [LOW] Add parallel tool calls for search operations
   - Evidence: Sequential searches added latency
   - Effort: Moderate

Select items to action [1,2,3 or 'all' or 'none']:
```

### 4.2 Gather User Feedback

Using AskUserQuestion:
- Which improvements to implement
- Any custom improvements to add
- Any modifications to suggestions
- Final confirmation of action list

### CHECKPOINT 4

**Action list confirmed:**
- [X] Improvement 1
- [X] Improvement 3
- [ ] Improvement 2 (skipped)

**Wait for user approval of final action list before executing.**

---

## STEP 5: Execute Changes

### 5.1 Generate Edit Plan

For each approved improvement:
1. Identify exact file(s) to modify
2. Draft specific edits (old_string → new_string)
3. Note dependencies between edits

Present edit plan:
```
File: .claude/commands/dev-story.md
Edit 1: Add validation step
  - Location: After step 1
  - Change: [before → after preview]
```

### 5.2 Execute Based on Source Type

#### Path (a) - Project-Specific Workflow

```bash
# Make edits directly to project's .claude/ directory
Edit(
    file_path=".claude/commands/{name}.md",
    old_string="...",
    new_string="..."
)

# Validate changes
cat .claude/commands/{name}.md | head -50
```

**Done after validation.**

#### Path (b) - NPM-Packaged Workflow

**Step 1:** Read NPM package CLAUDE.md for package-specific instructions:
```bash
cat ~/Coding/npm-torka/{package-name}/CLAUDE.md
```

**Step 2:** Make edits to NPM package source:
```bash
Edit(
    file_path="~/Coding/npm-torka/{package-name}/{source-path}",
    old_string="...",
    new_string="..."
)
```

**Step 3:** Bump version (patch for fixes, minor for features):
```bash
cd ~/Coding/npm-torka/{package-name}
npm version patch --no-git-tag-version
```

**Step 4:** Commit changes:
```bash
cd ~/Coding/npm-torka/{package-name}
git add -A
git commit -m "fix({workflow-name}): {brief description}"
```

**Step 5:** Push if configured:
```bash
cd ~/Coding/npm-torka/{package-name}
git push origin main 2>/dev/null || echo "Push manually if needed"
```

**Step 6:** Prompt for publish:
```
Ready to publish @torka/{package-name}@{new-version}

If you have 2FA enabled on npmjs.com, run manually:
cd ~/Coding/npm-torka/{package-name} && npm publish

Otherwise, I can run `npm publish` for you.
```

**Step 7:** Update project dependency:
```bash
npm update @torka/{package-name}
```

### 5.3 Validate Changes

```bash
# Verify file was modified correctly
cat {modified-file-path}

# For NPM packages, verify version bump
cat ~/Coding/npm-torka/{package-name}/package.json | grep version
```

### CHECKPOINT 5 (Final)

**Summary:**
- Files modified: [list]
- Changes made: [summary]
- Workflow source: [project-specific or npm-package]
- Next steps: [if any, e.g., "run npm publish manually"]

**Confirm completion with user.**

---

## Quick Reference

### Session File Location
```
~/.claude/projects/{encoded-project-path}/{session-uuid}.jsonl
```

### Priority Levels
- **HIGH**: Caused workflow failures or significant friction
- **MEDIUM**: Caused confusion or required clarification
- **LOW**: Optimization opportunities (speed, clarity)

### Effort Levels
- **Simple**: Single file edit, clear change
- **Moderate**: Multiple files or requires careful consideration
- **Complex**: Architectural change or significant rewrite

### JSONL Event Types (for parsing)
- `user` - User message (look for /commands here)
- `assistant` - Assistant response with tool_calls
- `tool_result` - Result of a tool call
