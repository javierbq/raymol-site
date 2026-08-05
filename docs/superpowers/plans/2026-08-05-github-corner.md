# GitHub Corner Triangle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed 80 px GitHub corner triangle, filled with the Raymol gradient, linking to `javierbq/RayMol` from the three pages that carry the sticky nav.

**Architecture:** One CSS block in the shared `styles.css` defines all behavior once; ~14 lines of inline SVG markup are duplicated into each of the three nav pages. The site has no build step and no templating, so duplication is the correct trade — injecting via `main.js` would make the corner JS-dependent and paint late.

**Tech Stack:** Static HTML + CSS. No framework, no bundler, **no test runner.**

**Spec:** `docs/superpowers/specs/2026-08-05-github-corner-design.md` (approved)

## Global Constraints

- Repo URL is exactly `https://github.com/javierbq/RayMol` — that capitalization, matching the `sameAs` entry already in `index.html`'s JSON-LD. Do not use the lowercase `raymol` form the footers use.
- Gradient id is exactly `gh-corner-grad`. All three pages already define `linearGradient id="tile"`; never reuse that id.
- Gradient axis is exactly `x1="1" y1="0" x2="0" y2="1"` with stops gold `#F9A825` at 0% → coral `#F2542D` at 24% → rose `#F0185C` at 50%. The stops are compressed because the wedge only ever spans t ∈ [0, 0.5] of the axis, so uncompressed stops never reach rose and leave the octocat head at 2.73:1. This axis is the whole point of the design — the stock `0,0 → 1,1` axis puts the white octocat on gold at ~1.9:1 contrast. Do not "fix" it back to the logo's direction.
- Corner size is exactly `80` × `80`.
- Breakpoints are exactly `max-width:1223px` (reserve nav space) and `max-width:960px` (hide corner). Both are derived in the spec: 1223 is **not** the 1176 px where `.wrap` stops growing, and 960 is **not** the 820 px of the nav's existing mobile breakpoint. Using 820 here wraps every nav link onto two lines across 860–940 px.
- Only `index.html`, `support.html`, `privacy.html` are touched. `404.html` and `community.html` are bare redirect stubs and must remain byte-identical.
- Match the existing 2-space indentation in `styles.css`.

## Testing approach — read before Task 1

This repo has no test framework, so there is nothing to `pytest` or `npm test`. The substitute is a **browser-measured assertion snippet**, and it is used the same way a unit test is: written first, run to observe a specific failure, then made to pass.

The snippet measures geometry rather than relying on eyeballing a screenshot:

```js
(() => {
  const c = document.querySelector('.github-corner');
  const cta = document.querySelector('nav .btn-primary');
  const wrap = document.querySelector('nav .wrap');
  if (!c) return { error: 'NO .github-corner IN DOM' };
  const cs = getComputedStyle(c);
  const out = {
    innerWidth: innerWidth,
    mq1223: matchMedia('(max-width:1223px)').matches,
    mq960: matchMedia('(max-width:960px)').matches,
    navLinkMaxH: Math.max(0, ...[...document.querySelectorAll('nav .links a')]
      .map(a => Math.round(a.getBoundingClientRect().height))),
    display: cs.display,
    position: cs.position,
    zIndex: cs.zIndex,
    navPadRight: getComputedStyle(wrap).paddingRight,
    href: c.getAttribute('href'),
    ariaLabel: c.getAttribute('aria-label'),
    gradFill: getComputedStyle(c.querySelector('.octo-bg')).fill,
  };
  if (cs.display === 'none') { out.overlapPx = 'n/a (corner hidden)'; return out; }
  const a = c.getBoundingClientRect(), b = cta.getBoundingClientRect();
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  out.overlapPx = (ox > 0 && oy > 0) ? `${Math.round(ox)}x${Math.round(oy)}` : 0;
  out.gapPx = Math.round(a.left - b.right);
  return out;
})()
```

Two things about this snippet that matter:

