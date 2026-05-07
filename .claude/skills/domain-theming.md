# Domain — Theming

CSS design token system shared across all portfolio pages. Tokens are defined on `:root` and replicated (not imported) in every file's `<style>` tag.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#1B3A5C` | Section titles, card borders, chip text |
| `--navy2` | `#0F2540` | Topbar background, hero background, footer background |
| `--sky` | `#5A9BC0` | Section labels (`.s-label`), card tags, links |
| `--ice` | `#BDD5EA` | Hero tagline, footer secondary text, subtle accents |
| `--cream` | `#F5F1EB` | Page background, chip background |
| `--charcoal` | `#2A2A2A` | Body text, card descriptions |
| `--mid` | `#6B7A8D` | Muted text, placeholder labels |
| `--accent` | `#E8A952` | Active nav link, CTA buttons, stat numbers, decorative bars |
| `--white` | `#FFFFFF` | Card backgrounds, hero text |
| `--border` | `rgba(27,58,92,0.12)` | Card borders |

---

## Typography Tokens

| Font | Variable | Usage |
|---|---|---|
| Syne (sans-serif, 800 weight) | — | Hero name, section titles (`.s-title`), footer brand, card titles |
| DM Mono (monospace, 400/500) | — | Nav links, labels, chips, card tags, footer small text |
| Lora (serif, italic available) | — | Body text, hero tagline, card descriptions |

Fallback stack:
- Syne → `sans-serif`
- DM Mono → `monospace`
- Lora → `Georgia, serif`

---

## Base Font Size

| Rule | Value |
|---|---|
| `html { font-size }` | `19px` |
| Body font | Lora, Georgia, serif |

All `rem` units scale from 19 px. Most text is sized in `px` directly.

---

## Common Component Tokens

| Component | Key Styles |
|---|---|
| `.card` | `background: white; border: 1px solid var(--border); border-radius: 12px; padding: 28px` |
| `.card::before` | `height: 3px; background: var(--navy)` — top accent bar |
| `.card-tag` | DM Mono 10 px; sky color on `rgba(sky, 0.1)` background |
| `.card-title` | Syne 17 px 700 weight; navy color |
| `.card-desc` | 14 px; mid color; line-height 1.75 |
| `.chip` | DM Mono 11 px; navy text; cream background; 1 px border; 100 px border-radius |
| `.s-label` | DM Mono 11 px; 4 px letter-spacing; uppercase; sky color |
| `.s-title` | Syne 28 px 700; navy; `::after` accent underline (36 px × 3 px, accent color) |

---

## Background Texture

Every portfolio page has an inline SVG data URI applied as `body::before`:
- `feTurbulence` filter creating a fractal noise texture
- `position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.4`
- Color: inherits cream background; produces subtle paper texture

---

## Updating Tokens

Because CSS variables are **replicated** (not imported), a global color change requires editing every portfolio HTML file. Files to update: `index.html`, `about.html`, `projects.html`, `cv.html`, `cv-he.html`.

---

## Cross-References

- Navigation colors: `domain-navigation`
- RTL pages use same tokens but load Assistant font instead of Syne/DM Mono/Lora: `uc-05-cv-hebrew`
