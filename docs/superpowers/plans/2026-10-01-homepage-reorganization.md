# Homepage Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder and merge the raymol.io homepage sections so the gold Materials loop leads, a highlights bento lands on screen 2, and the headline features (rendering, Materials, Design & Predict, Claude) run back to back, with Download closing the page.

**Architecture:** Everything happens in `index.html` and `styles.css`, plus one rename in `main.js` and one nav line in each of `support.html` and `privacy.html`. Task 1 does a pure, script-driven reorder of the existing blocks. Each later task makes one merge or one new component, and each ends with a browser-measured check of the page structure.

**Tech Stack:** Static HTML + CSS + vanilla JS on GitHub Pages. No framework, no bundler, **no test runner**.

**Spec:** `docs/superpowers/specs/2026-10-01-homepage-reorganization-design.md` (approved)

## Global Constraints

- Work in the worktree `~/repos/raymol-site/.claude/worktrees/site-1-12-0-materials` on branch `claude/site-1-12-0-materials` (PR #11). Never commit to `main`.
- The product is written **"Raymol"** in page copy.
- Copy is either moved verbatim from the current page or quoted from the spec. Write no other new claims.
- Never mention Binder Design / RFdiffusion3, or MSA search (#12).
- Every anchor in this list must keep resolving: `#features`, `#compare`, `#materials`, `#design-predict`, `#ai-connect`, `#devices`, `#themes`, `#faq`, `#download`, `#supporters`.
- Breakpoints the nav must survive on one line: 1224/1223 and 961/960 px (GitHub-corner reservation).
- Match the existing 2-space indentation and the inline-style header pattern of neighboring sections.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A visitor with a stale cached `styles.css`.** GitHub Pages caches for ~10 min. The new hero video must still render at page width, not at its intrinsic 1280 px. Pinned in Task 2, Step 6.
2. **Reduced motion.** The hero video must not autoplay; it shows the poster with native controls. The theme carousel must not auto-advance. Pinned in Task 2, Step 6.
3. **Old links.** URLs already in the wild (`/#features`, `/#compare`, `/#themes`, `/#devices`, `/#download`) must land on the matching content: `#features` on the rendering header, `#themes` on Make it yours. Pinned in Task 7, Step 4.
4. **Keyboard users.** The bento tiles must be reachable with Tab, show a visible focus ring, and navigate on Enter. Pinned in Task 3, Step 4.
5. **Phones (375 px).** The hamburger menu must hold the new links, close when one is tapped, and land on the section. Hero video, bento and download cards must fit without horizontal scroll. Pinned in Task 7, Step 4, and the harness `hScroll` field.

---

## Testing approach — read before Task 1

There is no test framework. The substitute is a browser-measured check run through the Playwright MCP tool `browser_run_code_unsafe`. Write the expectation first, watch it fail against the current page, make the change, and watch it pass.

### Local server

Port binding needs the sandbox's local-binding permission, or an unsandboxed run:

```bash
python3 -m http.server 8765 --bind 127.0.0.1 -d ~/repos/raymol-site/.claude/worktrees/site-1-12-0-materials
```

### Harness H (paste into `browser_run_code_unsafe`; edit `WIDTHS` per task)

```js
async (page) => {
  const WIDTHS = [[1280, 800]];
  const out = {};
  for (const [w, h] of WIDTHS) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
      scrollTo(0, 0);
      document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
    });
    await page.waitForLoadState('networkidle');
    out[w] = await page.evaluate((vh) => {
      const vw = document.documentElement.clientWidth, total = document.documentElement.scrollHeight;
      const blocks = [...document.querySelectorAll('main > section, main > div')];
      const key = el => el.id || el.className.split(' ')[0];
      return {
        order: blocks.map(key),
        screen: Object.fromEntries(blocks.map(el => [key(el), +((el.getBoundingClientRect().top + scrollY) / vh + 1).toFixed(1)])),
        screens: +(total / vh).toFixed(1),
        hScroll: document.documentElement.scrollWidth > vw,
        navMaxH: Math.max(0, ...[...document.querySelectorAll('nav .links a')].map(a => Math.round(a.getBoundingClientRect().height))),
        missingAnchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(x => x.length > 1 && !document.querySelector(x)),
        legacyAnchors: ['#features','#compare','#materials','#design-predict','#ai-connect','#devices','#themes','#faq','#download','#supporters'].filter(x => !document.querySelector(x)),
        brokenImgs: [...document.images].filter(i => !i.closest('.carousel-slide:not(.active)') && !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')),
      };
    }, h);
  }
  return out;
}
```

**Every task's passing state also requires** `hScroll: false`, `missingAnchors: []`, `legacyAnchors: []`, and `brokenImgs: []` at the widths that task runs.

---

### Task 1: Reorder the existing blocks

**Files:**
- Modify: `index.html` (everything between `<main id="main">` and `</main>`)

**Interfaces:**
- Produces: blocks in the order `hero, trust, features, compare, materials, design-predict, ai-connect, devices, controls, touch, themes, toolkit, faq, supporters, download, final`. Three new ids, `id="controls"` (Fine layer controls), `id="touch"` (Built for touch) and `id="toolkit"` (the PyMOL toolkit grid), plus the comments `<!-- FINE LAYER CONTROLS -->` and `<!-- BUILT FOR TOUCH -->`. Later tasks address blocks by these ids and comments.

- [ ] **Step 1: State the expectation and run it against the current page**

Run Harness H with `WIDTHS = [[1280, 800]]`. Expected after this task: `order` equals
`["hero","trust","features","compare","materials","design-predict","ai-connect","devices","controls","touch","themes","toolkit","faq","supporters","download","final"]`.
Expected now (FAIL): `order` begins `["hero","trust","download","devices","features","materials","compare","wrap","wrap",…]`.

- [ ] **Step 2: Reorder with a script that asserts every marker**

Run from the worktree root:

```bash
python3 - <<'EOF'
import pathlib
p = pathlib.Path('index.html'); s = p.read_text(encoding='utf-8')
starts = {
  'hero': '<!-- HERO -->',
  'trust': '<!-- TRUST -->',
  'download': '<!-- DOWNLOAD / INSTALL CHANNELS -->',
  'devices': '<!-- DEVICE LINEUP / PORTABILITY -->',
  'features': '<!-- FEATURES -->',
  'materials': '<!-- MATERIALS — new in 1.12',
  'compare': '<!-- COMPARISON -->',
  'controls': '<section class="wrap" style="padding-top:64px;padding-bottom:40px">\n  <div class="feat flip reveal">',
  'touch': '<section class="wrap" style="padding-top:40px">',
  'themes': '<!-- THEMES -->',
  'design-predict': '<!-- DESIGN & PREDICT',
  'ai-connect': '<!-- CONNECT AN AI APP (MCP) -->',
  'toolkit': '<!-- SECONDARY GRID -->',
  'raymond': '<!-- RAYMOND section temporarily disabled',
  'faq': '<!-- FAQ -->',
  'supporters': '<!-- SUPPORTED BY -->',
  'final': '<!-- FINAL CTA -->',
}
for k, m in starts.items():
    assert s.count(m) == 1, (k, s.count(m))
head, rest = s.split('<main id="main">\n', 1)
body, tail = rest.split('</main>', 1)
pos = sorted((body.index(m), k) for k, m in starts.items())
assert body[:pos[0][0]].strip() == '', 'unexpected content before the hero'
blocks = {}
for i, (start, k) in enumerate(pos):
    end = pos[i + 1][0] if i + 1 < len(pos) else len(body)
    blocks[k] = body[start:end].rstrip() + '\n\n'
sec = '<section class="wrap" style="padding-top:64px;padding-bottom:40px">'
blocks['controls'] = blocks['controls'].replace(sec, '<!-- FINE LAYER CONTROLS -->\n<section id="controls" class="wrap" style="padding-top:64px;padding-bottom:40px">', 1)
blocks['touch'] = blocks['touch'].replace('<section class="wrap" style="padding-top:40px">', '<!-- BUILT FOR TOUCH -->\n<section id="touch" class="wrap" style="padding-top:40px">', 1)
blocks['toolkit'] = blocks['toolkit'].replace(sec, '<section id="toolkit" class="wrap" style="padding-top:64px;padding-bottom:40px">', 1)
order = ['hero', 'trust', 'features', 'compare', 'materials', 'design-predict', 'ai-connect', 'devices',
         'controls', 'touch', 'themes', 'toolkit', 'raymond', 'faq', 'supporters', 'download', 'final']
assert sorted(order) == sorted(blocks), set(order) ^ set(blocks)
p.write_text(head + '<main id="main">\n\n' + ''.join(blocks[k] for k in order) + '</main>' + tail, encoding='utf-8')
print('reordered')
EOF
```

Expected output: `reordered`. Any `AssertionError` means a marker moved; stop and inspect rather than loosening the assertion.

- [ ] **Step 3: Run the check again**

Run Harness H with `WIDTHS = [[1280, 800], [375, 812]]`. Expected (PASS): `order` exactly as in Step 1 at both widths, and the always-required fields are clean.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Reorder homepage sections: headline features first, Download last

A pure move, no copy changes: rendering, comparison, Materials, Design &
Predict and Claude now follow the hero; Download moves to the end. Adds
ids to the three sections that had none so later steps can address them.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Gold-loop hero, sharper lead, and "Make it yours"

The theme carousel leaves the hero and becomes the visual of the merged Inspector + Themes section. It moves in this same task so it's never missing from the page.

**Files:**
- Modify: `index.html`: critical `<style>` in `<head>`, hero lead, `.hero-shot`, the Materials `.mat-hero` block, the `#controls` block, the `#themes` block
- Modify: `styles.css`: the `.hero-shot` line and the MATERIALS block
- Modify: `main.js`: rename `initHeroCarousel` → `initThemeCarousel`

**Interfaces:**
- Consumes: `#controls` and `<!-- FINE LAYER CONTROLS -->` from Task 1; `initVideos()` (existing, matches `video[data-autoplay]`).
- Produces: `.hero-video` (CSS class, 16:9 frame); `#themes` now holding `.theme-carousel`; `initThemeCarousel()` in `main.js`; `initVideos()` observing at `threshold: 0.1`.

- [ ] **Step 1: State the expectation and run it (FAIL)**

```js
async (page) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  return await page.evaluate(() => {
    const hero = document.querySelector('.hero'), v = hero.querySelector('video[data-autoplay]');
    return {
      heroVideo: !!v && v.querySelector('source').getAttribute('src') === 'assets/video/materials-gold.mp4',
      heroPlaying: !!v && !v.paused && v.muted && v.loop,
      heroHasCarousel: !!hero.querySelector('.theme-carousel'),
      lead: hero.querySelector('.lead').textContent.startsWith('Raymol is the open-source PyMOL engine rebuilt'),
      themesCarouselSlides: document.querySelectorAll('#themes .theme-carousel .tc-slide').length,
      themesFirstSlideLazy: document.querySelector('#themes .tc-slide')?.getAttribute('loading') === 'lazy',
      controlsGone: !document.getElementById('controls'),
      materialsVideo: !!document.querySelector('#materials video'),
      jsRenamed: typeof initThemeCarousel === 'function' && typeof initHeroCarousel === 'undefined',
    };
  });
}
```

Expected after this task: `heroVideo: true, heroPlaying: true, heroHasCarousel: false, lead: true, themesCarouselSlides: 4, themesFirstSlideLazy: true, controlsGone: true, materialsVideo: false, jsRenamed: true`. Expected now: the opposite on most fields.

- [ ] **Step 2: Hero: lead and visual**

In `index.html`, replace the lead paragraph:

```html
  <p class="lead">Raymol is a Metal-based build of PyMOL for Mac, iPad, and iPhone — a modern, native interface with real-time rendering, on the open-source engine you already know.</p>
```

with:

```html
  <p class="lead">Raymol is the open-source PyMOL engine rebuilt for Mac, iPad, and iPhone: real-time ray tracing and materials, on-device protein design and structure prediction, and Claude at the controls.</p>
```

Then replace this whole block, the hero's visual (Step 4 re-creates the carousel in its new home):

```html
  <div class="hero-shot reveal">
    <div class="theme-carousel" role="group" aria-label="The same Raymol session in four built-in themes">
      <img class="tc-slide active" src="assets/screenshots/hero-classic.webp?v=1" alt="Raymol on macOS — Classic theme — rainbow cartoon of ubiquitin (1UBQ) in the Metal viewport" width="2400" height="1600" loading="eager" decoding="async">
      <img class="tc-slide" src="assets/screenshots/hero-paper.webp?v=1" alt="Raymol on macOS — Paper theme" width="2400" height="1600" loading="lazy" decoding="async">
      <img class="tc-slide" src="assets/screenshots/hero-sunset.webp?v=1" alt="Raymol on macOS — Sunset theme" width="2400" height="1600" loading="lazy" decoding="async">
      <img class="tc-slide" src="assets/screenshots/hero-dawn.webp?v=1" alt="Raymol on macOS — Dawn theme" width="2400" height="1600" loading="lazy" decoding="async">
      <span class="tc-label" aria-hidden="true">Classic</span>
      <div class="tc-dots" role="tablist" aria-label="Theme">
        <button class="tc-dot active" type="button" aria-label="Classic theme"></button>
        <button class="tc-dot" type="button" aria-label="Paper theme"></button>
        <button class="tc-dot" type="button" aria-label="Sunset theme"></button>
        <button class="tc-dot" type="button" aria-label="Dawn theme"></button>
      </div>
    </div>
  </div>
```

with:

```html
  <div class="hero-shot reveal">
    <div class="hero-video">
      <video data-autoplay width="1280" height="720" muted loop playsinline controls preload="none" poster="assets/screenshots/materials-gold-poster.webp" aria-label="A heme protein turning in place in Raymol: a gold cartoon with gold side chains around the heme">
        <source src="assets/video/materials-gold.mp4" type="video/mp4">
      </video>
    </div>
  </div>
```

In the critical `<style>` in `<head>`, add after the `.tc-slide.active{opacity:1}` line:

```css
.hero-video{aspect-ratio:16/9;overflow:hidden;border-radius:16px}
.hero-video video{display:block;width:100%;height:100%;object-fit:cover}
```

- [ ] **Step 3: Materials: drop the moved video**

In `index.html`, delete this block from the `#materials` section, including the blank line after it:

```html
  <div class="media mat-hero reveal">
    <video data-autoplay width="1280" height="720" muted loop playsinline controls preload="none" poster="assets/screenshots/materials-gold-poster.webp" aria-label="A heme protein turning in place in Raymol: a gold cartoon with gold side chains around the heme">
      <source src="assets/video/materials-gold.mp4" type="video/mp4">
    </video>
  </div>
```

- [ ] **Step 4: Merge Inspector + Themes into "Make it yours"**

Delete the `#controls` block: from `<!-- FINE LAYER CONTROLS -->` up to, but not including, `<!-- BUILT FOR TOUCH -->`.

Replace the `#themes` block (from `<!-- THEMES -->` through its closing `</section>`) with:

```html
<!-- MAKE IT YOURS — Inspector controls and themes. The Mac theme carousel moved here from the hero. -->
<section id="themes" class="wrap" style="padding-top:72px;padding-bottom:72px;background:var(--bg2)">
  <div class="feat reveal">
    <div class="txt">
      <div class="kicker">Make it yours</div>
      <h2>Your controls,<br>your colors.</h2>
      <p>A live inspector exposes per-representation controls — cartoon tube radius, surface quality, stick and sphere scale, transparency, material, per-object color — plus a scene card for lighting, shadows, and antialiasing. Drag a slider and the viewport updates. The familiar A/S/H/L/C menus are a tap away.</p>
      <p>Restyle the entire interface in a tap. Four themes ship built in — and <b style="color:var(--ink)">Theme Studio</b> lets you craft your own. Your theme follows you across Mac, iPad, and iPhone.</p>
    </div>
    <div class="theme-carousel" role="group" aria-label="The same Raymol session in four built-in themes">
      <img class="tc-slide active" src="assets/screenshots/hero-classic.webp?v=1" alt="Raymol on macOS — Classic theme — rainbow cartoon of ubiquitin (1UBQ) in the Metal viewport" width="2400" height="1600" loading="lazy" decoding="async">
      <img class="tc-slide" src="assets/screenshots/hero-paper.webp?v=1" alt="Raymol on macOS — Paper theme" width="2400" height="1600" loading="lazy" decoding="async">
      <img class="tc-slide" src="assets/screenshots/hero-sunset.webp?v=1" alt="Raymol on macOS — Sunset theme" width="2400" height="1600" loading="lazy" decoding="async">
      <img class="tc-slide" src="assets/screenshots/hero-dawn.webp?v=1" alt="Raymol on macOS — Dawn theme" width="2400" height="1600" loading="lazy" decoding="async">
      <span class="tc-label" aria-hidden="true">Classic</span>
      <div class="tc-dots" role="tablist" aria-label="Theme">
        <button class="tc-dot active" type="button" aria-label="Classic theme"></button>
        <button class="tc-dot" type="button" aria-label="Paper theme"></button>
        <button class="tc-dot" type="button" aria-label="Sunset theme"></button>
        <button class="tc-dot" type="button" aria-label="Dawn theme"></button>
      </div>
    </div>
  </div>
</section>
```

The only change to the carousel markup is that the first slide's `loading="eager"` becomes `loading="lazy"`: it's far below the fold now.

- [ ] **Step 5: CSS and JS**

In `styles.css`, replace:

```css
  .hero-shot{margin-top:54px}
```

with:

```css
  .hero-shot{margin-top:54px}
  /* hero visual: the Materials loop; playback is initVideos() in main.js */
  .hero-video{position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;border:1px solid #1c1f27;box-shadow:0 40px 90px rgba(11,13,18,.34);background:#000}
  .hero-video video{display:block;width:100%;height:100%;object-fit:cover}
```

In the MATERIALS block of `styles.css`, replace these three lines:

```css
  /* MATERIALS (1.12) — hero loop, four image cards, then a .feat row for the Inspector.
     The video's playback is driven by initVideos() in main.js. */
  .mat-hero{margin-top:40px;aspect-ratio:16/9;border:1px solid #1c1f27;box-shadow:0 40px 90px rgba(11,13,18,.28)}
  .mat-hero video{display:block;width:100%;height:100%;object-fit:cover}
  .mat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:28px}
```

with:

```css
  /* MATERIALS (1.12) — four image cards, then a .feat row for the Inspector */
  .mat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:40px}
```

In `main.js`, rename the function and its call. The theme carousel no longer lives in the hero:

```bash
sed -i '' 's/initHeroCarousel/initThemeCarousel/g' main.js && grep -n "initThemeCarousel\|initHeroCarousel" main.js
```

Expected: two lines, both `initThemeCarousel` (the definition and the call in `DOMContentLoaded`).

Still in `main.js`, lower the autoplay threshold in `initVideos`. Measured at 1280×800 with the new three-line lead, only about 22% of the hero video is on screen at load, which is under the current 25%, so the hero would sit on its poster until the visitor scrolls. Replace:

```js
  }, { threshold: 0.25 });
```

with:

```js
  }, { threshold: 0.1 });
```

The pause-when-scrolled-away behavior is unchanged: below 10% visible counts as away.

- [ ] **Step 6: Run the check again, plus the Review Focus checks (PASS)**

Re-run the Step 1 snippet; expect every field as listed there. Then run:

```js
async (page) => {
  const res = {};
  await page.setViewportSize({ width: 1280, height: 800 });
  // carousel still auto-advances in its new home
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  await page.locator('#themes .theme-carousel').scrollIntoViewIfNeeded();
  const first = await page.evaluate(() => [...document.querySelectorAll('#themes .tc-slide')].findIndex(s => s.classList.contains('active')));
  await page.waitForTimeout(4500);
  res.carouselAdvanced = first !== await page.evaluate(() => [...document.querySelectorAll('#themes .tc-slide')].findIndex(s => s.classList.contains('active')));
  // reduced motion: no autoplay, controls shown, carousel holds still
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  res.reducedHero = await page.evaluate(() => { const v = document.querySelector('.hero video'); return { paused: v.paused, controls: v.controls }; });
  await page.locator('#themes .theme-carousel').scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);
  res.reducedCarouselStill = await page.evaluate(() => document.querySelector('#themes .tc-slide').classList.contains('active'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // stale cached styles.css: critical CSS alone must keep the hero video at page width
  await page.route('**/styles.css', r => r.abort());
  for (const w of [1280, 375]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'domcontentloaded' });
    res['staleCss' + w] = await page.evaluate(() => Math.round(document.querySelector('.hero video').getBoundingClientRect().width) <= document.documentElement.clientWidth);
  }
  await page.unroute('**/styles.css');
  return res;
}
```

Expected: `carouselAdvanced: true`, `reducedHero: {paused: true, controls: true}`, `reducedCarouselStill: true`, `staleCss1280: true`, `staleCss375: true`.

Then run Harness H with `WIDTHS = [[1280, 800], [375, 812]]`. Expected `order`: `["hero","trust","features","compare","materials","design-predict","ai-connect","devices","touch","themes","toolkit","faq","supporters","download","final"]`, with the always-required fields clean.

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css main.js
git commit -m "Lead with the gold Materials loop; merge Inspector and Themes

The hero visual becomes the Materials video (poster first, muted loop,
critical CSS so a stale stylesheet can't overflow it), with a lead that
names the hooks. The theme carousel moves into a merged \"Make it yours\"
section with the Inspector copy; initHeroCarousel becomes
initThemeCarousel to match.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Highlights bento replaces the trust strip

**Files:**
- Modify: `index.html` (the `<!-- TRUST -->` block)
- Modify: `styles.css` (new HIGHLIGHTS block after the `.trust` rules)

**Interfaces:**
- Consumes: section ids `#materials`, `#compare`, `#design-predict`, `#ai-connect`.
- Produces: `#highlights` with four `a.hl-tile`; CSS classes `.hl-grid`, `.hl-tile`, `.hl-tile--ui`, `.hl-body`, `.hl-title`, `.hl-line`, `.hl-note`, `.hl-trust`.

- [ ] **Step 1: State the expectation and run it (FAIL)**

```js
async (page) => {
  const res = {};
  for (const w of [1280, 820, 375]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
    res[w] = await page.evaluate(() => {
      const g = document.querySelector('#highlights .hl-grid');
      return {
        afterHero: document.querySelector('.hero')?.nextElementSibling?.id === 'highlights',
        hrefs: [...document.querySelectorAll('#highlights a.hl-tile')].map(a => a.getAttribute('href')),
        cols: g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0,
        trustGone: !document.querySelector('.trust'),
        trustLine: document.querySelector('#highlights .hl-trust')?.textContent.trim(),
      };
    });
  }
  return res;
}
```

Expected after this task:
- `afterHero: true` and `trustGone: true` at every width.
- `hrefs: ["#materials","#compare","#design-predict","#ai-connect"]`.
- `cols` of 4 at 1280, 2 at 820, and 1 at 375.
- `trustLine: "Built on the real PyMOL engine · 60 fps Metal rendering · Mac · iPad · iPhone · Free"`.

Expected now: `afterHero: false`, `hrefs: []`.

- [ ] **Step 2: Markup**

Replace the whole `<!-- TRUST -->` block (from the comment through `</div></div>`) with:

```html
<!-- HIGHLIGHTS — the four reasons to install, each a link down to its section -->
<section id="highlights" class="wrap" aria-label="Highlights" style="padding-top:16px;padding-bottom:56px">
  <div class="hl-grid reveal">
    <a class="hl-tile" href="#materials">
      <img src="assets/screenshots/materials-marble.webp" alt="" loading="lazy" width="960" height="720">
      <span class="hl-body"><span class="hl-title">Gold, glass, marble</span><span class="hl-line">Nine materials, on any layer.</span></span>
    </a>
    <a class="hl-tile" href="#compare">
      <img src="assets/screenshots/compare-surface-raymol.webp?v=6" alt="" loading="lazy" width="2400" height="2640">
      <span class="hl-body"><span class="hl-title">Light that looks real</span><span class="hl-line">Shadows and depth, side by side with PyMOL.</span></span>
    </a>
    <a class="hl-tile" href="#design-predict">
      <img src="assets/screenshots/tools-predict.webp" alt="" loading="lazy" width="1000" height="562">
      <span class="hl-body"><span class="hl-title">Design and fold, on-device</span><span class="hl-line">ProteinMPNN and Boltz-2, with no server.</span></span>
    </a>
    <a class="hl-tile hl-tile--ui" href="#ai-connect">
      <img src="assets/screenshots/mcp-connect.png?v=1" alt="" loading="lazy" width="477" height="413">
      <span class="hl-body"><span class="hl-title">Let Claude drive</span><span class="hl-line">Claude drives Raymol through its built-in MCP server.</span><span class="hl-note">Mac direct download &amp; Homebrew</span></span>
    </a>
  </div>
  <p class="hl-trust">Built on the real PyMOL engine · 60 fps Metal rendering · Mac · iPad · iPhone · Free</p>
</section>
```

The images are `alt=""` on purpose: each tile's text names the link, and an image description would only repeat it.

- [ ] **Step 3: CSS**

In `styles.css`, insert directly after the line `  .trust b{color:var(--ink)}`:

```css

  /* HIGHLIGHTS BENTO — four tiles under the hero, each a link down to its section */
  .hl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
  .hl-tile{min-width:0;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#fff;transition:transform .2s ease,box-shadow .2s ease}
  .hl-tile:hover,.hl-tile:focus-visible{transform:translateY(-3px);box-shadow:0 14px 34px rgba(11,13,18,.14)}
  .hl-tile img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;background:var(--darkpanel)}
  .hl-tile--ui img{object-fit:contain;background:var(--bg2);padding:14px}
  .hl-body{display:flex;flex-direction:column;gap:4px;padding:14px 16px 16px}
  .hl-title{font-weight:700;font-size:16px;color:var(--ink)}
  .hl-line{font-size:13.5px;color:var(--muted)}
  .hl-note{font-size:12px;color:#8a93a0}
  .hl-trust{margin:22px 0 0;text-align:center;font-size:13px;color:#8a93a0}
  @media(max-width:1000px){.hl-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:560px){.hl-grid{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){.hl-tile{transition:none}.hl-tile:hover,.hl-tile:focus-visible{transform:none}}
```

The old `.trust` rules stay: they're tiny and harmless, and deleting them is out of scope.

- [ ] **Step 4: Run the check again, plus the keyboard check (PASS)**

Re-run the Step 1 snippet; expect the listed values. Then:

```js
async (page) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  let found = false;
  for (let i = 0; i < 40 && !found; i++) {
    await page.keyboard.press('Tab');
    found = await page.evaluate(() => document.activeElement?.classList.contains('hl-tile'));
  }
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  return { found, ring, hash: await page.evaluate(() => location.hash) };
}
```

Expected: `found: true`, `ring` not `"none"`, `hash: "#materials"`.

Run Harness H with `WIDTHS = [[1280, 800], [820, 1000], [375, 812]]`. Expected `order` starts `["hero","highlights","features","compare",…]`, with the always-required fields clean.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css
git commit -m "Add a highlights bento under the hero

Four tiles (Materials, ray tracing, Design & Predict, Claude) give the
whole pitch on screen 2 and link down to each section. The trust strip's
facts fold into one line beneath them.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Merge the rendering card into the comparison section

**Files:**
- Modify: `index.html` (delete `<!-- FEATURES -->` block; rewrite the `#compare` header)

**Interfaces:**
- Consumes: Task 1's order (Features sits directly before Compare).
- Produces: `#compare` header with kicker "Real-time rendering" and an empty `<span id="features"></span>` keeping `#features` alive.

- [ ] **Step 1: State the expectation and run it (FAIL)**

```js
async (page) => {
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  return await page.evaluate(() => ({
    featuresSection: !!document.querySelector('section#features'),
    featuresAnchorInCompare: !!document.querySelector('#compare #features'),
    kicker: document.querySelector('#compare .kicker')?.textContent.trim(),
    renderingImg: !!document.querySelector('img[src*="rendering.webp"]'),
    pseLine: document.querySelector('#compare')?.textContent.includes('Open the same .pse in Raymol and PyMOL'),
  }));
}
```

Expected after this task: `featuresSection: false, featuresAnchorInCompare: true, kicker: "Real-time rendering", renderingImg: false, pseLine: true`.

- [ ] **Step 2: Delete the Features block**

```bash
python3 - <<'EOF'
import pathlib
p = pathlib.Path('index.html'); s = p.read_text(encoding='utf-8')
a, b = s.index('<!-- FEATURES -->'), s.index('<!-- COMPARISON -->')
assert a < b and s[a:b].count('<section') == 1, 'Features must sit directly before Compare'
p.write_text(s[:a] + s[b:], encoding='utf-8'); print('features block removed')
EOF
```

- [ ] **Step 3: Rewrite the comparison header**

Replace:

```html
<!-- COMPARISON -->
<section id="compare" class="compare">
  <div class="wrap">
    <div style="text-align:center">
      <div class="kicker" style="color:var(--gold)">Raymol vs PyMOL</div>
      <h2 style="font-size:38px;font-weight:800;color:#fff;margin-top:10px">The same scene,<br>two renderers.</h2>
      <p style="color:#aeb6c2;font-size:17px;max-width:620px;margin:16px auto 0">Open the same <code style="color:#fff">.pse</code> in each. Raymol's Metal viewport adds shadows, ambient occlusion, and antialiasing that PyMOL's default OpenGL viewport doesn't show in real time.</p>
    </div>
```

with:

```html
<!-- REAL-TIME RENDERING + RAYMOL VS PYMOL — absorbs the old #features card; #features stays as an anchor -->
<section id="compare" class="compare">
  <div class="wrap">
    <div style="text-align:center">
      <span id="features"></span>
      <div class="kicker" style="color:var(--gold)">Real-time rendering</div>
      <h2 style="font-size:38px;font-weight:800;color:#fff;margin-top:10px">Shadows and depth,<br>in real time.</h2>
      <p style="color:#aeb6c2;font-size:17px;max-width:680px;margin:16px auto 0">A Metal rendering engine replaces OpenGL, adding real-time shadow mapping, ambient occlusion, and order-independent transparency at interactive frame rates — and, new in 1.12, materials from polished gold to glass that bends light. On supported Apple Silicon, hardware ray tracing is available for higher-quality lighting, and reflective materials then reflect the structure itself.</p>
      <p style="color:#aeb6c2;font-size:17px;max-width:680px;margin:12px auto 0">Open the same <code style="color:#fff">.pse</code> in Raymol and PyMOL: Raymol's Metal viewport adds shadows, ambient occlusion, and antialiasing that PyMOL's default OpenGL viewport doesn't show in real time.</p>
    </div>
```

- [ ] **Step 4: Run the check again (PASS)**

Re-run the Step 1 snippet; expect the listed values. Run Harness H with `WIDTHS = [[1280, 800], [375, 812]]`. Expected `order`: `["hero","highlights","compare","materials","design-predict","ai-connect","devices","touch","themes","toolkit","faq","supporters","download","final"]`, with the always-required fields clean.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Fold the rendering card into the comparison section

The rendering copy becomes the comparison's intro, and the static
rendering.webp card goes, since the slider shows the same thing better.
#features stays alive as an anchor inside the section.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Merge Touch into "The same app, on every screen"

**Files:**
- Modify: `index.html` (the `#devices` section; delete `<!-- BUILT FOR TOUCH -->` block)

**Interfaces:**
- Consumes: `#touch` and `<!-- BUILT FOR TOUCH -->` from Task 1; `<!-- MAKE IT YOURS` from Task 2, which follows it.
- Produces: `#devices` holding the touch-gesture paragraph.

- [ ] **Step 1: State the expectation and run it (FAIL)**

```js
async (page) => {
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  return await page.evaluate(() => ({
    touchGone: !document.getElementById('touch'),
    touchImg: !!document.querySelector('img[src*="touch.webp"]'),
    devicesHasGestures: document.querySelector('#devices').textContent.includes('pinch to zoom, twist to roll'),
  }));
}
```

Expected after this task: `touchGone: true, touchImg: false, devicesHasGestures: true`.

- [ ] **Step 2: Add the gesture paragraph to Devices**

Replace:

```html
      <p style="color:var(--muted);font-size:16px;max-width:620px;margin:18px auto 0">The iPhone build is the <b style="color:var(--ink)">complete app</b> — the same engine, representations, settings, command language, and export as the Mac, on the device in your pocket.</p>
    </div>
```

with:

```html
      <p style="color:var(--muted);font-size:16px;max-width:620px;margin:18px auto 0">The iPhone build is the <b style="color:var(--ink)">complete app</b> — the same engine, representations, settings, command language, and export as the Mac, on the device in your pocket.</p>
      <p style="color:var(--muted);font-size:16px;max-width:620px;margin:14px auto 0"><b style="color:var(--ink)">Built for touch:</b> one finger to rotate, two to pan, pinch to zoom, twist to roll, combined in a single gesture. On Mac, trackpad gestures map to the camera, with the classic per-button mouse mode also available.</p>
    </div>
```

- [ ] **Step 3: Delete the Touch block**

```bash
python3 - <<'EOF'
import pathlib
p = pathlib.Path('index.html'); s = p.read_text(encoding='utf-8')
a, b = s.index('<!-- BUILT FOR TOUCH -->'), s.index('<!-- MAKE IT YOURS')
assert a < b and s[a:b].count('<section') == 1, 'Touch must sit directly before Make it yours'
p.write_text(s[:a] + s[b:], encoding='utf-8'); print('touch block removed')
EOF
```

- [ ] **Step 4: Run the check again (PASS)**

Re-run the Step 1 snippet; expect the listed values. Run Harness H with `WIDTHS = [[1280, 800], [375, 812]]`. Expected `order`: `["hero","highlights","compare","materials","design-predict","ai-connect","devices","themes","toolkit","faq","supporters","download","final"]`, with the always-required fields clean.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Fold Built for touch into the every-screen section

The gesture copy becomes a paragraph under the device lineup; the tall
touch.webp gesture guide goes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Download closes the page

**Files:**
- Modify: `index.html` (replace `<!-- DOWNLOAD / INSTALL CHANNELS -->` + `<!-- FINAL CTA -->` blocks with one section)

**Interfaces:**
- Consumes: Task 1's order (Download, then Final CTA, then `</main>`); `initDownload()` (existing; finds `.brew-copy` and `#brew-cmd`).
- Produces: `<section id="download" class="final">` as the last child of `<main>`.

- [ ] **Step 1: State the expectation and run it (FAIL)**

```js
async (page) => {
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  const res = await page.evaluate(() => {
    const last = document.querySelector('main').lastElementChild;
    return {
      lastIsDownload: last.id === 'download' && last.classList.contains('final'),
      icon: !!last.querySelector('.grad-tile'),
      h2: last.querySelector('h2')?.textContent.trim(),
      groups: last.querySelectorAll('.dl-group').length,
      finalSections: document.querySelectorAll('section.final').length,
      oldHeader: document.body.textContent.includes('Get Raymol, free.'),
    };
  });
  await page.locator('.brew-copy').scrollIntoViewIfNeeded();
  await page.locator('.brew-copy').click();
  res.copyButton = (await page.locator('.brew-copy').textContent()).trim();
  return res;
}
```

Expected after this task: `lastIsDownload: true, icon: true, h2: "Free on Mac, iPad, and iPhone.", groups: 2, finalSections: 1, oldHeader: false, copyButton: "Copied ✓"`.

- [ ] **Step 2: Rebuild the two blocks as one**

The channel groups are carried over byte for byte by slicing them out of the old block:

```bash
python3 - <<'EOF'
import pathlib
p = pathlib.Path('index.html'); s = p.read_text(encoding='utf-8')
a, b = s.index('<!-- DOWNLOAD / INSTALL CHANNELS -->'), s.index('</main>')
old = s[a:b]
assert '<!-- FINAL CTA -->' in old and old.index('<!-- FINAL CTA -->') > old.index('<!-- DOWNLOAD'), 'Download must precede Final CTA at the end of main'
groups = old[old.index('  <div class="dl-group">'):old.index('</section>')].rstrip()
assert groups.count('<div class="dl-group">') == 2
new = '''<!-- DOWNLOAD — closes the page: the final CTA's header over the install channels -->
<section id="download" class="final">
  <div class="wrap">
  <div class="reveal">
    <img class="grad-tile" src="assets/raymol-app-icon.png?v=2" alt="Raymol app icon" width="84" height="84" decoding="async">
    <h2>Free on Mac, iPad, and iPhone.</h2>
    <p style="color:var(--muted);font-size:18px;margin-top:12px">Three ways to install on Mac, one tap on iPhone and iPad — the same app and the same engine on every screen.</p>
  </div>

''' + groups + '''
  </div>
</section>

'''
p.write_text(s[:a] + new + s[b:], encoding='utf-8'); print('download section rebuilt')
EOF
```

- [ ] **Step 3: Run the check again (PASS)**

Re-run the Step 1 snippet; expect the listed values. Run Harness H with `WIDTHS = [[1280, 800], [375, 812]]`. Expected `order`: `["hero","highlights","compare","materials","design-predict","ai-connect","devices","themes","toolkit","faq","supporters","download"]`, with the always-required fields clean.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Close the page with Download, merged with the final CTA

The final CTA's icon and headline now head the install channels, and its
duplicate buttons go, since the channel cards are those buttons.
#download still anchors the nav button and \"Other installation
methods\".

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Nav and footer follow the new order

**Files:**
- Modify: `index.html` (nav `.links`, footer Product column)
- Modify: `support.html`, `privacy.html` (nav `.links`)

**Interfaces:**
- Consumes: ids `#materials`, `#design-predict`, `#ai-connect`, `#devices`, `#faq`, `#download`.

- [ ] **Step 1: State the expectation and run it (FAIL)**

Run Harness H with `WIDTHS = [[1280, 800], [1224, 800], [1223, 800], [961, 800], [960, 800]]`, plus:

```js
async (page) => {
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  return await page.evaluate(() => ({
    nav: [...document.querySelectorAll('nav .links a')].map(a => a.textContent),
    footerProduct: [...document.querySelectorAll('footer .cols > div')].find(d => d.querySelector('h4')?.textContent === 'Product') ?.querySelectorAll('a').length,
  }));
}
```

Expected after this task: `nav: ["Materials","Design & Predict","Claude","Devices","FAQ","Support","Community"]`, `footerProduct: 5`, and Harness H `navMaxH ≤ 21` at all five widths.

- [ ] **Step 2: Edit the navs and the footer**

In `index.html`, replace:

```html
    <a href="#features">Features</a><a href="#compare">Raymol vs PyMOL</a><a href="#themes">Themes</a><a href="#devices">Devices</a><a href="#faq">FAQ</a><a href="/support">Support</a><a href="/community">Community</a>
```

with:

```html
    <a href="#materials">Materials</a><a href="#design-predict">Design &amp; Predict</a><a href="#ai-connect">Claude</a><a href="#devices">Devices</a><a href="#faq">FAQ</a><a href="/support">Support</a><a href="/community">Community</a>
```

In `support.html` and `privacy.html`, replace:

```html
    <a href="/#features">Features</a><a href="/#compare">Raymol vs PyMOL</a><a href="/#themes">Themes</a><a href="/#devices">Devices</a><a href="/#faq">FAQ</a><a href="/support">Support</a>
```

with:

```html
    <a href="/#materials">Materials</a><a href="/#design-predict">Design &amp; Predict</a><a href="/#ai-connect">Claude</a><a href="/#devices">Devices</a><a href="/#faq">FAQ</a><a href="/support">Support</a>
```

In `index.html`, replace the footer Product column:

```html
    <div><h4>Product</h4><a href="#features">Features</a><br><a href="#materials">Materials</a><br><a href="#design-predict">Design &amp; Predict</a><br><a href="#themes">Themes</a><br><a href="#devices">Devices</a><br><a href="#download">Download</a></div>
```

with:

```html
    <div><h4>Product</h4><a href="#materials">Materials</a><br><a href="#design-predict">Design &amp; Predict</a><br><a href="#ai-connect">Claude</a><br><a href="#devices">Devices</a><br><a href="#download">Download</a></div>
```

**If `navMaxH > 21` at any width in Step 4:** shorten the link text "Design &amp; Predict" to "Design" in all three navs (the `href` stays) and re-run. Don't drop a link and don't touch the breakpoints.

- [ ] **Step 3: Measure the nav budget**

```js
async (page) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  return await page.evaluate(() => {
    const links = document.getElementById('nav-links'); let w = 0;
    [...links.children].forEach(x => { const s = document.createElement('span'); s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:14px'; s.textContent = x.textContent; document.body.appendChild(s); w += s.getBoundingClientRect().width; s.remove(); });
    return { linksPx: Math.round(w + 26 * (links.children.length - 1)) };
  });
}
```

Expected: `linksPx ≤ 584`, the one-line budget measured before the GitHub-corner work and again in the Materials spec. Record the number for the PR.

- [ ] **Step 4: Run the checks again, plus legacy-link and phone-menu checks (PASS)**

Re-run Step 1. Then:

```js
async (page) => {
  const res = {};
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const [hash, expectInside] of [['#features', '#compare'], ['#compare', '#compare'], ['#themes', '#themes'], ['#devices', '#devices'], ['#download', '#download']]) {
    await page.goto('http://localhost:8765/?t=' + Date.now() + hash, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    res[hash] = await page.evaluate(([h, inside]) => {
      const r = document.querySelector(h).getBoundingClientRect();
      return !!document.querySelector(h).closest(inside) && r.top < innerHeight && r.bottom > 0;
    }, [hash, expectInside]);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:8765/?t=' + Date.now(), { waitUntil: 'networkidle' });
  await page.locator('.nav-toggle').click();
  res.menuLinks = await page.locator('#nav-links.open a').count();
  await page.locator('#nav-links a', { hasText: 'Claude' }).click();
  await page.waitForTimeout(600);
  res.menuClosed = !(await page.evaluate(() => document.getElementById('nav-links').classList.contains('open')));
  res.landed = await page.evaluate(() => location.hash);
  return res;
}
```

Expected: every legacy hash `true`, `menuLinks: 7`, `menuClosed: true`, `landed: "#ai-connect"`. Also open `/support` and `/privacy` and confirm their nav shows the six new links; the GitHub-corner breakpoint rules apply there too, so run Harness H's `navMaxH` evaluation on each at 1224 and 961.

- [ ] **Step 5: Commit**

```bash
git add index.html support.html privacy.html
git commit -m "Point the nav and footer at the new section order

Nav: Materials, Design & Predict, Claude, Devices, FAQ, Support,
Community (support and privacy pages match). Measured to fit the
one-line budget at the GitHub-corner breakpoints. Old anchors still
resolve.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Full verification, targets, and PR

**Files:**
- Modify: `docs/superpowers/specs/2026-10-01-homepage-reorganization-design.md` (Status line)
- PR #11 description (via `gh api -X PATCH repos/javierbq/raymol-site/pulls/11 -F body=@…`; `gh pr edit` currently fails on this repo with a Projects-classic GraphQL error)

- [ ] **Step 1: Full harness at every width**

Run Harness H with `WIDTHS = [[1280, 800], [1224, 800], [1223, 800], [961, 800], [960, 800], [820, 1000], [375, 812]]`. Expected:
- The final `order` at every width.
- `hScroll: false`, `missingAnchors: []`, `legacyAnchors: []`, and `brokenImgs: []` everywhere.
- `navMaxH ≤ 21` wherever the desktop nav shows (above 820 px).

- [ ] **Step 2: The spec's targets**

From the 1280×800 run: `screen["design-predict"] ≤ 6`, `screen["ai-connect"] ≤ 7`, `screens ≤ 12`. Record the actual numbers and the 375×812 ones.

**If a target misses:** report the numbers and stop for a decision. Don't trim content to hit them.

- [ ] **Step 3: Every external link still resolves**

```bash
grep -ohE 'href="https?://[^"]+"' index.html support.html privacy.html | sed 's/href="//;s/"$//' | sort -u | while read u; do echo "$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 20 -A 'Mozilla/5.0' "$u") $u"; done
```

Expected: `200` for all, except the Slack invite (403 to curl, known and unrelated).

- [ ] **Step 4: Screenshots**

Capture:
- the hero plus bento (viewport, 1280×800);
- the full page at 1280 and at 375, as `fullPage: true` screenshots (add `.in` to every `.reveal` first);
- the Make it yours section.

Compress them to JPEG (q≈3) and push them as a new commit on top of the existing `pr-assets/site-1-12-0` orphan branch (parent = its current head, via `git commit-tree`). Reference them in the PR by commit SHA.

- [ ] **Step 5: Update the spec status and the PR**

In the spec, change `**Status:** Design approved in conversation; spec awaiting review` to `**Status:** Implemented on \`claude/site-1-12-0-materials\` (PR #11)`.

Update the PR description:
- Add a "Homepage reorganization" section: the new order, the before/after screen positions (Step 2), and the screenshots.
- Update the page-weight table: hero video now at first paint; `rendering.webp`, `touch.webp`, `inspector.webp`, and the four iPhone theme cards are no longer referenced (−553 KB on full scroll).
- Add the nav width measured in Task 7, Step 3.

- [ ] **Step 6: Commit and push**

```bash
git add docs/superpowers/specs/2026-10-01-homepage-reorganization-design.md
git commit -m "Mark the homepage reorganization spec implemented

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