**It is deliberately strict.** `getBoundingClientRect()` on the corner returns the full 80×80 square, including the transparent lower-left half that the triangle does not paint. So `overlapPx: 0` means the CTA does not even reach the corner's bounding box, not merely that it avoids colored pixels. That is the standard we want — a CTA tucked under the invisible half of the wedge looks cramped even though nothing technically overlaps.

**Judge behavior by `mq1223` / `mq960`, not `innerWidth`.** Depending on scrollbar handling, `innerWidth` can differ from the width media queries resolve against by ~15 px. Asserting against the `matchMedia` booleans makes the boundary checks reliable instead of flaky.

**`navLinkMaxH` is not decoration.** The nav's one-line content is 804 px (brand 107 + links 584 + CTA 113), so the 108 px reservation is only affordable above 940 px. An earlier revision of this plan hid the corner at 820 px and broke every nav link onto two lines across 860–940 px — `overlapPx` stayed 0 the whole time, which is precisely why overlap alone is not a sufficient check. Any value above ~24 means links have wrapped and the reservation is stealing space the nav does not have.

Expected values, all derived from `.wrap` being `max-width:1120px` with `border-box` sizing and `28px` padding:

| Viewport | `mq1223` | `mq960` | `display` | `navPadRight` | `overlapPx` | `gapPx` | `navLinkMaxH` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1400 | false | false | `block` | `28px` | 0 | ~88 | ~21 |
| 1224 | false | false | `block` | `28px` | 0 | ~0 | ~21 |
| 1223 | true | false | `block` | `108px` | 0 | ~80 | ~21 |
| 1000 | true | false | `block` | `108px` | 0 | ~28 | ~21 |
| 961 | true | false | `block` | `108px` | 0 | ~28 | ~21 |
| 960 | true | true | `none` | `28px` | n/a | — | ~21 |
| 900 | true | true | `none` | `28px` | n/a | — | ~21 |
| 375 | true | true | `none` | `28px` | n/a | — | 0 |

`gapPx` at 1224 is the boundary case: the CTA's right edge and the corner's left edge coincide. Anything from `-1` to `1` passes; a negative number larger than that means the breakpoint is wrong.

`navLinkMaxH` is 0 at 375 px only because the nav's own mobile breakpoint (820 px, pre-existing and untouched) hides the links behind the hamburger. At every width where links are visible it must stay near 21 — a 42 means they wrapped.

961/960 is the pair that matters most now: at 961 the corner is visible with the reservation applied and the nav must still fit on one line; at 960 the corner is gone and the padding is released.

---

## File Structure

| File | Change | Responsibility |
| --- | --- | --- |
| `styles.css` | Modify — insert after line 86 | All corner behavior: fill, wave, stacking, breakpoints, nav reservation |
| `index.html` | Modify — insert after line 92; edit line 484 | Corner markup; footer copy fix |
| `support.html` | Modify — insert after line 49; edit line 112 | Corner markup; footer copy fix |
| `privacy.html` | Modify — insert after line 47; edit line 113 | Corner markup; footer copy fix |

Line numbers are from the current tree; re-grep before editing if earlier tasks shifted them.

---

### Task 1: CSS + corner on the homepage

Establishes the CSS contract and proves it on one page. Tasks 2 and 3 are mechanical once this is validated.

**Files:**
- Modify: `styles.css` (insert after line 86)
- Modify: `index.html` (insert after line 92)
- Test: none — browser assertion snippet, per "Testing approach" above

**Interfaces:**
- Produces: CSS class `.github-corner` with descendant classes `.octo-bg`, `.octo-arm`, `.octo-body`; keyframes `octocat-wave`; SVG gradient id `gh-corner-grad`. Tasks 2 and 3 reuse these exact names — the markup block below is copied verbatim into two more pages, so any rename here must propagate.

- [ ] **Step 1: Serve the site locally**

```bash
python3 -m http.server 8765 --directory /Users/jcastellanos/repos/raymol-site/.claude/worktrees/website-design-review-798907
```

