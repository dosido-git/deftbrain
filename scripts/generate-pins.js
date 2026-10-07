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

// The starter set, by board. Board names follow the site's own categories
// (src/data/categoryMeta.js), so Pinterest and deftbrain.com use one map (2026-10-06).
const PIN_SET = {
  'Home & Daily Life': [
    'home/apartment-move-in-checklist',
    'home/how-to-protect-your-security-deposit-before-you-even-move-in',
    'home/automatic-renewal-clause-in-a-lease',
    'money/splitting-rent-with-different-room-sizes',
  ],
  'Money': [
    'money/how-to-read-an-itemized-hospital-bill',
    'money/how-to-negotiate-a-medical-bill',
    'money/how-to-dispute-a-bill-you-dont-recognize',
    'money/how-to-push-back-on-bank-fees',
  ],
  'Travel & Events': [
    'travel/is-a-60-minute-layover-enough',
    'travel/can-you-leave-the-airport-during-a-layover',
    'travel/how-to-sleep-in-an-airport-during-a-long-layover',
  ],
  'Career': [
    'career/how-to-explain-a-layoff-gap',
    'career/how-to-write-self-review-bullets-that-get-you-the-raise',
  ],
  'Conversations': [
    'home/how-to-split-household-chores-fairly',
    'home/how-to-talk-to-your-roommate-about-a-problem',
  ],
};

// Tool pins (2026-10-06): a pin that leads straight to a tool, about one for
// every three guide pins. `gets` is what the tool gives you, taken from the
// tool's own feature list (its guides' cta.features), so nothing is promised
// that the tool doesn't do. `example` is an excerpt of a real saved result
// (tools.js exampleOutput) where the tool has one.
const TOOL_PINS = [
  { id: 'RentersDepositSaver', name: "Renter's Deposit Saver", board: 'Home & Daily Life',
    head: 'Protect your security deposit on move-in day',
    sub: 'Walk through your apartment once. Leave with the record that settles a move-out dispute.',
    gets: ['Room-by-room walkthrough', 'A photo shot list', 'A formal condition report', 'A cover letter for your landlord, with your state\'s deposit rights'] },
  { id: 'LeaseTrapDetector', name: 'Lease Trap Detector', board: 'Home & Daily Life',
    head: 'Find the clauses hiding in your lease',
    sub: 'Paste or upload a lease. See what to question before you sign.',
    example: { verdict: 'High risk: 4 major concerns', label: 'From a real example: 3 things to fix before signing',
      items: ['Remove the automatic 10% rent increase on renewal', 'Make the one-sided attorney\'s fees clause mutual', 'Bring the deposit down to the state\'s legal limit'] } },
  { id: 'BillRescue', name: 'Bill Rescue', board: 'Money',
    head: 'A bill isn\'t a verdict. It\'s a puzzle.',
    sub: 'Tell it what the bill says and what happened. Get a plan for questioning it.',
    gets: ['Itemized-bill error spotting', 'Scripts and letters for each step', 'Financial assistance templates', 'Practice the billing call first'] },
  { id: 'LayoverMaximizer', name: 'Layover Maximizer', board: 'Travel & Events',
    head: 'Will you make your connection?',
    sub: 'Enter the airport, terminals, and your passport situation. Get the real time math.',
    gets: ['A YES / NO / RISKY verdict, with the math', 'Gate-to-gate directions', 'A lounge finder matched to your cards', 'The worst case, and what then'] },
  { id: 'MoneyDiplomat', name: 'Money Diplomat', board: 'Money',
    head: 'The right number for awkward money moments',
    sub: 'Tips, splits, rent, gifts, paying someone back: the amount and the words.',
    gets: ['Amounts that fit your budget and country', 'Scripts for the conversation, not just the math', 'Practice mode for the hard ones', 'Quick math for tips and splits'] },
  // Second set (2026-10-06).
  { id: 'QuoteCheck', name: 'Quote Check', board: 'Money',
    head: 'Is this repair quote fair?',
    sub: 'Paste or upload a quote for a car, appliance, or home repair before you approve it.',
    gets: ['What the price actually includes', 'Questions worth asking before you say yes', 'A side-by-side with a second quote', 'What to clarify before approving the work'] },
  { id: 'ScamRadar', name: 'Scam Radar', board: 'Money',
    head: 'Is this message a scam?',
    sub: 'Paste a suspicious text, email, DM, invoice, or phone script.',
    gets: ['What in it deserves caution, and why', 'How to verify it without trusting the message', 'Your options before you click, pay, or reply'] },
  { id: 'ComplaintEscalationWriter', name: 'Complaint Escalation Writer', board: 'Money',
    head: 'When a company stops answering',
    sub: 'Describe what happened and what you have tried. Get a clear plan for escalating.',
    gets: ['A step-by-step escalation plan', 'Letters written for each stage', 'An attorney general complaint, with the relevant law', 'Where your leverage is in that industry'] },
  { id: 'TicketTackler', name: 'Ticket Tackler', board: 'Money',
    head: 'Got a ticket? See what kind of case you have.',
    sub: 'Not every ticket is worth fighting, or paying without a look.',
    gets: ['What the citation actually says', 'The facts that may matter', 'The evidence worth keeping', 'Help making your case, if an appeal makes sense'] },
  { id: 'TheWholeStory', name: 'The Whole Story', board: 'Career',
    head: 'Explain a gap, a setback, or a hard chapter',
    sub: 'Tell it what actually happened and who you are telling. Find honest words that work.',
    gets: ['Honest framing, not spin', 'Versions for interviews, networking, and more', 'The follow-up questions to prepare for', 'Common mistakes to avoid'] },
  { id: 'BragSheetBuilder', name: 'Brag Sheet Builder', board: 'Career',
    head: 'Remember your work. Make the case for it.',
    sub: 'Turn a year of work into a self-review, a promotion case, or a raise conversation.',
    gets: ['A case built for the next level', 'Bold, balanced, or quietly confident versions', 'A script for the raise conversation', 'Stories ready for interviews'] },
  { id: 'RoommateCourt', name: 'Roommate Court', board: 'Conversations',
    head: 'Work it out with your roommate',
    sub: 'Describe what is going on and what each side says.',
    gets: ['A fair split of chores', 'Words for the conversation you have been avoiding', 'Both sides treated as adults'] },
  { id: 'DifficultTalkCoach', name: 'Difficult Talk Coach', board: 'Conversations',
    head: 'Practice the hard conversation first',
    sub: 'Rehearse it before it happens, with someone who pushes back.',
    gets: ['Likely pushback, and ways to answer it', 'A live practice mode', 'Language that keeps it calm', 'A debrief afterwards'] },
];

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

