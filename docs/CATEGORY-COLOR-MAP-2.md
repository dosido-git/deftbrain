<!-- v3.0 · 2026-10-29 · rebuilt in the repo from the owner's Claude chat and
     the palette sheet (Desktop/DeftBrain Category Palettes.pdf); the Project
     copy of v3.0 never reached this checkout. Supersedes v2.0's 17 categories
     and six pastel-tint families. -->
# DeftBrain Category Color Map

**Version:** 3.0, 2026-10-29
**Status:** approved by the owner. Dark mode is **midnight**.
**Code:** `src/data/toolSchemes.js` (`SCHEMES`), applied by
`src/components/CategoryStyle.js`. Usage rules: `audit/CONVENTIONS.md`,
"Category-colour pages".

## The system (identical in all ten categories)

- **Ink:** one deep colour per category, used only for the title, the main
  button, the active-tab bar, "Start over" and the outline of the single key
  box. Every ink is at least 5.5:1 on white (the sheet; the chat said 6:1).
- **Surface and panels:** warm neutral and white, never tinted.
- **Rule, input border and wash:** the ink blended into the surface at fixed
  percentages. The wash fills only the key box and inactive tabs.
- **Contrast:** a dark, muted opposite-hue shade, for warnings only.

## The ten categories, light mode (from the palette sheet)

| Category | Ink | Contrast | Border | Rule | Wash |
| --- | --- | --- | --- | --- | --- |
| Money | olive `#4F5738` | `#36295B` | `#878D78` | `#C3C4B7` | `#E9E8E1` |
| Learning | aubergine `#5A3D6A` | `#3B5B29` | `#8F7B9A` | `#C7BCC6` | `#EAE6E5` |
| Relationships | raspberry `#8A3556` | `#295B48` | `#AF768C` | `#D5BAC0` | `#EEE6E3` |
| Career and Business | navy `#27395A` | `#5B4A29` | `#6C788F` | `#B7BBC2` | `#E7E6E4` |
| Conversations | deep teal `#1F5A5C` | `#5B2B29` | `#678F90` | `#B5C5C2` | `#E6E8E4` |
| Home & Daily Life | graphite `#40454C` | from the formulas | from the formulas | from the formulas | from the formulas |
| Travel & Events | pine `#2D5A44` | `#5B2942` | `#708F80` | `#B9C5BB` | `#E7E8E2` |
| Ideas & Diversions | ochre `#7A5C0C` | `#29375B` | `#A5905A` | `#D0C6AA` | `#ECE8DE` |
| Health & Wellness | leaf green `#2F6F2A` | `#58295B` | `#729D6E` | `#BACBB3` | `#E7EAE0` |
| Decisions | copper `#984719` | `#29495B` | `#B98263` | `#D9BFAE` | `#EEE7DF` |

The sheet's second round moved Health & Wellness from rust to leaf green (too
close to Relationships) and Decisions from steel blue to copper (too close to
Career). Home & Daily Life is **graphite** `#40454C` (owner, 2026-10-29). The
sheet only shows its stone version (`#5E5648`, contrast `#293B5B`), so
graphite's other light values come from the formulas below when Home is
restyled; indigo `#444C94` was the third option.

## Shared neutrals

| Role | `SCHEMES` key | Light | Midnight |
| --- | --- | --- | --- |
| Lightest panel (form, answer card) | `field` | `#FBFAF7` | `#171A20` |
| Envelope (page panel) | `envelope` | `#F5F3EE` | `#1F232B` |
| White card / text boxes | `card` | `#FFFFFF` | `#101216` |
| Body text | `text` | `#1F1E1B` | `#E8ECF2` |
| Secondary grey | `muted` | `#4B5563` | `#A1A1AA` |
| Text on the ink button | `onStrong`, `buttonText` | `#FFFFFF` | `#14130F` |

## Per-category tokens (formulas)

The sheet gives light ink, contrast, border, rule and wash (table above). The
rest were measured from the Relationships entry the chat delivered and
reproduce it to within 1–2 units per channel.

| Role | Key | Light | Midnight |
| --- | --- | --- | --- |
| Ink | `accent`, `strong`, `button` | the ink | the ink mixed toward white until 6:1 on the envelope (about 6.2:1) |
| Panel and chip border | `border` | 65% ink over envelope | 55% midnight ink over envelope |
| Rule | `line` | 30% ink over envelope | 28% midnight ink over field |
| Wash | `wash` | 7% ink over envelope | 12% midnight ink over envelope |
| Inactive tab | `tab` | 10% ink over envelope | 10% midnight ink over field |
| Contrast (warnings) | `x`, `xText` | the sheet's value | opposite hue, lightness 76%, saturation 13% |
| Contrast border | `xLine` | 20% contrast over envelope | 28% contrast over field |

The midnight contrast formula is inferred from one example (Relationships'
`#BBCBC4`); the chat's own midnight shades were not recovered.

## Status by category

| Category | In `toolSchemes.js` |
| --- | --- |
| Relationships | v3.0 (from the chat) |
| Money, Learning, Conversations, Travel & Events | v3.0 (sheet values; tab and midnight from the formulas) |
| Home & Daily Life, Career and Business, Health & Wellness, Ideas & Diversions, Decisions | v3.0 (sheet values; Home graphite and every midnight set from the formulas) |

## Open items

- Gold AI-insight panel (v2.0 `#fdf4e8`): not decided in v3.0.
- Print: light tokens should apply on paper regardless of the dark setting.