Run this with `run_in_background: true` on the Bash tool so it survives across turns. Then open it with the `preview_start` tool using `url: http://localhost:8765/index.html` (no `launch.json` needed — `preview_start` accepts a bare URL).

Do not open `index.html` over `file://`. The page loads `/analytics.js` and `styles.css` by root-relative and relative path, and `file://` resolves them inconsistently.

- [ ] **Step 2: Run the assertion snippet to watch it fail**

Resize to 1400×900 with `resize_window`, then run the snippet from "Testing approach" via the `javascript_tool`.

Expected: `{ error: 'NO .github-corner IN DOM' }`

This is the failing state. If you get anything else, you are looking at a stale page — hard-reload and retry before continuing.

- [ ] **Step 3: Add the CSS block to `styles.css`**

Insert after line 86 (the `}` closing the existing `@media(max-width:820px)` nav block) and before the blank line preceding `.hero{`:

```css

  /* GITHUB CORNER — fixed wedge linking to the source repo.
     Sits above the sticky nav (z-index 50) and reserves room in the nav so the
     "Get Raymol" CTA never slides underneath it. See
     docs/superpowers/specs/2026-08-05-github-corner-design.md */
  .github-corner{position:fixed;top:0;right:0;z-index:60;line-height:0}
  .github-corner svg{display:block;border:0;color:#fff}
  .github-corner .octo-bg{fill:url(#gh-corner-grad) #F2542D}
  .github-corner .octo-arm,.github-corner .octo-body{fill:currentColor}
  .github-corner .octo-arm{transform-origin:130px 106px}
  .github-corner:hover .octo-arm,
  .github-corner:focus-visible .octo-arm{animation:octocat-wave 560ms ease-in-out}
  /* global a:focus-visible uses outline-offset:2px, which draws off-screen at the
     viewport corner and gets clipped; pull it inside the wedge instead */
  .github-corner:focus-visible{outline-offset:-6px}
  @keyframes octocat-wave{0%,100%{transform:rotate(0)}
    20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}
  /* .wrap clears an 80px corner only at >=1224px: it is border-box, so above
     1120px the CTA's right edge sits at (vw-1120)/2 + 28 from the viewport edge. */
  @media(max-width:1223px){nav .wrap{padding-right:108px}}
  /* 960, not the nav's own 820: the nav's one-line content is 800px, so it can only
     afford the 108px reservation above ~936px. Hiding at 820 wraps every link. */
  @media(max-width:960px){.github-corner{display:none}nav .wrap{padding-right:28px}}
  @media(prefers-reduced-motion:reduce){.github-corner .octo-arm{animation:none!important}}
```

**The order of those last three media queries is load-bearing.** The two `nav .wrap` rules have identical specificity, so the cascade decides: the `1223px` rule must come *before* the `960px` rule. Reverse them and at 375 px both queries match, the 1223 rule wins, and the nav keeps a 108 px reservation for a corner that is no longer rendered — which overflows the viewport on a phone.

- [ ] **Step 4: Add the markup to `index.html`**

Insert after line 92 (`<a class="skip-link" ...>`) and before the blank line preceding the `<svg width="0" ...>` defs block:

```html

<a class="github-corner" href="https://github.com/javierbq/RayMol"
   aria-label="View the Raymol source on GitHub">
  <svg width="80" height="80" viewBox="0 0 250 250" aria-hidden="true" focusable="false">
    <defs><linearGradient id="gh-corner-grad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F9A825"/>
      <stop offset="24%" stop-color="#F2542D"/>
      <stop offset="50%" stop-color="#F0185C"/>
    </linearGradient></defs>
    <path class="octo-bg" d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"/>
    <path class="octo-arm" d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"/>
    <path class="octo-body" d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"/>
  </svg>
</a>
```

The corner goes *after* the skip-link so the skip-link stays the first tab stop.

- [ ] **Step 5: Re-run the assertion at 1400 px**

Hard-reload, then run the snippet.

