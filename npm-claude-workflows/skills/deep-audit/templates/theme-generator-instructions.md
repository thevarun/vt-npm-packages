# Theme Generation Instructions

Instructions for grouping audit findings into structured refactoring themes and determining execution order. Read this file when generating the "Refactoring Plan" section of the deep-audit report.

## Step 1: Identify Refactoring Themes

Group related findings into themes. A theme is a coherent refactoring effort that addresses multiple findings together. Name themes for the **outcome**, not the problem (e.g., "Consolidate Auth Middleware" not "Auth Issues").

Guidelines for grouping:
- Findings touching the same files or module → likely same theme
- Findings in the same dimension that share a root cause → same theme
- Findings across dimensions that require the same code changes → same theme
- A finding may belong to multiple themes (list it in both)
- Singleton findings that don't group → create a theme with one finding
- Themes are **cross-severity** — a single theme may contain P1, P2, and P3 findings if they relate to the same area

Aim for 3-8 themes. Fewer than 3 means the grouping is too coarse. More than 8 means it is too granular.

## Step 2: Analyze Each Theme

For each theme, determine:
1. **Summary**: What is wrong and what is the combined impact? Reference specific finding IDs.
2. **Steps**: Concrete, ordered refactoring steps. Each step should be a single commit-sized change. Use imperative voice ("Extract middleware", "Add index", "Remove dead code").
3. **Files**: All files involved (aggregated from constituent findings).
4. **Effort**: S (< 2 hours), M (2-8 hours), L (> 8 hours).
5. **Risk**: LOW (no behavior change, additive only), MEDIUM (behavior preserved but code paths change), HIGH (behavior changes possible, needs careful testing).
6. **Dependencies**: Which other themes must complete first? Use theme IDs. If none, state "None".
7. **Test requirements**: What tests should exist BEFORE starting (safety net) and what tests should be added AFTER completion (regression).
8. **Coverage gate**: If the `tests_before` field would be "None" or "Minimal" (the affected area has no/insufficient existing tests), you MUST:
   - Set `coverage_gate: REQUIRED` in the output
   - Make step 1 of the `steps` field: "Write characterization tests for [affected area] to establish safety net"
   - Factor the test-writing effort into the `effort` estimate
   If existing tests are adequate, set `coverage_gate: ADEQUATE`.
9. **Blast radius**: Estimate how many files outside the theme's `files` list import or depend on the files being changed. Categorize as:
   - `CONTAINED` (0-2 external consumers)
   - `MODERATE` (3-10 external consumers)
   - `WIDE` (11+ external consumers)
   Consider: if 3 files are changed but 40 modules import them, the blast radius is WIDE.

## Step 3: Determine Execution Order

Assign each theme to a phase:
- **Phase 1**: Safe refactors (LOW risk, no dependencies). Builds confidence and reduces noise.
- **Phase 2**: Enablers (themes that other themes depend on). Order by most dependents first.
- **Phase 3**: High-impact refactors (most P1/P2 findings or broadest file coverage).
- **Phase 4**: Polish (remaining themes, typically P3-heavy).

Within each phase, order by: highest impact first, then lowest effort.

## Step 3.5: Validate Against Anti-Patterns

Before finalizing, check each theme against these common refactoring anti-patterns. Add a `warnings` field listing any that apply (or "None"):

- **"Large blast radius — consider splitting into sub-themes"**: Theme touches >10 files
- **"Refactoring without test safety net"**: `coverage_gate` is REQUIRED and no test-writing step exists (should not happen if Step 2.8 is followed, but acts as a double-check)
- **"Mixed concerns — separate structural changes from behavior changes"**: Theme steps include both structural refactoring (rename, move, extract) AND behavior changes (new logic, changed business rules)

## Step 4: Flag Quick Wins

Identify themes (or individual steps within themes) that meet ALL of:
- Effort: S
- Risk: LOW
- Addresses at least one P1 or P2 finding

## Output Formats

### THEME Block

Produce one block per theme using this exact format:

```
=== THEME ===
id: T-NNN
name: <concise theme name>
effort: S|M|L
risk: LOW|MEDIUM|HIGH
finding_ids: F-001, F-003, F-007
dependencies: T-002, T-005 | None
coverage_gate: REQUIRED|ADEQUATE
blast_radius: CONTAINED|MODERATE|WIDE
warnings: <comma-separated list> | None
phase: 1|2|3|4
summary: |
  <2-4 sentences: what's wrong, combined impact, why these belong together>
steps: |
  1. <first refactoring step>
  2. <second refactoring step>
  ...
files: |
  - <file1>
  - <file2>
  ...
tests_before: |
  <what tests must exist before starting — or "Existing tests adequate">
tests_after: |
  <what tests to add after completion>
=== END THEME ===
```

### EXECUTION ORDER Block

Exactly one of these, after all THEME blocks:

```
=== EXECUTION ORDER ===
phase_1: T-003, T-006
phase_2: T-001
phase_3: T-002, T-004
phase_4: T-005, T-007
quick_wins: T-003, T-006
total_effort: S|M|L|XL
summary: |
  <3-5 sentences: overall strategy, key sequencing rationale,
  biggest risk, and expected outcome>
=== END EXECUTION ORDER ===
```

## Documentation Health Findings — Special Handling

Documentation Health findings MUST NOT be grouped into regular refactoring themes. Instead:
1. After generating all code-focused themes (Phases 1-4), add a summary note in the EXECUTION ORDER block
2. Classify the overall doc update scope as MAJOR or MINOR
3. In the EXECUTION ORDER `summary` field, append: "Documentation: [MAJOR|MINOR] update recommended after completing all code changes. Run /docs-quick-update to sync docs with refactored code, then address remaining gaps from Documentation Health findings [list finding IDs]."
4. Do NOT create THEME blocks for documentation findings
5. Documentation Health finding IDs still count toward "every finding ID must appear" — satisfy this by listing them in the EXECUTION ORDER summary

## Important Rules

- Assign sequential IDs: T-001, T-002, T-003, ...
- Every finding ID from the input MUST appear in at least one theme (or in the Documentation Health note)
- Do NOT invent findings that were not in the input
- Do NOT suggest refactoring areas that have no associated findings
- If there is only 1 finding, produce 1 theme with 1 phase
- Keep step descriptions actionable — a developer should be able to start working from them without further design
- For effort estimates, assume a senior developer familiar with the codebase
- For risk assessment, consider: Does this change behavior? Does it touch critical paths? How hard is it to verify correctness?
- Total effort in EXECUTION ORDER: S (all themes < 1 day), M (1-3 days), L (3-10 days), XL (> 10 days)
