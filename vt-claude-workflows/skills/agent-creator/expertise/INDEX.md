# Pre-Built Expertise Profiles

Quick-start profiles for common agent specializations. Use these to jumpstart agent creation without extensive research.

## Quick Selection Guide

| If Building... | Use Profile | File |
|----------------|-------------|------|
| UI components, forms, modals | React Frontend | `react-frontend.md` |
| API routes, auth, validation | Backend API | `backend-api.md` |
| Full pages, App Router features | Next.js Full-Stack | `nextjs-fullstack.md` |
| Unit tests, E2E tests | Testing | `testing.md` |
| Schema, migrations, queries | Database/ORM | `database-orm.md` |
| CI/CD, deployment, secrets | DevOps/CI | `devops-ci.md` |

---

## How to Use Profiles

### 1. Match Keywords to Profile
Check if the agent description contains **trigger keywords** from a profile.

Example: "Build a modal component with form validation"
- Keywords: `modal`, `component`, `form` → **React Frontend profile**

### 2. Copy Relevant Sections
From the matched profile, extract:
- **Core Competencies** → Agent's expertise focus
- **Quality Markers** → Include in agent persona
- **Anti-Patterns** → Mention as things to avoid
- **Tool Affinities** → Verify MCP availability

### 3. Adapt Tech Stack
Each profile has a **Tech Stack** section specific to this SaaS template. Customize based on actual project dependencies.

---

## When to Skip Profiles

Research from scratch (Step 3 full process) when:

| Situation | Why |
|-----------|-----|
| Unusual technology | Profile may not cover it |
| Cross-cutting concerns | Spans multiple profiles |
| Security-focused agent | Needs specialized research |
| Integration-heavy agent | External APIs vary too much |
| Performance optimization | Highly context-dependent |

---

## Combining Profiles

Some agents span multiple domains. Combine profiles by:

1. **Primary profile** (60% weight) - Main focus area
2. **Secondary profile** (40% weight) - Supporting skills

Example: "Full-stack feature developer"
- Primary: `nextjs-fullstack.md`
- Secondary: `database-orm.md` (for data layer work)

---

## Profile Structure

Each profile contains:

| Section | Purpose |
|---------|---------|
| **Trigger Keywords** | High/medium signal words for matching |
| **Core Competencies** | 4-5 specific skills to include |
| **Typical Tasks** | What this specialist handles |
| **Quality Markers** | What separates good from mediocre |
| **Anti-Patterns** | Common mistakes to avoid |
| **Tool Affinities** | Relevant MCPs and tools |
| **Tech Stack** | Project-specific technologies |

---

## Available Profiles

### [React Frontend](react-frontend.md)
UI components, hooks, accessibility, forms, responsive design.

### [Backend API](backend-api.md)
API routes, authentication, validation, middleware, error handling.

### [Next.js Full-Stack](nextjs-fullstack.md)
App Router, Server Components, Server Actions, layouts, streaming.

### [Testing](testing.md)
Unit tests, E2E tests, mocking, fixtures, test patterns.

### [Database/ORM](database-orm.md)
Drizzle ORM, schema design, migrations, queries, relationships.

### [DevOps/CI](devops-ci.md)
GitHub Actions, deployment, environment management, secrets.
