# Community Resources for Agent Patterns

Reference this file when researching agent patterns in Step 3.

## Research Limits

**IMPORTANT: To prevent endless research loops, follow these limits:**

| Activity | Maximum |
|----------|---------|
| GitHub repo searches | 3 queries |
| Repos to evaluate in detail | 5 repos |
| Web searches | 2 queries |
| Total research time | 10 minutes |

After hitting limits, proceed with the best patterns found.

---

## Curated Community Repositories

These repositories are pre-vetted for agent/workflow patterns:

### Primary Resources (Check First)

| Repository | Focus Area | URL |
|------------|------------|-----|
| **claude-code-templates** | CLI tool components, templates | https://github.com/davila7/claude-code-templates |
| **wshobson/agents** | Agent definitions | https://github.com/wshobson/agents |
| **claude-flow** | Multi-agent orchestration | https://github.com/ruvnet/claude-flow |
| **awesome-claude-code** | Curated resources | https://github.com/hesreallyhim/awesome-claude-code |
| **SuperClaude Framework** | Enhanced agent framework | https://github.com/SuperClaude-Org/SuperClaude_Framework |
| **compound-engineering-plugin** | Engineering workflows | https://github.com/EveryInc/compound-engineering-plugin |
| **claude-code-workflows** | Workflow definitions | https://github.com/OneRedOak/claude-code-workflows |
| **infrastructure-showcase** | Infrastructure patterns | https://github.com/diet103/claude-code-infrastructure-showcase |

### Official Anthropic Resources

| Resource | URL |
|----------|-----|
| Claude Code Repository | https://github.com/anthropics/claude-code |
| Awesome Claude Code (Official) | https://github.com/anthropics/awesome-claude-code |
| Claude Code Documentation | https://docs.anthropic.com/en/docs/claude-code |

---

## Quick Lookup Commands

Use these commands to quickly fetch patterns from curated repos:

```bash
# Fetch agent examples from claude-code-templates
curl -s https://api.github.com/repos/davila7/claude-code-templates/contents/cli-tool/components | jq '.[].name'

# Check SuperClaude Framework structure
curl -s https://api.github.com/repos/SuperClaude-Org/SuperClaude_Framework/contents | jq '.[].name'

# View claude-flow agents
curl -s https://api.github.com/repos/ruvnet/claude-flow/contents | jq '.[].name'
```

---

## Evaluation Criteria

When evaluating repositories and patterns, score using these criteria:

### Repository Quality (Score 1-5 each)

| Criteria | Weight | How to Check |
|----------|--------|--------------|
| **Recent Activity** | High | Last commit < 30 days = 5, < 90 days = 3, > 90 days = 1 |
| **Stars** | Medium | 100+ = 5, 50+ = 4, 20+ = 3, 10+ = 2, <10 = 1 |
| **Documentation** | Medium | Has README with examples = 5, Basic README = 3, None = 1 |
| **Relevance** | High | Directly applicable = 5, Needs adaptation = 3, Tangential = 1 |

### Quick Activity Check
```bash
# Check repo stats (stars, last update)
gh repo view {owner}/{repo} --json stargazerCount,pushedAt,description

# Example:
gh repo view ruvnet/claude-flow --json stargazerCount,pushedAt
```

### Pattern Quality (Score 1-5 each)

| Criteria | What to Look For |
|----------|------------------|
| **Clarity** | Is the agent's purpose immediately obvious? |
| **Specificity** | Will the description trigger correctly? |
| **Tool Access** | Follows least-privilege principle? |
| **Completeness** | Includes workflow steps? |
| **Adaptability** | Can be customized for this project? |

### Minimum Thresholds

Only use patterns from repos that meet:
- Last commit within 90 days OR 50+ stars
- Clear documentation or examples
- At least 3/5 on relevance score

---

## Agent Pattern Templates

### Explorer Pattern
```markdown
---
name: tmp-explorer
description: Explores and understands codebases. Use when needing to understand project structure, find specific code, or map dependencies.
tools: Read, Glob, Grep, Bash
model: haiku
---

You are a codebase explorer. Your job is to efficiently navigate and understand code.

When exploring:
1. Start with project structure (tree, ls)
2. Identify key files (package.json, config files)
3. Map dependencies and relationships
4. Report findings in structured format
```

