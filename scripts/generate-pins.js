#!/usr/bin/env node
// ============================================================
// scripts/generate-pins.js
// ============================================================
// Pinterest pins for guides (2026-10-06): 1000×1500 PNGs (Pinterest's 2:3),
// drawn the same way scripts/generate-og-images.js draws the 1200×630 social
// previews (satori + resvg, the committed fonts in scripts/fonts/).
//
// Two pins per guide, so each guide can be pinned more than once (Pinterest
// treats a new image as fresh content):
//   -question.png  the guide's question as the headline, plus its short answer
//   -answer.png    the answer itself: the spec's answerTable or answerList when
//                  it has one, otherwise the guide's five section headings
//
// Plus pins.csv: title, description, board, and the guide link with
// utm_source=pinterest, ready to paste (or to adapt for Pinterest's bulk
// upload, which needs public image URLs).
//
// Usage:
//   node scripts/generate-pins.js                 the starter set (PIN_SET below)
//   node scripts/generate-pins.js money/some-slug  just these
// Writes to docs/marketing/pins/ (not part of the site).
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FONTS_DIR = path.join(__dirname, 'fonts');
const BRAIN_PATH = path.join(ROOT, 'public', 'pBrain-r.png');
const OUT_DIR = path.join(ROOT, 'docs', 'marketing', 'pins');

// The starter set from docs/marketing/quora-and-pinterest-plan.md, by board.
const PIN_SET = {
  'Renting & Moving': [
    'home/apartment-move-in-checklist',
    'home/how-to-protect-your-security-deposit-before-you-even-move-in',
    'home/automatic-renewal-clause-in-a-lease',
    'money/splitting-rent-with-different-room-sizes',
  ],
  'Money & Bills': [
    'money/how-to-read-an-itemized-hospital-bill',
    'money/how-to-negotiate-a-medical-bill',
    'money/how-to-dispute-a-bill-you-dont-recognize',
    'money/how-to-push-back-on-bank-fees',
  ],
  'Travel Tips': [
    'travel/is-a-60-minute-layover-enough',
    'travel/can-you-leave-the-airport-during-a-layover',
    'travel/how-to-sleep-in-an-airport-during-a-long-layover',
  ],
  'Career & Job Search': [
    'career/how-to-explain-a-layoff-gap',
    'career/how-to-write-self-review-bullets-that-get-you-the-raise',
  ],
  'Everyday Life Skills': [
    'home/how-to-split-household-chores-fairly',
    'home/how-to-talk-to-your-roommate-about-a-problem',
  ],
};

// Site palette (public/guides/guide.css): paper, ink, rule, accent, blue.
const C = { paper: '#f7f4ef', ink: '#1a1816', ink2: '#4a4640', muted: '#6b6760', rule: '#e0dbd2', accent: '#c94f2c', blue: '#165b9a', card: '#ffffff' };

const el = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } });

function firstSentences(text, max) {
  const clean = String(text || '').replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '$1').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const parts = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  let out = '';
  for (const p of parts) { if ((out + p).length > max) break; out += p; }
  return (out || clean.slice(0, max - 1) + '…').trim();
}

function headlineSize(t) {
  const n = t.length;
  if (n <= 30) return 108;
  if (n <= 45) return 94;
  if (n <= 62) return 80;
  return 68;
}

function frame({ brain, category, children }) {
  return el('div', { width: '1000px', height: '1500px', flexDirection: 'column', padding: '72px 76px 64px', backgroundColor: C.paper, fontFamily: 'DM Sans', color: C.ink }, [
    el('div', { alignItems: 'center', gap: '16px', fontSize: '30px', fontWeight: 500 }, [
      { type: 'img', props: { src: brain, width: 76, height: 76 } },
      el('div', {}, [{ type: 'span', props: { children: 'Deft' } }, { type: 'span', props: { style: { color: C.accent }, children: 'Brain' } }]),
    ]),
    el('div', { marginTop: '96px', fontSize: '26px', letterSpacing: '5px', textTransform: 'uppercase', color: C.accent, fontWeight: 500 }, category),
    // The content sits in the middle of the space between the category and the
    // footer, not at the top, so a short answer doesn't leave the bottom half empty.
    el('div', { flex: 1, flexDirection: 'column', justifyContent: 'center', paddingBottom: '40px' }, children),
    el('div', { flexDirection: 'column', gap: '26px' }, [
      el('div', { height: '2px', width: '100%', backgroundColor: C.rule }, []),
      el('div', { justifyContent: 'space-between', alignItems: 'center' }, [
        el('div', { fontSize: '28px', color: C.muted }, 'Free guide'),
        el('div', { backgroundColor: C.blue, color: '#fff', fontSize: '30px', fontWeight: 500, padding: '16px 30px', borderRadius: '999px' }, 'deftbrain.com'),
      ]),
    ]),
  ]);
}

