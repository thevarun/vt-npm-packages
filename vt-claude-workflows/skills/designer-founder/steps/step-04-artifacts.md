# Step 4: Convert & Create Artifacts

## MANDATORY EXECUTION RULES (READ FIRST)

- 🛑 NEVER generate artifacts without user approval of content
- 📖 CRITICAL: Use templates from `{installed_path}/templates/`
- ✅ ALWAYS create artifacts in the designated output folder
- 🎯 Goal: Transform design into dev-ready documentation

---

## CONTEXT FROM PREVIOUS STEPS

You should have:
- `mode`: production (or quick_prototype converting to production)
- `scope`: What was designed
- `design.tool_used`: Which tool created the design
- `design.output_location`: Where the design lives
- `design.needs_conversion`: Whether HTML→React conversion is needed

---

## YOUR TASK

Convert design output to dev-ready artifacts and save to `{planning_artifacts}/ux-design/`.

---

## TASK SEQUENCE

### 1. Conversion (if needed)

**If `design.needs_conversion` = true (SuperDesign or Wireframe):**

Load and execute: `{installed_path}/tools/conversion.md`

This handles HTML→React conversion with strategies:
- Component Mapping (shadcn)
- MagicPatterns Conversion
- Hybrid

**If `design.needs_conversion` = false (MagicPatterns or Direct):**

Skip conversion, proceed to artifact generation.

---

### 2. Prepare Artifact Data

Collect all data needed for templates:

```yaml
artifact_data:
  feature_name: "{from scope or user_intent}"
  date: "{current date}"

  # From design phase
  tool_used: "{design.tool_used}"
  output_location: "{design.output_location}"

  # From conversion (if applicable)
  shadcn_components: [list]
  custom_components: [list]
  install_command: "{npx shadcn command}"

  # Design details
  visual_direction: "{from inspiration/scope}"
  inspiration_sources: [list]
```

---

### 3. Determine Artifacts to Create

Based on scope and design:

```
ARTIFACTS TO GENERATE

Required:
✓ Design Brief - Overview and decisions
✓ Component Strategy - What to install and build

Conditional:
{✓/✗} Layouts - {if page/screen design, not just component}
{✓/✗} User Journeys - {if multi-step flow}

Output folder: {planning_artifacts}/ux-design/
File prefix: {feature_name_kebab_case}-
```

Confirm with user:
```
Generate these artifacts? [Y/N]
```

---

### 4. Generate Artifacts

For each artifact, load template and populate:

#### Design Brief

**Template:** `{installed_path}/templates/design-brief.md`

Populate placeholders:
- `{feature_name}` → Scope item name
- `{overview_description}` → What was designed and why
- `{design_decisions}` → Key choices made
- `{tool_used}` → Design tool
- `{output_location}` → Prototype location
- `{visual_direction}` → Style notes
- `{inspiration_sources}` → References used
- `{date}` → Current date

**Tool-specific placeholders:**

- `{tool_specific_notes}` → Generate based on tool used:
  - **MagicPatterns:** "React/TypeScript code ready for extraction. Use `read_files` MCP tool to access."
  - **SuperDesign:** "HTML/CSS prototype. Requires conversion to React components."
  - **Wireframe:** "Structure reference only. Build components from scratch."
  - **Direct:** "Component mapping provided. No visual prototype created."

- `{implementation_source_section}` → When MagicPatterns used:
  ```markdown
  | Component | Source URL | Files to Extract |
  |-----------|------------|------------------|
  | {component_name} | [{design_name}]({url}) | {file_list} |
  ```
  For other tools: "See Component Strategy for implementation details."

**Save to:** `{planning_artifacts}/ux-design/{prefix}design-brief.md`

---

#### Component Strategy

**Template:** `{installed_path}/templates/component-strategy.md`

Populate placeholders:
- `{feature_name}` → Scope item name
- `{shadcn_components}` → Installation command components
- `{component_mapping_rows}` → Table rows of element→component mapping
- `{shadcn_component_details}` → Details for each shadcn component
- `{custom_component_details}` → Build approach for custom components
- `{magicpatterns_section}` → URLs and extraction instructions (if used)
- `{implementation_notes}` → Any special considerations
- `{date}` → Current date

**MagicPatterns-specific placeholders (when `design.tool_used` = magicpatterns):**

- `{magicpatterns_extraction_warning}` → Include this warning block:
  ```markdown
  > **CRITICAL: EXTRACT CODE, DO NOT REBUILD**
  >
  > MagicPatterns designs contain **production-ready React/TypeScript**.
  > Use `mcp__magic-patterns__read_files` to extract code directly.
  > Only adapt for project patterns (Supabase auth, react-hook-form, etc.)
  ```

- `{extraction_table}` → Generate extraction guide from design registry:
  ```markdown
  | Design | MagicPatterns URL | Primary File | Key Elements |
  |--------|-------------------|--------------|--------------|
  | Sign In | [View](url) | SignInForm.tsx | Form, validation, social buttons |
  | Sign Up | [View](url) | SignUpForm.tsx | Multi-step form, password strength |
  ```

- `{what_not_to_do_section}` → Include this section:
  ```markdown
  ## What NOT to Do

  | Don't | Instead |
  |-------|---------|
  | Build layouts from scratch | Extract from MagicPatterns designs |
  | Create custom form components | Extract existing form patterns |
  | Write CSS for auth cards | Extract Tailwind classes from designs |
  | Guess component structure | Read files with `read_files` tool first |
  ```

