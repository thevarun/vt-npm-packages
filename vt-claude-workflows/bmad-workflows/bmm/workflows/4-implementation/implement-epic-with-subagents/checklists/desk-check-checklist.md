# Design Review Checklist for Desk Check

Use this checklist to validate visual quality during desk check.
Evaluate each category as PASS, PARTIAL, FAIL, or N/A (not applicable).

---

## 1. Quick Validation (Blockers - Must All Pass)

| Check | Status | N/A | Notes |
|-------|--------|-----|-------|
| All acceptance criteria visually verifiable | | | |
| No JavaScript errors in console | | | |
| Primary user flow works end-to-end | | | |

**If ANY fail → check_status: changes_requested**

---

## 2. Visual Polish (Should Pass)

| Check | Status | N/A | Notes |
|-------|--------|-----|-------|
| Typography readable, consistent hierarchy | | | |
| Spacing consistent (padding/margins) | | | |
| Colors match design system | | | |
| Sufficient color contrast | | | |
| Interactive states work (hover, active, disabled) | | | |
| Loading states present where needed | | | |
| Dark/light mode consistent (if applicable) | | | |

**Failures are MINOR if CSS-fixable, MAJOR otherwise**

---

## 3. Responsiveness (Should Pass)

| Check | Status | N/A | Notes |
|-------|--------|-----|-------|
| Desktop (1280px): Layout intact, no overlaps/cutoffs | | | |
| Desktop: No horizontal scroll | | | |
| Mobile (375px): Content reflows properly | | | |

**Layout breaks are MAJOR; minor spacing issues are MINOR**

---

## 4. Accessibility Basics (Should Pass)

| Check | Status | N/A | Notes |
|-------|--------|-----|-------|
| Interactive elements keyboard accessible | | | |
| Focus states visible | | | |
| Form inputs have labels | | | |
| Images have alt text (if applicable) | | | |

**Missing accessibility is MAJOR**

---

## 5. Optional Polish (Non-blocking)

| Check | Status | N/A | Notes |
|-------|--------|-----|-------|
| Mobile: Touch targets 44px+ minimum | | | |

**These checks inform polish backlog but do not block approval**

---

## Scoring Guide

- **All categories PASS** → check_status: approved
- **Only MINOR issues (CSS-fixable)** → self-fix, then approved
- **Any MAJOR issues** → check_status: changes_requested
- **Fundamental problems** → check_status: rejected
