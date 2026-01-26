# Wireframe Tool Execution

## Overview

Text-based wireframing for structure-first design. Always available, no external tools required.

**Output:** ASCII wireframe or Excalidraw file
**Output Location:** Inline or `_bmad-output/planning-artifacts/ux-design/`

---

## Execution Flow

### 1. Gather Structure Requirements

Ask clarifying questions:
```
WIREFRAME MODE

Before I sketch the layout, let me understand the structure:

1. What are the main sections/areas needed?
2. What's the primary action users should take?
3. Any specific layout preferences? (sidebar, full-width, centered, etc.)
```

### 2. Generate ASCII Wireframe

Create wireframe based on requirements:

```
{feature_name} - WIREFRAME

┌─────────────────────────────────────────────────────────────┐
│  [Logo]                    [Nav] [Nav] [Nav]    [Avatar ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────────────────────────────────────────┐      │
│    │                                                 │      │
│    │              [Main Content Area]                │      │
│    │                                                 │      │
│    │    ┌───────────┐  ┌───────────┐  ┌───────────┐  │      │
│    │    │  Card 1   │  │  Card 2   │  │  Card 3   │  │      │
│    │    │           │  │           │  │           │  │      │
│    │    └───────────┘  └───────────┘  └───────────┘  │      │
│    │                                                 │      │
│    │              [Primary CTA Button]               │      │
│    │                                                 │      │
│    └─────────────────────────────────────────────────┘      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Footer Link]  [Footer Link]  [Footer Link]    © 2024      │
└─────────────────────────────────────────────────────────────┘
```

### 3. Add Component Labels

Below the wireframe, add component identification:

```
COMPONENT MAPPING

┌─ Header ─────────────────────────────────────────────────────┐
│  Logo: Image/SVG                                             │
│  Navigation: Horizontal nav links (3-4 items)                │
│  User Menu: Dropdown with avatar trigger                     │
└──────────────────────────────────────────────────────────────┘

┌─ Main Content ───────────────────────────────────────────────┐
│  Section Title: h1 or h2                                     │
│  Card Grid: 3-column on desktop, stack on mobile             │
│  Card: Icon + Title + Description + Optional action          │
│  CTA: Primary button, centered                               │
└──────────────────────────────────────────────────────────────┘

┌─ Footer ─────────────────────────────────────────────────────┐
│  Links: Horizontal list                                      │
│  Copyright: Text, right-aligned                              │
└──────────────────────────────────────────────────────────────┘
```

### 4. Present Options

```
WIREFRAME COMPLETE

Options:
[E] Edit - Modify the structure
[M] Mobile - Show mobile layout variant
[X] Excalidraw - Generate as Excalidraw file
[C] Continue - Structure is approved
```

**If E (Edit):**
- Ask what changes are needed
- Regenerate wireframe
- Return to step 4

**If M (Mobile):**
Generate mobile variant:
```
{feature_name} - MOBILE WIREFRAME

┌─────────────────────┐
│ [≡]  [Logo]  [👤]   │
├─────────────────────┤
│                     │
│  [Main Content]     │
│                     │
│  ┌───────────────┐  │
│  │    Card 1     │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │    Card 2     │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │    Card 3     │  │
│  └───────────────┘  │
│                     │
│  [Primary CTA]      │
│                     │
├─────────────────────┤
│  [Links] [©]        │
└─────────────────────┘

Changes from Desktop:
- Nav collapsed to hamburger menu
- Cards stack vertically
- Full-width buttons
```

**If X (Excalidraw):**
- Invoke create-excalidraw-wireframe workflow
- Or generate Excalidraw JSON directly
- Save to `_bmad-output/planning-artifacts/ux-design/{feature}-wireframe.excalidraw`

**If C (Continue):**
- Return control to parent step

---

## Output State

After completion, set:

```yaml
design:
  tool_used: wireframe
  output_location: "inline"  # or excalidraw file path
  output_format: ascii
  needs_conversion: true
  wireframe_content: "{the ascii wireframe}"
  component_mapping: "{the component labels}"
```

---

## Wireframe Symbols Reference

```
┌───┐  Box/Container
│   │
└───┘

[Text]     Button or clickable element
(Text)     Rounded/pill element
<Text>     Input field
{Text}     Dynamic content placeholder

──────     Horizontal line/divider
│          Vertical line/divider

[≡]        Hamburger menu
[👤]       User avatar
[▼]        Dropdown indicator
[×]        Close button
[+]        Add button
[←]        Back navigation
```
