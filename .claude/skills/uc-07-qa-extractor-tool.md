# UC-07 — Use QA Extractor Pro

**Actor:** QA Engineer
**Entry Point:** `qa-extractor-pro.html` (direct or via iframe in `projects.html`)
**Trigger:** Need to generate Playwright test code from a live page

---

## Main Flow

1. **Step 1 — Install bookmarklet:**
   - Drag "📋 Extract Page" button from the tool to the browser toolbar (one-time setup)
2. **Step 2 — Extract from target page:**
   - Navigate to the page to be tested
   - Click the "📋 Extract Page" bookmark
   - Bookmarklet analyzes interactive elements (inputs, buttons, links, forms)
   - Outputs JSON describing elements with selectors and properties
   - Copy the JSON
3. **Step 3 — Generate Playwright code:**
   - Return to `qa-extractor-pro.html`
   - Paste JSON into the textarea input
   - Click "Generate Playwright Code"
4. **Step 4 — Use output:**
   - Preview: click "Preview" → modal shows generated `.spec.ts` code with status chips
   - Download: click "Download .spec.ts" → file saved to disk
   - Copy: click "Copy Code" → code copied to clipboard

---

## Generated Output Format

| Property | Value |
|---|---|
| File type | TypeScript (`.spec.ts`) |
| Framework | Playwright |
| Structure | `test.describe` block; one `test()` per extracted user flow |
| Selectors | `getByRole`, `getByLabel`, `getByText`, or CSS selectors based on extraction |

---

## Status Indicators in Preview

| Chip Color | Meaning |
|---|---|
| Green | Step will pass / action will succeed |
| Red | Step likely to fail / validation step |
| Gray | Informational / navigation step |

---

## Error Flows

| Scenario | Behavior |
|---|---|
| Invalid / empty JSON | Parse error shown; generate button disabled |
| Bookmarklet blocked by CSP | Extraction fails; manual JSON authoring required |
| No elements detected | Generated spec is empty; warning shown |

---

## Cross-References

- Implementation details: `domain-qa-extractor`
- Embedded on: `uc-03-projects-page`
