---
name: vt-bmad-dev-agents-creator
description: Creates custom Claude Code sub-agents for project tasks. Use when the user wants to create specialized agents, design agent workflows, or needs help breaking down complex tasks into agent-based solutions. All created agents are stored in .claude/agents/vt-bmad-dev-agents/.
tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, Task, LSP
---

# Agent Creator Skill

Create custom Claude Code sub-agents tailored to your project's needs. All agents are stored in `.claude/agents/vt-bmad-dev-agents/`.

## Story-Based Agents (Default Behavior)

**All created agents are story-focused by default.** This means:
1. Every agent accepts a **story identifier** as input (story number or name)
2. Every agent uses **smart routing** to auto-detect story type and invoke the correct workflow
3. The story context drives all agent work

### Smart Workflow Routing

Agents analyze story tasks and automatically route to the appropriate workflow:

| Story Contains | Routes To |
|----------------|-----------|
| Only UI keywords | `/dev-story-ui` |
| Only Backend keywords | `/dev-story-backend` |
| Both or unclear | `/dev-story-fullstack` |

**Detection Keywords:**
- **UI**: component, page, layout, visual, form, button, modal, card, dialog, toast, responsive, CSS, Tailwind, shadcn, MagicPatterns, screenshot
- **Backend**: API, endpoint, database, service, migration, auth, middleware, validation, schema, query, route handler, Drizzle, ORM

### Why Story-Based?
- Ensures traceability from story → implementation
- Provides clear scope boundaries for the agent
- Smart routing picks the right workflow automatically
- Maintains sprint tracking via `sprint-status.yaml`
- Aligns with BMAD Method workflows

## Workflow Overview

This skill follows a 5-step interactive process:

1. **Context Assessment** - Analyze project and task requirements
2. **Agent Design** - Determine needed agents and their specialties
3. **Community Research** - Reference GitHub repos for patterns and inspiration
4. **Agent Creation** - Generate and validate agent specification files
5. **Deployment** - Save files and verify installation

---

## Step 0: Quick Start

### Consider Built-in Agents First
Before creating custom agents, check if built-ins suffice:
- **Explore** - Codebase research
- **general-purpose** - Multi-step tasks
- **Plan** - Implementation planning

Only create custom agents when you need project-specific knowledge or custom workflows.

For simple requests ("quick agent for..."): Skip to Step 4.
For complex needs: Continue to Step 1.

---

## Step 1: Context Assessment

Before creating agents, gather comprehensive context:

### Project Analysis
```bash
# Understand project structure (use ls if tree not available)
ls -la . && ls -la src/ 2>/dev/null

# Check existing agents
ls -la .claude/agents/vt-bmad-dev-agents/ 2>/dev/null || echo "No agents directory yet"

# Check existing templates
ls -la .claude/skills/agent-creator/templates/ 2>/dev/null || echo "No templates yet"
```

Also read these files for context:
- `CLAUDE.md` - Project instructions
- `README.md` - Project overview
- `package.json` - Dependencies and scripts (if exists)

### Task Analysis Questions
Ask the user:
- What is the main task or goal you want to accomplish?
- Are there specific technologies or frameworks involved?
- What is the expected complexity (simple fix, feature, refactor, new project)?
- Do you have preferences for how work should be divided?

### CHECKPOINT 1
Present findings to user:
- Project type and tech stack identified
- Task scope and complexity assessed
- Proposed number of agents needed

**Wait for user approval before proceeding.**

## Step 2: Agent Design

Based on context, design the agent architecture:

### Story Agent Pattern (Default)

All story agents use the **universal template** with smart routing:

| Agent Examples | Specialty Focus |
|----------------|-----------------|
| `frontend`, `react-dev`, `ui-specialist` | Frontend/React expertise |
| `api-dev`, `db-specialist`, `auth-dev` | Backend/API expertise |
| `feature-dev`, `saas-dev`, `nextjs-fullstack` | Full-stack expertise |

**Note**: Agents inherit all available tools by default (including MCPs). The agent auto-detects story type and routes to the correct workflow.

### Non-Story Agent Patterns (Rare - Only When Explicitly Requested)

| Agent Type | Use Case | Restrictions |
|------------|----------|--------------|
| `explorer` | Codebase research, file discovery | `disallowedTools: Write, Edit` |
| `documenter` | Documentation-only updates | None (inherits all) |

### Design Considerations
- **Universal template**: All story agents use the same template with smart routing
- **Persona-focused**: Agent creation is about defining expertise and approach
- **Auto-routing**: Story type detection happens at execution time, not creation time
- **Single responsibility**: Each agent has one specialty focus
- **Minimal wrapper**: Agents are persona + handoff only; workflows handle all logic
- **Model selection**: Use `sonnet` for story agents (complex reasoning needed)
- **Tool inheritance**: Omit `tools:` field so agents inherit all tools including MCPs
- **No MCP checks in agents**: Workflows handle MCP availability checks

