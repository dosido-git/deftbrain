// backend/lib/shareCard.js
// ────────────────────────────────────────────────────────────────────────────
// The 1200×630 preview card social sites show for a DeftBrain link. One
// template for both kinds:
//   • a tool card (scripts/generate-tool-cards.js, from a tool's `ogCard`)
//   • a shared-result card (GET /r/:id/card.png, from the parts the visitor
//     ticked)
//
// Same paper, serif and orange as the guide cards (generate-og-images.js),
// because the old dark tool cards read as banner ads — a product name and a
// slogan on Reddit is the shape of a sponsored post. A card leads with
// something a person would actually say or find, the tool name small above it,
// and the domain nowhere: every platform prints it under the card already.
//
// The fonts draw Latin, Cyrillic and Vietnamese. Text in any other script
// (Arabic, CJK, Devanagari, Thai) would render as boxes, so canDraw() says no
// and the caller falls back to the tool's own card.
// ────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const FONTS_DIR = path.join(ROOT, 'scripts', 'fonts');
const BRAIN_PATH = path.join(ROOT, 'public', 'pBrain-r.png');

const PAPER = '#f7f4ef';
const INK = '#1a1816';
const MUTED = '#6b6760';
const ACCENT = '#c94f2c';

// Emoji and variation selectors are dropped before drawing: satori would
// need an emoji font, and a stray 📋 adds nothing to a card.
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu;
// Latin (incl. extended + Vietnamese), Greek/Cyrillic, punctuation, currency.
const DRAWABLE = /^[\u0000-ɏ̀-ͯͰ-ӿḀ-ỿ -⁯₠-⃏℀-⅏←-⇿− -ÿ]*$/u;

function clean(s) {
  return String(s || '').replace(EMOJI, '').replace(/\s+/g, ' ').trim();
}

function canDraw(...texts) {
  return texts.every(t => DRAWABLE.test(clean(t)));
}

// Cut at a word boundary so a card never ends mid-word.
function clip(s, max) {
  const t = clean(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[\s,;:–—-]+$/, '') + '…';
}

function headlineSize(n) {
  if (n <= 60) return 68;
  if (n <= 100) return 56;
  if (n <= 140) return 46;
  return 40;
}

let assets = null;
async function load() {
  if (assets) return assets;
  // satori is ESM-only.
  const { default: satori } = await import('satori');
  const { Resvg } = await import('@resvg/resvg-js');
  const font = f => fs.readFileSync(path.join(FONTS_DIR, f));
  const brain = fs.readFileSync(BRAIN_PATH);
  assets = {
    satori, Resvg,
    fonts: [
      { name: 'Playfair Display', data: font('PlayfairDisplay-Bold.ttf'), weight: 700, style: 'normal' },
      { name: 'DM Sans', data: font('DMSans-Regular.ttf'), weight: 400, style: 'normal' },
      { name: 'DM Sans', data: font('DMSans-Medium.ttf'), weight: 500, style: 'normal' },
    ],
    brain: `data:image/png;base64,${brain.toString('base64')}`,
  };
  return assets;
}

const el = (type, style, children) => ({ type, props: { style, children } });

// kicker: the tool name, small caps in orange. label: optional heading of the
// part shown. headline: the line the card is about. foot: optional quiet
// line — left off by default, since a pitch there is what makes a card an ad.
function template({ kicker, label, headline, sub, foot }, brain) {
  const h = clip(headline, 170);
  return el('div', {
    width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
    padding: '56px 80px', backgroundColor: PAPER, fontFamily: 'DM Sans',
  }, [
    el('div', { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px', color: INK, fontWeight: 500 }, [
      { type: 'img', props: { src: brain, width: 52, height: 52 } },
      el('div', { display: 'flex' }, [
        { type: 'span', props: { children: 'Deft' } },
        { type: 'span', props: { style: { color: ACCENT }, children: 'Brain' } },
      ]),
    ]),
    el('div', { display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }, [
      el('div', { fontSize: '20px', color: ACCENT, textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 500, marginBottom: label ? '14px' : '26px' }, clip(kicker, 60)),
      label && el('div', { fontSize: '24px', color: MUTED, fontWeight: 500, marginBottom: '18px' }, clip(label, 70)),
      el('div', { fontFamily: 'Playfair Display', fontSize: `${headlineSize(h.length)}px`, fontWeight: 700, color: INK, lineHeight: 1.12, letterSpacing: '-0.5px' }, h),
      sub && el('div', { fontSize: '26px', color: '#3a3530', marginTop: '26px', lineHeight: 1.35 }, clip(sub, 120)),
    ].filter(Boolean)),
    foot && el('div', { display: 'flex', borderTop: '1px solid #e2dcd2', paddingTop: '20px', fontSize: '20px', color: MUTED }, clip(foot, 90)),
  ].filter(Boolean));
}

async function renderCard(card) {
  const { satori, Resvg, fonts, brain } = await load();
  const svg = await satori(template(card, brain), { width: 1200, height: 630, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}

// The text up to the first sentence end, for a title. Same rule as
// firstSentence in src/components/ActionButtons.js.
function firstSentence(s, max) {
  const line = String(s || '').split('\n').map(clean).find(l => l.length >= 25);
  if (!line) return '';
  const m = line.match(/^.+?[.!?…。！？](?=\s|$)/u);
  return clip(m ? m[0] : line, max);
}

module.exports = { renderCard, canDraw, clip, clean, firstSentence };
