# GitHub corner triangle — raymol.io

**Date:** 2026-08-05
**Status:** Approved

## Context

The site has no prominent path to the source repository. GitHub appears only in footer
link lists and in `.dmg` release URLs. The ask: the corner triangle familiar from other
open-source project sites, linking to the repo.

### Verified facts

| Fact | Value |
| --- | --- |
| Repo | `https://github.com/javierbq/RayMol` — **public**, 22 stars (via `gh repo view`) |
| Pages with the sticky nav | `index.html`, `support.html`, `privacy.html` |
| Pages without it | `404.html` (meta-refresh stub), `community.html` (self-contained redirect, `noindex`) |
| Existing inline SVG `<defs>` | all three nav pages define `linearGradient id="tile"` |
| Nav stacking | `nav{position:sticky;z-index:50}` |
| `.wrap` geometry | `max-width:1120px`, `padding:0 28px`, `box-sizing:border-box` globally |
| Global focus ring | `a:focus-visible{outline:3px solid #C21D4B;outline-offset:2px}` |
| Reduced motion | `main.js` already gates `initReveal` and `initHeroCarousel` on `prefers-reduced-motion` |
| Brand gradient | `#F0185C` → `#F2542D` (52%) → `#F9A825` |
| Brand maroon | `#5A0A24` (used as the stroke on the logo's white "R") |

### The collision, derived

The nav's right edge holds a gradient "Get Raymol" button. An 80 px corner fixed to the
viewport occupies the rightmost 80 px, so the two compete.

`.wrap` is `border-box`, so above 1120 px it is a centered 1120 px box and the button's
right edge sits at `(vw − 1120) / 2 + 28` from the viewport edge. Clearing an 80 px
corner requires:

```
(vw − 1120) / 2 + 28 ≥ 80   →   vw ≥ 1224
```

**The reservation breakpoint is 1224 px, not 1176 px.** 1176 px is where `.wrap` stops
growing; it is not where the button clears the corner. Below 1224 px the corner overlaps
roughly 52 px of the button.

The overlap cannot be solved by reserving space at every width. At 375 px the nav already
carries ~316 px of content (brand ≈ 110, hamburger 40, CTA ≈ 110, plus 56 of padding);
adding an 80 px reservation overflows the viewport. Hence the corner is hidden on narrow
screens instead.

### Where the reservation stops being affordable — measured, not assumed

The first implementation attempt hid the corner at ≤820 px, matching the nav's existing
mobile breakpoint. Browser measurement of `index.html` showed that is too low. The nav's
one-line content is:

| Part | Width |
| --- | --- |
| `.brand` | 107 px |
| `nav .links` (7 links, one line) | 584 px |
| "Get Raymol" CTA | 109 px |
| **Total** | **800 px** |

So the viewport width below which the links wrap onto two lines is `800 + left + right`
padding:

| Right padding | Links wrap below |
| --- | --- |
| 28 px (untouched baseline) | 856 px |
| 108 px (with the reservation) | 936 px |

At 820 px the reservation therefore broke the nav across the whole 856–936 px band — all
seven links at 42 px tall inside a 61 px bar. **The corner hides at ≤960 px**, not 820 px,
which is where the nav can actually afford the reservation. 960 rather than the bare 936
leaves ~25 px of headroom: 936 is a measurement taken with SF Pro Display, and a client
falling back to Helvetica or Arial shifts the link widths.

Below 960 px the corner is gone and the nav reverts to its untouched 28 px padding, so its
behavior there is exactly what it was before this change.

**Not fixed here:** the 821–856 px band wrapped the nav links *before* this change too —
the mobile breakpoint at 820 px collapses the links later than their intrinsic width
requires. That is a pre-existing site bug, independent of the corner, and is tracked
separately rather than widened into this change.

## Decisions

Each was presented and approved:

1. **Fixed above the nav** (`z-index:60`), visible while scrolling — the standard
   behavior — with the nav reserving space below 1224 px so the CTA never slides under it.
2. **Raymol gradient fill**, not the stock near-black `#151513` wedge.
3. **Rotated gradient axis** — `x1="1" y1="0" x2="0" y2="1"`, gold → coral → rose. The
   stock axis (`0,0 → 1,1`) puts the octocat on coral/gold, where white measures ~3.3:1
   and ~1.9:1. Rotating pushes gold into the extreme corner, which the octocat barely
   occupies, and seats the silhouette on rose-to-coral. A rejected third option kept the
   stock axis and added a `#5A0A24` outline mirroring the logo's "R"; at 80 px the stroke
   thickened the octocat's arm and tail.
4. **80 px**, the stock `github-corners` size — the recognizable one, and small sizes turn
   the arm and tail to mush.
5. **The three nav pages only.** `404.html` and `community.html` are bare redirect stubs
   with no nav; a floating corner there has nothing to belong to.
6. **Hidden at ≤960 px** — the width below which the nav cannot afford the 108 px
   reservation without wrapping its links, derived by measurement above. Footer GitHub
   links remain the path on narrower screens.

### Rejected

- **Octocat as a nav link** (with or without star count) — tidier and collision-free, but
  not the corner triangle that was asked for.
- **Scroll-away corner** positioned at the top of the document — no nav interference, but
  gone for most of the visit.
- **Diagonal "Fork me on GitHub" ribbon** — says its purpose in words, but dated, larger,
  and it cuts across the nav border instead of tucking into the corner.

## Implementation

### Markup

Duplicated inline in `index.html`, `support.html`, and `privacy.html`, inserted after the
skip-link and before the existing `<defs>` SVG.

The site has no build step. Injecting via `main.js` would make the corner JS-dependent and
paint late, so ~10 duplicated lines per page is the better trade.

```html
<a class="github-corner" href="https://github.com/javierbq/RayMol"
   aria-label="View the Raymol source on GitHub">
  <svg width="80" height="80" viewBox="0 0 250 250" aria-hidden="true" focusable="false">
    <defs><linearGradient id="gh-corner-grad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F9A825"/>
      <stop offset="48%" stop-color="#F2542D"/>
      <stop offset="100%" stop-color="#F0185C"/>
    </linearGradient></defs>
    <path class="octo-bg" d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"/>
    <path class="octo-arm" d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"/>
    <path class="octo-body" d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"/>
  </svg>
</a>
```

`id="gh-corner-grad"` is deliberately distinct from the existing `id="tile"` on all three
pages. The gradient is declared inside each corner's own SVG, so the id repeats once per
page and never twice within one document.

### CSS

All of it in the shared `styles.css` — the behavior is defined once for all three pages.
Placed immediately after the existing `nav` block (which ends with the `max-width:820px`
nav rules), so the corner and the nav padding it displaces read as one unit. The
`nav .wrap` overrides are element-plus-class, so they outrank the base `.wrap` rule
regardless of order.

```css
.github-corner{position:fixed;top:0;right:0;z-index:60;line-height:0}
.github-corner svg{display:block;border:0;color:#fff}
.github-corner .octo-bg{fill:url(#gh-corner-grad)}
.github-corner .octo-arm,.github-corner .octo-body{fill:currentColor}
.github-corner .octo-arm{transform-origin:130px 106px}
.github-corner:hover .octo-arm,
.github-corner:focus-visible .octo-arm{animation:octocat-wave 560ms ease-in-out}
.github-corner:focus-visible{outline-offset:-6px}
@keyframes octocat-wave{0%,100%{transform:rotate(0)}
  20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}

@media(max-width:1223px){nav .wrap{padding-right:108px}}
@media(max-width:960px){.github-corner{display:none}nav .wrap{padding-right:28px}}
@media(prefers-reduced-motion:reduce){.github-corner .octo-arm{animation:none!important}}
```

Notes on three of these rules:

- `108px` is `28 + 80`. It over-reserves slightly between 1120 px and 1223 px, which only
  nudges the CTA left — harmless, and simpler than computing the exact shortfall.
- `outline-offset:-6px` overrides the global `+2px`. A positive offset at the viewport
  corner draws the ring off-screen where it gets clipped; a negative one draws it inside
  the wedge.
- The reduced-motion rule keeps the corner consistent with `main.js`, so it is not the one
  element on the site that animates regardless of the user's setting.

The stock `github-corners` distribution includes a `max-width:500px` block that
auto-plays the wave on touch devices, where `:hover` does not fire. It is omitted: the
corner does not render at those widths.

### Adjacent fix

All three footers read `Source on GitHub · opening after release`. The repo is public, so
the line is already stale, and pairing it with a prominent corner inviting people to that
repo makes each page contradict itself. Delete the
`<span style="opacity:.55">· opening after release</span>` from all three footers.

Scoped deliberately: the sibling "License" text in the same footer block is not a link and
is left alone.

## Verification

The repo is a static site with no test harness, so verification is a visual and keyboard
pass, performed and reported rather than assumed:

1. Corner renders on all three pages; `404.html` and `community.html` unchanged.
2. No CTA overlap at 1400, 1224, 1223, 1000, 961, 960, 900, and 375 px. 1224/1223 and
   961/960 are the boundary pairs the media queries turn on.
2a. No nav link taller than one line (~21 px) at any of those widths. This is the check
   that would have caught the 820 px error, so it is now part of the standard pass.
3. Hover waves the arm; keyboard `Tab` reaches the link, waves it, and shows a focus ring
   inside the wedge rather than a clipped one.
4. Corner absent below 960 px, with the nav's right padding back to 28 px.
5. Octocat legible against the gradient — the reason the axis was rotated.
6. `prefers-reduced-motion: reduce` suppresses the wave.
7. No duplicate-id warnings; `#tile` gradients still render the nav and footer logos.
