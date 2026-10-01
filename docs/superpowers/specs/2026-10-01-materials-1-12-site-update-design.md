# Raymol 1.12.0 (Materials) — raymol.io site update

**Date:** 2026-10-01
**Status:** Implemented on `claude/site-1-12-0-materials`; merge waits for the 1.12.0 DMG

## Context

RayMol 1.12.0's headline feature is **materials**. The site has no mention of it, and
several facts on it were already stale before this release.

### Sources of truth for copy

Every claim on the page was checked against these three files at tag `v1.12.0`:

- `docs/release-notes/v1.12.0.md`
- `docs/appstore/whats-new-1.12.0.md`
- `docs/materials.md`

Binder Design is experimental and appears nowhere on the site.

### Verified facts — measured, not assumed

| Fact | Value | How |
| --- | --- | --- |
| GitHub release `v1.12.0` | **Not published** as of 2026-10-01; latest is `v1.11.3` | `gh release view v1.12.0 -R javierbq/RayMol` → "release not found" |
| `RayMol-1.11.3.dmg` | 83,122,253 bytes (83 MB) | `gh release view` asset size |
| `RayMol-1.12.0.dmg` | **~84 MB, unconfirmed** — the figure given for the release; re-check when published | — |
| macOS minimum | **14.0** (site said 13+) | `swiftui/project.yml` `deploymentTarget.macOS`, and `LSMinimumSystemVersion` = 14.0 in the shipped 1.11.2 app |
| iOS / iPadOS minimum | **17.0** (site said 16+) | `project.yml` `deploymentTarget.iOS`, and the live App Store lookup (`minimumOsVersion: 17.0`) |
| Since when | macOS 14 since 2026-07-23, iOS 17 since 2026-08-06; both already in 1.11.3 | `git log -S` on `project.yml` |

`project.yml` sets the floors through XcodeGen's `options.deploymentTarget`, so there is no
literal `MACOSX_DEPLOYMENT_TARGET` / `IPHONEOS_DEPLOYMENT_TARGET` key; XcodeGen generates
those build settings from it.

The Sparkle appcast for 1.11.3 still advertises `minimumSystemVersion 13.0`, which
contradicts the binary. That belongs to the RayMol release tooling, not this site, and
is reported rather than fixed here.

### Nav link — measured, does not fit

The GitHub-corner spec (2026-08-05) measured the nav's one-line content at 804 px and
showed it is already at the edge of what the 960 px / 1223 px breakpoints allow. Measured
again at 1280 px in the browser:

| | Links | Brand + links + CTA | Wraps below (corner reserved, 108 px) | Wraps below (28 px) |
| --- | --- | --- | --- | --- |
| Today | 584 px | 805 px | 941 px | 861 px |
| + "Materials" | 669 px | 890 px | **1026 px** | **946 px** |

A "Materials" link would wrap the nav across roughly 821–1026 px. **No nav link.** The
section is reached from the hero's "New" pill and the footer's Product column instead.

## Decisions

1. **Placement: right after Features** (the "Real-time rendering" card), before the
   dark Raymol-vs-PyMOL section. Materials is a rendering feature, so it reads as the
   continuation of that card. The section stays light, with dark `.media` frames, so it
   doesn't sit dark-on-dark against the comparison section.
2. **Hero visual: the owner's Gold video**, re-encoded. The source is a full 360° turn
   whose frame 240 repeats frame 0, so it is trimmed to 240 frames for a seamless loop.
3. **Four points as image cards**: nine materials per layer, Looks, glass that bends
   light, side chains follow the cartoon. Then one `feat`-style row showing where the
   controls live (Inspector Material menu, Look chip, Custom…), which also carries
   reflections and saving.
4. **Hero pill** changes from the two-month-old iOS launch to `New in 1.12 · Materials →`,
   linking to `#materials`. The iOS spec intended the pill as the slot for current news.
5. **Video playback** is progressive enhancement in `main.js`: muted, looping, inline,
   `preload="none"`, played when in view and paused out of view. With
   `prefers-reduced-motion` it does not autoplay and shows controls, matching how the
   hero carousel and scroll reveal already behave. Without JS, the native controls stay.
6. **`og-image` unchanged.** It is a release-agnostic brand card, and a raw render is not
   clearly better as a social preview.
7. **Movies:** the release notes say movies replay per-object materials at every cut,
   but `materials.md` says they currently replay only the global half (#508). The two
   disagree, so the site makes no claim about movies replaying materials.

## Media

| File | Source | Size |
| --- | --- | --- |
| `assets/video/materials-gold.mp4` | `Gold video.mp4`, 1280×720, 240 frames, H.264 CRF 26, no audio, faststart | 1.38 MB |
| `assets/screenshots/materials-gold-poster.webp` | first frame of the encoded loop | 30 KB |
| `assets/screenshots/materials-rubber.webp` | `rubber.png`, 4:3 crop → 960×720 | 34 KB |
| `assets/screenshots/materials-marble.webp` | `Marble.png`, 4:3 crop → 960×720 | 30 KB |
| `assets/screenshots/materials-glass.webp` | `render.png`, 4:3 crop → 960×720 | 71 KB |
| `assets/screenshots/materials-sidechains.webp` | `Heme.png`, 4:3 crop → 960×720 | 59 KB |
| `assets/screenshots/materials-inspector.webp` | store shot `05-material-controls.png`, Inspector crop, 1160×960 | 47 KB |

No 4K originals are committed.

## Changes

- **New `#materials` section** (`index.html`, styles in `styles.css`, playback in `main.js`).
- **Rendering feature card** mentions materials and traced reflections.
- **"Fine layer controls" copy** adds "material" to the list of Inspector controls.
- **FAQ, ray tracing:** materials work on every supported device; ray tracing adds
  reflections of the structure itself.
- **JSON-LD:** `softwareVersion` 1.8.0 → 1.12.0; `operatingSystem` → macOS 14+, iOS 17+,
  iPadOS 17+.
- **DMG size** 59 MB → 84 MB (two `aria-label`s and the Direct download card).
- **Minimum OS** 13+/16+ → 14+/17+ everywhere on the page.
- **Footer** on all three nav pages: "What's new" links to the 1.12.0 GitHub release;
  Product column on the homepage gains "Materials".
- **`sitemap.xml`** `lastmod` for `/` → 2026-10-01.

## Verification

1. Serve locally; check 1280 px and 375 px: no horizontal scroll, images load, the video
   autoplays muted and loops, every link resolves.
2. Nav links stay one line at the corner breakpoints (1224/1223, 961/960) — unchanged by
   this work, but checked because the nav is near its limit.
3. Reduced motion: the video does not autoplay and shows controls.
4. The site has a light theme only (no `prefers-color-scheme` rules), so there is no dark
   theme to check.