Expected:
```
display: "block", position: "fixed", zIndex: "60", navPadRight: "28px",
overlapPx: 0, href: "https://github.com/javierbq/RayMol",
ariaLabel: "View the Raymol source on GitHub",
gradFill: 'url("#gh-corner-grad")'
```

`gradFill` returning `url("#gh-corner-grad")` confirms the `.octo-bg` selector matched; it does not confirm the gradient actually painted — `getComputedStyle(...).fill` returns the declared `url()` string whether or not the reference resolves. Only the visual screenshot step (Step 8) confirms the wedge actually paints. If `gradFill` reports `none` or a bare color, the selector is not matching at all — fix that before proceeding.

- [ ] **Step 6: Walk the eight boundary widths**

For each of 1400, 1224, 1223, 1000, 961, 960, 900, 375 (px wide, 900 tall): `resize_window`, then run the snippet. Compare every row against the table in "Testing approach".

The pairs that matter most are 1224/1223 and 961/960 — those are the breakpoints flipping. A failure at 1223 or 961 means the reservation is not applying; a non-`none` display at 960 means the hide rule is not applying; a `navLinkMaxH` above ~24 at any width means the reservation is squeezing the nav.

Record the actual eight-row output. Do not paraphrase it as "all widths pass."

- [ ] **Step 7: Verify motion, focus, and id hygiene**

At 1400 px, run:

```js
(() => {
  const rules = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch(e) { return [] } });
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
  return {
    reducedMotionRule: rules.filter(r => r.conditionText?.includes('reduced-motion')).map(r => r.cssText),
    waveKeyframes: rules.some(r => r.name === 'octocat-wave'),
    duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
    tileGradientPresent: !!document.getElementById('tile'),
  };
})()
```

Expected: `reducedMotionRule` contains the `.github-corner .octo-arm{animation:none!important}` rule, `waveKeyframes: true`, `duplicateIds: []`, `tileGradientPresent: true`.

Then confirm keyboard reach: press `Tab` twice from the top of the page (`computer` action `key`, text `Tab`) — first stop is the skip-link, second is the corner — and screenshot to confirm the focus ring draws *inside* the wedge rather than being clipped at the viewport edge.

- [ ] **Step 8: Screenshot at 1400 and 900 px for the visual record**

The geometry checks prove nothing overlaps; these confirm the octocat actually reads against the rotated gradient, which is the reason the axis was rotated in the first place. Look at the head and the raised arm specifically — those sit on the coral end.

- [ ] **Step 9: Commit**

```bash
git add styles.css index.html
git commit -m "$(cat <<'MSG'
Add the GitHub corner triangle to the homepage

Fixed 80px github-corners wedge filled with the Raymol gradient on a rotated
axis (gold at the outer tip), so the white octocat sits on rose-coral instead
of gold, where white only reaches ~1.9:1.

The nav reserves 108px on its right below 1224px so the "Get Raymol" CTA never
slides under the corner. 1224 is where .wrap actually clears an 80px corner --
it is border-box, so the CTA's right edge sits at (vw-1120)/2 + 28. Below 960px
the nav has no room to spare -- its one-line content is 800px, so the 108px
reservation only fits above ~936px -- and the corner is hidden with the
reservation released.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 2: Corner on the support and privacy pages

**Files:**
- Modify: `support.html` (insert after line 49)
- Modify: `privacy.html` (insert after line 47)

**Interfaces:**
- Consumes: the `.github-corner` CSS from Task 1 — already global in `styles.css`, so no CSS changes here.

- [ ] **Step 1: Confirm the insertion points**

```bash
grep -n "skip-link" support.html privacy.html
```

Expected: `support.html:49`, `privacy.html:47`. Both pages have the same `<body>` → skip-link → `<defs>` SVG → `<nav>` structure as `index.html`.

- [ ] **Step 2: Insert the identical markup into `support.html`**

After line 49, byte-identical to the block in Task 1 Step 4:

```html

