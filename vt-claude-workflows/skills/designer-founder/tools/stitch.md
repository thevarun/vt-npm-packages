# Stitch Tool Execution

## Overview

Stitch is Google's AI design tool that generates web UI screens from text prompts.
This tool requires Stitch MCP to be configured.

**Output Location:** `.stitch/screens/`
**Output Format:** HTML + CSS files + screenshots
**MCP Tools Available:** `generate_screen_from_text`, `get_screen`, `list_screens`, `list_projects`, `get_project`, `create_project`, `edit_screens`, `generate_variants`

---

## Prerequisites

Check availability before proceeding:

```
Stitch MCP: [check if mcp__stitch* or stitch* tools available]
react-components skill: [check if installed via `npx skills list`]
```

### If Stitch MCP not available:

```
STITCH MCP NOT CONFIGURED

Stitch MCP is required for this design tool.

To use Stitch:
1. Configure Stitch MCP server (see stitch.withgoogle.com/docs/mcp/guide/)
2. Restart Claude Code

Alternative options:
[S] SuperDesign - HTML/CSS prototype
[M] MagicPatterns - AI-generated React components
[B] Back to tool selection
```

### If react-components skill not installed:

```
STITCH SKILL RECOMMENDED

Google's react-components skill enhances HTML->React conversion.

Install with:
npx skills add google-labs-code/stitch-skills --skill react-components -g -a claude-code -y

Then restart Claude Code and try again.

[C] Continue without skill - Use standard conversion
[B] Back to tool selection
```

---

## Content Limitations

Stitch works best for **full-page layouts** (landing pages, dashboards, settings screens, forms).

Stitch is NOT suitable for:
- Component showcases or design system pages
- Individual component generation (use MagicPatterns instead)
- Design token documentation

---

## Execution Flow

### 1. Theme Reference

Theme tokens should be established before design. If a theme was provided in Step 1, reference it in the design prompt. If no theme was provided, proceed with tool defaults.

---

### 2. Prepare Design Prompt

Frame the design request from context:

```
DESIGN REQUEST FOR STITCH

Feature: {user_intent}

Context:
- {scope_summary}
- {inspiration_references}

Requirements:
- Responsive design (desktop-first)
- Tailwind CSS classes
- {additional_context_from_scope}

{if theme provided}
THEME:
[Include relevant sections from theme.prompt.md - colors, typography, component styles]
[Reference token values from theme.tokens.json for precise color matching]
{/if}

Style Direction:
- {visual_direction_notes}
- {inspiration_sources}
```

---

### 3. Create or Select Project

**If `stitch.json` exists in project root with projectId:**

```
EXISTING STITCH PROJECT FOUND

Project: {project_title}
Project ID: {projectId}

[C] Continue with this project
[N] Create new project
```

**If no existing project or user selects [N]:**

```
Creating new Stitch project...
```

```
Tool: create_project
Parameters:
  title: "{feature_name} Design"
  description: "{user_intent summary}"
```

Save projectId to `stitch.json` for future sessions:

```json
{
  "projectId": "{created_project_id}",
  "projectTitle": "{project_title}",
  "createdAt": "{timestamp}"
}
```

---

### 4. Generate Screen

```
GENERATING DESIGN

Feature: {user_intent}
Project: {project_name}

Generating screen (this takes 1-3 minutes)...
```

```
Tool: generate_screen_from_text
Parameters:
  projectId: "{projectId}"
  prompt: "{constructed_prompt}"
  deviceType: "DESKTOP"
  modelId: "GEMINI_3_PRO"
```

**IMPORTANT:** Always use `modelId: "GEMINI_3_PRO"` for higher quality output (not Flash).

### Generation Timing

Screens take **1-3 minutes** to generate (per Stitch MCP documentation).

**DO NOT RETRY** if the tool call appears slow. The built-in Stitch MCP docs explicitly state: "This action can take a few minutes. DO NOT RETRY."

After firing the generation request:
```
Screen is generating (1-3 min). I'll check the result shortly.
```

- `list_screens` will NOT show the screen until generation completes
- Wait at least 90 seconds before assuming failure
- If the tool call fails with a connection error, the generation may still succeed server-side -- try `get_screen` or `list_screens` later to check

---

### 5. Retrieve and Save Assets

After generation completes:

```
Tool: get_screen
Parameters:
  projectId: "{projectId}"
  screenId: "{screenId}"
```

