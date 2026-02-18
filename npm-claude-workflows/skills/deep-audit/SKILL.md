# Deep Audit — Skill Reference

This file is the single source of truth for agent roster, dimension boundaries, scoring rubric, and output format. Every audit agent reads this file to understand its scope and output requirements.

## Agent Roster

### Quick Mode (default — 3 agents)

| Agent File | Dimensions | Model | Rationale |
|------------|-----------|-------|-----------|
| `security-and-error-handling.md` | Security, Error Handling | opus | Unhandled errors ARE security issues; one agent reasoning about both produces better findings |
| `architecture-and-complexity.md` | Architecture, Simplification | opus | Architecture decisions need deepest reasoning; over-engineering IS an architecture problem |
| `code-health.md` | AI Slop Detection, Dependency Health | sonnet | Both smell neglect — slop detection and dependency rot share the same instinct |

### Full Mode (adds 6 more agents — `--full` flag)

| Agent File | Dimension | Model |
|------------|-----------|-------|
| `performance-profiler.md` | Performance | sonnet |
| `test-coverage-analyst.md` | Test Coverage | sonnet |
| `type-design-analyzer.md` | Type Design | sonnet |
| `data-layer-reviewer.md` | Data Layer & Database | opus |
| `api-contract-reviewer.md` | API Contracts & Interface Consistency | sonnet |
| `seo-accessibility-auditor.md` | SEO & Accessibility | sonnet |

## Dimension Boundaries

Each dimension has a clear scope. Agents MUST stay within their assigned dimensions and NOT report findings that belong to another dimension.

### Security
- Authentication & authorization flaws
- Injection vulnerabilities (SQL, XSS, command injection, path traversal)
- Secrets/credentials in code or config
- Insecure cryptographic usage
- CSRF, SSRF, open redirects
- Unsafe deserialization
- Missing rate limiting on auth endpoints
- **NOT**: general error handling, performance, code style

### Error Handling
- Unhandled promise rejections and uncaught exceptions
- Empty catch blocks or swallowed errors
- Missing error boundaries (React) or global error handlers
- Inconsistent error response formats
- Missing validation at system boundaries (user input, external APIs)
- Error messages leaking internal details (overlaps security — report under Security if exploitable)
- **NOT**: business logic validation, type safety, test assertions

### Architecture
- Separation of concerns violations
- Circular dependencies
- God objects / god modules
- Missing abstraction layers (e.g., direct DB calls in route handlers)
- Inconsistent patterns across similar components
- Tight coupling between modules that should be independent
- **NOT**: code style, naming conventions, dependency versions

### Simplification
- Over-abstracted code (abstractions used once)
- Premature optimization
- Feature flags or backwards-compatibility shims for dead code
- Unnecessary indirection (wrapper functions that just pass through)
- Configuration for things that never change
- Dead code, unused exports, orphaned files
- **NOT**: intentional design patterns, library APIs (they need flexibility)

### AI Slop Detection
- Excessive/unnecessary comments explaining obvious code
- Redundant docstrings on trivial functions
- Over-verbose variable names (e.g., `resultOfDatabaseQuery`)
- Defensive error handling for impossible scenarios
- Unnecessary type annotations that TypeScript can infer
- "Just in case" fallbacks that mask real bugs
- Boilerplate that adds no value
- **NOT**: intentional documentation, public API docs, complex logic comments

### Dependency Health
- Outdated packages with known vulnerabilities
- Abandoned/unmaintained dependencies (no commits in 2+ years)
- Duplicate dependencies serving the same purpose
- Pinned versions preventing security updates
- Missing lock file or lock file drift
- Oversized dependencies for simple tasks (e.g., lodash for one function)
- **NOT**: architecture decisions about which library to use

### Performance
- N+1 query patterns
- Missing pagination on unbounded queries
- Synchronous operations blocking the event loop
- Unnecessary re-renders (React) or DOM thrashing
- Missing caching for expensive operations
- Memory leaks (event listeners, subscriptions, closures)
- Large bundle imports that could be tree-shaken or lazy-loaded
- **NOT**: micro-optimizations, premature optimization

### Test Coverage
- Untested critical paths (auth, payments, data mutations)
- Missing edge case tests (empty inputs, boundary values, error states)
- Flaky tests (timing-dependent, order-dependent, environment-dependent)
- Tests that test implementation rather than behavior
- Missing integration tests for API endpoints
- Test fixtures with hardcoded secrets or PII
- **NOT**: 100% coverage goals, testing trivial getters/setters

### Type Design
- `any` types that should be specific
- Overly complex generic types that hurt readability
- Missing discriminated unions for state machines
- Inconsistent type naming conventions
- Type assertions (`as`) hiding real type errors
- Missing null/undefined handling in types
- **NOT**: library type definitions, auto-generated types