**For non-MagicPatterns tools:**
- `{magicpatterns_extraction_warning}` → Empty string
- `{extraction_table}` → Empty string or "N/A - Design created with {tool_used}"
- `{what_not_to_do_section}` → Empty string

**Save to:** `{planning_artifacts}/ux-design/{prefix}component-strategy.md`

---

#### Layouts (if applicable)

**Template:** `{installed_path}/templates/layouts.md`

Only generate if designing pages/screens (not standalone components).

Populate placeholders:
- `{feature_name}` → Scope item name
- `{desktop_layout_ascii}` → Desktop wireframe
- `{desktop_notes}` → Layout notes
- `{tablet_layout_ascii}` → Tablet wireframe
- `{tablet_changes}` → What changes
- `{mobile_layout_ascii}` → Mobile wireframe
- `{mobile_changes}` → What changes
- `{responsive_summary_rows}` → Table of element behavior
- `{date}` → Current date

**Implementation note placeholder:**

- `{layout_implementation_note}` → When MagicPatterns used:
  ```markdown
  > **NOTE: Layouts Already Implemented**
  >
  > These layouts are reference documentation. The actual responsive layouts
  > are already built into the MagicPatterns designs. Extract the Tailwind
  > responsive classes directly from the design files rather than rebuilding.
  >
  > **Source:** Extract from [{design_name}]({url}) using `read_files` tool.
  ```
  For other tools: Empty string or omit placeholder

**Save to:** `{planning_artifacts}/ux-design/{prefix}layouts.md`

---

#### User Journeys (if applicable)

**Template:** `{installed_path}/templates/user-journeys.md`

Only generate if multi-step flow (wizard, checkout, onboarding, etc.).

Populate placeholders:
- `{feature_name}` → Scope item name
- `{journey_name}` → Name of the flow
- `{journey_trigger}` → What starts the journey
- `{journey_goal}` → What user accomplishes
- `{mermaid_flowchart}` → Flow diagram in Mermaid syntax
- `{journey_steps}` → Detailed step descriptions
- `{alternative_flows}` → Other paths
- `{edge_cases}` → Edge case handling
- `{error_states}` → Error handling
- `{date}` → Current date

**Implementation source placeholder:**

- `{journey_implementation_sources}` → Link each journey step to its design source:
  ```markdown
  | Step | Design Source | Primary File | Key Feature |
  |------|---------------|--------------|-------------|
  | 1. Enter email | [Sign In]({url}) | SignInForm.tsx | Email input with validation |
  | 2. Enter password | [Sign In]({url}) | SignInForm.tsx | Password field with show/hide |
  | 3. Submit | [Sign In]({url}) | SignInForm.tsx | Loading state, error handling |
  ```
  For non-MagicPatterns: "Reference {tool_used} prototype at {output_location}"

**Save to:** `{planning_artifacts}/ux-design/{prefix}user-journeys.md`

---

### 5. Present Artifacts for Review

```
ARTIFACTS CREATED

Location: {planning_artifacts}/ux-design/

Files:
✓ {prefix}design-brief.md
✓ {prefix}component-strategy.md
{✓ {prefix}layouts.md}
{✓ {prefix}user-journeys.md}

Options:
[R] Review - Show artifact contents
[E] Edit - Make changes to an artifact
[C] Complete - Finalize workflow
```

**If R (Review):**
- Ask which artifact to show
- Display contents
- Return to options

**If E (Edit):**
- Ask which artifact and what changes
- Update the file
- Return to options

---

### 6. Workflow Complete

```
DESIGN WORKFLOW COMPLETE ✓

Summary:
─────────────────────────────────────
Mode: {mode}
Tool: {design.tool_used}
Prototype: {design.output_location}

Artifacts:
{list of created files with paths}

Next Steps for Development:
─────────────────────────────────────
1. Install components:
   {install_command}

2. Review component strategy for custom builds

3. Reference layouts during implementation

{If related story exists:}
This design supports: {story_reference}
Ready for implementation via /dev-story workflow.
─────────────────────────────────────

[L] Link to Epics - Update implementation plans with UX references
[N] New Design - Start another design session
[D] Done - Exit workflow
```

**Menu Handlers:**
- **L**: Load `./step-05-epic-linking.md` to cross-reference designs in epic files
- **N**: Restart workflow from Step 1
- **D**: Exit workflow

---

## OUTPUT FOLDER MANAGEMENT

**If folder doesn't exist:**
- Create `{planning_artifacts}/ux-design/`

**If files already exist:**
```
Files already exist:
- {existing_file_1}
- {existing_file_2}

Options:
[O] Overwrite - Replace existing files
[V] Version - Create {prefix}v2-*.md files
[M] Merge - Add to existing files with changelog
```

**If Merge selected:**
- Append new content with section header:
  ```markdown
  ---

  ## Update: {date}

  {new_content}
  ```

---

## COLLABORATION MENU

```
[A] Advanced - Refine artifacts further
[P] Party Mode - Get dev/PM review of artifacts
[C] Complete - Finish workflow
```

---

## SUCCESS CRITERIA

✅ Design converted to component mapping (if needed)
✅ All applicable artifacts created
✅ Files saved to correct location
✅ shadcn installation command provided
✅ Custom components identified with build approach
