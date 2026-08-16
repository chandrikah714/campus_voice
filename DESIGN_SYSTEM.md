# Campus Voice — Design System Reference

## Source of truth

There is exactly **one** palette in this app: the CSS custom properties in
`src/index.css` (`@theme` block). Register, Login, every dashboard, every
card, and every button all read from the same tokens — nothing hardcodes a
different color anywhere. (Verified: a grep for any Tailwind *default*
color utility — `bg-blue-500`, `text-red-600`, etc. — across every `.jsx`
file in `src/` returns zero matches. Every color in the app is one of the
tokens below.)

Register.jsx's left panel *looks* different from other screens only
because it displays a background photo (`register.jpg`) — the actual UI
colors (buttons, inputs, links, text) are identical tokens to Login and
every other page. If you want Register's *specific* look — the split
photo/form layout — applied elsewhere, that's a layout change, not a color
change; happy to do that separately if that's what you meant.

## Token reference

| Token | Hex | RGB | Used for |
|---|---|---|---|
| `paper-50` | `#FBF9F4` | 251,249,244 | Cards, modals, lightest surface |
| `paper-100` | `#F3EFE3` | 243,239,227 | App background |
| `paper-200` | `#E9E3D2` | 233,227,210 | Hover states on light surfaces, dividers |
| `paper-300` | `#D8CFB6` | 216,207,182 | Borders, rings |
| `ink-900` | `#1B2536` | 27,37,54 | Primary text, headings, dark surfaces (sidebar) |
| `ink-800` | `#212D42` | 33,45,66 | — (reserved, currently unused directly) |
| `ink-700` | `#2D3B54` | 45,59,84 | Hover state on ink-900 buttons |
| `ink-500` | `#55617A` | 85,97,122 | Secondary body text |
| `ink-300` | `#646B78` ⁺ | 100,107,120 | Tertiary text, timestamps, docket labels |
| `marigold-500` | `#E2932E` | 226,147,46 | Primary accent, CTA buttons, pending status |
| `marigold-400` | `#EAA845` | 234,168,69 | Medium-priority badge, button hover |
| `marigold-600` | `#B36B1E` | 179,107,30 | *(new)* button-safe accent for white-text buttons |
| `marigold-700` | `#976019` ⁺ | 151,96,25 | Links, link hover text |
| `teal-500` | `#2F8F73` | 47,143,115 | Resolved status, success accents |
| `teal-600` | `#227A61` | 34,122,97 | *(new)* button-safe — white-text "resolve" buttons |
| `teal-700` | `#1F6650` | 31,102,80 | Success banner text |
| `coral-500` | `#D1543A` | 209,84,58 | High priority, alert accents |
| `coral-600` | `#C14A32` | 193,74,50 | *(new)* button-safe — white-text destructive buttons |
| `coral-700` | `#9C3D28` | 156,61,40 | Error banner text, destructive text links |

⁺ `ink-300` and `marigold-700` were **darkened** from their original
values (`#8891A3` and `#A86B1C`) — see the accessibility audit below.

## WCAG 2.1 AA contrast audit

I computed actual contrast ratios (relative luminance formula per
WCAG 2.1 §1.4.3) for every real foreground/background pairing used in the
app, rather than eyeballing it. AA requires **4.5:1** for normal text and
**3:1** for large text (≥18.66px bold or ≥24px regular) and UI components.

