# iOS launch — raymol.io site update

**Date:** 2026-08-03
**Status:** Approved

## Context

The Raymol iOS/iPadOS app went live on the App Store. The site still says "coming soon
to iPhone & iPad" in nine places and one nav button literally reads "Coming soon".

### Verified listing facts

Queried from `https://itunes.apple.com/lookup?id=6781513038&country=us` — not assumed.

| Field | Value |
| --- | --- |
| App ID | `6781513038` — one universal record serving Mac + iOS (`features: ["iosUniversal"]`) |
| iOS URL | `https://apps.apple.com/us/app/raymol/id6781513038` |
| Mac URL | same URL with `?mt=12` (already used on the site) |
| Price | Free |
| Minimum OS | iOS / iPadOS 16.0 |
| Version | 1.8.0, updated 2026-08-03 |
| Categories | Graphics & Design, Education |
| iOS bundle size | 172 MB |

The Mac and iOS apps share a single App Store record, so `?mt=12` is the only thing
distinguishing the two storefront links.

`assets/badges/app-store.svg` (180×60) already exists in the repo and is currently
unused — it was staged for this launch.

## Decisions

Three choices were presented to the user and approved:

1. **Download section → two platform groups**, not a fourth card. Mac-only facts
   (59 MB `.dmg`, Homebrew, the MCP-sandboxing note, macOS 13+/Apple Silicon) stay
   scoped to Mac instead of bleeding onto an iOS card.
2. **Launch announcement → a "New" pill in the hero.** No new JS or dismissal state,
   and one line to delete when it stops being news.
3. **Hero CTA → keep the `.dmg` one-click primary, add the App Store badge beside it.**
   Preserves the Mac conversion path introduced deliberately in `ff7941f`.

## Pre-existing issue this change must fix

`.cta-dl` is used in the markup twice (hero, final CTA) but **has no CSS rule at all**.
The two hero buttons only sit side-by-side because both are `display:inline-block`, held
together by a `margin-left:12px` inline style on the second one. Adding a 54px-tall
store badge to that container would baseline-misalign it against the buttons.

`.cta-row` at `styles.css:84` is already the correct flex primitive
(`display:flex;gap:14px;justify-content:center;flex-wrap:wrap`) and is currently unused.

**Fix:** give `.cta-dl` a real flex rule with `align-items:center`, and remove the
`margin-left:12px` inline hack. Targeted repair of the code being touched — not a
refactor of anything else.

## Changes

### 1. CSS (`styles.css`)

Four additions, all small:

- `.cta-dl` — flex, centered, `gap:14px`, `flex-wrap:wrap`, `align-items:center`, so
  buttons and store badges align on a shared centre line.
- `.launch-pill` — anchor variant of the existing `.soon-pill` gradient: removes the
  underline, adds a hover lift. Reuses the gradient rather than redefining it.
- `.dl-group` / `.dl-group .kicker` / `.dl-group .dl-grid` — spacing for the two
  labelled platform groups. Group labels reuse the existing `.kicker` style, so no new
  visual language is introduced.
- `.dl-single` — `max-width:520px;margin:18px auto 0` for the lone iOS card, so it
  doesn't stretch across a three-column grid track.

### 2. Hero (`index.html`)

- Add the launch pill above the headline, linking to the iOS App Store URL:
  `New · Raymol is now on iPhone & iPad →`
- CTA row: `[Get Raymol]` (`.dmg`, unchanged) · `[Download on the App Store]` ·
  `[Join Community →]`. Three items; they wrap on mobile. Keeping Community in the row
  is deliberate — it was placed there on purpose and is also in the nav.
- Note line: drop "also coming soon to iPhone & iPad".
- `.freenote`: keep, already lists both platforms correctly.

### 3. Download section (`index.html`)

Header retitled — it is no longer Mac-only:

- kicker `Get Raymol for Mac` → `Download`
- h2 `Three ways to install.` → `Get Raymol, free.`
- lead → "Three ways to install on Mac, one tap on iPhone and iPad — the same app and
  the same engine on every screen."

Then two groups:

- **For Mac** — the existing three-card grid unchanged (Mac App Store / direct `.dmg` /
  Homebrew), followed by the Mac requirements strip and the existing "Same app, two
  builds" MCP note.
- **For iPhone & iPad** — one centred `.dl-single` card: heading `App Store`, copy
  "One universal app for iPhone and iPad — install and update through the App Store.",
  and the `app-store.svg` badge. Followed by an iOS requirements strip
  (Free · iPhone iOS 16+ · iPad iPadOS 16+).

The iOS bundle size is deliberately **not** shown; the App Store displays it and it
would be one more number to keep in sync.

### 4. Accuracy fixes (`index.html`)

| Location | Change |
| --- | --- |
| FAQ "Is Raymol really free?" | "iPhone and iPad are coming soon" → free on the App Store now |
| FAQ "App Store vs direct-download" | scope the answer explicitly to Mac |
| Final CTA copy | drop "coming soon to iPhone & iPad" |
| Final CTA row | mirror the hero: `.dmg` button + App Store badge |
| `#ai-connect` note | currently implies only the *Mac* App Store build lacks MCP. Must now read: the App Store builds — Mac, iPhone, and iPad — don't include the MCP server; the Mac direct-download and Homebrew builds do. |
| `#ai-connect` requirements strip | "Direct-download & Homebrew builds" → "Mac direct-download & Homebrew" |

### 5. Metadata and other files

- `index.html` meta description, `og:description`, `twitter:description` — mention the
  App Store instead of Mac-only channels.
- JSON-LD `SoftwareApplication`: `installUrl` drops `?mt=12` so it resolves for both
  platforms; add `softwareVersion: "1.8.0"` (verified above, not invented).
  `operatingSystem` is already correct.
- `privacy.html:72` — nav button reads "Coming soon"; make it "Get Raymol" → `/#download`,
  matching `support.html:74`.
- `sitemap.xml` — `lastmod` for `/` → `2026-08-03`.
- `assets/youtube/about.txt` — "Free. Coming soon to the App Store." → live wording.

## Verification

Static site, so verification is direct observation, not inference:

1. Serve the site locally.
2. Screenshot the hero, the download section, and the final CTA at desktop and mobile
   widths. Confirm the App Store badge aligns with the buttons (the `.cta-dl` fix) and
   that the two platform groups read as intended.
3. `grep -rniE "coming soon"` across the repo returns nothing outside this spec.
4. Confirm both storefront links resolve: the plain URL and the `?mt=12` variant.

## Out of scope

Noted for the user, not changed here:

- `assets/youtube/about.txt` also promotes "Raymond, an AI copilot", but the Raymond
  section is commented out in `index.html:389`.
- `.store-badge.soon` (`styles.css:29`) becomes dead code once no badge is disabled.
