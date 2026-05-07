# Domain — QA Extractor Pro

Implementation details for `qa-extractor-pro.html` — the bookmarklet-based Playwright test generator.

---

## Architecture Overview

| Layer | Detail |
|---|---|
| File | `qa-extractor-pro.html` |
| Size | ~15 KB |
| Dependencies | No external CDN; monospace fallback font only |
| Entry | Standalone page; embedded as iframe (500 px height) in `projects.html` |

---

## Bookmarklet

Embedded in a `<a href="javascript:...">` element styled as a draggable button.

When clicked on a target page, the bookmarklet:
1. Traverses the DOM for interactive elements: `input`, `button`, `a`, `select`, `textarea`, `[role="button"]`
2. For each element collects: tag, type, text content, `aria-label`, `placeholder`, `id`, CSS selector path
3. Groups by form or interaction context
4. Serializes to JSON string
5. Presents JSON in a copy dialog overlay

---

## JSON Input Schema

```json
{
  "url": "https://...",
  "title": "Page Title",
  "elements": [
    {
      "tag": "button",
      "text": "Submit",
      "selector": "#submit-btn",
      "type": "submit"
    }
  ]
}
```

---

## Code Generation

The generator runs client-side when "Generate Playwright Code" is clicked:

| Step | Detail |
|---|---|
| Parse | `JSON.parse` input; validate `elements` array exists |
| Map elements | Each element type → Playwright action (`click`, `fill`, `selectOption`, etc.) |
| Selector strategy | Prefer `getByRole`/`getByLabel`/`getByText`; fall back to CSS selector |
| Output | Single `.spec.ts` file with one `test.describe` block |

---

## Generated Code Shape

```typescript
import { test, expect } from '@playwright/test';

test.describe('Page Title', () => {
  test('main flow', async ({ page }) => {
    await page.goto('https://...');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Submit' }).click();
    // ...
  });
});
```

---

## Output Actions

| Button | Mechanism |
|---|---|
| Preview | Opens modal; renders generated code in `<pre>` block with status chips per step |
| Download `.spec.ts` | Creates `Blob`, triggers `<a download>` click |
| Copy Code | `navigator.clipboard.writeText(generatedCode)` |

---

## Status Chips in Preview

Chips are assigned heuristically based on step type:
- Green: navigation (`goto`), assertions (`expect`)
- Red: potential failure points (assertions on dynamic content)
- Gray: fill, click, wait steps

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Empty textarea | "Generate" button disabled |
| Invalid JSON | `JSON.parse` error caught; error message shown below textarea |
| Empty elements array | Warning shown; no code generated |
| Clipboard API unavailable | Copy button shows fallback message (select text manually) |

---

## Cross-References

- User flow: `uc-07-qa-extractor-tool`
- Embedded on projects page: `uc-03-projects-page`
