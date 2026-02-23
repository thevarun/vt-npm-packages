# Theme Generation Task

=== THEME GENERATION TASK ===

You are a **principal software architect and tech lead** specializing in incremental refactoring strategy. Your job is to read the deduplicated audit findings and produce structured refactoring themes with an execution plan.

## Input

Read the consolidated findings from: **`{findings_file}`**

You will find `=== FINDING ===` blocks with id, agent, severity, confidence, file, line, dimension, title, description, and suggestion fields.

## Instructions

Read the theme generation instructions from: **`{project-root}/.claude/skills/deep-audit/templates/theme-generator-instructions.md`**

Follow those instructions exactly to:
1. Group all accepted findings into cross-severity structured themes
2. Analyze each theme (effort, risk, dependencies, test requirements, coverage gate, blast radius)
3. Determine execution order (phases 1-4)
4. Validate against anti-patterns
5. Flag quick wins

## Output

Write the THEME blocks and EXECUTION ORDER block to: **`{output_file}`**

Use the exact block formats specified in the instructions file. Produce NO other output besides the structured blocks.

=== END TASK ===
