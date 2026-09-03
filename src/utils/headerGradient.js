// headerGradient.js — the tool-page colour band, derived from one catalog field.
//
// Every tool carries a single `headerColor` hex in src/data/tools.js. Until now
// ToolPageWrapper painted it flat — `C 0%, C 60px, transparent 220px` — so the
// band was one solid colour with a fade under it, and it used the same hex in
// both themes. Two consequences:
//
//   1. A flat band reads as paint. Two related stops read as light, which is
//      the whole difference between "coloured rectangle" and "surface".
//   2. The palette was authored for a white page. `#f5e0c0` and `#d4dde8` on
//      zinc-900 are bright stripes, not tinted headers.
//
// Both are fixed here rather than in the catalog, so nothing about the 125
// entries changes and the whole thing is revertible by deleting one import.
//
// Hue is always preserved. A tool's colour is still recognisably its colour.

const HEX = /^#([0-9a-f]{6})$/i;

function hexToHsl(hex) {
  const m = HEX.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  const hh = ((h % 360) + 360) % 360 / 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const channel = (t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const to255 = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  const [r, g, b] = ss === 0
    ? [ll, ll, ll]
    : [channel(hh + 1 / 3), channel(hh), channel(hh - 1 / 3)];
  return '#' + [to255(r), to255(g), to255(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// The second stop. Rotated a little around the wheel and taken one step deeper,
// which is what makes the band look lit rather than filled. Relative to the
// base rather than absolute, so the four deliberately dark catalog entries
// (#1e2a3a, #2a5248, #2a3820, #9a4040) stay dark instead of being dragged up
// into the pastel range.
//
// +10 degrees, not more. Sixteen was the first attempt and it was wrong for the
// warm end: amber at hue 36 landed on 52, which reads yellow-green rather than
// a deeper amber. Ten is invisible as a hue change and still enough to stop the
// two stops looking like one colour at two opacities. Saturation is nudged up
// but never DOWN — a naive clamp at 68 was quietly desaturating #f5e0c0, which
// starts at 73.
export function partnerColor(hex) {
  const c = hexToHsl(hex);
  if (!c) return null;
  return hslToHex(c.h + 10, clamp(c.s + 6, 8, Math.max(c.s, 66)), clamp(c.l - 7, 8, 92));
}

// Dark mode gets a derived value, not the light-mode hex. Hue is kept,
// saturation is damped (a pastel's saturation reads as neon once the lightness
// drops), and lightness lands near the surface rather than near white.
//
// The first version pinned dark lightness to a constant, which quietly undid
// the point: two tools in the same hue family — Justify My Meeting at L87 and
// Meeting Hijack Stopper at L72 — both derived to L21 and became the same dark
// band, distinguishable only by a few points of saturation. Dark lightness now
// tracks the source, inverted: the deeper a tool's light-mode colour, the
// stronger its dark band. A source already darker than the pastel range
// saturates at the top of the output range, which is what those four entries
// need anyway — a near-black band on a near-black page is not a band.
function darkLightness(srcL) {
  return clamp(19 + (92 - srcL) * 0.18, 19, 27);
}

export function darkBase(hex) {
  const c = hexToHsl(hex);
  if (!c) return null;
  return hslToHex(c.h, clamp(c.s * 0.72, 14, 34), darkLightness(c.l));
}

export function darkPartner(hex) {
  const c = hexToHsl(hex);
  if (!c) return null;
  return hslToHex(c.h + 10, clamp(c.s * 0.72, 14, 34), darkLightness(c.l) + 6);
}

// The value ToolPageWrapper puts in `style`. Geometry is unchanged from the
// flat version — solid to 60px, gone by 220px — so nothing on the page moves.
export function headerGradient(hex, isDark) {
  const c = hexToHsl(hex);
  if (!c) return null;
  const from = isDark ? darkBase(hex) : hex;
  const to = isDark ? darkPartner(hex) : partnerColor(hex);
  return `linear-gradient(to bottom, ${from} 0%, ${to} 60px, transparent 220px)`;
}

export { hexToHsl, hslToHex };
