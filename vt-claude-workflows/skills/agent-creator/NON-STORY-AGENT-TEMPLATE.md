# Non-Story Agent Template (Rare)

Only use this template when explicitly requested for non-story tasks (research, exploration, documentation, etc.).

---

## Full Template

```markdown
---
name: {agent-name}
description: {Clear description of when/why to use this agent. Be specific about triggers.}
model: {sonnet|haiku|opus|inherit}
# Optional: Only use disallowedTools if you need to restrict specific tools
# disallowedTools: {tools to deny, e.g., Write, Edit for read-only agents}
---

# Role & Purpose

You are a {role description} specialized in {specialty}.

## When to Activate

This agent should be used when:
- {Trigger condition 1}
- {Trigger condition 2}

## First Action: MCP Availability Check

Before starting work:
1. Review task requirements for MCP dependencies
2. If critical MCP unavailable:
   - Output: `ESCALATE: Required MCP '{mcp-name}' not available.`
   - HALT and wait for user action
3. If optional MCP unavailable: note limitation and proceed

## Core Responsibilities

1. {Primary responsibility}
2. {Secondary responsibility}

## MCP Usage Patterns (if applicable)

### ShadCN Components
- ALWAYS call demo/docs first before implementing
- Verify component API, variants, props
- Never guess—verify first

### MagicPatterns Designs
- When link provided, use MCP to fetch code
- NEVER build from scratch
- Adapt fetched code for project structure

## Workflow

1. {First step}
2. {Second step}
3. {Continue as needed}

## Output Format

{Describe expected output structure}

## Constraints

- {Limitation 1}
- {Limitation 2}
- MUST escalate if critical MCP is unavailable
```

---

## Minimal Template

```markdown
---
name: {name}
description: {When to use this agent}
model: sonnet
# disallowedTools: Write, Edit  # Uncomment for read-only agents
---

You are a {role}. Your job is to {primary task}.

**First Action**: Check MCP availability. If critical MCP missing → ESCALATE and HALT.

When invoked:
1. {Step 1}
2. {Step 2}
3. {Step 3}
```

---

## Common Non-Story Agent Patterns

| Agent Type | Use Case | Restrictions |
|------------|----------|--------------|
| `explorer` | Codebase research, file discovery | `disallowedTools: Write, Edit` |
| `documenter` | Documentation-only updates | None (inherits all) |

**Note**: Use `disallowedTools` for restrictions instead of explicit `tools` lists. This preserves MCP access while restricting specific dangerous operations.

---

## Validation Checklist

Before saving a non-story agent, verify:

1. **Name format**: `{lowercase-alphanumeric-hyphens}`
2. **Tool access**:
   - ✅ Best: No `tools:` field (inherits all including MCPs)
   - ✅ OK: `disallowedTools:` for specific restrictions (e.g., read-only agents)
   - ❌ Avoid: Explicit `tools:` list (blocks MCP access)
3. **Model**: `sonnet`, `haiku`, `opus`, or `inherit`
4. **Description**: 20-300 characters, specific triggers
5. **Content includes**:
   - Clear activation conditions
   - **MCP Availability Check** as first action
   - Escalation behavior for missing critical MCPs
   - Defined workflow steps
   - Expected output format
   - MCP usage patterns if agent may use ShadCN/MagicPatterns
