# Direct Component Mapping Tool Execution

## Overview

Skip visual prototyping and map directly to shadcn/ui components. Best for standard UI patterns where the structure is clear.

**Output:** Component mapping document
**Requires:** shadcn MCP (optional, CLI fallback available)

---

## Execution Flow

### 1. Understand Requirements

```
DIRECT MAPPING MODE

I'll map your requirements directly to shadcn/ui components.

Let me understand what you need:

1. What type of UI is this? (form, dashboard, list, modal, etc.)
2. What data/content will it display?
3. What actions can users take?
```

### 2. Identify Component Needs

Based on requirements, identify needed components:

```
COMPONENT ANALYSIS

For: {user_intent}

Identified UI patterns:
- {pattern_1}: Needs {component_type}
- {pattern_2}: Needs {component_type}
- ...
```

### 3. Search shadcn Registry (if MCP available)

If shadcn MCP is available:
```
Searching shadcn registry for matching components...
```

Use MCP to search for each identified pattern.

If shadcn MCP not available:
```
shadcn MCP not configured. Using known component list.

Available shadcn/ui components:
- Layout: Card, Separator, Sheet, Tabs
- Forms: Form, Input, Label, Select, Checkbox, Radio, Switch, Textarea
- Feedback: Alert, Badge, Toast, Tooltip
- Navigation: Breadcrumb, Dropdown Menu, Navigation Menu
- Data: Table, Data Table
- Overlay: Dialog, Drawer, Popover, Alert Dialog
- Other: Accordion, Avatar, Button, Calendar, Command, Skeleton

Docs: https://ui.shadcn.com/docs/components
```

### 4. Generate Component Mapping

```
COMPONENT MAPPING

Page/Feature: {feature_name}

## Structure

┌─ {Section 1} ────────────────────────────────────────────────┐
│                                                              │
│  UI Element          →  shadcn Component   →  Props/Notes   │
│  ─────────────────────────────────────────────────────────── │
│  {element}           →  {component}        →  {notes}       │
│  {element}           →  {component}        →  {notes}       │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌─ {Section 2} ────────────────────────────────────────────────┐
│                                                              │
│  {element}           →  {component}        →  {notes}       │
│  {element}           →  CUSTOM             →  {approach}    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

## Installation

```bash
npx shadcn@latest add {component1} {component2} {component3}
```

## Custom Components Needed

{list any elements that don't map to shadcn}
```

### 5. Handle Custom Components

For elements that don't map to shadcn:

```
CUSTOM COMPONENT: {name}

This element doesn't have a direct shadcn match.

Options:
[B] Build from primitives - Compose using Radix + Tailwind
[M] MagicPatterns - Generate via AI {if available}
[R] Research - Search for existing solutions
[S] Skip - Handle during implementation
```

### 6. Present Final Mapping

```
COMPONENT MAPPING COMPLETE

Summary:
- shadcn components: {count}
- Custom components: {count}

Installation command ready:
npx shadcn@latest add {all_components}

Options:
[A] Adjust - Modify component choices
[S] Search - Look up more components {if MCP available}
[C] Continue - Mapping is approved
```

---

## Output State

After completion, set:

```yaml
design:
  tool_used: direct
  output_location: "inline"
  output_format: mapping
  needs_conversion: false  # Already mapped
  components:
    shadcn:
      - name: "{component}"
        usage: "{where used}"
        props: "{key props}"
    custom:
      - name: "{component}"
        approach: "{how to build}"
        complexity: "{low/medium/high}"
  install_command: "npx shadcn@latest add {components}"
```

---

## Common Patterns Quick Reference

### Form Pattern
```
Login/Signup Form:
- Card (container)
- Form (wrapper)
- Input + Label (fields)
- Button (submit)
- Separator (dividers)

Install: npx shadcn@latest add card form input label button separator
```

### Dashboard Pattern
```
Dashboard Page:
- Card (stat cards, content sections)
- Table or Data Table (lists)
- Badge (status indicators)
- Dropdown Menu (actions)
- Tabs (content organization)

Install: npx shadcn@latest add card table badge dropdown-menu tabs
```

### Settings Pattern
```
Settings Page:
- Tabs (sections)
- Form + Input + Label (fields)
- Switch (toggles)
- Select (dropdowns)
- Button (save actions)
- Alert (notifications)

Install: npx shadcn@latest add tabs form input label switch select button alert
```

### Modal Pattern
```
Modal/Dialog:
- Dialog (container)
- Form elements (content)
- Button (actions)

Install: npx shadcn@latest add dialog button
```

### List Pattern
```
Item List:
- Card (item container)
- Badge (status)
- Dropdown Menu (actions)
- Skeleton (loading state)

Install: npx shadcn@latest add card badge dropdown-menu skeleton
```
