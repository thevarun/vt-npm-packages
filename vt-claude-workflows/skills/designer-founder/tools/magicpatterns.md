# MagicPatterns Tool Execution

## Overview

MagicPatterns is an AI design tool that generates React components directly. Requires MagicPatterns MCP to be configured.

**Output:** React component code + hosted design URL
**MCP Tools Used:** `create_design`, `get_design`, `read_files`, `update_design`

---

## Prerequisites

Check MCP availability:
```
MagicPatterns MCP: [check if mcp__magicpatterns tools available]
```

If not available, inform user:
```
MagicPatterns MCP is not configured.

To use MagicPatterns:
1. Configure MCP server (see magicpatterns.com/docs)
2. Or use MagicPatterns directly in browser and share the URL

Alternative options:
[S] SuperDesign - HTML/CSS prototype
[W] Wireframe - Structure first
[D] Direct - Map to components directly
```

---

## Execution Flow

### 1. Frame Design Prompt

Construct prompt from context:

```
{user_intent}

Requirements:
- Use React with TypeScript
- Tailwind CSS for styling
- Responsive design (mobile-first)
- {additional_context_from_scope}

Style:
- {inspiration_notes}
- Clean, modern aesthetic
- Consistent with shadcn/ui patterns
```

### 2. Create Design

Use MCP tool:
```
Tool: create_design
Parameters:
  prompt: "{constructed_prompt}"
  imageUrls: [{inspiration_image_urls}]  // optional
```

### 2.5 Handle Empty Response

If `create_design` returns no URL or empty response:

```
DESIGN CREATION ISSUE

The design may have been created but the URL wasn't returned.

Options:
[P] Paste URL - I'll provide the URL from MagicPatterns browser
[R] Retry - Try creating the design again
[S] Switch - Use a different design tool
```

**If P (Paste URL):**
- Accept URL from user
- Validate format (must contain `magicpatterns.com/c/` or `magicpatterns.app`)
- Call `get_design` to verify design exists
- If valid, continue to step 3
- If invalid, show error and return to options

**If R (Retry):**
- Re-execute step 2 with same parameters
- If fails again, suggest P or S options

**If S (Switch):**
- Return to tool selection in step-03-design.md
- Mark current design attempt as abandoned

### 3. Present Result

```
DESIGN CREATED

Preview URL: {preview_url}
Editor URL: {editor_url}

Please review the design in MagicPatterns.

Options:
[U] Update - Request changes
[R] Read Code - Extract React component code
[V] View Files - List available files
[C] Continue - Design is approved
```

### 4. Handle User Selection

**If U (Update):**

Ask what changes are needed:
```
What changes would you like to make?
```

Use MCP tool:
```
Tool: update_design
Parameters:
  url: "{design_url}"
  prompt: "{user_change_request}"
```

Return to step 3 after update completes.

**If V (View Files):**

Use MCP tool:
```
Tool: get_design
Parameters:
  url: "{design_url}"
```

Present file list:
```
Available files in design:
- {file_1}
- {file_2}
- ...

Which files would you like to read? [comma-separated list or 'all']
```

**If R (Read Code):**

First get file list if not already retrieved:
```
Tool: get_design
Parameters:
  url: "{design_url}"
```

Then read files:
```
Tool: read_files
Parameters:
  url: "{design_url}"
  fileNames: [{selected_files}]
```

Present code:
```
REACT CODE EXTRACTED

{file_contents}

Options:
[S] Save - Store code for artifact generation
[A] Adjust - Request changes
[C] Continue - Code is approved
```

**If C (Continue):**
- Store design URL and any extracted code
- Return control to parent step

---

## Output State

After completion, set:

```yaml
design:
  tool_used: magicpatterns
  output_location: "{design_url}"
  output_format: react
  needs_conversion: false  # Already React
  extracted_code:
    files:
      - name: "{filename}"
        content: "{code}"
  design_id: "{id_from_url}"
```

---

## Using MagicPatterns for Conversion

MagicPatterns can also convert existing designs (from SuperDesign HTML) to React:

```
Tool: create_design
Parameters:
  prompt: "Convert this HTML design to React components with Tailwind CSS:
           [describe the HTML structure]

           Requirements:
           - TypeScript
           - Tailwind CSS
           - Break into reusable components
           - Follow shadcn/ui patterns"
  imageUrls: [{screenshot_of_html_design}]  // if available
```

This is useful in the conversion step when the user chooses MagicPatterns for HTML→React conversion.

---

## Design Registry Pattern

When creating multiple designs (e.g., auth flows with 6 screens), maintain a registry to track progress:

### Registry Structure

```yaml
designs:
  - name: "{scope_item_name}"
    url: "{url_or_pending}"
    status: [pending | created | approved]
    files: [list from get_design]
```

### Progress Display

After each design is created or approved, show progress:

```
DESIGN PROGRESS: {completed} of {total} complete

{foreach design in designs}
{if status = approved}✓{/if}{if status = created}◐{/if}{if status = pending}○{/if} {name} - {status}{if url} ({url}){/if}
{/foreach}

Options:
[N] Next - Create next pending design
[R] Review - Review a specific design
[C] Continue - Proceed to artifacts (if all approved)
```

### Batch Creation Flow

When scope has multiple items:

1. **Show scope overview:**
   ```
   DESIGNS TO CREATE ({count} items)

   {foreach scope_item}
   ○ {item_name}
   {/foreach}

   Options:
   [O] One-by-one - Create and approve each design individually
   [B] Batch - Create all designs, then review together
   ```

2. **If One-by-one:** Execute steps 1-4 for each item, updating registry after each

3. **If Batch:**
   - Create all designs (steps 1-3) without waiting for approval
   - Present all designs for bulk review
   - Allow individual updates before final approval

### Registry State

Store in workflow context:

```yaml
design_registry:
  total_items: {count}
  completed: {approved_count}
  designs:
    - name: "Sign In"
      url: "https://magicpatterns.com/c/abc123"
      status: approved
      files: ["SignInForm.tsx", "styles.css"]
    - name: "Sign Up"
      url: "https://magicpatterns.com/c/def456"
      status: created
      files: ["SignUpForm.tsx"]
    - name: "Forgot Password"
      url: null
      status: pending
      files: []
```
