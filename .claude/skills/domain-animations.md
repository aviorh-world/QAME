# Domain — Animations

Fade-in scroll animation system used on all portfolio pages.

---

## Mechanism

| Component | Detail |
|---|---|
| Observer | `IntersectionObserver` with `threshold: 0.12` |
| Trigger | Element enters viewport by ≥ 12% |
| Effect | `opacity: 0 → 1`, `transform: translateY(16px) → translateY(0)` |
| Duration | `0.55s ease` |
| CSS class | `.fade-in` on any element that should animate |

---

## CSS Definition

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in {
  opacity: 0;
  animation: fadeUp .55s ease forwards;
}
```

The animation is **paused by default** (element is invisible). The IntersectionObserver adds an inline `animation-play-state: running` style when the element enters the viewport.

---

## Stagger Delays

Elements within the same section can have `animation-delay` applied inline to create a cascading effect:

```html
<div class="fade-in" style="animation-delay: 0s">First</div>
<div class="fade-in" style="animation-delay: 0.1s">Second</div>
<div class="fade-in" style="animation-delay: 0.2s">Third</div>
```

---

## JavaScript Observer Setup

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
```

`observer.unobserve` is called after triggering — elements animate once only.

---

## Applying to New Elements

1. Add `.fade-in` class to the element
2. Optionally add `style="animation-delay: Xs"` for stagger
3. No other setup needed — the observer script at the bottom of each page handles it automatically

---

## Graceful Degradation

If JavaScript is disabled, `.fade-in` elements remain at `opacity: 0`. To prevent invisible content, the observer script can be omitted — but no fallback CSS is currently in place. If adding a new page, consider adding a `<noscript>` rule:

```css
/* optional noscript fallback */
.fade-in { opacity: 1 !important; }
```

---

## Cross-References

- Applied on: `index.html`, `about.html`, `projects.html`, `cv.html`, `cv-he.html`
- Animation tokens: `domain-theming`
