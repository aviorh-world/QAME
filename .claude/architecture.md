# Architecture — QAME

Orientation map for implementation details. See domain skill files for deep dives.

---

## Site Structure

| Layer | Description |
|---|---|
| Hosting | GitHub Pages, root of `main` branch, no build pipeline |
| Entry | `index.html` — default root document |
| Navigation | Shared `site-topbar` HTML replicated across all portfolio pages |
| Styling | CSS embedded in `<style>` per file; shared design system duplicated, not imported |
| Scripting | Vanilla JS embedded in `<script>` per file |
| Persistence | `localStorage` in `calendar.html` only (`militaryShifts2026` key) |
| Fonts | Google Fonts CDN (1 network request per page load) |

---

## File Dependency Map

| File | Embeds / Links To | Notes |
|---|---|---|
| `index.html` | `about.html`, `projects.html`, `cv.html`, `cv-he.html` | Nav only |
| `about.html` | Same nav links | Self-contained |
| `projects.html` | `ui-diff.html` (iframe + link), `qa-extractor-pro.html` (iframe + link), Screenshot1–4.png, Google Drive | Heaviest page (33 KB) |
| `cv.html` | `cv-he.html` (toggle), LinkedIn, portfolio URL | |
| `cv-he.html` | `cv.html` (toggle), LinkedIn | RTL mirror of cv.html |
| `ui-diff.html` | None | Standalone tool |
| `qa-extractor-pro.html` | None | Standalone tool |
| `UI-diff.html` | — | Stale duplicate — do not edit |

---

## Shared HTML Skeleton (portfolio pages)

```
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>...</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="Google Fonts URL" rel="stylesheet" />
    <style>/* ALL CSS HERE */</style>
  </head>
  <body>
    <div class="site-topbar">…nav links…</div>
    <!-- hero or page-specific header -->
    <main>…sections…</main>
    <footer class="site-footer">…</footer>
    <script>/* ALL JS HERE */</script>
  </body>
</html>
```

---

## CSS Architecture

| Concept | Implementation |
|---|---|
| Design tokens | CSS custom properties on `:root` |
| Layout | CSS Grid (cards, multi-column); Flexbox (topbar, rows) |
| Responsive | `@media (max-width: 768px)` and `@media (max-width: 420px)` breakpoints |
| Animations | `@keyframes fadeUp` + `.fade-in` class; triggered via IntersectionObserver |
| Component classes | BEM-lite: `.card`, `.card-title`, `.card-desc`, `.chip`, `.chips` |
| RTL support | `dir="rtl"` on `<html>` or `<body>` (cv-he, calendar, PPOFORBATCHEN only) |
| Noise texture | Inline SVG data URI `feTurbulence` filter as `body::before` fixed overlay |

---

## JavaScript Patterns

| Pattern | File(s) | Mechanism |
|---|---|---|
| Fade-in on scroll | All portfolio pages | `IntersectionObserver` on `.fade-in` elements |
| Testimonial carousel | `about.html` | `setInterval` (8 s), hardcoded array, dynamic DOM injection |
| FAQ accordion | `about.html` | `toggleFaq(index)` function, `max-height` CSS transition |
| Image lightbox | `projects.html` | Modal + `wheel` event for zoom, `mousemove` for pan, keyboard listeners |
| Password gate | `projects.html` | Hardcoded string compare; on success reveals `<a>` links |
| Video add (edit mode) | `projects.html` | `body.edit-mode` CSS class toggle; second password check |
| Calendar CRUD | `calendar.html` | `localStorage` read/write on every mutation; JSON export/import |
| Bubble layout | `PPOFORBATCHEN.HTML` | Collision-detection placement loop, `Font Awesome` icons |

---

## Responsive Breakpoints

| Breakpoint | Changes |
|---|---|
| ≤ 768 px | Nav brand hidden; nav links spread full width; hero switches to single column; main padding 18 px; footer single column; CV skills 1-column |
| ≤ 420 px | Hero name font shrinks to 36 px |
| None (fixed) | `PPOFORBATCHEN.HTML` uses fixed 1280×720 px canvas — not responsive |

---

## External CDN Dependencies

| Resource | Used By | Risk if Unavailable |
|---|---|---|
| Google Fonts (Syne, DM Mono, Lora) | index, about, projects, cv, cv-he, ui-diff | Typography falls back to system serif/monospace |
| Google Fonts (Assistant) | calendar, PPOFORBATCHEN | Typography fallback |
| Font Awesome 6.5.1 | PPOFORBATCHEN.HTML | Icons missing (bubbles remain) |
| Google Drive iframe embeds | projects.html | Video previews blank |

---

## Known Issues / Technical Debt

| Issue | File | Action |
|---|---|---|
| Duplicate file (case collision on Linux) | `UI-diff.html` | Delete — `ui-diff.html` is canonical |
| Navigation HTML is copy-pasted across pages | All portfolio pages | No templating system; changes must be applied to each file manually |
| Password hardcoded in JS | `projects.html` | Acceptable for a static portfolio; document but do not change without discussion |
| `avior_hadad_cv_final.htm` in repo root | Legacy file | Not linked; can be removed when cv.html is confirmed complete |
| Font Awesome referenced in projects.html JS comment | `projects.html` | CDN not loaded; icons use Unicode/emoji fallbacks |

---

## Tool Architecture: ui-diff.html

| Component | Detail |
|---|---|
| Input method | Drag-and-drop JSON files or paste; optional screenshot upload |
| Bookmarklet | Extracts page structure + computed styles; outputs JSON |
| Comparison engine | Client-side JS; checks color, typography, layout, spacing |
| Output | Results panel with pass/fail status chips |
| External fonts | Google Fonts: Inter, JetBrains Mono |

See `domain-ui-diff` skill for full implementation details.

---

## Tool Architecture: qa-extractor-pro.html

| Component | Detail |
|---|---|
| Bookmarklet | Injected into target page; extracts interactive elements |
| Input | JSON pasted into textarea from bookmarklet output |
| Codegen | Client-side Playwright `.spec.ts` generation |
| Output | Preview modal + download `.spec.ts` + clipboard copy |

See `domain-qa-extractor` skill for full implementation details.
