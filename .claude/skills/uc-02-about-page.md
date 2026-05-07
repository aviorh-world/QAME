# UC-02 — Explore About / Profile

**Actor:** Visitor
**Entry Point:** `about.html`
**Trigger:** Click "About Me" in nav, or "Read More" from index.html about preview

---

## Main Flow

1. Page loads; topbar renders (About Me link active via `.current`)
2. Intro card fades in: philosophy quote + stats (same values as index.html)
3. Testimonials carousel auto-starts: first quote visible; rotates every 8 seconds
4. Visitor can click dot indicators to jump to a specific testimonial
5. Role & Focus section fades in: 4 cards describing specializations
6. Tech Stack section: 9 category cards with tool chips
7. QA Philosophy section: 6 principle cards
8. FAQ section: 6 collapsed questions; click to expand/collapse

---

## Testimonials Detail

| Attribute | Value |
|---|---|
| Count | 8 quotes |
| Source | Hardcoded JS array (`testimonials` variable) |
| Auto-rotate interval | 8 000 ms (`setInterval`) |
| Transition | CSS `opacity` fade (0 → 1) |
| Manual nav | Click dot (`.t-dot`) to jump to index |
| Active dot | `.active` class set via JS |

---

## FAQ Detail

| # | Question Topic |
|---|---|
| 1 | Do you write code? |
| 2 | What is Cloudbeat? |
| 3 | Are you moving toward Automation Engineering? |
| 4 | How do you investigate bugs? |
| 5 | How do you work with developers? |
| 6 | Where are you heading? |

- Toggle function: `toggleFaq(index)` in inline `<script>`
- Expanded state: `.faq-body` max-height expands from `0` to `500px`; `.faq-btn` gets `.open` class (rotates caret icon)
- Only one item open at a time: NOT enforced — multiple can be open simultaneously

---

## Error Flows

| Scenario | Behavior |
|---|---|
| Google Fonts unavailable | Falls back to system fonts |
| JS disabled | FAQ items stay collapsed (hidden); carousel shows only first testimonial statically |

---

## Cross-References

- Carousel implementation: `domain-about-carousel`
- Fade-in animation: `domain-animations`
- Navigation: `domain-navigation`
- Theming: `domain-theming`
- Stats consistency: `product.md` → Statistics Claims
