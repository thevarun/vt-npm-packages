# Step 2: Scope & Inspiration

## MANDATORY EXECUTION RULES (READ FIRST)

- NEVER proceed without clear scope confirmation
- CRITICAL: Pull relevant context from existing artifacts
- ALWAYS confirm scope before design phase
- Goal: Define exactly what to design and gather visual references

---

## CONTEXT FROM PREVIOUS STEP

You should have:
- `mode`: production (otherwise this step is skipped)
- `user_intent`: What user wants to design
- `project_state`: greenfield or existing
- `related_artifacts`: List of relevant files
- `theme`: Theme info (if detected in Step 1)

---

## YOUR TASK

Define the specific scope of design work and optionally gather visual inspiration.

---

## TASK SEQUENCE

### 1. Pull Existing Context (if available)

**If existing project with artifacts:**

Read relevant files to understand:
- Existing design decisions (from UX specs)
- Related user stories (from epics)
- Current component patterns (from component inventory)
- Design tokens already defined

Present summary:
```
EXISTING CONTEXT

From UX Specification:
- [Key design decisions relevant to this work]

From Epic/Stories:
- [Related stories and their requirements]

Current Design System:
- Theme: [dark/light/both]
- Primary components: [list]
- Patterns established: [list]
```

**If greenfield:**
```
GREENFIELD PROJECT

No existing design specs found. This design work will help establish:
- Visual direction
- Component patterns
- Design tokens foundation
```

---

### 2. Define Scope

Based on user intent and context, propose specific scope:

```
PROPOSED SCOPE

Based on "{user_intent}", here's what I recommend designing:

1. [Specific page/flow/component]
   - [What it needs to accomplish]
   - [Key elements to include]

2. [Another item if multi-part]
   - [Details]

Estimated outputs:
- [ ] Design prototype ([tool])
- [ ] Component strategy
- [ ] Page layouts
- [ ] User journey (if multi-step)
```

Ask for confirmation:
```
Does this scope look right? Want to add or remove anything?
```

---

### 3. Gather Inspiration (Optional)

After scope is confirmed, offer inspiration gathering:

```
INSPIRATION (Optional)

Would you like to gather visual references before designing?

[Y] Yes - I'll search for relevant examples
[N] No - Let's proceed with design
[U] I have URLs - I'll share specific references
```

**If Y (search for inspiration):**
- Use web search to find 2-3 relevant design examples
- Focus on the specific UI pattern being designed
- Present findings with brief analysis:
  ```
  INSPIRATION FOUND

  1. [Source/Company] - [URL if available]
     What works: [specific element]
     Relevant for: [how it applies to our design]

  2. [Another example]
     ...
  ```

**If U (user has URLs):**
- Accept user's reference URLs
- Note key elements to incorporate

**If N:**
- Proceed directly to design

---

### 4. Confirm Design Direction

Summarize before proceeding:

```
DESIGN BRIEF

Scope: [confirmed scope items]

Inspiration:
- [References gathered, or "None - proceeding with library defaults"]

Design approach:
- Primary tool: [based on availability and scope]
- Target: [what we're creating]

Ready to proceed to design phase.
```

---

## STATE TO CARRY FORWARD

Add to working memory:

```yaml
scope:
  items:
    - name: "[item 1]"
      description: "[what it accomplishes]"
      type: [page | flow | component]
    - name: "[item 2]"
      ...
inspiration:
  - source: "[name]"
    url: "[url if available]"
    takeaway: "[what to incorporate]"
design_direction: "[summary of approach]"
```

---

## NEXT STEP

Proceed to `./step-03-design.md`
