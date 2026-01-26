# Step 3: Design Execution

## MANDATORY EXECUTION RULES (READ FIRST)

- 🛑 NEVER proceed without user confirmation at each design iteration
- 📖 CRITICAL: Load the appropriate tool file for detailed execution
- ✅ ALWAYS show design results for review before moving on
- 🎯 Goal: Create visual prototype using user's preferred tool

---

## CONTEXT FROM PREVIOUS STEPS

You should have:
- `mode`: quick_prototype or production
- `user_intent`: What to design
- `scope`: Specific items to design (if production mode)
- `inspiration`: Visual references (if gathered)
- `tools_available`: Which tools are configured

---

## YOUR TASK

Execute design using the user's preferred tool, iterate until satisfied.

---

## TASK SEQUENCE

### 1. Present Tool Selection

Based on available tools, present options:

```
DESIGN TOOL SELECTION

Choose your design approach:

[S] SuperDesign
    → Quick HTML/CSS prototypes via VS Code
    → Best for: Rapid visual exploration, custom styling

[M] MagicPatterns {show availability status}
    → AI-generated React components
    → Best for: Direct React code, component variations

[W] Wireframe Only
    → ASCII or Excalidraw sketch
    → Best for: Structure-first, discussing layout

[D] Direct to Components
    → Skip visuals, map directly to shadcn
    → Best for: Standard patterns, known layouts

Which approach? [S/M/W/D]
```

---

### 2. Load Tool Execution File

Based on user selection, load the corresponding tool file:

| Selection | Tool File |
|-----------|-----------|
| S | `{installed_path}/tools/superdesign.md` |
| M | `{installed_path}/tools/magicpatterns.md` |
| W | `{installed_path}/tools/wireframe.md` |
| D | `{installed_path}/tools/direct-mapping.md` |

**CRITICAL:** Read the ENTIRE tool file and follow its instructions exactly.

Pass context to tool execution:
- `user_intent`
- `scope` (if available)
- `inspiration` (if gathered)

---

### 3. Tool Execution

Execute the loaded tool file completely:
- Follow all steps in the tool file
- Handle user interactions as specified
- Collect output state as defined in tool file

---

### 4. Offer Playwright Verification (Optional)

If Playwright MCP is available AND user created a visual prototype (SuperDesign or MagicPatterns):

```
VISUAL VERIFICATION (Optional)

Would you like me to capture screenshots of your design?

[Y] Yes - Take screenshots (desktop + mobile)
[N] No - Skip verification
```

If Y:
- Use Playwright to navigate to design
- Capture desktop screenshot
- Resize viewport (375px width) and capture mobile screenshot
- Present screenshots for review

---

### 5. Confirm Design Completion

After tool execution completes:

```
DESIGN COMPLETE

Tool used: {design.tool_used}
Output: {design.output_location}
```

**If Quick Prototype mode:**
```
Prototype complete! Would you like to:

[P] Production - Convert to dev-ready artifacts
[D] Done - End workflow here
```

**If Production mode:**
```
Ready to create dev handover artifacts.
```

---

### 5.5 Validate All Designs (Before Step 4)

**When scope has multiple items**, validate coverage before proceeding to artifacts:

```
DESIGN VALIDATION

Checking scope coverage:
{foreach scope_item}
[✓/✗] {item_name}: {url_or_missing}
{/foreach}

─────────────────────────────────────
Coverage: {completed_count} of {total_count} scope items
```

**If any items missing:**
```
Some designs are incomplete.

Missing:
{foreach missing_item}
- {item_name}
{/foreach}

Options:
[C] Create missing - Generate remaining designs now
[S] Skip - Proceed with partial coverage (will note gaps in artifacts)
[R] Revise scope - Remove items that don't need designs
```

**If C (Create missing):**
- Return to step 2 for each missing item
- Update design registry after each creation
- Return to validation after all created

**If S (Skip):**
- Mark skipped items in design state
- Add "NOT DESIGNED" note to artifact generation
- Proceed to step 4 with partial coverage

**If R (Revise scope):**
- Show current scope items
- Allow removal of items
- Recalculate coverage
- Return to validation

**If all items covered:**
```
VALIDATION PASSED ✓

All {total_count} scope items have approved designs.
Ready for artifact generation.

[C] Continue to artifacts
[R] Review designs before continuing
```

---

## COLLABORATION MENU

```
[A] Advanced - Explore design alternatives
[P] Party Mode - Get feedback from multiple perspectives
[C] Continue - Proceed to next step
```

---

## STATE AFTER COMPLETION

Should have from tool execution:

```yaml
design:
  tool_used: [superdesign | magicpatterns | wireframe | direct]
  output_location: "{path or URL}"
  output_format: [html | react | ascii | mapping]
  needs_conversion: [true | false]
  # Plus tool-specific state (components, code, etc.)
```

---

## NEXT STEP

- If `mode` = `quick_prototype` AND user selects [D]: End workflow
- If `mode` = `quick_prototype` AND user selects [P]: Load `./step-04-artifacts.md`
- If `mode` = `production` AND user selects [C]: Load `./step-04-artifacts.md`

Remember: Do NOT proceed until user explicitly confirms.