<a class="github-corner" href="https://github.com/javierbq/RayMol"
   aria-label="View the Raymol source on GitHub">
  <svg width="80" height="80" viewBox="0 0 250 250" aria-hidden="true" focusable="false">
    <defs><linearGradient id="gh-corner-grad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F9A825"/>
      <stop offset="24%" stop-color="#F2542D"/>
      <stop offset="50%" stop-color="#F0185C"/>
    </linearGradient></defs>
    <path class="octo-bg" d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"/>
    <path class="octo-arm" d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"/>
    <path class="octo-body" d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"/>
  </svg>
</a>
```

- [ ] **Step 3: Insert the same block into `privacy.html`**

After line 47. Same markup, repeated here rather than referenced so you are not diffing across tasks:

```html

<a class="github-corner" href="https://github.com/javierbq/RayMol"
   aria-label="View the Raymol source on GitHub">
  <svg width="80" height="80" viewBox="0 0 250 250" aria-hidden="true" focusable="false">
    <defs><linearGradient id="gh-corner-grad" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F9A825"/>
      <stop offset="24%" stop-color="#F2542D"/>
      <stop offset="50%" stop-color="#F0185C"/>
    </linearGradient></defs>
    <path class="octo-bg" d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"/>
    <path class="octo-arm" d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"/>
    <path class="octo-body" d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"/>
  </svg>
</a>
```

- [ ] **Step 4: Confirm the three blocks are truly identical**

```bash
for f in index.html support.html privacy.html; do
  echo -n "$f: "; grep -c 'class="github-corner"' $f
done
grep -h -A13 'class="github-corner"' index.html support.html privacy.html | md5sum
```

Expected: each file reports `1`. The `md5sum` is informational — inspect the three blocks directly if you suspect drift.

- [ ] **Step 5: Run the assertion snippet on both new pages**

Navigate to `http://localhost:8765/support.html`, resize to 1400 px, run the snippet from "Testing approach". Then 961 px, then 960 px. Repeat all three for `privacy.html`.

Expected at 1400: `display: "block"`, `overlapPx: 0`, `navPadRight: "28px"`, `navLinkMaxH` ~21.
Expected at 961: `display: "block"`, `overlapPx: 0`, `navPadRight: "108px"`, `navLinkMaxH` ~21.
Expected at 960: `display: "none"`, `navPadRight: "28px"`, `navLinkMaxH` ~21.

`support.html` and `privacy.html` carry 6 nav links to the homepage's 7 — both omit "Community" (74 px plus one 26 px gap, so ~484 px of links against the homepage's 584 px). Their one-line nav need is therefore ~700 px, clearing the 960 px breakpoint with room to spare. These two pages are the *easier* case; the homepage sets the binding constraint. Measure anyway rather than reasoning from the homepage's numbers.

- [ ] **Step 6: Confirm the redirect stubs were not touched**

```bash
git status --porcelain 404.html community.html
```

Expected: empty output. Any output here is a bug — those two files must stay byte-identical.

- [ ] **Step 7: Commit**

```bash
git add support.html privacy.html
git commit -m "$(cat <<'MSG'
Add the GitHub corner to the support and privacy pages

Same markup as the homepage. All behavior already lives in the shared
styles.css, so these are markup-only changes.

404.html and community.html are deliberately excluded -- both are bare
redirect stubs with no nav for a floating corner to belong to.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

### Task 3: Retire the stale "opening after release" footer note

Independent of the corner: a reviewer could accept the corner and reject this, so it commits separately.

The three footers currently read `Source on GitHub · opening after release`. The repo has been public (22 stars) for a while, so the note is already wrong — and pairing it with a prominent corner inviting people to that repo makes each page contradict itself.

**Files:**
- Modify: `index.html:484`, `support.html:112`, `privacy.html:113`

- [ ] **Step 1: Confirm all three occurrences and that they are identical**

```bash
grep -n 'opening after release' index.html support.html privacy.html
```

Expected: exactly three hits — `index.html:484`, `support.html:112`, `privacy.html:113`.

- [ ] **Step 2: Delete the span from all three files**

In each file, remove exactly this substring, including the single leading space:

```
 <span style="opacity:.55">· opening after release</span>