Create output directory if needed:
```
mkdir -p .stitch/screens/
```

Download and save assets:
- **HTML:** `htmlCode.downloadUrl` -> save to `.stitch/screens/{page}.html`
- **Screenshot:** `screenshot.downloadUrl` -> save to `.stitch/screens/{page}.png`

**IMPORTANT:** Do NOT download/export HTML until the user has reviewed and approved the design on the Stitch platform.

---

### 6. Present Result

```
DESIGN CREATED

Project: {project_name}
Screen: {screen_title}

Files saved:
- HTML: .stitch/screens/{page}.html
- Preview: .stitch/screens/{page}.png

Please review the design on the Stitch platform.

Options:
[V] View - Display screenshot
[E] Edit - Request changes via edit_screens
[A] Alternatives - Generate design variants
[C] Continue - Design approved, proceed to next step
```

### Handle User Selection

**If V (View):**
- Display the screenshot image from `.stitch/screens/{page}.png`
- Return to options

**If E (Edit):**
Use `edit_screens` for iteration instead of regenerating from scratch:
```
What changes would you like to make?
```

```
Tool: edit_screens
Parameters:
  projectId: "{projectId}"
  screenId: "{screenId}"
  prompt: "{user_change_request}"
```

Wait for edit to complete (same timing rules as generation), then retrieve updated assets.
Return to step 6.

**If A (Alternatives):**
Offer variant generation when user wants to explore alternatives:

```
GENERATE VARIANTS

How different should the variants be?

[R] Refine - Subtle variations (same structure, minor tweaks)
[E] Explore - Moderate changes (layout shifts, style changes)
[I] Reimagine - Significantly different approaches

How many variants? [1-5, default: 3]

What aspects to vary?
[L] Layout
[C] Color scheme
[T] Typography
[A] All aspects
```

```
Tool: generate_variants
Parameters:
  projectId: "{projectId}"
  screenId: "{screenId}"
  creativeRange: "[REFINE | EXPLORE | REIMAGINE]"
  aspects: ["LAYOUT", "COLOR_SCHEME", ...]
  variantCount: {count}
```

Present variants for comparison and selection. Selected variant becomes the active design.

**If C (Continue):**
- Store design state
- Return control to parent step (step-03-design.md)

---

## Output State

After completion, set:

```yaml
design:
  tool_used: stitch
  output_location: ".stitch/screens/{page}.html"
  output_format: html
  needs_conversion: true  # HTML needs React conversion in Step 4
  screenshot: ".stitch/screens/{page}.png"
  stitch_project_id: "{projectId}"
  stitch_screen_id: "{screenId}"
```

---

## Design Registry Pattern

When creating multiple screens (scope has multiple items), track progress:

```yaml
designs:
  - name: "{scope_item_name}"
    screen_id: "{id_or_pending}"
    status: [pending | created | approved]
    html_path: ".stitch/screens/{name}.html"
    screenshot_path: ".stitch/screens/{name}.png"
```

### Batch Generation Flow

If scope has multiple items:

```
SCOPE ITEMS TO DESIGN

You have {count} items to design:
{foreach scope_item}
[ ] {item_name}
{/foreach}

Options:
[A] All at once - Generate all designs in sequence
[O] One by one - Generate and approve each individually

Which approach? [A/O]
```

**If A (All at once):**
- Generate each design in sequence (DO NOT fire multiple generations simultaneously)
- Track status in design registry
- Present all for review at end

**If O (One by one):**
- Generate first design
- Present for approval
- On approval, move to next
- Repeat until all complete

---

## Conversion Notes

Stitch outputs HTML/CSS with Tailwind classes. The conversion step (Step 4) offers two paths:

1. **Quick shadcn mapping** - Our standard `conversion.md` flow
2. **Google's react-components** - Full modular React architecture with AST validation

Both are presented in Step 4 when `design.tool_used` = `stitch`.

---

## Reference: Stitch MCP Tools

| Tool | Purpose |
|------|---------|
| `list_projects` | Get all Stitch projects |
| `get_project` | Get project details |
| `create_project` | Create new project |
| `list_screens` | Get all screens in project |
| `get_screen` | Get screen details + download URLs |
| `generate_screen_from_text` | Generate new screen from prompt (use `modelId: "GEMINI_3_PRO"`) |
| `edit_screens` | Edit existing screens via prompt (use for iteration) |
| `generate_variants` | Create design variations with creative range control |