### CHECKPOINT 2
Present agent design to user:
- List of proposed agents with names and descriptions
- Each agent's specialty/persona focus
- How agents will collaborate (if applicable)

**Wait for user approval before proceeding.**

## Step 3: Community Research

### Action 1: Check Pre-Built Expertise Profiles (Do This First)

**Read the profile index at `.claude/skills/agent-creator/expertise/INDEX.md`**

Most agents fit one of these pre-built profiles:

| Profile | Use For |
|---------|---------|
| `react-frontend.md` | UI components, forms, modals, accessibility |
| `backend-api.md` | API routes, auth, validation, error handling |
| `nextjs-fullstack.md` | Pages, layouts, Server Components, App Router |
| `testing.md` | Unit tests, E2E tests, coverage, fixtures |
| `database-orm.md` | Schema, migrations, Drizzle queries |
| `devops-ci.md` | CI/CD, deployment, secrets, GitHub Actions |

**If a profile matches 80%+**: Extract keywords, competencies, and anti-patterns. Skip repo research.

**If no good match**: Proceed to Action 2.

### Action 2: Repo Research (Only If Needed)

**Reference the detailed guide at `.claude/skills/agent-creator/COMMUNITY-REPOS.md`**

#### Research Limits (Mandatory)

| Activity | Maximum |
|----------|---------|
| GitHub repo searches | 3 queries |
| Repos to evaluate in detail | 5 repos |
| Web searches | 2 queries |
| Total research time | 10 minutes |

#### Curated Repos (Check First)

| Repository | URL |
|------------|-----|
| claude-code-templates | https://github.com/davila7/claude-code-templates |
| wshobson/agents | https://github.com/wshobson/agents |
| claude-flow | https://github.com/ruvnet/claude-flow |
| awesome-claude-code | https://github.com/hesreallyhim/awesome-claude-code |
| SuperClaude Framework | https://github.com/SuperClaude-Org/SuperClaude_Framework |
| compound-engineering-plugin | https://github.com/EveryInc/compound-engineering-plugin |
| claude-code-workflows | https://github.com/OneRedOak/claude-code-workflows |

#### Research Questions

When reviewing repos, answer these questions (see COMMUNITY-REPOS.md for details):
1. What problem does this agent solve?
2. What expertise does it encode?
3. What patterns can be reused?
4. What limitations does it have?
5. How should it be adapted?

#### Evaluation Criteria

Before using patterns from a repo, verify:
1. **Recent Activity**: Last commit < 30 days (ideal) or < 90 days (acceptable)
2. **Stars**: 50+ preferred, 10+ minimum
3. **Relevance**: Directly applicable to the task

```bash
# Quick repo check (if gh CLI available)
gh repo view {owner}/{repo} --json stargazerCount,pushedAt

# Fallback if gh CLI not available - use WebFetch
# WebFetch("https://api.github.com/repos/{owner}/{repo}")
```

### CHECKPOINT 3
Share research findings:
- Profile(s) used (if applicable)
- Which repos were checked (max 5, if Action 2 was needed)
- Key patterns/competencies extracted
- Adaptations proposed for this project

**Wait for user approval before proceeding.**

## Step 4: Agent Creation

Create agent files following Claude Code's native format.

### Templates

**Use the universal template for all story agents:**

| Agent Type | Template File |
|------------|---------------|
| **Story Agents** (default) | `.claude/skills/agent-creator/STORY-AGENT-TEMPLATE.md` |
| **Non-Story** (rare) | `.claude/skills/agent-creator/NON-STORY-AGENT-TEMPLATE.md` |

The universal template includes smart routing logic - agents auto-detect story type and route to the correct workflow (`/dev-story-ui`, `/dev-story-backend`, or `/dev-story-fullstack`).

Read the template file before creating agents.

### File Naming Convention
- Location: `.claude/agents/vt-bmad-dev-agents/{name}.md`
- Naming: lowercase, hyphens only
- Examples: `frontend.md`, `api-integrator.md`

### Pre-Save Validation
Before presenting to user, validate each agent:

1. **Name format**: Must be `{lowercase-alphanumeric-hyphens}`
   - Valid: `frontend`, `api-client`, `db-migrator`
   - Invalid: `my_agent`, `MyAgent`, `FRONTEND`

2. **Tool access**: Prefer inheritance over explicit lists
   - ✅ Best: Omit `tools:` field entirely (inherits all including MCPs)
   - ✅ OK: Use `disallowedTools:` to restrict specific dangerous tools
   - ⚠️ Avoid: Explicit `tools:` list (blocks MCP access)

3. **Model**: Must be one of: `sonnet`, `haiku`, `opus`, `inherit`

