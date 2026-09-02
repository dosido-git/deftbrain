module.exports = {
  slug:          'what-those-laundry-symbols-actually-mean',
  category:      'practical',
  categoryLabel: 'Practical',
  title:         "What Those Laundry Symbols Actually Mean",
  titleHtml:     "What Those Laundry Symbols <em>Actually Mean</em>",
  shortTitle:    "Laundry Symbols Decoded",
  navTitle:      "laundry symbols decoded",
  description:   "Care labels look like a hieroglyphic test. Here is the small set of symbols that actually matter, what each one tells you, and how to skip the ones that don't.",
  deck:          "Care labels look like a hieroglyphic test. Here is the small set of symbols that actually matter, what each one tells you, and how to skip the ones that don't.",
  ledes: [
    `You held up the new shirt's care label. There are six symbols on it. None of them have words. One looks like a bucket. One looks like a square with a circle inside. One looks like a triangle, and another like a triangle with lines through it. You vaguely remember that these are supposed to mean something specific about how to wash this thing, but you have never bothered to learn the system, and the shirt is still in your hand and you still have no idea what to do with it.

There are about thirty laundry symbols in common use, but you only really need to recognize about ten. The rest are for industrial dry cleaners or unusual fabrics. Knowing the ten that matter — what shape they are and what they mean — turns care labels from hieroglyphs into a quick scan.`,
    `What follows: the ten symbols you actually need to know. Then a tool that decodes any care label from a photo.`,
  ],
  steps: [
    { name: 'The bucket of water tells you about washing', art: '<svg viewBox="0 0 40 40" width="34" height="34" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="9" x2="37" y2="9"/><path d="M7,9 L9,30 Q9,32 11,32 H29 Q31,32 31,30 L33,9"/></svg>', artLabel: 'Machine Wash', artCaption: 'The wash symbol', body: 'The bucket symbol always relates to washing. Numbers inside the bucket mean maximum water temperature in Celsius (30 = cold, 40 = warm, 60 = hot). Dots inside the bucket mean the same thing in dot-count form (one dot = cold, two = warm, three = hot). A line under the bucket means use a gentle cycle. Two lines means very gentle. A bucket with an X through it means do not machine wash — usually hand-wash or dry-clean only.' },
    { name: 'The triangle is about bleach', art: '<svg viewBox="0 0 40 40" width="34" height="34" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20,5 L36,33 H4 Z"/></svg>', artLabel: 'Bleach As Needed', artCaption: 'The bleach symbol', body: 'An empty triangle means bleach allowed. A triangle with diagonal stripes means non-chlorine (oxygen) bleach only. A triangle with an X through it means do not bleach. If you do not use bleach in your laundry routine, you can ignore this symbol entirely — but if you do bleach whites, check it first to avoid ruining a fabric that does not tolerate it.' },
    { name: 'The square is about drying', art: '<svg viewBox="0 0 40 40" width="34" height="34" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="30" height="30" rx="1"/><circle cx="20" cy="18" r="10.5"/></svg>', artLabel: 'Tumble Dry', artCaption: 'The tumble-dry symbol', body: 'A plain square is the drying symbol. A square with a circle inside it means tumble dry (machine dryer). Dots inside the circle indicate heat (one dot = low, two = medium, three = high). A square with lines inside it (no circle) means air-dry — vertical lines mean drip dry, horizontal lines mean dry flat. A square with an X through the circle means do not tumble dry. The dryer-related symbols are the most commonly violated, and dryer violations are how things shrink.' },
    { name: 'The iron tells you about ironing', art: '<svg viewBox="0 0 40 40" width="34" height="34" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5,25 L5,27 H35 V22 L28,13 H13 Q5,13 5,19 Z"/><circle cx="15" cy="20" r="2" fill="currentColor"/><circle cx="25" cy="20" r="2" fill="currentColor"/></svg>', artLabel: 'Iron Warm · 150°C', artCaption: 'The iron symbol', body: 'A plain iron means ironing is fine. Dots inside the iron indicate heat (one = low, two = medium, three = high). An iron with an X means do not iron. An iron with lines underneath means use steam carefully. If you do not iron things, you can ignore this symbol. If you do, the heat dots are the only part that matters — the wrong heat will scorch synthetic fabrics.' },
    { name: 'The circle is about dry cleaning', art: '<svg viewBox="0 0 40 40" width="34" height="34" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="20" r="15"/></svg>', artLabel: 'Dry Clean', artCaption: 'The dry-clean symbol', body: 'A plain circle means dry-clean only. Letters inside the circle (P, F, W) tell professional cleaners which solvent to use — irrelevant to you, but important if you take it to the cleaner. A circle with an X means do not dry-clean. If a label says dry-clean only and you do not want to take it to a cleaner, you have to either accept a higher risk by hand-washing carefully, or skip buying the item. The dry-clean-only label is information about the manufacturer\'s testing — it usually means the garment will not survive home washing.' }
  ],
  cta: {
    glyph:    '🧺',
    headline: "Stop guessing what to do with the load.",
    body:     "Snap the care label or describe what you are washing. Get exact cycle settings, drying risks, and time estimates — plus emergency stain treatment using stuff already in your kitchen.",
    features: [
      "AI load advisor with cycle settings",
      "Stain SOS using household supplies",
      "Smart timers with audio alerts",
      "Care-label photo decoder"
    ],
    toolId:   'LaundroMat',
    toolName: 'LaundroMat',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
