# UC-08 — Access Work Samples

**Actor:** Verified contact (recruiter or hiring manager who has received the password)
**Entry Point:** `projects.html` → Work Samples section
**Trigger:** Visitor clicks "View" on any of the 4 locked work sample items

---

## Main Flow

1. Visitor sees 4 locked work sample cards in the Work Samples section
2. Visitor clicks "View" on any card → password modal appears
3. Visitor enters the password → clicks "Unlock" (or presses Enter)
4. **On correct password:**
   - Modal closes
   - All 4 Google Docs/Sheets links reveal and become clickable
   - Links open in new tab
5. **On wrong password:**
   - Error message shown in modal ("Incorrect password")
   - Input field clears
   - Modal stays open; visitor can retry

---

## Work Sample Links

| # | Title | Type |
|---|---|---|
| 1 | E2E Phase 2 Test Flow | Google Docs |
| 2 | E2E Testing Guide | Google Docs |
| 3 | Test Strategy | Google Docs |
| 4 | E2E Test Cases | Google Sheets |

---

## Password Implementation Notes

| Attribute | Detail |
|---|---|
| Storage | Hardcoded string in inline `<script>` in `projects.html` |
| Comparison | Plain string equality (client-side only) |
| Session persistence | Unlocked state resets on page reload |
| Security model | Obscurity only — suitable for a personal portfolio, not sensitive data |

The password itself must not appear in any documentation committed to the public repository. See `CLAUDE.md` → Constraints.

---

## Error Flows

| Scenario | Behavior |
|---|---|
| Google Doc link broken | Link opens but shows 404/permission error in Google |
| Wrong password | Error shown; input cleared |
| JS disabled | Lock cards show but "View" button does nothing |

---

## Cross-References

- Full projects page flow: `uc-03-projects-page`
- Password location: `projects.html` inline `<script>` (search `AviorW`)
