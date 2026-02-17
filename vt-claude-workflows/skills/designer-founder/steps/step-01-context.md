# Step 1: Context & Mode Selection

## MANDATORY EXECUTION RULES (READ FIRST)

- NEVER assume project state without checking
- CRITICAL: Read complete step file before taking action
- ALWAYS treat this as collaborative discovery
- Goal: Understand where we are and what mode to use

---

## YOUR TASK

Establish context and select the appropriate workflow mode based on project state and user intent.

---

## TASK SEQUENCE

### 0. Check for Returning Session

Before greeting, check for a previous session state file:

**Look for:** `{planning_artifacts}/ux-design/.designer-state.yaml`

**If found:**
```
Welcome back, {user_name}! I see a previous design session:

Previous session:
- Tool: {tool_used}
- Theme: {theme_path_or_none}
- Mode: {mode}

[Y] Same settings - Jump to Step 2 (Scope)
[R] Review - Show full state, let me modify
[N] Start fresh - Run full setup
```

- **Y**: Load previous state into working memory, skip to Step 2 (Scope)
- **R**: Show all saved state fields, let user confirm/modify each, then proceed
- **N**: Continue with normal Step 1 below

**If not found:** Continue with normal Step 1 below.

---

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
- **Greenfield**: No relevant specs found -> Need to establish design direction
- **Mid-project**: Specs exist -> Pull context, focus on specific scope

**Report findings concisely:**
```
Project Context:
- [Greenfield / Existing project with specs]
- Related artifacts found: [list or "none"]
- Relevant epics/stories: [list or "none"]
```

---

### 3. Detect Theme

Search for theme files in the project. Themes follow a two-file convention:
- `{name}.prompt.md` -- Human-readable design rules (vibe, typography, components, animation)
- `{name}.tokens.json` -- Machine-readable HSL values for shadcn CSS variables

**Detection:** Search for `**/themes/*.prompt.md` or `**/themes/*.tokens.json` in:
1. Project root
2. One level up (`../`)

**If theme files found:**
```
Theme detected: {theme_name}
- Prompt: {path to .prompt.md}
- Tokens: {path to .tokens.json}

Should I use these for design consistency? (Recommended)
[Y] Yes - Use this theme
[N] No - Continue without theme
```

**If theme files NOT found:**
```
No theme files detected in the project.

[P] Provide theme - Point me to your theme files
[S] Skip - Continue without a theme (tool defaults will be used)
```

**If theme is from outside the project** (e.g., `../vt-design-studio/themes/`):
- Copy theme files to `{planning_artifacts}/themes/`
- Reference the local copy in all subsequent steps

---

### 4. Check Available Tools

Detect and report tool availability:

```
Available Tools:
[check] SuperDesign - HTML/CSS prototyping
[check] MagicPatterns MCP - React component generation
[check] Stitch MCP - Google AI design tool
[check] shadcn MCP - Component search & install
```

Note: shadcn CLI (`npx shadcn@latest add`) is always available as fallback.

---

### 5. Present Mode Selection

Based on context, recommend a mode and let user choose:

```
WORKFLOW MODE

Based on your request, I recommend: [Quick Prototype / Production Flow]

[Q] Quick Prototype
    -> Fast visual exploration
    -> Output: HTML prototype or wireframe
    -> Best for: Testing ideas, exploring directions

[P] Production Flow
    -> Full dev-ready artifacts
    -> Output: Component strategy, layouts, user journeys
    -> Best for: Features going into the product

Which mode? [Q/P]
```

**Recommendation logic:**
- User says "explore", "try", "prototype", "quick" -> Recommend Quick
- User mentions specific epic/story, "build", "implement" -> Recommend Production
- Greenfield project, first design -> Recommend Production (establish foundation)
- Uncertain -> Ask user

---

### 6. Confirm and Route

Once user selects mode, confirm and route:

**If Quick Prototype:**
```
Quick Prototype mode selected.

We'll skip detailed specs and focus on rapid visualization.
Ready to move to design tool selection.
```
-> Proceed to Step 3 (skip Step 2)

**If Production Flow:**
```
Production Flow selected.

We'll create dev-ready artifacts including:
- Component strategy with shadcn mappings
- Page layouts (responsive)
- User journeys (if multi-step flow)

Let's define the scope first.
```
-> Proceed to Step 2

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
  stitch: [true/false]
  shadcn_mcp: [true/false]
theme:
  name: "{theme_name}"
  prompt_file: "{path to .prompt.md}"
  tokens_file: "{path to .tokens.json}"
  is_local: true/false  # whether files are in the project
```

---

## NEXT STEP

- If mode = `quick_prototype`: Load `./step-03-design.md`
- If mode = `production`: Load `./step-02-scope.md`
