# Step 5: Epic Linking

## MANDATORY EXECUTION RULES (READ FIRST)

- 🛑 NEVER modify epic files without user approval
- 📖 CRITICAL: Preview all changes before applying
- ✅ ALWAYS preserve existing epic content (targeted edits only)
- 🎯 Goal: Cross-reference UX designs in implementation plans

---

## CONTEXT FROM PREVIOUS STEPS

You should have from Step 4:
- `artifact_data.feature_name`: What was designed
- `artifact_data.date`: Current date
- `design.tool_used`: Which tool created the design (magicpatterns, superdesign, wireframe, direct)
- `design.output_location`: Where the design lives (URL or folder path)
- Files created in `{planning_artifacts}/ux-design/` with prefix like `epic-3-onboarding-*`

---

## YOUR TASK

Connect UX design artifacts to epic files so developers can find designs during implementation.

---

## TASK SEQUENCE

### 1. Detect Related Epics

Extract epic number from artifact prefix:

**Pattern:** `{prefix}design-brief.md` where prefix = `epic-{N}-{feature-name}-`

```
SCANNING FOR RELATED EPICS
─────────────────────────────────────

Artifact prefix: {prefix}
Detected epic: Epic {N}

Searching: {planning_artifacts}/epics/
```

**Search logic:**
1. Parse artifact filename prefix (e.g., `epic-3-onboarding-` → Epic 3)
2. Find epic file: `epic-{N}-*.md` in `{planning_artifacts}/epics/`
3. If multiple matches, list all and ask user to select

**If no epic found:**
```
No matching epic file found for "{prefix}".

Options:
[P] Provide path - Enter epic file path manually
[S] Skip - Continue without linking
```

---

### 2. Analyze Epic Structure

Read the epic file and identify:

```yaml
epic_analysis:
  file_path: "{epic_file_path}"
  title: "{Epic N: Title}"
  has_ux_section: [true/false]
  stories:
    - number: "3.1"
      title: "Story title"
      has_ux_design: [true/false]
    - number: "3.2"
      ...
```

**Report to user:**
```
EPIC ANALYSIS
─────────────────────────────────────

Found: {Epic N: Title}
Location: {epic_file_path}

Current UX Design references:
- Epic level: {Yes/No}
- Stories with UX Design section: {count}/{total}

Artifacts to link:
- {prefix}design-brief.md
- {prefix}component-strategy.md
{- {prefix}layouts.md}
{- {prefix}user-journeys.md}
```

---

### 3. Prepare Epic-Level Link

**If epic does NOT have UX Design section:**

Generate section to insert after **Goal:** line:

```markdown
**UX Design Artifacts:**
- [Design Brief](../ux-design/{prefix}design-brief.md)
- [Component Strategy](../ux-design/{prefix}component-strategy.md)
{- [Layouts](../ux-design/{prefix}layouts.md)}
{- [User Journeys](../ux-design/{prefix}user-journeys.md)}
```

**If epic already has UX Design section:**

```
Epic already has UX Design Artifacts section.

Options:
[U] Update - Replace with new links
[M] Merge - Add new links to existing
[K] Keep - Leave epic-level unchanged
```

---

### 4. Prepare Story-Level Links

For each story, determine if there's a matching design:

**Matching logic:**
- Check if `design.output_location` contains story-specific designs
- For MagicPatterns: Check design registry from Step 3 for story-matched URLs
- For other tools: Match by feature name similarity

**Story-level UX Design format varies by tool:**

**MagicPatterns:**
```markdown
**UX Design:**
- **Prototype:** [Story Title]({magicpatterns_url})
- **Components:** `ComponentA.tsx`, `ComponentB.tsx`
```

**SuperDesign:**
```markdown
**UX Design:**
- **Prototype:** `.superdesign/design_iterations/{feature}/`
- **Components:** shadcn `Button`, custom `FeatureCard`
```

**Direct Mapping (shadcn research):**
```markdown
**UX Design:**
- **Components:** shadcn `Card`, shadcn `Form`, custom `UserCard`
- **See:** [Component Strategy](../ux-design/{prefix}component-strategy.md)
```

**Wireframe:**
```markdown
**UX Design:**
- **Wireframe:** See [Layouts](../ux-design/{prefix}layouts.md)
- **Components:** shadcn `Card`, custom `WizardStep`
```

---

### 5. Preview Changes

Present all changes before applying:

