# Homepage reorganization: showcase first

**Date:** 2026-10-01
**Status:** Implemented on `claude/site-1-12-0-materials` (PR #11)
**Ships in:** PR #11 (`claude/site-1-12-0-materials`), together with the 1.12.0 Materials work

## Context

The homepage buries the features that make Raymol worth installing. Measured at 1280×800
(phone: 375×812) on this branch before the change, with the page at 16 screens (phone 22):

| Section | Desktop screen | Phone screen |
| --- | --- | --- |
| Hero (theme carousel of a rainbow ubiquitin) | 1 | 1 |
| Download channels | 2.9 | 2.8 |
| Devices lineup | 4.2 | 4.8 |
| Real-time rendering | 5.5 | 6.1 |
| Materials | 6.1 | 7.0 |
| Raymol vs PyMOL | 8.5 | 11.1 |
| Inspector, Touch, Themes | 9.7–11.2 | 12.2–14.1 |
| Design & Predict | 12.2 | 15.4 |
| Let Claude drive Raymol | 13.6 | 17.8 |
| Toolkit, FAQ, Sponsors, Final CTA | 14.3–15.9 | 19–21 |

The two features no other PyMOL-style viewer has (on-device ProteinMPNN / Boltz-2, and
Claude driving the app) start 12–18 screens down. The first thing after the hero is
install logistics, and the hero visual sells themes, the least distinctive feature.

## Intent

- **Audience:** both scientists and general visitors, **visuals first**. The striking
  renders (materials, ray tracing) hook everyone; Design & Predict and Claude follow
  immediately as the "and it does this too" punch. *(Owner's choice.)*
- **Success:** within two screens a visitor sees what Raymol looks like and the four
  reasons to install it, and a download button is never more than one click away.
- **Constraints:** same or similar content; the existing visual language (gradient,
  type, cards, dark bands) stays. No new features are claimed. Every copy rule from the
  Materials spec still applies (sources, "Raymol" in copy, no Binder Design, no MSA search
  until #12 is resolved).

## Design

### New order

| # | Section | id(s) | Background | Source |
| --- | --- | --- | --- | --- |
| 1 | Hero | — | white | existing, changed |
| 2 | Highlights bento | `highlights` | white | **new** (replaces the trust strip) |
| 3 | Real-time rendering + Raymol vs PyMOL | `compare`, `features` | dark | merge of Features + Compare |
| 4 | Materials | `materials` | white | existing, hero video removed |
| 5 | Design & Predict | `design-predict` | dark | existing |
| 6 | Let Claude drive Raymol | `ai-connect` | light grey | existing |
| 7 | The same app, on every screen | `devices` | white | merge of Devices + Touch |
| 8 | Make it yours | `themes` | light grey | merge of Inspector + Themes |
| 9 | A full structural-biology toolkit | — | white | existing |
| 10 | FAQ | `faq` | light grey | existing |
| 11 | Sponsored by | `supporters` | white | existing |
| 12 | Download (closes the page) | `download` | light grey | merge of Download + Final CTA |

Dark and light alternate through the headline run (3–6). Rendering comes before Materials
because the hero already opens on the Materials loop, and that order keeps the two dark
bands (3 and 5) apart.

**Anchor compatibility.** Every anchor that exists today keeps resolving. Section 3 carries
`id="compare"`, and an empty `<span id="features"></span>` at the top of its header keeps
`#features` working. The rest keep their ids: `#compare`,
`#materials`, `#design-predict`, `#ai-connect`, `#devices`, `#themes`, `#faq`,
`#download`, `#supporters`.

### 1. Hero

- **Unchanged:** the pill (`New in 1.12 · Materials →` → `#materials`), the kicker, the H1, the
  three CTAs (Get Raymol `.dmg`, App Store badge, Join Community), "Other installation
  methods →" (`#download`), and the free/OS line.
- **Lead**, replacing the current one:
  > Raymol is the open-source PyMOL engine rebuilt for Mac, iPad, and iPhone: real-time ray
  > tracing and materials, on-device protein design and structure prediction, and Claude
  > at the controls.

  The Claude clause is approved even though MCP is only in the Mac direct-download and
  Homebrew builds. Section 6 and the bento tile carry that caveat.
- **Visual:** the theme carousel is replaced by the gold Materials loop
  (`assets/video/materials-gold.mp4`, poster `materials-gold-poster.webp`). It sits in the
  existing hero frame (rounded, dark, large shadow) at **16:9**, using the same
  `data-autoplay` mechanism as before (`initVideos`). The poster paints first; the video
  plays once on screen, which at the top of the page is immediately. Reduced motion shows
  the poster with native controls.
- The critical inline CSS in `<head>` that pins `.theme-carousel` / `.tc-slide` stays,
  because the carousel still exists in section 8.

### 2. Highlights bento (new)

Four clickable tiles, each an image, a short title, and one line, linking to its section.

| Tile | Title | Line | Image | Links to |
| --- | --- | --- | --- | --- |
| Materials | Gold, glass, marble | Nine materials, on any layer. | `materials-marble.webp` | `#materials` |
| Ray tracing | Light that looks real | Shadows and depth, side by side with PyMOL. | `compare-surface-raymol.webp` | `#compare` |
| Design & Predict | Design and fold, on-device | ProteinMPNN and Boltz-2, with no server. | `tools-predict.webp` | `#design-predict` |
| Claude | Let Claude drive | Claude drives Raymol through its built-in MCP server. Caption: *Mac direct download & Homebrew*. | `mcp-connect.png` | `#ai-connect` |

- **Images** use the existing files at a fixed 4:3 tile ratio with `object-fit: cover`.
  The exception is the Claude tile: `mcp-connect.png` is a small (477×413) light dialog
  capture, so it is shown whole (`object-fit: contain`) on a light panel. A new crop is
  made only if a tile reads poorly at size.
- **Layout:** 4 columns above 1000 px, 2×2 down to 560 px, 1 column below. The whole
  tile is the link, with a visible focus ring and hover lift.
- **Trust line:** the trust strip's four facts fold into one slim, centered line under the
  tiles: *Built on the real PyMOL engine · 60 fps Metal rendering · Mac · iPad · iPhone ·
  Free*.

### 3. Real-time rendering + Raymol vs PyMOL (dark)

- **Header:** kicker *Real-time rendering*, H2 *Shadows and depth, in real time.* The intro
  paragraph is the current rendering-card copy (Metal engine, shadow mapping, AO, OIT,
  materials, ray tracing with reflections of the structure itself), followed by the
  comparison line ("Open the same `.pse` in each…").
- **Below:** the existing comparison slider carousel, unchanged.
- **Removed:** the static `rendering.webp` card; the slider shows the same thing better.

### 4. Materials (white)

As built in this PR, minus `.mat-hero` (its video moved to the page hero): header, the
four cards, the Inspector row, and the "Also in 1.12" line.

### 5. Design & Predict (dark)

As built in this PR. No change.

### 6. Let Claude drive Raymol (light grey)

As today. No change.

### 7. The same app, on every screen (white)

- **Keep:** the header, the device lineup, the "full app on iPhone" badge and paragraph,
  and the requirements strip (macOS 14+ / iPadOS 17+ / iOS 17+).
- **Merge:** the touch-gesture copy (one finger to rotate, two to pan, pinch to zoom, twist
  to roll; trackpad gestures and the classic mouse mode on Mac) becomes a paragraph under
  the lineup.
- **Removed:** `touch.webp`, the tall gesture-guide image.

### 8. Make it yours (light grey)

- **Layout:** one `.feat` row. Text on one side: kicker *Make it yours*, H2 *Your controls,
  your colors.*
  - **First paragraph:** the current Inspector copy (per-representation controls including
    material, scene card, A/S/H/L/C menus).
  - **Second paragraph:** the current themes copy (four built-in themes, Theme Studio,
    themes following you across Mac, iPad, and iPhone).
- **Visual:** the Mac theme carousel moved from the hero, with dots, the label, and
  auto-cycling (`initHeroCarousel`) unchanged. It shows the whole app (viewport, object
  panel, console) in each of the four themes. It doesn't show the Inspector's sliders, but
  the Materials section's Inspector shot already covers those.
- **Known blemish:** these captures show internal Python lines in the console. That is
  true today too, in the hero. Moving them down the page lowers their profile; recapturing
  them is a separate follow-up.
- **Removed:** the separate `inspector.webp` row and the four iPhone theme cards.

### 9–11. Toolkit, FAQ, Sponsors

Unchanged, in that order.

### 12. Download (closes the page)

- **Header:** the final CTA's app icon, H2 *Free on Mac, iPad, and iPhone.*, and one line:
  *Three ways to install on Mac, one tap on iPhone and iPad — the same app and the same
  engine on every screen.*
- **Below:** the existing *For Mac* group (three channel cards, MCP note, requirements)
  and *For iPhone & iPad* group, unchanged.
- **Removed:** the separate Final CTA section and its duplicate buttons. The channel cards
  are those buttons.

### Nav and footer

- **Nav links:** *Materials · Design & Predict · Claude · Devices · FAQ · Support ·
  Community*, replacing *Features · Raymol vs PyMOL · Themes · Devices · FAQ · Support ·
  Community*. The new set must fit the measured one-line budget (links ≤ 584 px today) so
  it doesn't wrap at the GitHub-corner breakpoints. If it doesn't fit, shorten labels
  ("Design & Predict" → "Design") before dropping a link.
- **Footer Product column:** *Materials · Design & Predict · Claude · Devices · Download*.

## Page weight

| Change | Effect |
| --- | --- |
| Hero video loads at first paint instead of on scroll | +1.38 MB at first paint (poster 30 KB is the LCP image) |
| Theme carousel leaves the hero | −89 KB eager image at first paint; its four slides load lazily in section 8 |
| `rendering.webp`, `touch.webp`, `inspector.webp`, four iPhone theme cards removed | −553 KB on full scroll |
| Bento | reuses images already on the page; no new bytes unless a crop is needed |

The full-scroll weight drops by about 0.5 MB. Assets that become unreferenced stay in the
repo for now; deleting them is a separate cleanup.

## Verification

1. Re-run the section-position measurement. Target at 1280×800: Design & Predict starts by
   screen 6, Claude by screen 7, and the page is at most 12 screens. **Measured after
   implementation:** Design & Predict 6.3, Claude 7.7, page 13.2 screens (375×812: 9.5 / 11.9 /
   20.6), down from 12.2 / 13.6 / 16. The targets were estimates; the owner accepted the
   measured numbers on 2026-10-01 rather than tightening spacing or moving content.
2. No horizontal scroll at 1280, 1224, 1223, 961, 960, 820, and 375 px.
3. Nav links stay on one line at 1224/1223 and 961/960.
4. Every anchor in the compatibility list resolves; every nav, bento, footer, and
   "Other installation methods" link lands on its section.
5. The hero video autoplays muted and loops, paints its poster first, and under reduced
   motion stays on the poster with controls. The theme carousel still cycles in section 8.
6. All images load; every local asset returns 200.
7. Screenshots of the hero + bento and of the full page at desktop and phone width go on
   the PR.

## Out of scope

- The H1, the meta description, and `og-image`.
- Act headers (option B). They could be layered on later.
- The privacy page (#12); MSA search stays off the page until it is resolved.
- Deleting newly unreferenced assets.
