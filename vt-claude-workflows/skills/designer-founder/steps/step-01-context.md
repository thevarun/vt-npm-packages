# Step 1: Context & Mode Selection

## MANDATORY EXECUTION RULES (READ FIRST)

- 🛑 NEVER assume project state without checking
- 📖 CRITICAL: Read complete step file before taking action
- ✅ ALWAYS treat this as collaborative discovery
- 🎯 Goal: Understand where we are and what mode to use

---

## YOUR TASK

Establish context and select the appropriate workflow mode based on project state and user intent.

---

## TASK SEQUENCE

### 1. Greet and Understand Intent

Start with a brief greeting using `{user_name}` and ask what they'd like to design:

```
Hey {user_name}! I'm ready to help you design.

What are you looking to create today?
```

Wait for user input describing what they want to design.

---

### 2. Detect Project State

After user describes their intent, quickly assess:

**Check for existing project artifacts:**
- `_bmad-output/planning-artifacts/` - Do specs exist?
- `_bmad-output/planning-artifacts/ux-design/` - Existing design docs?
- Epic/story files related to user's intent?

**Determine project phase:**
- **Greenfield**: No relevant specs found → Need to establish design direction
- **Mid-project**: Specs exist → Pull context, focus on specific scope

**Report findings concisely:**
```
Project Context:
- [Greenfield / Existing project with specs]
- Related artifacts found: [list or "none"]
- Relevant epics/stories: [list or "none"]
```

---

### 3. Check Available Tools

Detect and report tool availability:

```
Available Tools:
✓ SuperDesign - HTML/CSS prototyping
[✓/✗] MagicPatterns MCP - React component generation
[✓/✗] shadcn MCP - Component search & install
[✓/✗] Playwright MCP - Screenshot verification
```

Note: shadcn CLI (`npx shadcn@latest add`) is always available as fallback.

---

### 4. Present Mode Selection

Based on context, recommend a mode and let user choose:

```
WORKFLOW MODE

Based on your request, I recommend: [Quick Prototype / Production Flow]

[Q] Quick Prototype
    → Fast visual exploration
    → Output: HTML prototype or wireframe
    → Best for: Testing ideas, exploring directions

[P] Production Flow
    → Full dev-ready artifacts
    → Output: Component strategy, layouts, user journeys
    → Best for: Features going into the product

Which mode? [Q/P]
```

**Recommendation logic:**
- User says "explore", "try", "prototype", "quick" → Recommend Quick
- User mentions specific epic/story, "build", "implement" → Recommend Production
- Greenfield project, first design → Recommend Production (establish foundation)
- Uncertain → Ask user

---

### 5. Confirm and Route

Once user selects mode, confirm and route:

**If Quick Prototype:**
```
Quick Prototype mode selected.

We'll skip detailed specs and focus on rapid visualization.
Ready to move to design tool selection.
```
→ Proceed to Step 3 (skip Step 2)

**If Production Flow:**
```
Production Flow selected.

We'll create dev-ready artifacts including:
- Component strategy with shadcn mappings
- Page layouts (responsive)
- User journeys (if multi-step flow)

Let's define the scope first.
```
→ Proceed to Step 2

---

## COLLABORATION MENU

After confirming mode, present:

```
[A] Advanced - Deep dive into project context
[P] Party Mode - Get multiple agent perspectives
[C] Continue - Proceed to next step
```

**Menu Handlers:**
- **A**: Load `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml` for deeper discovery
- **P**: Load `{project-root}/_bmad/core/workflows/party-mode/workflow.md` for multi-perspective input
- **C**: Proceed to next step based on mode selection

---

## STATE TO CARRY FORWARD

Store in working memory for subsequent steps:

```yaml
mode: [quick_prototype | production]
user_intent: "[what user wants to design]"
project_state: [greenfield | existing]
related_artifacts: [list of relevant files found]
tools_available:
  superdesign: true
  magicpatterns: [true/false]
  shadcn_mcp: [true/false]
  playwright: [true/false]
```

---

## NEXT STEP

- If mode = `quick_prototype`: Load `./step-03-design.md`
- If mode = `production`: Load `./step-02-scope.md`

Remember: Do NOT proceed until user explicitly selects [C]
