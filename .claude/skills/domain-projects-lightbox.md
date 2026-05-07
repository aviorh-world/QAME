# Domain — Projects Page Lightbox

Image lightbox with zoom and pan, used in `projects.html` for Jifipedia screenshots.

---

## Trigger

```html
<img src="ScreenshotN.png" class="article-img" onclick="openLightbox(this)" />
```

`openLightbox(imgEl)` reads the `src` attribute and opens the modal.

---

## Modal Structure

```html
<div id="lightbox" class="lb-overlay">     <!-- backdrop -->
  <div class="lb-container">
    <img id="lb-img" />
    <div id="lb-zoom-badge">100%</div>     <!-- zoom percentage display -->
    <button id="lb-close">×</button>
  </div>
</div>
```

---

## Zoom State

| Variable | Purpose |
|---|---|
| `lbScale` | Current zoom level (default: `1.0`) |
| `lbMinScale` | Minimum zoom: `0.5` (50%) |
| `lbMaxScale` | Maximum zoom: `4.0` (400%) |
| `lbPanX`, `lbPanY` | Current pan offset in pixels |

Scale is applied via CSS transform: `img.style.transform = \`scale(\${lbScale}) translate(\${lbPanX}px, \${lbPanY}px)\``.

---

## Zoom Interactions

| Trigger | Behavior |
|---|---|
| Mouse wheel up | Scale + 0.1 (max 4.0) |
| Mouse wheel down | Scale - 0.1 (min 0.5) |
| Click image (≤ 100%) | Jump to 1.5× |
| Click image (≤ 150%) | Jump to 2.0× |
| Click image (≤ 200%) | Jump to 2.5× |
| Click image (> 200%) | Reset to 1.0× |
| Keyboard `+` | Scale + 0.1 |
| Keyboard `-` | Scale - 0.1 |
| Keyboard `0` | Reset to 1.0×, pan to 0,0 |
| Keyboard `Escape` | Close lightbox |
| Click badge | Reset zoom to 1.0× |

---

## Pan Behavior

Pan is only active when `lbScale > 1.0`:

- `mousedown` on image sets `lbDragging = true`
- `mousemove` computes delta from last position → updates `lbPanX`, `lbPanY`
- `mouseup` / `mouseleave` sets `lbDragging = false`
- Cursor: `grab` at rest, `grabbing` while dragging

---

## Open / Close

```js
function openLightbox(img) {
  document.getElementById('lb-img').src = img.src;
  lbScale = 1; lbPanX = 0; lbPanY = 0;
  document.getElementById('lightbox').style.display = 'flex';
  updateLbTransform();
}
function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
}
```

Clicking the backdrop (`.lb-overlay`) directly also calls `closeLightbox()` (event target check prevents close when clicking image itself).

---

## Zoom Badge

Updated on every transform change:
```js
document.getElementById('lb-zoom-badge').textContent = Math.round(lbScale * 100) + '%';
```

---

## Cross-References

- Page flow: `uc-03-projects-page`
- Screenshot files: `architecture.md` → Static Assets
