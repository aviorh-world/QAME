# UC-05 — View Hebrew CV

**Actor:** Hebrew-speaking recruiter
**Entry Point:** `cv-he.html`
**Trigger:** Click "Hebrew CV" toggle on `cv.html`, or direct link

---

## Main Flow

Identical to UC-04 (English CV) except:

1. Page direction: `dir="rtl"` on `<html>` element
2. All text content is Hebrew
3. Language toggle: "קורות חיים בעברית" (active) | "English CV" → `cv.html`
4. Title: "קורות חיים · אביאור חדד"

---

## RTL Implementation Notes

| Concern | Implementation |
|---|---|
| Text direction | `dir="rtl"` on `<html>` |
| Layout direction | Flexbox/Grid automatically mirrors with RTL; no extra CSS needed |
| Font | Same Google Fonts (Syne, DM Mono, Lora); these render Hebrew characters via system fallback |
| Punctuation | Hebrew uses right-to-left punctuation; do not add LTR Unicode markers |
| Dates | Formatted identically to English (e.g., 2022–Present) |

---

## Content Sections (Hebrew)

| English Label | Hebrew Label |
|---|---|
| Professional Summary | סיכום מקצועי |
| Experience | ניסיון מקצועי |
| Technical Skills | כישורים טכניים |
| Education & Certifications | השכלה והסמכות |
| Languages | שפות |

---

## Mirror Rule

When `cv.html` gets a structural change (new section, reordered fields), mirror to `cv-he.html`. Use the Hebrew translations above as a guide; translate new section labels consistently.

---

## Cross-References

- English counterpart: `uc-04-cv-english`
- RTL pages: `architecture.md` → Constraints & Platform Rules
- Theming: `domain-theming`
