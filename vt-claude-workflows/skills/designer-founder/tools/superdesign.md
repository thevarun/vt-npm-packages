# SuperDesign Tool Execution

## Overview

SuperDesign is a VS Code extension that generates HTML/CSS prototypes through a structured 4-step workflow.

**Output Location:** `.superdesign/design_iterations/`
**Output Format:** HTML + CSS files

**Assets Location:** `{installed_path}/tools/superdesign-assets/`
- `superdesign-agent-instructions.md` - Full agent instructions for SuperDesign
- `generate-theme.ts` - CLI script for theme generation

---

## Execution Flow

### 1. Prepare Design Request

Frame the design prompt for SuperDesign:

```
DESIGN REQUEST FOR SUPERDESIGN

Feature: {user_intent}

Context:
- {scope_summary}
- {inspiration_references}

Requirements:
- Mobile-first responsive design
- Use Tailwind CSS classes
- Follow existing design tokens if available
- Dark mode support (use existing theme if available)

Style Direction:
- {visual_direction_notes}
```

### 2. Instruct User

Present to user:

```
SUPERDESIGN MODE

SuperDesign uses a 4-step workflow in VS Code:

1. **Layout** - ASCII wireframe defining structure
2. **Theme** - CSS generation with design tokens
3. **Animation** - Micro-interaction specifications
4. **HTML** - Final component output

To proceed:
1. Open VS Code with SuperDesign extension active
2. Start a new SuperDesign session
3. Use the design request above as your starting point
4. Complete all 4 steps, confirming each before proceeding

Let me know when you've completed the SuperDesign workflow.
```

### 3. Wait for Completion

User completes SuperDesign workflow externally.

### 4. Confirm Output

After user indicates completion:

```
SUPERDESIGN OUTPUT

Please confirm the output file location.
Default: .superdesign/design_iterations/

What is the filename? (e.g., feedback_widget_1.html)
```

Store:
- `design.output_location` = confirmed file path
- `design.tool_used` = "superdesign"

### 5. Offer Review Options

```
SuperDesign prototype complete!

Location: {output_location}

Options:
[V] View - Open in browser to review
[P] Screenshot - Capture with Playwright {if available, else "(not configured)"}
[I] Iterate - Make changes in SuperDesign
[C] Continue - Proceed to next step
```

**If V (View):**
- Provide file path for user to open in browser
- Wait for feedback

**If P (Screenshot) and Playwright available:**
- Use Playwright MCP to:
  1. Navigate to file:// URL
  2. Capture desktop screenshot
  3. Resize viewport to mobile (375px)
  4. Capture mobile screenshot
- Present screenshots for review

**If I (Iterate):**
- User returns to SuperDesign
- Repeat from step 3

**If C (Continue):**
- Return control to parent step

---

## Output State

After completion, set:

```yaml
design:
  tool_used: superdesign
  output_location: "{confirmed_path}"
  output_format: html
  needs_conversion: true  # HTML needs React conversion
```

---

## Conversion Notes

SuperDesign outputs HTML/CSS, not React components. The conversion step will need to:
1. Analyze HTML structure
2. Map to shadcn components
3. Optionally use MagicPatterns for complex custom components

---

## Reference: SuperDesign Assets

The full SuperDesign agent instructions and theme CLI are co-located with this workflow:

```
{installed_path}/tools/superdesign-assets/
├── superdesign-agent-instructions.md  # Complete 4-step workflow instructions
└── generate-theme.ts                  # Theme generation CLI script
```

**Theme CLI Usage:**
```bash
# From file input
npx tsx {installed_path}/tools/superdesign-assets/generate-theme.ts \
  --name "Theme Name" \
  --output .superdesign/design_iterations/theme_1.css \
  --input /path/to/theme-content.css

# From stdin
echo ':root { ... }' | npx tsx {installed_path}/tools/superdesign-assets/generate-theme.ts \
  --name "Theme Name" \
  --output .superdesign/design_iterations/theme_1.css
```

If updating SuperDesign (e.g., from GitHub), replace the files in `superdesign-assets/`.
