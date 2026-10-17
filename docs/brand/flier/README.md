# DeftBrain flier — every tool, one line each

Two-sided US Letter (8.5 × 11 in), white stock, no bleed (nothing touches the
edge). Tools are grouped by their first category in `src/data/categoryMeta.js`
order, A–Z inside each group; the line under each name is its catalog tagline.

## Files
- `flier.pdf` — print file. Page 1 = front, page 2 = back. Fonts embedded
  (Playfair Display 700, DM Sans 400/500/700, taken from the business card).
  RGB — let the print shop convert to CMYK. Icons are color emoji (bitmaps).
- `flier.html` — the layout the PDF is printed from.
- `tools.csv` — Category, Icon, Tool, Description: for placing the copy in
  InDesign / Affinity Publisher / Word instead of using the PDF layout.
- `build-flier.mjs` — regenerates `flier.html` and `tools.csv` from the live
  catalog, so a new or renamed tool lands on the next print run.

## Regenerate
```
node docs/brand/flier/build-flier.mjs
cd docs/brand/flier && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf=flier.pdf flier.html
```
Check it is still 2 pages: if the catalog grows past what fits, the third page
appears silently — tighten `.desc` / `.tool` sizes in `build-flier.mjs`.
No total tool count is printed, on purpose (counts go stale; see the tool-count rule).
