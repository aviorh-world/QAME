# Domain — Navigation

Implementation details for the shared `site-topbar` and footer navigation present on all portfolio pages.

---

## Topbar Structure

| Element | Class | Role |
|---|---|---|
| Outer container | `.site-topbar` | `position: sticky; top: 0; z-index: 100`; navy2 background |
| Brand mark | `.site-topbar-brand` | "QAME" text; hidden on ≤ 768 px; right-border divider |
| Links container | `.site-topbar-links` | Horizontal scroll, no scrollbar visible; `display: flex` |
| Individual link | `.site-topbar-links a` | DM Mono, 11 px, uppercase, letter-spacing 2 px |
| Active link | `.current` class on `<a>` | `color: var(--accent); border-bottom-color: var(--accent)` |

---

## Nav Links (replicated in every portfolio page)

| Label | href | Active On |
|---|---|---|
| Home | `index.html` | `index.html` |
| About Me | `about.html` | `about.html` |
| My Projects | `projects.html` | `projects.html` |
| CV | `cv.html` | `cv.html`, `cv-he.html` |

Active state is **hardcoded** per page via `.current` class — there is no JS router. If a new page is added, the topbar HTML must be copy-pasted to that page and `.current` added to the matching link.

---

## Footer Structure

| Element | Class | Content |
|---|---|---|
| Outer | `.site-footer` | Navy2 background; `z-index: 1` |
| Grid | `.sf-grid` | 3 columns (2fr 1fr 1fr) → 1 column on mobile |
| Brand col | `.sf-brand` + `.sf-tag` | Name + role description |
| Nav col | `.sf-col` | Repeat of topbar links |
| Connect col | `.sf-col` | Email, LinkedIn, WhatsApp |
| Divider | `.sf-div` | `<hr>` styled as subtle separator |
| Bottom bar | `.sf-bottom` | Copyright left; social links right |

---

## Mobile Behavior (≤ 768 px)

| Element | Change |
|---|---|
| `.site-topbar-brand` | `display: none` |
| `.site-topbar-links` | Full-width; links flex `1` each; centered text |
| Link font size | 10 px (down from 11 px) |
| Footer grid | Single column |
| Footer bottom | Stacked vertically, centered |

---

## Adding a New Page

1. Copy the `<div class="site-topbar">` block from any existing portfolio page
2. Add `.current` to the new page's link; remove it from all others
3. Add the new link `<a href="newpage.html">Label</a>` to the links container in **all** existing portfolio pages
4. Add matching row to `product.md` → Navigation Rules table
5. Update `CLAUDE.md` File Inventory table

---

## Cross-References

- Color tokens: `domain-theming`
- Mobile breakpoints: `architecture.md` → Responsive Breakpoints