```

The line goes from:

```html
<a href="https://github.com/javierbq/raymol">Source on GitHub</a> <span style="opacity:.55">· opening after release</span><br>License
```

to:

```html
<a href="https://github.com/javierbq/raymol">Source on GitHub</a><br>License
```

Scoped deliberately: leave the `Source on GitHub` anchor's lowercase `raymol` URL alone (it redirects fine and is not what this change is about), and leave the sibling `License` text alone — it is not a link and is out of scope.

- [ ] **Step 3: Verify the removal and check for collateral damage**

```bash
grep -c 'opening after release' index.html support.html privacy.html; \
grep -c 'Source on GitHub' index.html support.html privacy.html; \
grep -c 'opacity:.55' index.html support.html privacy.html
```

Expected: `0` for the first group in all three files, `1` for `Source on GitHub` in all three, and `0` for `opacity:.55` in all three — that inline style appeared only in the deleted spans.

- [ ] **Step 4: Confirm the footer renders correctly**

Reload `http://localhost:8765/index.html`, scroll to the footer, and screenshot the "Open source" column. Confirm it reads `Built on PyMOL / Source on GitHub / License` on three lines with no stray separator or dangling `·`.

- [ ] **Step 5: Commit**

```bash
git add index.html support.html privacy.html
git commit -m "$(cat <<'MSG'
Drop the stale "opening after release" footer note

javierbq/RayMol has been public for a while, so the note was already wrong.
With a GitHub corner now inviting people to the repo, leaving it in would make
each page contradict itself.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

- [ ] **Step 6: Stop the local server**

Stop the backgrounded `python3 -m http.server` (via `TaskStop` on the background Bash task, or `preview_stop` if it was registered as a preview server).

---

## Plan self-review

**Spec coverage.** Walked every spec section against the tasks:

| Spec requirement | Task |
| --- | --- |
| Markup on the three nav pages | 1 (index), 2 (support, privacy) |
| `gh-corner-grad` id, no `#tile` collision | 1 Step 4, verified 1 Step 7 |
| Rotated gradient axis | 1 Step 4, verified visually 1 Step 8 |
| 80 px size | 1 Step 4 |
| `position:fixed`, `z-index:60` | 1 Step 3, verified 1 Step 5 |
| Wave on hover *and* focus | 1 Step 3, verified 1 Step 7 |
| `outline-offset:-6px` focus fix | 1 Step 3, verified 1 Step 7 |
| Reduced-motion suppression | 1 Step 3, verified 1 Step 7 |
| 1224 px nav reservation | 1 Step 3, verified 1 Step 6 |
| Hidden ≤960 px, padding released | 1 Step 3, verified 1 Step 6 |
| Nav links never wrap at any width | verified 1 Step 6 via `navLinkMaxH` |
| Stock touch-device wave block omitted | Not written — omission needs no task |
| `404.html` / `community.html` untouched | 2 Step 6 |
| Footer copy fix | 3 |
| All 8 verification widths | 1 Step 6 |

No gaps.

**Placeholder scan.** No `TBD`/`TODO`/"handle edge cases". Every code step carries literal content. Task 2 repeats the full SVG twice rather than saying "same as Task 1" — deliberate, since tasks may be executed by separate agents that never see Task 1.

**Name consistency.** `.github-corner`, `.octo-bg`, `.octo-arm`, `.octo-body`, `gh-corner-grad`, and `octocat-wave` are spelled identically in the CSS (Task 1 Step 3), all three markup blocks (Tasks 1–2), and both assertion snippets (Steps 5–7). The href is `javierbq/RayMol` in all four places it appears.

**One deviation from the skill's default worth naming.** The skill prescribes a write-test → watch-it-fail → implement → watch-it-pass loop. There is no test runner in this repo, so Task 1 substitutes the browser assertion snippet, run first at Step 2 to observe `NO .github-corner IN DOM` before any implementation. Tasks 2 and 3 are propagation and copy edits whose correctness is established by `grep` counts and geometry re-checks rather than by new assertions.
