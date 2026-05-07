# Domain — UI Diff Tool

Implementation details for `ui-diff.html` — the pixel-level design comparison tool.

---

## Architecture Overview

| Layer | Detail |
|---|---|
| File | `ui-diff.html` (canonical); `UI-diff.html` is a stale duplicate — do not edit |
| Size | ~58 KB |
| Dependencies | Google Fonts (Inter, JetBrains Mono); no external JS libraries |
| Entry | Standalone page; embedded as iframe in `projects.html` |

---

## Input Zones

| Zone | Accepts | Method |
|---|---|---|
| Figma JSON | JSON from Figma plugin | Drag-and-drop file, paste, or text area input |
| Browser JSON | JSON from "Extract Page" bookmarklet | Same |
| Screenshots | PNG/JPG | Drag-and-drop file (optional) |

Drop zones show dashed borders; drag state adds visual highlight class.

---

## Bookmarklet

The "Extract Page" bookmarklet is injected from the tool via a `<a href="javascript:...">` drag-to-toolbar button.

What it does when clicked on a target page:
- Traverses visible DOM elements
- Reads `window.getComputedStyle` for colors, fonts, dimensions, spacing
- Serializes to JSON with element path, selector, and property map
- Outputs JSON to a copy dialog or download

Bookmarklet code is embedded in the `href` of the button element.

---

## Comparison Engine

All processing is client-side. Engine runs when "Run Diff" is clicked:

| Phase | Action |
|---|---|
| Parse | JSON.parse both inputs; validate structure |
| Match | Match Figma elements to browser elements by selector or path |
| Compare | Per matched pair, compare each property category |
| Score | Assign pass/fail per property; aggregate by category |
| Output | Build results DOM with status chips |

---

## Comparison Categories

| Category | Properties Checked |
|---|---|
| Color | `color`, `background-color`, `border-color` |
| Typography | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing` |
| Layout | `width`, `height`, `display`, `position` |
| Spacing | `padding-top/right/bottom/left`, `margin-top/right/bottom/left`, `gap` |

---

## Results Display

| Element | Detail |
|---|---|
| Results panel | Rendered below inputs after "Run Diff" |
| Per-property chip | Green (✓ pass) or Red (✗ fail) |
| Category summary | Pass count / total per category |
| Status bar | Overall pass/fail summary at top |

---

## Figma Plugin

The Figma plugin (source in `figma-ui-diff-exporter-copy-fixed.zip`) exports a matching JSON schema for Figma frames. The zip contains the plugin code; install via Figma Plugins → Development → Import plugin from manifest.

---

## Known Constraints

- Bookmarklet may be blocked by pages with strict CSP (`script-src` policy)
- Comparison is best-effort: selector matching may fail for complex dynamic pages
- No diffing of pseudo-elements (`:before`, `:after`)

---

## Cross-References

- User flow: `uc-06-ui-diff-tool`
- Embedded on projects page: `uc-03-projects-page`
- Duplicate file to delete: `architecture.md` → Known Issues
