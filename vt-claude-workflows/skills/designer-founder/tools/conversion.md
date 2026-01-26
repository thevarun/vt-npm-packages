# HTML to React Conversion Tool

## Overview

Convert SuperDesign HTML/CSS output to React components. Used when `design.tool_used` = `superdesign`.

---

## Conversion Strategies

### Strategy C: Component Mapping (Recommended)

Analyze HTML structure and map to shadcn/ui components.

**Best for:** Standard UI patterns, minimal custom styling

### Strategy M: MagicPatterns Conversion

Use MagicPatterns AI to generate React code from the design.

**Best for:** Complex custom components, unique designs

### Strategy H: Hybrid

Map standard elements to shadcn, use MagicPatterns for custom components.

**Best for:** Mix of standard and custom elements

---

## Execution Flow

### 1. Present Conversion Options

```
CONVERSION STRATEGY

Your SuperDesign prototype is HTML/CSS. Let's convert to React components.

Prototype location: {design.output_location}

Choose your approach:

[C] Component Mapping (Recommended)
    → Analyze HTML and map to shadcn components
    → You install via CLI, minimal custom code
    → Best for: Standard UI patterns

[M] MagicPatterns Conversion {if available, else "(not configured)"}
    → Generate React code from the design
    → Direct component code output
    → Best for: Complex custom components

[H] Hybrid
    → Map standard elements to shadcn
    → Use MagicPatterns for custom components
    → Best for: Mix of standard and custom

Which approach? [C/M/H]
```

---

### 2A. Component Mapping Execution

```
ANALYZING HTML STRUCTURE

Reading: {design.output_location}
```

Parse and identify:
- Semantic structure (header, main, footer, sections)
- Interactive elements (buttons, forms, links)
- Layout patterns (grid, flex, containers)
- Custom styled elements

Generate mapping:
```
HTML TO SHADCN MAPPING

┌─ Analysis ───────────────────────────────────────────────────┐
│                                                              │
│  HTML Element         shadcn Match        Confidence         │
│  ─────────────────────────────────────────────────────────── │
│  <header>             -                   Layout only        │
│  <nav>                NavigationMenu      High               │
│  <button.primary>     Button              High               │
│  <div.card>           Card                High               │
│  <input>              Input               High               │
│  <form>               Form                High               │
│  <div.modal>          Dialog              High               │
│  <div.custom-widget>  CUSTOM              Needs build        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

SHADCN COMPONENTS IDENTIFIED

✓ Button - Primary and secondary actions
✓ Card - Content containers
✓ Input - Form fields
✓ Form - Form wrapper with validation
✓ Dialog - Modal overlays
{... more as identified}

CUSTOM ELEMENTS (No direct match)

1. {element_description}
   - HTML: {relevant html snippet}
   - Suggestion: {how to build with primitives}

2. {another_element}
   ...
```

If shadcn MCP available, verify components:
```
Verifying components in shadcn registry...
✓ All identified components available
```

For custom elements:
```
CUSTOM ELEMENT: {name}

No direct shadcn match. Options:

[B] Build from primitives
    Compose using: {suggested_primitives}

[M] MagicPatterns {if available}
    Generate React code for this specific component

[S] Skip
    Handle during implementation

Choice? [B/M/S]
```

---

### 2B. MagicPatterns Conversion Execution

```
MAGICPATTERNS CONVERSION

Preparing design reference...
```

If Playwright available, take screenshot of HTML file for reference.

Create design request:
```
Tool: create_design
Parameters:
  prompt: "Convert this HTML/CSS design to React components:

           Structure:
           - {describe main sections from HTML}
           - {describe key components}

           Requirements:
           - React with TypeScript
           - Tailwind CSS (match existing styles)
           - Break into reusable components
           - Follow shadcn/ui patterns where applicable
           - Responsive design preserved"

  imageUrls: [{screenshot_url_if_available}]
```

After generation:
```
REACT CODE GENERATED

Design URL: {url}

Files available:
- {file_list}

[R] Read all code
[V] View specific file
[U] Update - Request changes
[C] Continue with generated code
```

Extract code via `read_files` when user approves.

---

### 2C. Hybrid Execution

Combine both approaches:

```
HYBRID CONVERSION

Step 1: Mapping standard elements to shadcn
Step 2: Using MagicPatterns for custom components

Starting analysis...
```

1. Run component mapping analysis
2. Identify elements that map cleanly to shadcn
3. Identify custom elements that need generation
4. For each custom element, use MagicPatterns:
   ```
   Generating custom component: {name}
   ```
5. Combine into unified component list

---

### 3. Generate Installation Command

After any conversion strategy:

```
INSTALLATION READY

shadcn components to install:
```bash
npx shadcn@latest add {all_identified_components}
```

Custom components:
- {list custom components and their approach}

MagicPatterns code (if any):
- {component}: {url} - Extract via MCP
```

---

## Output State

After conversion, update:

```yaml
conversion:
  strategy: [mapping | magicpatterns | hybrid]
  shadcn_components:
    - name: "{component}"
      usage: "{where used}"
  custom_components:
    - name: "{component}"
      approach: "{build method}"
      source: [primitives | magicpatterns]
      code: "{if extracted}"
  install_command: "npx shadcn@latest add {components}"
```

---

## Mapping Reference

### Common HTML → shadcn Mappings

| HTML Pattern | shadcn Component |
|--------------|------------------|
| `<button>` | Button |
| `<input type="text">` | Input |
| `<input type="checkbox">` | Checkbox |
| `<select>` | Select |
| `<form>` | Form |
| `<div class="card">` | Card |
| `<div class="modal">` | Dialog |
| `<div class="dropdown">` | DropdownMenu |
| `<table>` | Table |
| `<div class="tabs">` | Tabs |
| `<div class="accordion">` | Accordion |
| `<span class="badge">` | Badge |
| `<div class="alert">` | Alert |
| `<div class="tooltip">` | Tooltip |
