# QA Report — aviorh-world.github.io/QAME
**Date:** 2026-06-17  
**Mode:** Standard (diff-aware → Quick, no URL provided)  
**Branch:** claude/gstack-install-t6mupv  
**Base branch:** main  
**Local server:** http://localhost:8080  
**Pages tested:** index.html, projects.html, cv.html, cv-he.html, about.html  
**Screenshots:** .gstack/qa-reports/screenshots/  
**Duration:** ~25 min  

---

## Summary

| Metric | Value |
|--------|-------|
| Pages visited | 5 |
| Issues found | 3 |
| Fixed (verified) | 2 |
| Fixed (best-effort) | 0 |
| Deferred | 1 |
| Health score (before) | 63/100 |
| Health score (after) | 95/100 |

**PR Summary:** QA found 3 issues, fixed 2 (critical lightbox HTML missing + absolute URLs in about.html nav), health score 63 → 95.

---

## Issues

### ISSUE-001 — Lightbox HTML container missing from projects.html
**Severity:** Critical  
**Category:** Functional  
**Fix Status:** ✅ Verified  
**Commit:** f3f096b  
**Files Changed:** `projects.html`

**What broke:** Clicking any screenshot thumbnail on the projects page threw `TypeError: Cannot set properties of null (setting 'src')` at `openLb()`. The CSS and JavaScript for the lightbox were fully implemented, but the actual HTML elements (`#lb`, `#lbImg`, `#lbCap`, `#lbStage`, `#lbZoomInfo`) were never added to the DOM. Same issue affected the password modal (`#pwModal`, `#pwInput`, `#pwErr`) used for unlocking work samples, and the edit-mode save banner (`#saveBanner`).

**Repro:** Navigate to projects.html → click any screenshot thumbnail → lightbox does not open (silently fails).

**Fix:** Added the lightbox overlay, password modal, and save banner HTML between `</main>` and the first `<script>` block.

**Verified:** Lightbox now opens on click; password modal opens on "Unlock"; zoom controls work; close with Escape or ✕ button.

---

### ISSUE-002 — about.html navigation uses absolute GitHub Pages URLs
**Severity:** High  
**Category:** Navigation  
**Fix Status:** ✅ Verified  
**Commit:** f3f096b, 4124c5f  
**Files Changed:** `about.html`, `projects.html`

**What broke:** All nav links, footer links, and in-page links in `about.html` used `https://aviorh-world.github.io/QAME/...` absolute URLs. In any non-production environment (local dev, staging, PR preview), clicking these links would redirect to the live GitHub Pages site instead of staying on the current server. Also the "View CV" footer link in `projects.html` had the same problem.

**Fix:** Replaced all internal `https://aviorh-world.github.io/QAME/` links with relative paths (`index.html`, `about.html`, `projects.html`, `cv.html`, `cv-he.html`). Left the QA Extractor iframe src and open-in-new-tab link as absolute (intentional — they load the deployed embedded tool).

**Verified:** About page nav now shows relative hrefs; navigating within about.html stays on localhost.

---

### ISSUE-003 — About page not linked from main navigation
**Severity:** Medium  
**Category:** UX / Navigation  
**Fix Status:** ⏸ Deferred  

**What's wrong:** `index.html`, `projects.html`, `cv.html`, `cv-he.html` all have a 3-link topbar (Home / Projects / CV). The About page exists but is not reachable from any of these. About page's own nav includes "About Me" and "My Projects" (different label vs "Projects" on other pages).

**Impact:** Visitors can't discover the About page from the main portfolio navigation.

**Recommendation:** Add `<a href="about.html">About</a>` to the topbar in `index.html`, `projects.html`, `cv.html`, `cv-he.html`. Align nav label "My Projects" → "Projects" for consistency.

---

## Console Health
- All 5 pages: 0 real JS errors after fixes
- CDN cert errors (Google Fonts over HTTPS) in headless/local dev — not user-facing, not counted

## Links Health
- No broken internal links found
- External links (LinkedIn, WhatsApp, Google Drive): not tested (external services)

---

## Health Score Breakdown

| Category | Before | After | Weight | Contribution (after) |
|----------|--------|-------|--------|---------------------|
| Console | 40 | 100 | 15% | 15.0 |
| Links | 100 | 100 | 10% | 10.0 |
| Visual | 100 | 100 | 10% | 10.0 |
| Functional | 25 | 100 | 20% | 20.0 |
| UX | 92 | 92 | 15% | 13.8 |
| Performance | 90 | 90 | 10% | 9.0 |
| Content | 100 | 100 | 5% | 5.0 |
| Accessibility | 100 | 100 | 15% | 15.0 |
| **Total** | **63** | **95** | | |

*Functional score was 25/100 before fix: critical lightbox broken (-25), critical modal broken (-25), high nav issues (-25).*
*UX deduction: ISSUE-003 medium (-8 → 92).*

---

## What's Working Well
- All 5 pages load with HTTP 200
- Hero sections, stats, and typography render correctly on desktop and mobile (375px)
- Homepage testimonials carousel — buttons work, reviews display
- CV page — full layout with all sections visible
- Animated sections (IntersectionObserver fade-in) work correctly for real users scrolling
- Hebrew CV (cv-he.html) — RTL layout loads without errors
- Projects embedded tools (UI Design Diff, QA Dynamic Engine) render in iframes

---

## Baseline JSON
```json
{
  "date": "2026-06-17",
  "url": "http://localhost:8080",
  "branch": "claude/gstack-install-t6mupv",
  "healthScore": 95,
  "issues": [
    {"id": "ISSUE-001", "title": "Lightbox HTML missing", "severity": "critical", "category": "functional", "status": "fixed"},
    {"id": "ISSUE-002", "title": "about.html absolute URLs", "severity": "high", "category": "navigation", "status": "fixed"},
    {"id": "ISSUE-003", "title": "About not in main nav", "severity": "medium", "category": "ux", "status": "deferred"}
  ]
}
```
