# UC-01 — Browse Portfolio Home

**Actor:** Visitor (recruiter, hiring manager, peer)
**Entry Point:** `index.html`
**Trigger:** Direct URL visit or link from external source

---

## Main Flow

1. Page loads; `body::before` noise overlay renders; Google Fonts load (Syne, DM Mono, Lora)
2. Sticky `site-topbar` renders at top with brand mark and nav links (Home active with `.current`)
3. Hero section renders: role badge → name → tagline → right-side contact links + CV download button
4. IntersectionObserver fires as user scrolls; `.fade-in` sections animate up sequentially
5. About preview section: short intro paragraph + stats card (10+ Years, 4 Companies, 5+ Integrations, ∞ Bugs Found)
6. Projects section: 2 project cards (UI Design Diff, Jifipedia) + 1 placeholder card ("More Coming Soon")
7. Technical Skills section: chips grouped into 5 categories
8. Contact section: email link, WhatsApp link, LinkedIn link
9. Footer renders with nav columns and copyright

---

## Sections Detail

| Section | Key Content | Interaction |
|---|---|---|
| Hero | Name, "QA Engineer · Manual & Automation", tagline | CV button → cv.html download anchor |
| About preview | 1-paragraph intro, stats card | "Read More" → about.html |
| Projects | UI Diff card, Jifipedia card, placeholder | Card links → projects.html |
| Skills | 5 chip groups | Static display |
| Contact | Email, WhatsApp, LinkedIn | External links |

---

## Error Flows

| Scenario | Behavior |
|---|---|
| Google Fonts unavailable | Typography falls back to system serif (Lora) / monospace (DM Mono) / sans-serif (Syne) |
| JavaScript disabled | Fade-in elements remain visible (CSS fallback `opacity:1` if JS does not run) |

---

## Cross-References

- Navigation: `domain-navigation`
- Theming tokens: `domain-theming`
- Fade-in animation: `domain-animations`
- Stats values must match: `product.md` → Statistics Claims
