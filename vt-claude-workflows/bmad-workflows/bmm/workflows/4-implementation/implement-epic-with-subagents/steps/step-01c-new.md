---
name: 'step-01c-new'
description: 'Set up new epic execution with optional worktree isolation'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/4-implementation/implement-epic-with-subagents'

# File References
thisStepFile: '{workflow_path}/steps/step-01c-new.md'
orchestrateFile: '{workflow_path}/steps/step-02-orchestrate.md'
workflowFile: '{workflow_path}/workflow.md'

# State files
sidecarFolder: '{output_folder}/epic-executions'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'

# Agent references
storyPrepAgent: '.claude/agents/story-prep-master.md'
codeReviewAgent: '.claude/agents/principal-code-reviewer.md'
specialistAgentsFolder: '.claude/agents/vt-bmad-dev-agents/'
fallbackDevAgent: '_bmad/bmm/agents/dev.md'
agentCreatorSkill: '.claude/skills/agent-creator/SKILL.md'

# Configuration
baseBranch: 'main'
---

# Step 1C: New Epic Setup

## STEP GOAL:

To set up a fresh epic execution, optionally in an isolated worktree, including mode selection, worktree creation, dependency installation, epic parsing, prerequisite validation, specialist agent creation, and sidecar initialization.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip setup steps
- 📖 CRITICAL: Read the complete step file before taking any action
- 📋 YOU ARE SETTING UP a new epic execution

### Role Reinforcement:

- ✅ You are an Epic Execution Orchestrator
- ✅ This step handles ALL new epic setup
- ✅ Guide user through mode selection and epic choice
- ✅ Ensure all prerequisites are validated before proceeding

### Step-Specific Rules:

