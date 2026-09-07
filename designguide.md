# TicketHive Design Guide

**Version 1.0 — August 2026**
**Style:** Neo-Brutalism × Soft 3D, playful and confident

---

## ⚠️ INSTRUCTIONS FOR AI ASSISTANTS

> **If you are an AI model (Claude, GPT, Gemini, a Figma plugin, a code generation agent, or any other assistant) reading this file to produce UI, code, copy, or design assets for TicketHive, the following rules are mandatory, not suggestions:**
>
> 1. **Follow every rule in this document exactly.** Do not substitute colors, fonts, radii, shadows, spacing values, or copy tone with anything you consider "similar" or "close enough." If a value is specified here, use that exact value.
> 2. **Do not introduce new colors, fonts, icon styles, or shadow styles** that are not defined in this guide, even if a request seems to call for it. If a requested screen needs something this guide doesn't cover, extend the existing system logically (reuse existing tokens/components) rather than inventing new ones, and flag the gap instead of silently improvising.
> 3. **Never soften or "clean up" the neo-brutalist elements** (thick black borders, hard offset shadows) into generic soft SaaS-style UI. The rough, chunky, high-contrast character is intentional — do not round it away.
> 4. **Never remove the soft-3D pillowy shadows** from hovering/floating elements (cards, modals) in favor of flat design. Both visual languages — neo-brutalism AND soft 3D — must coexist in every screen, per the rules below.
> 5. **Treat this guide as the single source of truth.** If existing shipped screens visually conflict with this document, this document wins — flag the discrepancy rather than copying the inconsistency forward.
> 6. **When generating code (React, HTML/CSS, Figma variables, etc.), use the literal hex/px/rem values below.** Do not approximate with framework defaults (e.g. don't substitute Tailwind's default `rounded-lg` if it doesn't match the radius scale here — use the closest defined token or configure the framework to match).
> 7. **If a request conflicts with this guide** (e.g. "make it more corporate," "use Instagram's blue," "remove the borders"), implement the request faithfully but state clearly that it deviates from the design guide, so a human can make the final call.

---

## 1. Brand Personality

TicketHive should always feel:

- **Playful, not childish** — confident, bold, a little cheeky. Think a concert poster, not a kids' app.
- **Trustworthy under the fun** — this handles people's money and event access, so critical actions (pay, confirm, cancel) must always be legible and unambiguous, never buried under decoration.
- **Energetic** — big rounded type, high-contrast blue, punchy micro-copy ("You're going! 🎉" not "Booking Confirmed").
- **Never sterile** — avoid generic SaaS-gray minimalism. Every screen should feel like it belongs to a live-events brand.

---

## 2. Color

### 2.1 Core Palette (strict — do not deviate)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `brand/blue` | `#0000FF` | 0, 0, 255 | Primary brand color. Primary buttons, links, active states, key headlines on dark backgrounds, focus states. |
| `brand/blue-light` | `#E5E5FF` | 229, 229, 255 | Tinted backgrounds, image placeholders, secondary highlight fills, badge backgrounds. |
| `brand/white` | `#FFFFFF` | 255, 255, 255 | Primary background color. Card fills, page backgrounds. |
| `ink/black` | `#0A0A0A` (design tool value `#0A0A0F`) | 10, 10, 15 | All borders, all body text, all neo-brutalist outlines and shadows. Never pure `#000000` — use this slightly-blue-tinted near-black. |
| `ink/gray-70` | `#4A4A57` | 74, 74, 87 | Secondary/muted text (subtitles, meta text, placeholders). |
| `ink/gray-30` | `#D8D8E4` | 216, 216, 228 | Dividers, disabled states, subtle strokes. |

### 2.2 Supporting / Semantic Colors

These exist because the strict Blue/White palette alone cannot express state (success, error, warning) or the "playful accent" moments (badges, secondary buttons) that neo-brutalist/pop design relies on. **Do not add more accent colors beyond these** — reuse these before inventing new ones.

| Token | Hex | Usage |
|---|---|---|
| `surface/yellow` | `#FFE94D` | Secondary buttons, highlight badges ("Trending Now"), Add Event / promo accents, checkout "Download Ticket" CTA. This is the single allowed secondary accent color. |
| `surface/pink` | `#FF6FD8` | Reserved accent for illustration/decoration only — do not use on buttons or text. Used sparingly, e.g. background pattern variation. |
| `state/success` | `#00C875` | Success checkmarks, "Confirmed"/"Active" status badges, positive deltas. |
| `state/error` | `#FF3B3B` | Error icons, "Cancel"/destructive buttons, declined-payment states, "Inactive" badges. |
| `state/warning` | `#FFB800` | Warning banners (e.g. "seats held for X minutes"), caution badges. |

### 2.3 Color Rules

- **Backgrounds are white or blue — nothing else**, except the semantic tint fills above used strictly for status/feedback surfaces (e.g. a pale red box behind an error message, a pale green box behind a success badge). Never introduce a generic light-gray (`#F5F5F5`-style) page background as a *primary* choice — use white. A very light neutral (`#F9F9FC`, i.e. `ink/gray-30` at low opacity or the `#F9F9FC`/`#F9F9FC`-equivalent "off-white" surface used in dashboards) is permitted only as a **section background inside an otherwise white page** (e.g. dashboard body behind white cards), never as the outermost canvas color instead of white.
- **All borders are `ink/black`**, never gray, never colored, unless the border is communicating a semantic state (error red border on invalid field, etc.).
- **Text is always `ink/black` (headings/body) or `ink/gray-70` (secondary/meta).** Never pure black `#000000`, never mid-gray body text.
- Admin-only surfaces (e.g. Admin Login) may use a **near-black background** (`#0A0A0E`) to visually separate "restricted" contexts from the customer/organizer product — this is the *only* approved exception to the white/blue background rule, and it must still use `brand/blue` for the primary action and `ink/black` bordered white cards for content.

---

## 3. Typography

### 3.1 Typefaces (Google Fonts — exact families, no substitutions)

| Role | Font | Where to load it |
|---|---|---|
| Headings / Display | **Baloo 2** | fonts.google.com/specimen/Baloo+2 |
| Body / UI text | **DM Sans** | fonts.google.com/specimen/DM+Sans |

**Why these two:** Baloo 2 is a rounded, chunky, high-personality display face that carries the "playful" half of the brand. DM Sans is a clean, highly legible grotesque that keeps dense UI (forms, tables, dashboards) readable. Do not swap either for a "similar" font (e.g. do not substitute Fredoka, Poppins, or Nunito for Baloo 2 — the exact letterforms of Baloo 2 are part of the brand identity).

### 3.2 Type Scale

| Style token | Font | Weight | Size | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|---|
| `Display/XL` | Baloo 2 | ExtraBold (800) | 56px | 105% | 0 | Rare — huge hero moments only |
| `Display/L` | Baloo 2 | ExtraBold (800) | 40px | 108% | 0 | Banner/hero headlines, success screen headline |
| `Heading/L` | Baloo 2 | Bold (700) | 28px | 115% | 0 | Page-level headings ("My Bookings", "Dashboard") |
| `Heading/M` | Baloo 2 | Bold (700) | 22px | 120% | 0 | Section headings inside a page (e.g. event title on cards' page context, "Sales This Month") |
| `Heading/S` | Baloo 2 | SemiBold (600) | 18px | 125% | 0 | Card-level headings ("Order Summary", "Payment Details") |
| `Body/L` | DM Sans | Regular (400) | 17px | 145% | 0 | Long-form descriptive text (event descriptions) |
| `Body/M` | DM Sans | Regular (400) | 15px | 145% | 0 | Default UI body text, input values, paragraph copy |
| `Body/S` | DM Sans | Medium (500) | 13px | 140% | 0 | Meta text, timestamps, helper text, table cell text |
| `Label/M` | DM Sans | SemiBold (600) | 14px | 120% | 0.2px | Form field labels, nav links, tab labels |
| `Label/S` | DM Sans | Bold (700) | 12px | 120% | 0.4px | Badges, status pills, all-caps micro-labels (e.g. "UNIQUE TICKET CODE") — **always set in UPPERCASE** |
| `Button/L` | DM Sans | Bold (700) | 16px | 100% | 0.2px | All button labels, at any button size |

### 3.3 Typography Rules

- Headings (Baloo 2) are used **only** for: page titles, section titles inside cards, event/venue names, big display numbers (stats, ticket codes, prices in emphasis), and celebratory screen headlines. Never set a full paragraph in Baloo 2.
- Body copy, form inputs, table data, and navigation are **always** DM Sans.
- `Label/S` tokens (badges, status pills, section eyebrows) are always uppercase with the specified letter-spacing — this is a recurring signature of the system (e.g. "TRENDING NOW", "HIGH DEMAND", "UNIQUE TICKET CODE").
- Never use italics. Never use a font weight lighter than Regular (400) anywhere in the product.
- Numerals in prices, ticket codes, and stat values are set in **Baloo 2 Bold**, not DM Sans, to give them visual weight (e.g. `$240.97`, `TH-8F42-XQ91`, `1,842`).

---

## 4. Spacing & Radius

### 4.1 Spacing Scale (px)

Use only these values for padding, gaps, and margins. Do not use arbitrary numbers (e.g. 13px, 25px).

`2, 4, 8, 12, 16, 20, 24, 32, 48, 64`

Typical usage:
- `4–8px` — gap between a label and its input, icon-to-text gaps
- `12–16px` — internal padding of small elements (chips, tags), gap between related form fields
- `20–24px` — gap between stacked items within a card (line items, list rows)
- `32px` — card internal padding (standard), gap between major sections
- `48px` — page-level horizontal padding on standard content, section-to-section spacing
- `64px` — page-level horizontal padding on wide desktop layouts (1440px canvases)

### 4.2 Corner Radius Scale (px)

| Token | Value | Usage |
|---|---|---|
| `radius-8` | 8px | Small elements: seat tiles, tiny icon buttons, checkboxes |
| `radius-14` to `radius-16` | 14–16px | Inputs, small chips/rows, list row backgrounds |
| `radius-20` to `radius-24` | 20–24px | Cards, event card posters, dashboard tiles |
| `radius-28` to `radius-32` | 28–32px | Large hovering cards/modals (auth card, form cards, success card) |
| `radius-full` | 999px (pill) | **All buttons, all toggles, all badges/chips, all status pills.** No exceptions — anything button- or tag-shaped is a full pill, never a rounded rectangle. |

**Rule of thumb:** the bigger and more "floating" an element is, the larger its radius. The moment something is clickable-and-pill-shaped (button, chip, badge, toggle segment), it is always `radius-full`.

---

## 5. Elevation & Shadows — the Neo-Brutalism × Soft-3D System

This is the most distinctive part of the visual identity. **Two different shadow languages are used deliberately for two different purposes — do not mix them up.**

### 5.1 `Shadow/Soft-3D` — pillowy, ambient (for floating/hovering surfaces)

Used on: modals, the Auth card, the Add Event / Add Venue / Organizer Request form cards, the Success screen card, sidebar summary cards, any element that should feel like it's **gently floating above the page**.

```
Layer 1: drop-shadow, color #0000FF at 18% opacity, offset (0, 14px), blur 30px, spread -4px
Layer 2: drop-shadow, color #000000 at 6% opacity, offset (0, 2px), blur 6px, spread 0px
```

Characteristics: soft, diffuse, blue-tinted (ties the shadow color back to the brand instead of neutral gray), no hard edge. This is what makes cards feel "inflated"/pillowy rather than flat.

### 5.2 `Shadow/Brutal-M` and `Shadow/Brutal-S` — hard offset (for clickable elements)

Used on: **every button**, every primary CTA, chart/data cards on dashboards, tiles that need a "pressed paper" graphic quality.

```
Shadow/Brutal-M: drop-shadow, color #0A0A0F at 100% opacity, offset (6px, 6px), blur 0px, spread 0px
Shadow/Brutal-S: drop-shadow, color #0A0A0F at 100% opacity, offset (4px, 4px), blur 0px, spread 0px
```

Characteristics: solid, hard-edged, no blur — a flat "sticker" shadow offset down-and-right, always paired with a 2.5–3px solid black border on the element itself. Use `Brutal-M` for primary/larger buttons and prominent cards; `Brutal-S` for smaller inline buttons (e.g. dashboard "Check In" button).

### 5.3 Combination Rule

**A single screen should use both.** Typical pattern: a soft-3D card *contains* hard-brutal buttons. Example: the Auth card uses `Soft-3D` on the card itself, while the "Log In" button inside it uses `Brutal-M`. Do not put a Brutal shadow on the outer card and Soft-3D on the button inside — it's always Soft-3D (container) → Brutal (button/CTA inside it).

Flat elements with **no** shadow: page backgrounds, nav headers (bordered, not shadowed), table/list rows, input fields (bordered, not shadowed), status badges/chips (bordered, not shadowed).

---

## 6. Borders

- **Every card, button, input, chip, badge, and tile has a solid `ink/black` border.** This is non-negotiable and is the core neo-brutalist signature — without the border, an element looks unfinished/off-brand.
- Border weight scale:
  - `2px` — checkboxes, tiny inline elements
  - `2.5px` — chips, badges, small buttons, table row containers
  - `3px` — cards, standard buttons, inputs, nav header bottom border
  - `4px` — large circular icon containers (success checkmark circle, error X circle)
- Nav headers and top bars use a **3px bottom border only** (not a full border) to separate from content below.
- Dashed borders (`dashPattern: [6,4]`) are reserved specifically for the **ticket code box** on the success screen — a deliberate "perforated ticket" visual metaphor. Do not use dashed borders elsewhere.

---

## 7. Iconography & Imagery

- **Lucide React Library.** This keeps the interface warm and informal rather than corporate. Do not introduce Material Icons, Font Awesome, Feather, or any SVG icon set as a general replacement — emoji stays the default. Custom SVG icons are permitted only for interface glyphs emoji can't render well (e.g. checkmarks/X's inside colored badge circles use a bold glyph in Baloo 2, not emoji, for crisper rendering at large sizes).
- **Photography/posters:** Event poster images use a placeholder fill of `brand/blue-light` (`#E5E5FF`) until real imagery is supplied. Real event photography should be full-bleed within the card's rounded-corner mask, no additional filter or duotone treatment.
- **Decorative background elements:** Soft, semi-transparent blue circles/blobs of varying sizes (opacity ~50%, colors alternating between `#0000FF`-family blue tones) are the approved decorative motif for large blue backgrounds (Auth, Registration, Organizer Request success). Do not use geometric shapes, waves, or gradients as decoration — circles only, and always on a solid blue field, never on white.
- **Admin-context decoration:** a faint blue dot grid (not circles) on near-black is the *only* approved decorative treatment for admin-restricted screens — signals a distinct, more serious mode.

---

## 8. Components

### 8.1 Button

- Shape: pill (`radius-full`), 3px solid `ink/black` border, `Shadow/Brutal-M` (or `Brutal-S` for compact contexts).
- Label style: `Button/L` (DM Sans Bold 16px).
- **Primary** — fill `brand/blue`, text white. Use for the single most important action per screen/section (Buy Now, Pay, Submit, Publish, Save).
- **Secondary** — fill `surface/yellow`, text `ink/black`. Use for supportive-but-visible actions (Learn More, Download Ticket, Create a New Event shortcut).
- **Outline** — fill white, text `brand/blue` or `ink/black`, border still black. Use for tertiary/low-emphasis actions (Cancel, Back).
- Sizes: `L` (padding 16–18px vertical / 30–32px horizontal) for primary page actions; `M` (padding 12px vertical / 22px horizontal) for compact/secondary contexts.
- Destructive actions (Cancel booking, Reject) use `state/error` (`#FF3B3B`) fill with white text instead of the standard variants, still pill-shaped with a black border.

### 8.2 Input Field

- Label above field: `Label/M`, `ink/black`.
- Field: white fill, 3px `ink/black` border (2.5px in denser/secondary contexts like dashboard mini-forms), `radius-16` (or `radius-14` in denser contexts), 14–16px vertical padding, 16–18px horizontal padding.
- Placeholder text: `Body/M`, `ink/gray-70`.
- **No shadow on default inputs.** A focused state may add `Shadow/Brutal-S` and swap the border color to `brand/blue` to signal focus.
- Never use underline-only inputs or borderless/ghost inputs — every field is always fully outlined.

### 8.3 Card

- White fill, 3px black border, `radius-20`–`radius-24` for standard content cards, `radius-28`–`32` for large hero/modal-style cards.
- Standard internal padding: 24–32px.
- Cards that "float" over a colored or patterned background use `Shadow/Soft-3D`. Cards that sit flat within a white/off-white page (e.g. a dashboard stat card) may use `Shadow/Soft-3D` at a lighter touch or none — but always keep the black border regardless of shadow.

### 8.4 Chip / Badge / Status Pill

- Always pill-shaped (`radius-full`), always bordered.
- Default/neutral: white fill, `ink/black` border, `ink/black` text.
- Active/selected: `brand/blue` fill, white text, `ink/black` border.
- Status semantics: `state/success` tint background + dark green text for "Confirmed"/"Active"; pale red background + dark red text for "Cancelled"/"Inactive"; `surface/yellow` fill for highlight/promo badges ("Trending Now", "High Demand", "Become an Organizer").
- Label text is always `Label/S` or `Label/M`, and semantic status labels are set in Title Case ("Confirmed") while eyebrow/callout badges are set in UPPERCASE with letter-spacing ("TRENDING NOW").

### 8.5 Navigation Header

- White background, 3px black bottom border only (no shadow, no other borders).
- Logo: Baloo 2 ExtraBold, 22–24px, always `brand/blue`, always paired with the 🎟️ emoji as the wordmark's leading glyph: "🎟️ TicketHive".
- Nav links: `Label/M`, `ink/black`, no underline, no hover-color-change to non-brand colors (hover should shift to `brand/blue` only).
- Search bar (customer-facing nav): pill-shaped, 2.5px black border, light gray-tinted fill (`#F9F9FC`-equivalent), never the full white/border-only treatment used by inputs elsewhere (this is a deliberate visual distinction between "search" and "form input").
- Auth buttons live at the nav's trailing edge: "Log In" as an unbordered text-style button, "Sign Up" as a small primary pill button.

### 8.6 Seat Map / Grid Selector

- Individual seats: 28×28px squares, `radius-8`, 2px black border.
- States: white fill = available, `brand/blue` fill = selected, `ink/gray-30` fill = sold/unavailable. Always paired with a legend using the same swatches.
- The "stage/screen" indicator is a solid black pill bar above the grid with a small `Body/S` gray caption ("S T A G E", letter-spaced) centered beneath it.

### 8.7 Digital Ticket

- A dedicated component: colored (`brand/blue`) header block with white text (event name in Baloo 2 Bold, meta in Body/S), a perforation row (small light-gray dots in a horizontal line) separating header from body, white body containing the dashed-border ticket code box (Baloo 2 Bold, letter-spaced, `brand/blue` text, centered) and seat/quantity details.

---

## 9. Layout & Grid

- **Design canvas / reference width:** 1440px for desktop. All desktop screens in this system are built at 1440px.
- **Page horizontal padding:** 64px on wide content pages (Home, Event Details, Checkout, Dashboards), 48px on top/nav bars.
- **Content max-width inside very wide pages:** constrain long-form reading content (e.g. event descriptions) to roughly 800–900px even on a 1440px canvas so line lengths stay readable; full-bleed only for backgrounds, nav bars, and hero sections.
- **Two-column "main content + sticky sidebar" is the standard desktop checkout/detail pattern** (Event Details, Checkout seat selection, Checkout review & pay) — main content ~800–900px, sidebar fixed at 380–440px, 32px gap between columns. **This pattern must always be used for desktop checkout/purchase flows — do not stack these narrow/mobile-style for a desktop deliverable.**
- Mobile/narrow layouts (if/when designed) should collapse this into a single column with the sidebar content moving to the bottom or a sticky bottom bar — but that is a distinct, separately-specified mobile system, not a shrunk desktop screen. Never ship a checkout flow that is simply a narrow (~560px) column centered on a 1440px canvas and call it "desktop" — that is a mobile layout mistakenly placed on a wide canvas.
- Cards/tiles in a grid (venue directory, dashboard stats) use consistent gutters of 18–20px and wrap responsively.

---

## 10. Voice & Microcopy

- Headlines and confirmations are warm and a little celebratory: *"You're going! 🎉"*, *"Request submitted!"*, not flat system language like "Booking Confirmed" or "Form Submitted Successfully."
- Errors are calm, specific, and never blame the user: *"Payment didn't go through"* + a plain-language reason, not "Transaction Failed. Error Code 402."
- Buttons are verbs, always: "Buy Now," "Continue to Review," "Check In," "Publish Event 🚀" — an occasional single trailing emoji on a primary celebratory action is fine; do not add emoji to every button.
- Admin/restricted surfaces drop the playful tone in copy (though not in the underlying visual system): "Administrator Login," "Restricted access. Authorized platform administrators only," "All login attempts are logged and monitored."

---

## 11. Do / Don't Summary

**Do:**
- Pair a Soft-3D floating container with Brutal-shadow buttons inside it.
- Keep every clickable/tag-shaped element a full pill with a black border.
- Use Baloo 2 for anything that should feel like a headline or a big number; DM Sans for everything else.
- Use emoji as the icon system.
- Keep backgrounds strictly white or blue (plus the one approved near-black admin exception).

**Don't:**
- Don't use gray as a background color choice over white.
- Don't drop the black borders "for a cleaner look."
- Don't mix in a different accent color beyond blue/yellow (+ semantic red/green/amber).
- Don't use a line-icon library instead of emoji.
- Don't ship a cramped, narrow (~560px) single-column layout and call it a desktop screen — desktop layouts use the full 1440px canvas with proper multi-column composition.
- Don't substitute Baloo 2 or DM Sans for a "similar-looking" font.

---

*This guide should evolve as the product grows — but changes should be made deliberately and reflected here first, not introduced ad hoc in a single screen and left undocumented.*