function questionPin(spec, brain) {
  const head = spec.shortTitle || spec.title;
  return frame({ brain, category: spec.categoryLabel, children: [
    el('div', { fontFamily: 'Playfair Display', fontWeight: 700, fontSize: `${headlineSize(head)}px`, lineHeight: 1.06, letterSpacing: '-1.5px' }, head),
    el('div', { marginTop: '52px', fontSize: '42px', lineHeight: 1.4, color: C.ink2 }, firstSentences(spec.deck, 230)),
  ] });
}

function answerPin(spec, brain) {
  const head = spec.shortTitle || spec.title;
  let body;
  if (spec.answerTable && spec.answerTable.rows) {
    body = el('div', { flexDirection: 'column', marginTop: '44px', backgroundColor: C.card, borderRadius: '24px', padding: '16px 36px' },
      spec.answerTable.rows.map((r, i) => el('div', { justifyContent: 'space-between', alignItems: 'flex-start', gap: '28px', padding: '24px 0', borderTop: i ? `2px solid ${C.rule}` : 'none' }, [
        el('div', { flex: 1.3, fontSize: '34px', lineHeight: 1.3, color: C.ink2 }, r[0]),
        el('div', { flex: 1, fontSize: '34px', lineHeight: 1.3, fontWeight: 500, color: C.ink }, r[1]),
      ])));
  } else {
    const items = (spec.answerList && spec.answerList.length) ? spec.answerList : spec.steps.map(s => s.name);
    body = el('div', { flexDirection: 'column', marginTop: '52px', gap: '34px' },
      items.slice(0, 5).map((t, i) => el('div', { gap: '24px', alignItems: 'flex-start' }, [
        el('div', { width: '66px', height: '66px', flexShrink: 0, borderRadius: '999px', backgroundColor: C.blue, color: '#fff', fontSize: '34px', fontWeight: 500, alignItems: 'center', justifyContent: 'center' }, String(i + 1)),
        el('div', { flex: 1, fontSize: '40px', lineHeight: 1.3, color: C.ink, paddingTop: '6px' }, t),
      ])));
  }
  return frame({ brain, category: spec.categoryLabel, children: [
    el('div', { fontFamily: 'Playfair Display', fontWeight: 700, fontSize: `${Math.min(80, headlineSize(head))}px`, lineHeight: 1.08, letterSpacing: '-1px' }, head),
    body,
  ] });
}

function csvCell(s) { return `"${String(s).replace(/"/g, '""')}"`; }

async function main() {
  const { default: satori } = await import('satori');
  const { Resvg } = await import('@resvg/resvg-js');
  const font = f => fs.readFileSync(path.join(FONTS_DIR, f));
  const fonts = [
    { name: 'Playfair Display', data: font('PlayfairDisplay-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'DM Sans', data: font('DMSans-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'DM Sans', data: font('DMSans-Medium.ttf'), weight: 500, style: 'normal' },
  ];
  const brain = `data:image/png;base64,${fs.readFileSync(BRAIN_PATH).toString('base64')}`;

  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const jobs = args.length
    ? args.map(k => ({ key: k, board: '' }))
    : Object.entries(PIN_SET).flatMap(([board, keys]) => keys.map(key => ({ key, board })));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rows = [['File', 'Board', 'Title', 'Description', 'Link'].map(csvCell).join(',')];
  let made = 0;
  for (const { key, board } of jobs) {
    const file = path.join(ROOT, 'guides', `${key}.js`);
    if (!fs.existsSync(file)) { console.warn(`  ⚠ no guide ${key}, skipped`); continue; }
    delete require.cache[require.resolve(file)];
    const spec = require(file);
    const link = `https://deftbrain.com/guides/${spec.category}/${spec.slug}?utm_source=pinterest&utm_campaign=${spec.slug}`;
    const description = firstSentences(spec.description || spec.deck, 480);
    for (const [variant, build] of [['question', questionPin], ['answer', answerPin]]) {
      const svg = await satori(build(spec, brain), { width: 1000, height: 1500, fonts });
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
      const name = `${spec.slug}-${variant}.png`;
      fs.writeFileSync(path.join(OUT_DIR, name), png);
      rows.push([name, board, (spec.shortTitle || spec.title).slice(0, 100), description, link].map(csvCell).join(','));
      made++;
    }
    console.log(`  ✓ ${spec.slug}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'pins.csv'), rows.join('\n') + '\n');
  console.log(`📌 ${made} pins + pins.csv → ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch(err => { console.error(err); process.exit(1); });