### Implementer Pattern
```markdown
---
name: tmp-implementer
description: Implements features and writes code. Use when creating new functionality or modifying existing code.
tools: Read, Write, Edit, Bash, Glob
model: sonnet
---

You are a senior developer implementing features.

When implementing:
1. Understand requirements fully
2. Check existing patterns in codebase
3. Write clean, tested code
4. Follow project conventions
```

### Reviewer Pattern
```markdown
---
name: tmp-reviewer
description: Reviews code for quality, security, and best practices. Use proactively after code changes.
tools: Read, Grep, Glob
model: sonnet
---

You are a senior code reviewer.

Review checklist:
- Code clarity and readability
- Security vulnerabilities
- Error handling
- Test coverage
- Performance concerns
```

### Tester Pattern
```markdown
---
name: tmp-tester
description: Creates and runs tests. Use when writing unit tests, integration tests, or running test suites.
tools: Read, Write, Edit, Bash
model: sonnet
---

You are a QA engineer writing tests.

When testing:
1. Understand the code to test
2. Identify test cases (happy path, edge cases, errors)
3. Write comprehensive tests
4. Run and verify all pass
```

---

## Search Strategy (If Curated Repos Insufficient)

Only if the curated repos above don't have relevant patterns:

### GitHub Search (Max 3 queries)
```bash
# Query 1: General agent search
gh search repos "claude code agents" --sort stars --limit 5

# Query 2: Specific pattern search
gh search code "{pattern-type}" path:.claude/agents --limit 10

# Query 3: Workflow search
gh search repos "claude subagent" --sort updated --limit 5
```

### Web Search (Max 2 queries)
- `"{specific-agent-type}" claude code github`
- `claude code agent patterns {technology}`

---

## Web Resources

### Documentation
- Anthropic Docs: https://docs.anthropic.com
- Claude Code Guide: https://code.claude.com

### Community
- Anthropic Discord: https://discord.gg/anthropic
- GitHub Discussions: https://github.com/anthropics/claude-code/discussions

---

## Research Questions Framework

When researching agent patterns, answer these 5 questions to extract actionable insights:

### 1. What problem does this agent solve?
- What task or workflow does it automate?
- What pain point does it address?
- Is this problem relevant to your project?

### 2. What expertise does it encode?
- What domain knowledge is embedded?
- What decisions does it make automatically?
- What best practices does it enforce?

### 3. What patterns can be reused?
- Prompt structure and persona design
- Tool selection and restrictions
- Workflow steps and checkpoints

### 4. What limitations does it have?
- What scenarios does it NOT handle?
- What assumptions does it make?
- Where might it fail in your context?

### 5. How should it be adapted?
- What project-specific changes are needed?
- What tools/MCPs should be added/removed?
- What workflow steps need modification?

---

## Expertise Extraction Guide

When reviewing a repository or agent definition, extract these elements:

| Element | What to Look For | How to Use It |
|---------|------------------|---------------|
| **Keywords** | Words in description that trigger the agent | Add to your agent's description |
| **Competencies** | Skills/knowledge areas mentioned | Include in persona section |
| **Tool Selection** | Which tools are allowed/restricted | Match to your MCP availability |
| **Workflow Steps** | Sequence of actions the agent follows | Adapt for your workflow |
| **Quality Checks** | Validation or verification steps | Include in agent instructions |
| **Anti-Patterns** | Things the agent explicitly avoids | Add as "You avoid" section |
| **Output Format** | How results are structured | Match your project conventions |

### Quick Extraction Checklist

For each repo/agent reviewed, note:

```markdown
## Agent: {name}
**Source**: {repo URL}
**Relevance**: {1-5 score}

### Extracted Elements
- **Keywords**: {trigger words}
- **Core Skill**: {main competency}
- **Tool Pattern**: {tools used/restricted}
- **Key Insight**: {most useful pattern}
- **Adaptation Needed**: {what to change}
```

### When to Stop Researching

Stop research and proceed when ANY of these are true:
- Found 2+ relevant patterns that can be combined
- Hit research limits (3 repo searches, 5 repo evaluations, 2 web searches)
- 10 minutes elapsed
- Pre-built expertise profile covers 80%+ of needs
