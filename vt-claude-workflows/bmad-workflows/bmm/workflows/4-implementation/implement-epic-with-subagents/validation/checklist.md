# Epic Execution Pre-Flight Checklist

Use this checklist to validate prerequisites before starting epic execution.

## Required Agents

- [ ] **story-prep-master** exists at `.claude/agents/story-prep-master.md`
  - Responsible for creating developer-ready stories from epic

- [ ] **quality-gate-verifier** exists at `.claude/agents/quality-gate-verifier.md`
  - Responsible for independent test/coverage verification

- [ ] **principal-code-reviewer** exists at `.claude/agents/principal-code-reviewer.md`
  - Responsible for code quality review

- [ ] **Fallback dev agent** exists at `_bmad/bmm/agents/dev.md`
  - Used when no specialist matches the story

## Optional Specialist Agents

- [ ] Specialist agents folder exists at `.claude/agents/vt-bmad-dev-agents/`
- [ ] At least one specialist agent defined (recommended)

Each specialist agent should have:
- `specialty` field in frontmatter (one-liner)
- `Specialty Context` section with:
  - Domain
  - Technologies
  - Story Types
  - Keywords

## Required Files

- [ ] **Epic file** exists and follows BMAD epics-template format
  - Contains stories in format `### Story N.M: [title]`
  - Each story has acceptance criteria

- [ ] **Sprint-status.yaml** exists at configured location
  - Stories listed with current status
  - Epic status tracked

## Optional Files

- [ ] **project-context.md** exists (enhances agent context)
  - Located at `**/project-context.md`
  - Contains coding standards and patterns

## MCP Tools

- [ ] **Context-7 MCP** is configured and available
  - Provides up-to-date library documentation
  - Required for accurate implementation

- [ ] **Playwright MCP** is configured (optional)
  - Enables E2E testing automation
  - Useful if stories involve UI testing

## Environment

- [ ] Git repository is clean (no uncommitted changes)
  - Or user is aware commits will be mixed with existing changes

- [ ] Tests can run (`npm test` or equivalent works)
  - Test command is configured correctly

- [ ] Build passes (`npm run build` or equivalent)
  - No existing build errors

## Configuration

- [ ] Coverage threshold is appropriate (default: 80%)
  - Adjust in workflow.yaml if needed

- [ ] Max retries is set (default: 3)
  - Controls retry attempts before escalation

- [ ] Auto-commit is enabled/disabled as desired (default: true)
  - Creates git commit after each story

---

## Pre-Execution Verification Commands

Run these to verify environment:

```bash
# Check agents exist
ls -la .claude/agents/story-prep-master.md
ls -la .claude/agents/quality-gate-verifier.md
ls -la .claude/agents/principal-code-reviewer.md
ls -la .claude/agents/vt-bmad-dev-agents/

# Check tests work
npm test

# Check git status
git status

# Check sprint status exists
cat docs/delivery/sprint-status.yaml
```

---

## Troubleshooting

### Agent Not Found
- Ensure agent file exists at correct path
- Check file has valid frontmatter with `name` field

### Tests Fail Before Execution
- Fix existing test failures before starting epic
- Epic execution expects clean test baseline

### MCP Not Available
- Check MCP server is running
- Verify Context-7 is configured in Claude settings

### Coverage Below Threshold
- Existing code may have low coverage
- Consider lowering threshold or improving coverage first
