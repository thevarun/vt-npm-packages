# Deep Audit — Design Inspirations

Reference sources consulted during agent prompt design. Not loaded at runtime — for development reference only.

## Tier 1 — Core Patterns

| Source | URL | Pattern Used |
|--------|-----|-------------|
| Anthropic `code-review` plugin | https://github.com/anthropics/claude-code/tree/main/plugins/code-review | Confidence scoring (0-100), only report 80+, false-positive filtering |
| Anthropic `pr-review-toolkit` | https://github.com/anthropics/claude-code/tree/main/plugins/pr-review-toolkit | 6 specialized agents, smart orchestration, parallel spawning, conditional agent selection |
| EveryInc compound-engineering | https://github.com/EveryInc/compound-engineering-plugin/blob/main/plugins/compound-engineering/commands/workflows/review.md | 15 review agents, P1/P2/P3 severity, file-based output |
| EveryInc review agents | https://github.com/EveryInc/compound-engineering-plugin/tree/main/plugins/compound-engineering/agents/review | Agent-per-dimension pattern, structured handoff |
| wshobson code-reviewer | https://github.com/wshobson/agents/blob/main/plugins/comprehensive-review/agents/code-reviewer.md | 5-phase review structure, numbered output artifacts |
| wshobson security-auditor | https://github.com/wshobson/agents/blob/main/plugins/comprehensive-review/agents/security-auditor.md | OWASP checklist integration, security-specific review flow |
| Deslop/Anti-slop SKILL.md | https://github.com/avifenesh/agentsys/blob/main/plugins/deslop/skills/deslop/SKILL.md | Certainty-gated approach, minimal diff principle, deterministic patterns first |

## Tier 2 — Cherry-Picked Ideas

| Source | URL | Pattern Used |
|--------|-----|-------------|
| undeadlist agents | https://github.com/undeadlist/claude-code-agents/tree/main/.claude/agents | SEO auditor framework detection + 6 audit categories |
| davila7 code-review | https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components/commands/utilities/code-review.md | Multi-file analysis patterns |
| Premortem skill | https://www.aimcp.info/en/skills/ee6aa52d-1d52-45b7-8f10-c1b238772acd | "Imagine this already failed — why?" reframing for risk identification |
| Evaluation rubrics skill | https://www.aimcp.info/en/skills/4090c675-54f6-42b8-96a6-74417f6db77c | 4-8 criteria, explicit descriptors per level, analytic scoring |
| Stop-slop (find-bugs) | https://www.aimcp.info/en/skills/390a1fbf-b55b-466c-85a6-be818e33bb28 | 5-dimension scoring (1-10), threshold triggers, diff analysis |
| AI Prompt Library blog | https://www.aipromptlibrary.app/blog/claude-code-prompt-library | Claude Code prompt patterns and agent design conventions |
