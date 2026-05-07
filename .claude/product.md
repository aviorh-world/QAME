# Product — QAME

Use-case and business-rule orientation map. See UC skill files for step-by-step flows.

---

## Product Purpose

| Attribute | Value |
|---|---|
| Owner | Avior Hadad, QA Engineer |
| Audience | Hiring managers, tech leads, recruiters |
| Goal | Demonstrate 10+ years of QA experience via portfolio, CV, and live tools |
| Deployment | GitHub Pages — `aviorh-world.github.io/QAME` |
| Language support | English (default), Hebrew (CV page + RTL utilities) |

---

## Use Cases

| ID | Name | Entry Point | Primary Actor |
|---|---|---|---|
| UC-01 | Browse Portfolio Home | `index.html` | Visitor |
| UC-02 | Explore About / Profile | `about.html` | Visitor |
| UC-03 | View Projects & Tools | `projects.html` | Visitor / Recruiter |
| UC-04 | View English CV | `cv.html` | Recruiter |
| UC-05 | View Hebrew CV | `cv-he.html` | Hebrew-speaking recruiter |
| UC-06 | Use UI Diff Tool | `ui-diff.html` | QA / Designer |
| UC-07 | Use QA Extractor Pro | `qa-extractor-pro.html` | QA Engineer |
| UC-08 | Access Work Samples | `projects.html` (password modal) | Verified contact |

---

## Content Inventory

### index.html

| Section | Content | Notes |
|---|---|---|
| Hero | Name, title, contact links, CV download button | First impression |
| About preview | Intro paragraph + stats card | Links to about.html |
| Projects preview | 2 project cards (UI Diff, Jifipedia) + placeholder | Links to projects.html |
| Skills | Chips grouped by category | 5 categories: Automation, API, Backend, AI, Methodology |
| Contact | Email, WhatsApp, LinkedIn | Inline links, no form |
| Footer | Nav links, copyright, social links | Identical across all portfolio pages |

### about.html

| Section | Content | Notes |
|---|---|---|
| Intro card | Philosophy quote + same stats | |
| Testimonials | 8 manager quotes, auto-rotate 8 s | Names/titles in hardcoded JS array |
| Role & Focus | 4 cards: integrations, docs, automation, log analysis | Company-specific context (Jifiti, Wix) |
| Tech Stack | 9 category cards | |
| QA Philosophy | 6 principle cards | Includes "Vibe Coding with AI" |
| FAQ | 6 expandable Q&A items | Key questions: code writing, Cloudbeat, SDET goal |

### projects.html

| Section | Content | Notes |
|---|---|---|
| UI Design Diff | Embedded iframe (1220 px) + "Open full" link | Links to ui-diff.html |
| QA Extractor Pro | Embedded iframe (500 px) + "Open full" link | Links to qa-extractor-pro.html |
| Jifipedia Articles | 3 screenshots with lightbox zoom | Screenshot1–3.png |
| Instructional Videos | 2 Google Drive iframes | Edit mode allows adding more |
| Work Samples | 4 Google Docs/Sheets links, password-protected | Password: see CLAUDE.md constraints |

### cv.html / cv-he.html

| Section | English | Hebrew |
|---|---|---|
| Header | Name, title, contact | Same in Hebrew |
| Summary | 10+ years QA paragraph | Hebrew translation |
| Experience | Jifiti, Wix, Hotelbeds, NCR | Same content |
| Skills | 6 category grid | Same content |
| Education | 3 entries | Same content |
| Languages | Hebrew native, English professional | Same |
| Toggle | "View Hebrew CV" link | "View English CV" link |

---

## Statistics Claims (must stay consistent across pages)

| Stat | Value | Appears On |
|---|---|---|
| Years of QA experience | 10+ | index.html, about.html, cv.html |
| Companies | 4 | index.html, about.html |
| Integrations | 5+ | index.html, about.html |
| Bugs Found | ∞ | index.html (stats card only) |

---

## Content Business Rules

- **Stats must be consistent.** If the "10+ years" claim is updated, it must be updated in index.html hero tagline, index.html stats card, about.html intro card, and cv.html summary paragraph.
- **Experience entries are ordered** reverse-chronologically: Jifiti (2022–present) → Wix (2019–2022) → Hotelbeds (2016–2019) → NCR (2013–2016).
- **CV mirror rule.** Structural changes to `cv.html` (new section, reordered fields) must be mirrored to `cv-he.html`. Content-only Hebrew translations do not require changes to `cv.html`.
- **Screenshots in projects.html** reference Jifipedia articles from Avior's work at Jifiti. They are internal documentation screenshots, not publicly accessible documents.
- **Work samples are gated** by a password known only to direct contacts. The 4 linked documents are Google Docs/Sheets.
- **Testimonials** are attributed to real managers and colleagues. Do not alter names, titles, or company attributions.
- **Project placeholder card** ("More Coming Soon") in index.html projects section is intentional — no current plans to add content.

---

## Navigation Rules

| Nav Link Label | Target | Active State |
|---|---|---|
| QAME / brand | index.html | Never active (brand mark) |
| Home | index.html | Active on index.html |
| About Me | about.html | Active on about.html |
| My Projects | projects.html | Active on projects.html |
| CV | cv.html | Active on cv.html and cv-he.html |

Active state is applied via `.current` class on the `<a>` tag. It is hardcoded per page, not computed.

---

## Out-of-Scope Features

| Feature | Decision |
|---|---|
| Contact form / email backend | Out of scope — direct links only |
| CMS / admin panel | Out of scope — static site |
| Blog / writing section | Not planned |
| Dark mode | Not planned |
| Analytics tracking | Not present |
| calendar.html in nav | Personal tool — excluded from portfolio nav |
| PPOFORBATCHEN.HTML in nav | Personal tool — excluded from portfolio nav |
