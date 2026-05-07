# QAME — QA Portfolio

Avior Hadad's QA Engineer portfolio. Static HTML/CSS/JS site, no build step. Deployed on GitHub Pages at `aviorh-world.github.io/QAME`.

---

## Skill Loading Gate

Load relevant skills before working on any area of the codebase:

| Work Area | Load These Skills |
|---|---|
| Any portfolio page | `domain-navigation`, `domain-theming` |
| Animated sections | `domain-animations` |
| Home page | `uc-01-portfolio-home` |
| About page | `uc-02-about-page`, `domain-about-carousel` |
| Projects page | `uc-03-projects-page`, `domain-projects-lightbox` |
| English CV | `uc-04-cv-english` |
| Hebrew CV | `uc-05-cv-hebrew` |
| UI Diff tool | `uc-06-ui-diff-tool`, `domain-ui-diff` |
| QA Extractor tool | `uc-07-qa-extractor-tool`, `domain-qa-extractor` |
| Work sample access | `uc-08-work-samples-access` |

---

## Quick Reference

| Command | Purpose |
|---|---|
| `python3 -m http.server 8080` | Serve site locally on port 8080 |
| `open index.html` | Open in default browser (macOS) |
| `git push -u origin main` | Deploy (GitHub Pages auto-deploys from main) |

---

## File Inventory

### Portfolio Pages (public, linked in nav)

| File | Purpose |
|---|---|
| `index.html` | Landing page — hero, about preview, projects preview, skills, contact |
| `about.html` | Full about — philosophy, testimonials carousel, FAQ accordion |
| `projects.html` | Projects showcase — embedded tools, screenshots lightbox, videos, protected work samples |
| `cv.html` | English CV / resume |
| `cv-he.html` | Hebrew CV (RTL layout) |

### Standalone Tools (public, linked from projects.html)

| File | Purpose |
|---|---|
| `ui-diff.html` | Pixel-level Figma-vs-browser design comparison tool |
| `qa-extractor-pro.html` | Bookmarklet-based Playwright test extraction tool |

### Personal Utilities (not linked from portfolio nav)

| File | Purpose |
|---|---|
| `calendar.html` | Military shift scheduler, May–Jul 2026, RTL, LocalStorage-backed |
| `PPOFORBATCHEN.HTML` | Hospital unit cloud visualization, Hebrew, standalone slide |

### Legacy / Artifacts

| File | Notes |
|---|---|
| `UI-diff.html` | **Leftover duplicate** of `ui-diff.html` — do not edit; schedule deletion |
| `avior_hadad_cv_final.htm` | Word HTML export of CV — source of truth is `cv.html`, not this file |
| `avior_hadad_cv_final.docx` | Original Word CV — reference only |
| `avior_hadad_cv_he.docx` | Original Hebrew Word CV — reference only |
| `figma-ui-diff-exporter-copy-fixed.zip` | Archive of Figma plugin source for ui-diff bookmarklet |

### Static Assets

| File | Used By |
|---|---|
| `Screenshot1.png` | projects.html — John Deere Jifipedia article |
| `Screenshot2.png` | projects.html — Fiserv adjustment file article |
| `Screenshot3.png` | projects.html — Jifiti Branding article |
| `Screenshot4.png` | projects.html — additional documentation |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (no template engine) |
| Styling | CSS3, custom properties (variables), CSS Grid, Flexbox — all embedded in `<style>` tags |
| Scripting | Vanilla ES6 JavaScript — all embedded in `<script>` tags |
| Fonts | Google Fonts CDN — Syne, DM Mono, Lora (portfolio pages); Assistant (Hebrew pages) |
| Icons | Font Awesome 6.5.1 CDN (PPOFORBATCHEN.HTML only) |
| Persistence | `localStorage` (calendar.html only) |
| Hosting | GitHub Pages, served from `main` branch root |
| Build | None — edit files directly and push |

---

## Shared Design System

All portfolio pages (index, about, projects, cv, cv-he) share an identical CSS variable palette and typography system. See `domain-theming` skill for the full token table.

Key shared structure: `site-topbar` → hero section → `<main>` → section cards → `site-footer`.

---

## Constraints & Platform Rules

- **No build step.** Do not introduce npm, bundlers, or pre-processors without explicit decision.
- **No external JS frameworks.** No React, Vue, jQuery, etc. Vanilla JS only.
- **All CSS and JS must remain embedded** in each HTML file's `<style>` and `<script>` tags (no separate `.css` or `.js` files).
- **GitHub Pages serves from repo root.** No `docs/` folder or branch switching needed.
- **RTL pages** (`cv-he.html`, `calendar.html`, `PPOFORBATCHEN.HTML`) use `dir="rtl"` on `<html>` or `<body>` and load the Assistant font instead of Syne/DM Mono/Lora.
- **Password `AviorW@`** gates work sample links in `projects.html`. Do not hardcode elsewhere; do not expose in documentation pushed to a public repo.
- **`UI-diff.html`** is a stale duplicate of `ui-diff.html`. Any fix to the diff tool must only be applied to `ui-diff.html`.

---

## After Any Feature Change

- [ ] Update the relevant UC skill if a user flow changed
- [ ] Update the relevant domain skill if implementation details changed
- [ ] If a new page is added, create `uc-{id}-{page-name}` skill and add a row to the File Inventory above
- [ ] If a new interactive pattern is introduced, create or update the matching domain skill
- [ ] Run the site locally and confirm the page renders correctly in both desktop and mobile viewports
- [ ] If `cv.html` is updated, mirror changes to `cv-he.html` (and vice versa for structure-level changes)
- [ ] Check that `index.html` project cards and `about.html` stats match any new content claims

---

## Skill Reference

### UC Skills

| Skill File | Covers |
|---|---|
| `.claude/skills/uc-01-portfolio-home.md` | Landing page sections, stats, contact links |
| `.claude/skills/uc-02-about-page.md` | About flow — testimonials, FAQ, philosophy cards |
| `.claude/skills/uc-03-projects-page.md` | Projects flow — embedded tools, screenshots, videos, work samples |
| `.claude/skills/uc-04-cv-english.md` | English CV sections and download flow |
| `.claude/skills/uc-05-cv-hebrew.md` | Hebrew CV sections and RTL considerations |
| `.claude/skills/uc-06-ui-diff-tool.md` | UI Diff tool — upload, compare, results flow |
| `.claude/skills/uc-07-qa-extractor-tool.md` | QA Extractor — bookmarklet install, JSON paste, code generate |
| `.claude/skills/uc-08-work-samples-access.md` | Password-gated Google Docs/Sheets links flow |

### Domain Skills

| Skill File | Covers |
|---|---|
| `.claude/skills/domain-navigation.md` | Topbar, nav links, active state, mobile layout |
| `.claude/skills/domain-theming.md` | CSS variables, color palette, typography tokens |
| `.claude/skills/domain-animations.md` | IntersectionObserver fade-in pattern, animation-delay stagger |
| `.claude/skills/domain-ui-diff.md` | Diff engine — bookmarklet, JSON format, comparison logic |
| `.claude/skills/domain-qa-extractor.md` | Extractor bookmarklet, Playwright codegen, download/copy flow |
| `.claude/skills/domain-projects-lightbox.md` | Image lightbox — zoom, pan, keyboard shortcuts |
| `.claude/skills/domain-about-carousel.md` | Testimonials carousel — auto-rotate, dot nav, fade transitions |
