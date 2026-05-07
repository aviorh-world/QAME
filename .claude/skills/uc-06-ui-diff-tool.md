# UC-06 — Use UI Diff Tool

**Actor:** QA Engineer / Designer
**Entry Point:** `ui-diff.html` (direct or via iframe in `projects.html`)
**Trigger:** Need to compare Figma design vs live browser implementation

---

## Main Flow

1. User opens `ui-diff.html` (standalone or "Open Full Page" from projects.html)
2. **Step 1 — Get browser data:**
   - Install bookmarklet: drag "Extract Page" button from tool to browser toolbar
   - Navigate to target page; click bookmarklet
   - Bookmarklet extracts computed styles, layout info, and DOM structure → outputs JSON
   - Copy/download JSON output
3. **Step 2 — Get Figma data:**
   - Use Figma plugin (from `figma-ui-diff-exporter-copy-fixed.zip`) to export design JSON
4. **Step 3 — Load both into tool:**
   - Drag-and-drop or paste Figma JSON into left drop zone
   - Drag-and-drop or paste browser JSON into right drop zone
   - Optionally: upload screenshots for visual reference
5. **Step 4 — Run comparison:**
   - Click "Run Diff" button
   - Engine compares color, typography, layout, spacing
6. **Step 5 — Review results:**
   - Results panel shows per-property pass/fail chips (✓ / ✗)
   - Review discrepancies; fix in code or design as appropriate

---

## Comparison Checks

| Category | What is Checked |
|---|---|
| Color | Fill colors, border colors — exact hex/rgba match |
| Typography | Font family, font size, font weight, line height |
| Layout | Width, height, position (relative/absolute), display type |
| Spacing | Padding, margin, gap |

---

## Input Formats

| Input | Format |
|---|---|
| Figma export | JSON produced by the Figma plugin in the zip archive |
| Browser export | JSON produced by the "Extract Page" bookmarklet |
| Screenshots | PNG/JPG; optional — for visual reference only |

---

## Error Flows

| Scenario | Behavior |
|---|---|
| Invalid JSON | Parse error displayed; form not submitted |
| Only one input provided | "Run Diff" disabled or shows error |
| Bookmarklet blocked by CSP | Extraction fails; manual JSON entry required |

---

## Cross-References

- Implementation details: `domain-ui-diff`
- Figma plugin archive: `figma-ui-diff-exporter-copy-fixed.zip` in repo root
- Embedded on: `uc-03-projects-page`