### Data Layer & Database
- Missing database indexes on frequently queried columns
- Schema design issues (denormalization problems, missing constraints)
- Raw SQL without parameterized queries
- Missing transactions for multi-step mutations
- ORM misuse (eager loading everything, N+1 queries)
- Missing data validation at the persistence layer
- Migration safety (irreversible migrations without rollback plan)
- **NOT**: query performance (belongs to Performance), API response shapes

### API Contracts & Interface Consistency
- Inconsistent naming across endpoints (camelCase vs snake_case)
- Missing or inconsistent error response formats
- Breaking changes without versioning
- Undocumented endpoints or parameters
- Inconsistent pagination patterns
- Missing Content-Type headers or wrong status codes
- Internal function signatures inconsistent with external API patterns
- **NOT**: implementation details behind the API, database schema

### SEO & Accessibility
- Missing or duplicate meta tags (title, description, canonical)
- Missing alt text on images
- Insufficient color contrast
- Missing ARIA labels on interactive elements
- Non-semantic HTML (div soup)
- Missing heading hierarchy (h1 → h2 → h3)
- Missing keyboard navigation support
- Missing `prefers-reduced-motion` support for animations
- Touch target minimum size (24x24 CSS px)
- Missing Open Graph / social sharing metadata
- **NOT**: content quality, marketing strategy, visual design choices

## Scoring Rubric

Each dimension is scored 1–10:

| Score | Label | Meaning |
|-------|-------|---------|
| 9–10 | Excellent | No findings or only minor nitpicks; production-ready |
| 7–8 | Good | Minor issues; low risk, easy fixes |
| 5–6 | Adequate | Notable gaps; some P2 findings that should be addressed |
| 3–4 | Concerning | Significant issues; P1 findings present; needs attention before next release |
| 1–2 | Critical | Severe problems; multiple P1 findings; immediate action required |

**Overall Health Score** = weighted average:
- Security: weight 3
- Error Handling: weight 2
- Architecture: weight 2
- Simplification: weight 1
- AI Slop: weight 1
- Dependency Health: weight 1
- Performance: weight 2 (full mode only)
- Test Coverage: weight 2 (full mode only)
- Type Design: weight 1 (full mode only)
- Data Layer: weight 2 (full mode only)
- API Contracts: weight 1 (full mode only)
- SEO & Accessibility: weight 1 (full mode only)

## Severity Definitions

| Level | Label | Meaning | Action |
|-------|-------|---------|--------|
| **P1** | Critical | Security vulnerability, data loss risk, or production blocker | Fix before next deploy |
| **P2** | Important | Significant quality issue that degrades maintainability or reliability | Fix within current sprint |
| **P3** | Minor | Code quality improvement; low risk but worth addressing | Fix when touching the file |

## Confidence Threshold

Agents MUST only report findings with **confidence >= 80%** (on a 0-100 scale).

- **90-100**: Very high confidence — clear violation with concrete evidence
- **80-89**: High confidence — strong signal with reasonable certainty
- **Below 80**: Do NOT report — risk of false positive outweighs value

When assessing confidence, consider:
- Is this a definitive violation or a judgment call?
- Could there be a valid reason for this pattern you can't see?
- Would a senior engineer agree this is an issue?

## False Positive Prevention

Agents MUST NOT report:
- Issues a linter or formatter would catch (eslint, prettier, stylelint)
- Subjective style preferences that a senior engineer might reasonably disagree with
- Pre-existing patterns the codebase uses consistently (these are intentional conventions, not bugs)
- Potential issues that depend on runtime state, specific inputs, or environment config you cannot verify
- Micro-optimizations with negligible real-world impact

## Agent Output Format

Every agent MUST produce output in exactly this format.

### Finding Block

```
=== FINDING ===
agent: <agent-file-name without .md>
severity: P1|P2|P3
confidence: <80-100>
file: <relative file path>
line: <line number or range, e.g., 42 or 42-58>
dimension: <dimension name from boundaries above>
title: <concise one-line title>
description: |
  <2-4 sentences explaining the issue, why it matters, and concrete evidence>
suggestion: |
  <specific fix or approach — code snippet if helpful, but keep it brief>
=== END FINDING ===
```

### Dimension Summary Block

One per dimension the agent covers:

```
=== DIMENSION SUMMARY ===
dimension: <dimension name>
score: <1-10>
p1_count: <number>
p2_count: <number>
p3_count: <number>
assessment: |
  <2-3 sentences summarizing the dimension's health and key patterns observed>
=== END DIMENSION SUMMARY ===
```

### Output Order

1. All `=== FINDING ===` blocks (sorted by severity: P1 first, then P2, then P3)
2. All `=== DIMENSION SUMMARY ===` blocks

### Important Rules

- Do NOT include findings below 80% confidence
- Do NOT report findings outside your assigned dimensions
- Do NOT suggest fixes that introduce new problems
- Do NOT report the same issue multiple times across different files — report the pattern once and list affected files
- If no findings for a dimension, still include the DIMENSION SUMMARY with score and assessment
- Keep descriptions factual and evidence-based; avoid vague language like "could potentially" or "might cause issues"
