# UC-04 — View English CV

**Actor:** Recruiter
**Entry Point:** `cv.html`
**Trigger:** Click "CV" in nav, or "Download CV" button on index.html hero, or direct link

---

## Main Flow

1. Page loads; topbar renders (CV active)
2. Single `.cv-wrap` layout with `.cv-card` centered content
3. `.cv-band` header: name, title, contact row (WhatsApp, email, LinkedIn, location)
4. Language toggle visible: "English CV" (active) | "Hebrew CV" link → `cv-he.html`
5. Sections render top to bottom: Summary → Experience → Skills → Education → Languages → Portfolio link

---

## Sections Detail

| Section | Content |
|---|---|
| Summary | 3-sentence paragraph: 10+ years QA, fintech/travel/retail, automation + manual |
| Experience | 4 jobs, reverse-chronological (see below) |
| Technical Skills | 6-category grid: Test Mgmt, Automation, API & Debug, Backend Env, Database, AI & Tools |
| Education | 3 entries: Automation Full-Stack (2022), QA Engineering (2013), B.Ed with Distinction (2008–2012) |
| Languages | Hebrew (native), English (professional working) |
| Portfolio | External link to QAME GitHub Pages URL with ↗ icon |

---

## Experience Entries

| # | Company | Period | Role Highlights |
|---|---|---|---|
| 1 | Jifiti | 2022–Present | Multi-integration QA; Cloudbeat; Playwright; Confluence documentation |
| 2 | Wix | 2019–2022 | Sole QA; web/mobile/API; Selenium automation |
| 3 | Hotelbeds | 2016–2019 | B2B travel platform; SQL validation; Scrum Master |
| 4 | NCR | 2013–2016 | Retail POS hardware/software; initial QA career |

---

## CV Mirror Rule

Structure changes (new section, reordered fields) must be mirrored to `cv-he.html`. Content-only changes in Hebrew do not require `cv.html` changes.

---

## Error Flows

| Scenario | Behavior |
|---|---|
| Google Fonts unavailable | Falls back to system fonts |
| LinkedIn link broken | Visible link text; user must copy manually |

---

## Cross-References

- Hebrew version: `uc-05-cv-hebrew`
- Theming: `domain-theming`
- Navigation: `domain-navigation`
- Product rules: `product.md` → Content Business Rules