```
PROPOSED CHANGES
─────────────────────────────────────

Epic: {Epic N: Title}
File: {epic_file_path}

EPIC-LEVEL (after Goal line):
+ **UX Design Artifacts:**
+ - [Design Brief](../ux-design/{prefix}design-brief.md)
+ - [Component Strategy](../ux-design/{prefix}component-strategy.md)
+ - [User Journeys](../ux-design/{prefix}user-journeys.md)

STORY-LEVEL:
○ Story {N.1}: {title}
  + **UX Design:**
  + - **Prototype:** [{title}]({url})
  + - **Components:** `Component.tsx`

○ Story {N.2}: {title}
  (no matching design found - skipping)

○ Story {N.3}: {title}
  + **UX Design:**
  + - **Prototype:** [{title}]({url})
  + - **Components:** shadcn `Select`, `Preferences.tsx`

─────────────────────────────────────

Options:
[A] Apply all - Add all UX references
[E] Epic only - Only add epic-level section
[S] Select - Choose which stories to update
[X] Cancel - Return without changes
```

---

### 6. Apply Changes

**If user approves:**

Execute targeted edits:

1. **Epic-level:** Insert after the line containing `**Goal:**`
   - Find: `**Goal:**.*\n`
   - Insert after match: UX Design Artifacts section + blank line

2. **Story-level:** Insert after `**Acceptance Criteria:**` section, before `---`
   - Find: Story heading → Acceptance Criteria → last criterion line
   - Insert before `---`: UX Design section + blank line

**Use Edit tool for each change:**
```
Editing: {epic_file_path}
- Adding epic-level UX references...
- Adding Story {N.1} UX references...
- Adding Story {N.3} UX references...
```

**After all edits:**
```
EPIC LINKING COMPLETE ✓

Updated: {epic_file_path}

Changes made:
✓ Epic-level UX Design Artifacts section
✓ Story {N.1} UX Design reference
✓ Story {N.3} UX Design reference

Stories skipped (no matching design):
- Story {N.2}
```

---

### 7. Return to Completion Menu

```
─────────────────────────────────────

[L] Link more - Link to additional epics
[N] New Design - Start another design session
[D] Done - Exit workflow
```

**Menu Handlers:**
- **L**: Restart from Section 1 (epic detection)
- **N**: Load `./step-01-context.md`
- **D**: Exit workflow

---

## EDGE CASE HANDLING

### No Related Epic Found

```
No epic file found matching artifact prefix "{prefix}".

This may happen when:
- Design is for a feature without a defined epic
- Artifact naming doesn't follow epic-{N}- pattern
- Epic files are in a different location

Options:
[P] Provide path - Enter epic file path manually
[C] Create reference - Just show the links to copy manually
[S] Skip - Continue without linking
```

**If P:**
- Prompt for epic file path
- Validate file exists
- Continue with linking flow

**If C:**
- Display formatted markdown sections for user to copy
- Return to completion menu

### Epic Already Has Complete UX Section

```
Epic {N} already has UX Design references:

Epic-level: ✓ Present
Stories with UX: 5/5

Options:
[R] Review current - Show existing UX sections
[U] Update anyway - Replace with current design references
[S] Skip - Keep existing references
```

### Multiple Epics Match

If artifact prefix is ambiguous or design spans epics:

```
Multiple related epics detected:

[1] Epic 2: Authentication Experience
[2] Epic 3: User Onboarding & Welcome

Select which to update (comma-separated, or A for all):
```

### Story-Design Mismatch

When design doesn't map cleanly to stories:

```
DESIGN-TO-STORY MAPPING
─────────────────────────────────────

Design: {feature_name}
Stories in Epic {N}: 7

Auto-matched:
✓ Story 3.1 → Onboarding Step 1 design
✓ Story 3.3 → Preferences design

Unmatched stories (manual mapping needed):
? Story 3.2 - Feature Tour
? Story 3.4 - Progress & Skip

Unmatched designs:
? Dashboard Welcome component

Options:
[M] Manual map - Match designs to stories manually
[A] Auto only - Only link matched stories
[S] Skip stories - Only add epic-level links
```

---

## STATE TO CARRY FORWARD

```yaml
linking_result:
  epic_file: "{path}"
  epic_level_added: true
  stories_linked: ["3.1", "3.3", "3.5"]
  stories_skipped: ["3.2", "3.4"]
```

---

## SUCCESS CRITERIA

✅ Related epic file identified (or user provided path)
✅ Changes previewed before applying
✅ Epic-level UX Design Artifacts section added
✅ Story-level UX Design sections added where applicable
✅ Existing epic content preserved
✅ Relative paths correct (`../ux-design/...`)
