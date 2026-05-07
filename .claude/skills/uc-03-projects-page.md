# UC-03 — View Projects & Tools

**Actor:** Visitor / Recruiter / QA Engineer
**Entry Point:** `projects.html`
**Trigger:** Click "My Projects" in nav, or project card on index.html

---

## Main Flow

1. Page loads; topbar renders (My Projects active)
2. UI Design Diff section: embedded iframe (height 1220 px) showing `ui-diff.html`; "Open Full Page" link below
3. QA Extractor Pro section: embedded iframe (height 500 px) showing `qa-extractor-pro.html`; "Open Full Page" link below
4. Jifipedia Articles section: 3 screenshot images in grid; visitor clicks any image to open lightbox
5. Instructional Videos section: 2 Google Drive iframe embeds; play inline
6. Work Samples section: 4 locked items; visitor clicks "View" to trigger password modal

---

## Lightbox Flow (Jifipedia Screenshots)

1. Visitor clicks a screenshot thumbnail → lightbox modal opens
2. Image displayed at default scale; zoom % shown in badge
3. Visitor scrolls mouse wheel → zoom in/out (each step ±10%, range 50–400%)
4. Visitor clicks image → progressive zoom (successive clicks: 100% → 150% → 200% → 250%)
5. When zoomed, visitor drags image to pan
6. Keyboard: `+` / `-` to zoom, `0` to reset, `Escape` to close
7. Click backdrop (`.lb-overlay`) to close
8. Close button (×) also closes

| Screenshot | Subject |
|---|---|
| Screenshot1.png | John Deere Authorized Approver guide |
| Screenshot2.png | Fiserv adjustment file validation |
| Screenshot3.png | Jifiti Branding guide |

---

## Work Samples Flow

1. Visitor clicks "View" on any of the 4 protected items
2. Password modal appears
3. Visitor enters password → on match: links reveal, modal closes
4. On wrong password: error message shown; field clears
5. Once unlocked, all 4 links are visible until page reload

| Sample | Type |
|---|---|
| E2E Phase 2 Test Flow | Google Docs |
| E2E Testing Guide | Google Docs |
| Test Strategy | Google Docs |
| E2E Test Cases | Google Sheets |

---

## Video Add (Edit Mode)

1. Editor drags a file onto the page → edit mode activates (`body.edit-mode`)
2. "Save" banner appears at top
3. Password prompt appears; on success: "Add Video" form reveals
4. Editor pastes Google Drive embed URL + title → video added to grid
5. Changes persist in DOM only (no server); page reload resets

---

## Error Flows

| Scenario | Behavior |
|---|---|
| Iframe blocked by browser | Tool sections show blank iframe; "Open Full Page" link still works |
| Google Drive unavailable | Video iframes blank |
| Wrong password | Error message in modal; input cleared |
| Image fails to load | Broken image icon in grid; lightbox will still open but show broken image |

---

## Cross-References

- Lightbox implementation: `domain-projects-lightbox`
- Password gate logic: `architecture.md` → JavaScript Patterns
- Tool details: `uc-06-ui-diff-tool`, `uc-07-qa-extractor-tool`
- Work sample access full flow: `uc-08-work-samples-access`
