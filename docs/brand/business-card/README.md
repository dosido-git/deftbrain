# DeftBrain business card — "The Toggle" (Concept 04)

One composition, two themes: Side A is the site in light mode, Side B is the
same card in the app's real dark palette (zinc + orange). Flipping the card
is the theme toggle. Both sides carry everything — neither is the "back".

- Tagline: the dictionary-entry masthead — deft (adj.) — showing cleverness
  and skill in handling things.
- Email: hello@deftbrain.com — matches the site's public address everywhere
  (About, footer, newsletter); an obvious address beats a clever one at a
  glance.
- QR: vector, error-correction M, resolves to https://deftbrain.com.

## Files
- `deftbrain-card-toggle.pdf` — 2 pages (Side A light, Side B dark), each
  3.75 × 2.25 in = 3.5 × 2 in trim + 0.125 in bleed on all edges. Type stays
  ≥ 0.1875 in inside trim. Fonts embedded (Playfair Display 700, DM Sans
  400/500/700). RGB — let the print shop convert to CMYK.
- `card-press.html` — the source; regenerate the PDF with:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless=new --disable-gpu --no-pdf-header-footer \
    --print-to-pdf=deftbrain-card-toggle.pdf card-press.html`

## Ordering notes
- Tell the printer: 3.5 × 2 in trim, bleed included in the file, no crop
  marks. Page 1 = front, page 2 = back.
- Stock: **18 pt / ~450–500 gsm, uncoated** — substantial in hand without the
  novelty heft of 32 pt (which reads as trying-too-hard and costs more). This
  is the "thicker than standard, not too thick" target. Shop equivalents:
  Moo "Super" (450 gsm), Vistaprint "Premium Plus / Extra-Thick" (~18 pt).
- Finish: add **soft-touch (suede) lamination** if offered — a velvety matte
  that makes the card feel premium the instant it's picked up (more so than
  raw extra thickness), deepens the dark side, and keeps the cream side warm
  and non-glossy. Aligns with the brand's understated identity.
- (The light side's cream is printed ink here, so white stock is fine; if
  using cream/natural stock instead, ask the shop to drop the background fill
  on Side A.)
- Side B is a flood dark — ask for a rich black/near-black build rather than
  plain 100K if offered.
- Optional "someday" flourish: a painted edge (navy or ochre) suits the
  light/dark toggle — but it needs the thicker duplexed 32 pt stock to show,
  so it pushes past the "not too thick" target. File under later.
- QR prints at 0.55 in (0.5 in on the dark chip) — don't scale the card down.