4. **Description**: Should be 20-300 characters, specific enough to trigger correctly
   - **Story agents MUST include**: "Requires story number or name"

5. **No duplicates**: Check `.claude/agents/vt-bmad-dev-agents/` for existing agent with same name

6. **Story-based validation** (for story agents):
   - Description mentions story input requirement
   - Content includes "Required Input" section for story identifier
   - Content includes Execution section with routing logic (auto-detects story type)
   - Content includes reference to all three workflows (`/dev-story-ui`, `/dev-story-backend`, `/dev-story-fullstack`)
   - Content does NOT include:
     - MCP availability checks (workflow handles this)
     - Implementation steps (workflow handles this)
     - Checklists (workflow handles this)
   - Content includes Handoff Format section with `workflow_used` field

### CHECKPOINT 4
For each agent, show:
- Complete agent file content
- File path where it will be saved
- Validation status (all checks passed)

**Wait for user approval of each agent before saving.**

## Step 5: Validation & Deployment

### Save Agent Files
```bash
# Ensure agents directory exists
mkdir -p .claude/agents/vt-bmad-dev-agents

# Write each approved agent file
# (Done via Write tool after user approval)
```

### Verify Installation
```bash
# List created agents
ls -la .claude/agents/vt-bmad-dev-agents/

# Show agent count
echo "Created $(ls .claude/agents/vt-bmad-dev-agents/*.md 2>/dev/null | wc -l) agents"
```

### Usage Instructions
After creation, agents work in two ways:
- **Automatic**: When your task matches the agent's description, Claude may use it automatically
- **Explicit**: Reference the agent by name in your prompt, e.g., "Use the tester agent to..."

### Cleanup Instructions
When agents are no longer needed:
```bash
# Remove all agents in the directory
rm -rf .claude/agents/vt-bmad-dev-agents/

# Or remove specific agent
rm .claude/agents/vt-bmad-dev-agents/{name}.md
```

### CHECKPOINT 5 (Final)
Present summary:
- All agents created successfully
- How to use them
- How to clean them up later

**Confirm completion with user.**

## MCP Integration Guidelines

### Tool Inheritance (Critical)

**DO NOT explicitly list tools in agent frontmatter** unless you need to restrict access.

```yaml
# ❌ WRONG - Blocks MCP access
tools: Read, Glob, Grep, Bash, Edit, Write

# ✅ CORRECT - Inherits all tools including MCPs
# (omit the tools field entirely)

# ✅ ALSO CORRECT - Restrict specific dangerous tools only
disallowedTools: Bash
```

When `tools:` is omitted, agents inherit all available tools from the main conversation, including any configured MCP tools.

### MCP Checks Handled by Workflows (Not Agents)

**Important**: Agents no longer include MCP availability checks. The specialized workflows handle all MCP logic:

| Workflow | MCP Handling |
|----------|--------------|
| `/dev-story-ui` | Probes shadcn, Playwright (required); Context7, MagicPatterns (optional) |
| `/dev-story-backend` | Probes Context7, Serena (all optional with fallbacks) |
| `/dev-story-fullstack` | Combines both based on task types |

If a critical MCP is unavailable, the **workflow** will escalate and halt. Agents are minimal wrappers that only provide persona context and invoke the workflow.

### Background vs Foreground Agent Warning

**Critical limitation**: MCP tools are NOT available in background subagents.

If your agent needs MCP access:
- It must run in foreground mode
- Background tasks that need MCPs will fail silently
- Consider this when designing agent workflows

---

## Quick Reference

### Templates

See the template files for full examples and minimal templates:
- **Story Agents** (default): `STORY-AGENT-TEMPLATE.md` - Universal template with smart routing
- **Non-Story Agents** (rare): `NON-STORY-AGENT-TEMPLATE.md`

### Available Tools Reference

**Core Tools** (always available):
| Tool | Purpose |
|------|---------|
| `Read` | Read file contents |
| `Write` | Create new files |
| `Edit` | Modify existing files |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `Bash` | Run shell commands |
| `WebFetch` | Fetch web content |
| `WebSearch` | Search the web |
| `Task` | Delegate to subagents |
| `LSP` | Code intelligence |

**MCP Tools** (available when configured):
| MCP | Common Tools | Use Case |
|-----|--------------|----------|
| ShadCN | Component demos, installation | UI component implementation |
| MagicPatterns | Get pattern code | Fetch designed components |
| Context7 | Query docs | Up-to-date library documentation |
| Playwright | Browser automation | E2E testing, screenshots |

**Remember**: Omit `tools:` field to inherit all available tools including MCPs.

### Model Selection Guide
| Model | Best For | Cost |
|-------|----------|------|
| `haiku` | Simple, fast tasks | Lowest |
| `sonnet` | Balanced reasoning | Medium |
| `opus` | Complex reasoning | Highest |
| `inherit` | Match parent model | Varies |