// The answer pin's points, as one line of text for its Pinterest description.
function answerDescription(spec) {
  const points = spec.answerTable && spec.answerTable.rows
    ? spec.answerTable.rows.map(r => `${r[0]}: ${r[1]}`)
    : ((spec.answerList && spec.answerList.length) ? spec.answerList : spec.steps.map(st => st.name)).slice(0, 5);
  const line = points.map(t => String(t).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[.\s]+$/, '')).join('. ');
  return firstSentences(`The short answer: ${line}. Full guide at DeftBrain.`, 480);
}

function toolPin(t, brain) {
  const check = (txt) => el('div', { gap: '22px', alignItems: 'flex-start' }, [
    el('div', { width: '50px', height: '50px', flexShrink: 0, borderRadius: '999px', backgroundColor: C.blue, color: '#fff', fontSize: '28px', fontWeight: 500, alignItems: 'center', justifyContent: 'center' }, [
      // Drawn, not typed: the pin fonts have no ✓ glyph.
      { type: 'svg', props: { width: 26, height: 26, viewBox: '0 0 24 24', children: [
        { type: 'path', props: { d: 'M5 12.5l4.5 4.5L19 7.5', stroke: '#fff', strokeWidth: 3.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } },
      ] } },
    ]),
    el('div', { flex: 1, fontSize: '36px', lineHeight: 1.3, color: C.ink, paddingTop: '2px' }, txt),
  ]);
  const card = t.example
    ? el('div', { flexDirection: 'column', marginTop: '48px', backgroundColor: C.card, borderRadius: '24px', padding: '34px 36px', gap: '22px' }, [
        el('div', { fontSize: '26px', color: C.muted, letterSpacing: '1px' }, t.example.label),
        el('div', { fontSize: '38px', fontWeight: 500, color: C.accent }, t.example.verdict),
        ...t.example.items.map(check),
      ])
    : el('div', { flexDirection: 'column', marginTop: '48px', backgroundColor: C.card, borderRadius: '24px', padding: '34px 36px', gap: '24px' }, [
        el('div', { fontSize: '26px', color: C.muted, letterSpacing: '1px' }, 'What you get'),
        ...t.gets.map(check),
      ]);
  return el('div', { width: '1000px', height: '1500px', flexDirection: 'column', padding: '72px 76px 64px', backgroundColor: C.paper, fontFamily: 'DM Sans', color: C.ink }, [
    el('div', { alignItems: 'center', gap: '16px', fontSize: '30px', fontWeight: 500 }, [
      { type: 'img', props: { src: brain, width: 76, height: 76 } },
      el('div', {}, [{ type: 'span', props: { children: 'Deft' } }, { type: 'span', props: { style: { color: C.accent }, children: 'Brain' } }]),
    ]),
    el('div', { marginTop: '96px', fontSize: '26px', letterSpacing: '5px', textTransform: 'uppercase', color: C.accent, fontWeight: 500 }, `Free tool · ${t.name}`),
    el('div', { flex: 1, flexDirection: 'column', justifyContent: 'center', paddingBottom: '40px' }, [
      el('div', { fontFamily: 'Playfair Display', fontWeight: 700, fontSize: `${headlineSize(t.head)}px`, lineHeight: 1.06, letterSpacing: '-1.5px' }, t.head),
      el('div', { marginTop: '32px', fontSize: '36px', lineHeight: 1.4, color: C.ink2 }, t.sub),
      card,
    ]),
    el('div', { flexDirection: 'column', gap: '26px' }, [
      el('div', { height: '2px', width: '100%', backgroundColor: C.rule }, []),
      el('div', { justifyContent: 'space-between', alignItems: 'center' }, [
        el('div', { fontSize: '28px', color: C.muted }, 'Free · no account needed'),
        el('div', { backgroundColor: C.blue, color: '#fff', fontSize: '30px', fontWeight: 500, padding: '16px 30px', borderRadius: '999px' }, 'deftbrain.com'),
      ]),
    ]),
  ]);
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
      // Pinterest's bulk import rejects two rows with the same title, so the
      // answer pin gets its own title and a description of what it shows.
      const head = spec.shortTitle || spec.title;
      const title = variant === 'answer' ? `${head.replace(/\?$/, '')}: the short answer` : head;
      const desc = variant === 'answer' ? answerDescription(spec) : description;
      const pinLink = variant === 'answer' ? `${link}&utm_content=answer` : link;
      rows.push([name, board, title.slice(0, 100), desc, pinLink].map(csvCell).join(','));
      made++;
    }
    console.log(`  ✓ ${spec.slug}`);
  }
  // Tool pins: always with the full starter set; with named guides only when
  // --tools is passed.
  if (!args.length || process.argv.includes('--tools')) {
    for (const t of TOOL_PINS) {
      const svg = await satori(toolPin(t, brain), { width: 1000, height: 1500, fonts });
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1000 } }).render().asPng();
      const name = `tool-${t.id}.png`;
      fs.writeFileSync(path.join(OUT_DIR, name), png);
      const link = `https://deftbrain.com/${t.id}?utm_source=pinterest&utm_campaign=tool-${t.id}`;
      rows.push([name, t.board, t.head.slice(0, 100), `${t.sub} Free, no account needed.`, link].map(csvCell).join(','));
      made++;
      console.log(`  ✓ tool ${t.id}`);
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'pins.csv'), rows.join('\n') + '\n');
  console.log(`📌 ${made} pins + pins.csv → ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch(err => { console.error(err); process.exit(1); });