- 🎯 Focus ONLY on new epic setup
- 🚫 FORBIDDEN to resume existing work (that's step-01b)
- 💬 Present clear options for execution mode
- 🚪 VALIDATE all prerequisites before creating sidecar

## EXECUTION PROTOCOLS:

- 🎯 Complete all setup steps in sequence
- 💾 Create sidecar only after all validation passes
- 📖 Handle worktree creation and dependency installation
- 🚫 FORBIDDEN to proceed to orchestration without complete setup

## SETUP SEQUENCE:

### 1. Git Sync Check

Before any setup, verify git working directory status:

**Execute checks:**
```bash
git status --porcelain              # Check for uncommitted changes
git fetch origin {baseBranch}       # Fetch latest from remote
git rev-list HEAD...origin/{baseBranch} --count  # Check commits behind/ahead
```

**Display results:**
- ✅ Clean working directory, synced with remote → proceed automatically
- ⚠️ Uncommitted changes found → list files, ask: "[C] Continue anyway | [S] Stop to commit first"
- ⚠️ Behind remote by N commits → warn, ask: "[P] Pull first | [C] Continue anyway"
- ⚠️ Ahead of remote → info only, proceed

**If user chooses to stop:** EXIT workflow, preserve no state.

### 2. Execution Mode Selection

Check `worktree_mode` setting from workflow.yaml:
- If `"always"` → skip prompt, set mode = worktree
- If `"never"` → skip prompt, set mode = main
- If `"ask"` (default) → show prompt below

**Prompt (if asking):**
```
How would you like to run this epic execution?

[W] Separate worktree (Recommended)
    • Isolates epic work from main repo
    • Enables parallel development on other tasks
    • Requires session restart in worktree location
    • Creates: ../{project_name}-epic-{N}/

[M] Main repository
    • Traditional single-repo approach
    • Blocks main repo during execution
    • No session restart required
```

**Store selection for later:** `execution_mode: "worktree" | "main"`

### 3. Load Sprint Status

Read sprint-status.yaml at `{sprintStatus}`:

1. Parse all epic entries
2. Identify epics with status `backlog` or `in-progress`
3. For each epic, count stories in backlog/ready-for-dev

**Display:**
```
Sprint Status Summary:
  Epic 2: Complete Authentication (8 stories) - backlog
  Epic 3: User Onboarding (7 stories) - backlog
  ...
```

### 4. Select Epic to Execute

**If user provided specific epic in initial message:**
- Use that epic, confirm selection

**If multiple epics available:**
- Display list with story counts
- Ask: "Which epic would you like to execute?"
- Options: [1] Epic 2 | [2] Epic 3 | ... | [A] All (sequential)

**Locate epic file:**
- Search `{implementation_artifacts}` for epic-N-*.md matching selection
- Parse and validate epic file

### 5. Worktree Creation (if mode = worktree)

**Skip this section if execution_mode = "main"**

**5.1 Generate paths:**
- Sanitize epic name: lowercase, replace spaces with hyphens, remove special chars
- Branch name: `feature/epic-{epic_number}-{sanitized_epic_name}`
- Worktree directory: `../{project_name}-epic-{epic_number}-{sanitized_epic_name}`

**5.2 Create worktree:**
```bash
git worktree add -b {branch_name} {worktree_directory}
```

**If creation fails:**
- Branch exists: "[U] Use existing branch | [D] Delete and recreate | [A] Abort"
- Directory exists: "[R] Remove and recreate | [A] Abort"
- Display error, ask user to resolve, retry

**5.3 Install dependencies:**
```bash
cd {worktree_directory}
# Auto-detect package manager or use configured dependency_command
npm install  # or yarn, pnpm, bun
cd -
```

**5.4 Environment Files Setup:**

Gitignored files are NOT automatically present in worktrees. Detect and offer to copy them.

**Detection:**
```bash
# Find gitignored files that exist in main repo root
git ls-files --others --ignored --exclude-standard 2>/dev/null | grep -E '^\.(env|local)' | head -20
```

**Filter for environment-related files:**
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.production.local`
- `.local`
- Other files matching `.env*` or `*.local` patterns

**If environment files detected:**

Display:
```
⚠️ Environment Files Detected

These gitignored files exist in your main repo but won't be in the worktree:
  • .env
  • .env.local
  • [other detected files]

[C] Copy these files to worktree (Recommended)
[S] Skip - I'll set these up manually
```

**If user chooses [C]:**
```bash
# Copy each detected env file to worktree
cp {main_repo}/.env {worktree_directory}/.env
cp {main_repo}/.env.local {worktree_directory}/.env.local
# ... repeat for each detected file
```

Display: `✅ Copied X environment file(s) to worktree`

**If user chooses [S]:**
Display: `⚠️ Remember to set up environment files in the worktree before running the app`

**If no environment files detected:**
Skip this section silently, proceed to 5.4.

**5.5 Store worktree config (for sidecar later):**
```yaml
worktree_config:
  enabled: true
  worktree_path: "{absolute_worktree_path}"
  worktree_relative: "{relative_worktree_path}"
  main_repo_path: "{current_repo_path}"
  branch_name: "{branch_name}"
  dependencies_installed: true
  created_at: "{timestamp}"
```

### 6. Create Feature Branch (if mode = main)

**Skip this section if execution_mode = "worktree"**

Create dedicated branch for this epic's work:

1. Generate branch name: `feature/epic-{epic_number}-{sanitized_epic_name}`
2. Execute: `git checkout -b {branch_name}`

**If branch creation fails:** Display error, ask user to resolve, retry.

### 7. Load and Parse Epic

Once epic path is confirmed:

1. Read the complete epic file
2. Parse all stories using pattern: `### Story N.M:`
3. Extract for each story:
   - Story number (N.M)
   - Story title
   - Acceptance criteria summary
4. Build story execution list

**Display parsed stories:**
```
Found X stories in epic:
  - Story N.1: [title]
  - Story N.2: [title]
  ...
```

### 8. Validate Prerequisites

Check all required components exist:

**Agents:**
- [ ] story-prep-master agent at `{storyPrepAgent}`
- [ ] principal-code-reviewer agent at `{codeReviewAgent}`
- [ ] Fallback dev agent at `{fallbackDevAgent}`

**Specialist Agents (Optional):**
- [ ] Check `{specialistAgentsFolder}` for available specialists
- List found specialists with their specialties

**MCP Tools:**
- [ ] Context-7 MCP available (check via tool availability)

**Files:**
- [ ] Sprint-status.yaml exists at `{sprintStatus}`
- [ ] Project-context.md exists (optional, search `**/project-context.md`)

**Display validation results:**
```
Prerequisites Check:
  ✅ story-prep-master agent
  ✅ principal-code-reviewer agent
  ✅ Fallback dev agent
  ✅ Specialist agents folder (X specialists found)
  ✅ Context-7 MCP
  ✅ Sprint-status.yaml
  ⚪ Project-context.md (optional, not found)
```

If any required prerequisite fails → display error and stop.

### 9. Create Specialist Agents

Analyze epic and create specialized dev agents for the stories:

**9.1 Analyze Epic Stories:**
- Read each story title and description from epic file
- Identify technical domains: frontend, backend, API, database, auth, etc.
- Group stories by primary domain

**9.2 Invoke Agent Creator:**
Load and follow `{agentCreatorSkill}` steps 1-4:
- Skip Step 0 (registry check) - always create fresh for this epic
- Step 1: Context already gathered from epic analysis
- Step 2: Design agents based on story domains
- Step 3: Skip community research (use built-in patterns)
- Step 4: Create agent files

**Note:** If execution_mode = "worktree", create agents in the WORKTREE directory.

**9.3 Register Created Agents:**
Store for sidecar:
```yaml
specialist_agents_created:
  - name: "auth-specialist"
    path: ".claude/agents/vt-bmad-dev-agents/auth-specialist.md"
    stories: ["2.1", "2.3", "2.6"]
  - name: "frontend-forms"
    path: ".claude/agents/vt-bmad-dev-agents/frontend-forms.md"
    stories: ["2.2", "2.4", "2.5"]
```

**9.4 Display Summary:**
```
Created X specialist agents for this epic:
  - auth-specialist (3 stories)
  - frontend-forms (3 stories)
  - general-dev (2 stories - fallback)
```

### 10. Create Sidecar State File

Ensure sidecar folder exists:
```bash
mkdir -p {sidecarFolder}
```

Initialize the execution state file at `{sidecarFolder}/epic-{epic_number}-state.yaml`:

```yaml
epic_execution_state:
  epic_file: "{epic_path}"
  epic_name: "{parsed_epic_name}"
  epic_number: {N}
  total_stories: {X}
  current_story: null
  current_phase: "initialized"  # or "awaiting_session_restart" if worktree
  stories_completed: []
  stories_pending: ["N.1", "N.2", ...]
  stories_skipped: []
  stories_failed: []
  execution_log: []
  started_at: "{timestamp}"
  last_updated: "{timestamp}"

execution_mode:
  type: "worktree" | "main"
  selected_at: "{timestamp}"

worktree_config:
  enabled: true | false
  worktree_path: "{path}"  # if worktree
  worktree_relative: "{relative_path}"  # if worktree
  main_repo_path: "{main_repo}"  # if worktree
  branch_name: "{branch}"
  dependencies_installed: true | false
  created_at: "{timestamp}"

git_workflow:
  branch_name: "{branch_name}"
  base_branch: "main"
  created_at: "{timestamp}"

specialist_agents_created:
  - name: "{agent_name}"
    path: "{agent_path}"
    stories: ["N.1", "N.2"]

specialist_agents_available:
  - name: "{agent_name}"
    specialty: "{specialty}"

configuration:
  coverage_threshold: 80
  max_retries: 3
  auto_commit: true

cleanup:
  marked_for_removal: false
  agents_cleaned: false
```

### 11. Route Based on Execution Mode

#### If Worktree Mode:

Update sidecar: `current_phase: "awaiting_session_restart"`

Display:
```
═══════════════════════════════════════════════════════════════
                    WORKTREE READY
═══════════════════════════════════════════════════════════════

Epic worktree created and configured!

📁 Worktree Location:
   {worktree_path}

🔧 Dependencies installed: ✅
🤖 Specialist agents created: {count} agents

═══════════════════════════════════════════════════════════════

NEXT STEPS:

1. Open a NEW terminal/Claude Code session
2. Navigate to: cd {worktree_path}
3. Run: claude (or your Claude Code command)
4. Execute: /implement-epic-with-subagents

The workflow will automatically resume from where we left off.

═══════════════════════════════════════════════════════════════
```

**STOP EXECUTION** - Workflow pauses here. Do not proceed to step-02.

#### If Main Repo Mode:

Update sidecar: `current_phase: "executing"`

Display execution plan summary:
```
**Epic Execution Plan**

**Epic:** {epic_name}
**Stories:** {X} total
**Agents:** 3 orchestrated agents per story
**Estimated Flow:**

For each story:
1. Create story file (story-prep-master)
2. Implement with TDD (specialist or dev agent)
3. Visual inspection (UI stories only)
4. Code review (principal-code-reviewer)
5. Git commit (pre-commit hooks run tests)
6. Update status

**Ready to begin autonomous execution?**

[C] Start Epic Execution
```

**If user confirms [C]:**
→ Load, read entire file, then execute `{orchestrateFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Execution mode selected appropriately
- Worktree created and dependencies installed (if worktree mode)
- Epic file loaded and parsed successfully
- All required prerequisites validated
- Specialist agents created
- Sidecar state file created with all required fields
- Correct routing: pause for worktree OR proceed to orchestration

### ❌ SYSTEM FAILURE:

- Skipping mode selection
- Not creating worktree when mode = worktree
- Not installing dependencies in worktree
- Proceeding without epic file validation
- Not checking for existing sidecar state
- Skipping prerequisite validation
- Starting execution without user confirmation
- Not creating sidecar state file

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
