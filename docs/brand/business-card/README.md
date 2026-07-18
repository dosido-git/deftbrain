# DeftBrain business card — "The Toggle" (Concept 04)

One composition, two themes: Side A is the site in light mode, Side B is the
same card in the app's real dark palette (zinc + orange). Flipping the card
is the theme toggle. Both sides carry everything — neither is the "back".

- Tagline: the dictionary-entry masthead — deft (adj.) — skillful, nimble,
  clever.
- Email: hello@deftbrain.com — matches the site's public address everywhere
  (About, footer, newsletter); an obvious address beats a clever one at a
  glance.
- QR: vector, error-correction M, resolves to https://deftbrain.com.

## Files
- `card-press.pdf` — 2 pages (Side A light, Side B dark), each
  3.75 × 2.25 in = 3.5 × 2 in trim + 0.125 in bleed on all edges. Type stays
  ≥ 0.1875 in inside trim. Fonts embedded (Playfair Display 700, DM Sans
  400/500/700). RGB — let the print shop convert to CMYK.
- `card-press.html` — the source; regenerate the PDF with:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf=card-press.pdf card-press.html`

## Ordering notes
- Tell the printer: 3.5 × 2 in trim, bleed included in the file, no crop
  marks. Page 1 = front, page 2 = back.
- Stock: **18 pt caliper** — substantial in hand without the novelty heft of
  32 pt (which reads as trying-too-hard and costs more). This is the "thicker
  than standard, not too thick" target. Recommended: **Moo "Super" (18 pt)**
  or Vistaprint "Premium Plus / Extra-Thick" (~18 pt).
- Finish: **Soft Touch lamination** — velvety shine-free matte. This is the
  premium-feel multiplier (more than raw thickness), and for THIS design a
  laminated coating actually reproduces the dark flood + fine QR better than
  bare uncoated stock (uncoated absorbs ink → less-deep darks, spread lines).
  Matte also avoids glare, which helps QR scanning. On Moo, Super's "coated
  both sides" = this lamination; choose **Soft Touch, NOT High Gloss** (gloss
  makes the dark side a mirror — wrong for the brand).
- (Both sides are printed on white stock — the cream is ink. If a shop offers
  cream/natural stock instead, ask them to drop the background fill on Side A.)
- Side B is a flood dark — ask for a rich black/near-black build rather than
  plain 100K if offered.
- Optional "someday" flourish: a painted edge (navy or ochre) suits the
  light/dark toggle — but it needs the thicker duplexed 32 pt stock to show,
  so it pushes past the "not too thick" target. File under later.
- QR prints at 0.55 in (0.5 in on the dark chip) — don't scale the card down.
