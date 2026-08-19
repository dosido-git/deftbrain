/**
 * src/data/tagColors.js
 * ──────────────────────────────────────────────────────────────────────
 * The category palette for Six Degrees of Me.
 *
 * Eleven semantic tags — the ones the backend's /tag-nodes endpoint can
 * return — each with a hue that has to work as SVG stroke, as a node border,
 * as a legend dot, and as text on a tinted chip, in both themes.
 *
 * One hex per tag could not do that. The -500 shades that read on white go
 * muddy on near-black: the chip labels measured 2.99:1 against their own
 * ground in dark mode, which is why they were described as nearly invisible.
 * So each tag carries two shades and `tagColor` picks by theme. Lime and cyan
 * sit one step darker on light because those two hues stay pale at -700.
 *
 * Lives in data/ rather than the tool file because four separate renderers
 * read it, and because a palette is data — the tool's own colours belong in
 * its `c = {}` block.
 */

export const TAG_COLORS = {
  career:       { light: '#6d28d9', dark: '#c4b5fd' },
  education:    { light: '#1d4ed8', dark: '#93c5fd' },
  relationship: { light: '#be185d', dark: '#f9a8d4' },
  place:        { light: '#047857', dark: '#6ee7b7' },
  hobby:        { light: '#b45309', dark: '#fcd34d' },
  emotion:      { light: '#b91c1c', dark: '#fca5a5' },
  skill:        { light: '#155e75', dark: '#67e8f9' },
  event:        { light: '#3f6212', dark: '#bef264' },
  identity:     { light: '#7e22ce', dark: '#d8b4fe' },
  health:       { light: '#0f766e', dark: '#5eead4' },
  belief:       { light: '#c2410c', dark: '#fdba74' },
};

export const tagColor = (tag, isDark) => {
  const pair = TAG_COLORS[tag];
  return pair ? (isDark ? pair.dark : pair.light) : null;
};