| Pairing | Ratio | Normal text AA | Large/UI AA |
|---|---|---|---|
| `ink-900` on `paper-100` (body text) | 13.39:1 | ✅ | ✅ |
| `ink-900` on `white` (card text) | 15.39:1 | ✅ | ✅ |
| `ink-500` on `paper-100` (secondary text) | 5.41:1 | ✅ | ✅ |
| `ink-500` on `white` | 6.22:1 | ✅ | ✅ |
| `ink-300` on `white` — **before fix** | 3.17:1 | ❌ | ✅ |
| `ink-300` on `white` — **after fix** | 5.36:1 | ✅ | ✅ |
| `ink-300` on `paper-100` — **before fix** | 2.76:1 | ❌ | ❌ |
| `ink-300` on `paper-100` — **after fix** | 4.66:1 | ✅ | ✅ |
| `marigold-700` links on `white` — **before** | 4.39:1 | ❌ | ✅ |
| `marigold-700` links on `white` — **after** | 5.25:1 | ✅ | ✅ |
| `marigold-700` links on `paper-100` — **before** | 3.82:1 | ❌ | ✅ |
| `marigold-700` links on `paper-100` — **after** | 4.56:1 | ✅ | ✅ |
| `teal-700` on `white` / `teal-50` (success text) | 6.83 / 6.09:1 | ✅ | ✅ |
| `coral-700` on `white` / `coral-50` (error text) | 6.75 / 5.79:1 | ✅ | ✅ |
| `paper-50` text on `ink-900` (sidebar) | 14.63:1 | ✅ | ✅ |
| `ink-900` on `marigold-500` (primary button) | 6.19:1 | ✅ | ✅ |
| white text on `teal-500` — **before fix** | 3.96:1 | ❌ | ✅ |
| white text on `teal-600` — **after fix** | 5.22:1 | ✅ | ✅ |
| white text on `coral-500` — **before fix** | 4.17:1 | ❌ | ✅ |
| white text on `coral-600` — **after fix** | 4.89:1 | ✅ | ✅ |

**What was actually broken and is now fixed in the codebase:**
1. `ink-300` (timestamps, docket numbers, tertiary labels) failed AA at the
   small sizes it's actually used at. Darkened the token itself — every
   usage across the app inherits the fix automatically since it's a shared
   variable, not a per-component color.
2. `marigold-700` link text failed AA. Same fix, same mechanism.
3. White text on `teal-500`/`coral-500` buttons (Resolve/Remove/Delete
   actions) failed AA — Tailwind's `text-sm font-semibold` (14px bold)
   doesn't meet WCAG's bold-text large-text threshold (needs ~18.66px
   bold), so these count as normal text and needed 4.5:1. Added
   `teal-600`/`coral-600` specifically for this use and swapped every
   white-text button/badge instance (`Card.jsx`, `CardModal.jsx`,
   `PendingIssues.jsx`, `ManageComplaints.jsx`, `ManageUsers.jsx`,
   `Sidebar.jsx`'s badge, `Navbar.jsx`'s notification badge) to use them.
   The lighter `-500` values are kept for non-text uses (chart bars,
   priority-badge backgrounds with dark text, borders) where they were
   already compliant.

## Component/state coverage

| Component | Default | Hover | Active/Focus | Disabled | Error |
|---|---|---|---|---|---|
| Primary button (e.g. "Log in") | `bg-ink-900` `text-paper-50` | `bg-ink-700` | `ring-marigold-500` (via `:focus-visible`) | `opacity-60` | — |
| Accent button (e.g. "Submit report") | `bg-marigold-500` `text-ink-900` | `bg-marigold-400` | same as above | `opacity-60` | — |
| Resolve button | `bg-teal-600` `text-white` | `bg-teal-700` | same as above | `opacity-50` | — |
| Destructive button | `bg-coral-600` `text-white` | `bg-coral-700` | same as above | `opacity-50` | — |
| Text input | `border-paper-300` `bg-white` | — | `border-marigold-500` `ring-marigold-200` | — | (not currently styled — see note below) |
| Link | `text-marigold-700` | `underline` | — | — | — |
| Status/error banner | — | — | — | — | `bg-coral-50` `text-coral-700` |
| Success banner | — | — | — | — | `bg-teal-50` `text-teal-700` |

**Note:** input fields don't currently have a distinct visual error state
(a red border on validation failure) — errors surface as a banner above
the form instead, everywhere in the app. That's a legitimate design choice
(one clear place to look), not an oversight, but flagging it since you
asked specifically about the "error" state per component — if you'd
rather have per-field red borders too, that's a small, contained change to
`.input` in `index.css` plus a boolean prop on each field.

## Screen size behavior

Colors themselves don't change across breakpoints — Tailwind's responsive
prefixes (`sm:`, `lg:`) in this app only ever change layout (e.g. Login's
photo panel is `hidden lg:block`), never color values. So there's nothing
separate to document per device; what you see on desktop is the same
palette on mobile and tablet, just reflowed.
