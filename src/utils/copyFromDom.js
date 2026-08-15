/**
 * src/utils/copyFromDom.js
 * ──────────────────────────────────────────────────────────────────────
 * Turn what is actually on screen into Markdown you can paste somewhere.
 *
 * WHY THIS EXISTS. Print and copy used to come from two different places.
 * Print calls window.print() on the live DOM, so it gets every section, in
 * order, always current. Copy read a hand-written summary string authored
 * separately inside each of 126 tools — whatever that tool's author
 * remembered to include, frozen at whatever the result shape was that day.
 * Context Collapse rendered seven result sections and copied three, silently
 * dropping the one about where misunderstandings happen. Every tool had its
 * own version of that gap and no way to notice it.
 *
 * Reading the DOM means copy cannot drift from the page again: if it is on
 * screen it is in the clipboard, and a new section needs no copy code at all.
 *
 * Markdown rather than plain text because of where this gets pasted — Notes,
 * Docs, Slack, email. `## Heading` and `- item` render in most of those. The
 * old convention was ALL-CAPS labels, which render as nothing anywhere.
 *
 * FALLBACK IS THE WHOLE SAFETY STORY. serializeResults() returns null when it
 * finds nothing convincing, and the caller keeps using the tool's own
 * buildFullText(). A tool this cannot read is exactly as good as it was
 * yesterday, never worse.
 */

const clean = s => String(s).replace(/\s+/g, ' ').trim();

// Elements that are controls or chrome, not content. Every tool's results
// carry buttons — copy, regenerate, tab rows — and the input form lives in the
// same <main>, so both have to go. Only one tool in the catalog marks its form
// data-print-hide, which is why this is structural rather than opt-in.
const SKIP_TAGS = new Set([
  'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'LABEL', 'FORM',
  'SCRIPT', 'STYLE', 'NAV', 'SVG', 'KBD', 'NOSCRIPT',
]);

const SKIP_ATTR = ['data-print-hide', 'data-copy-hide', 'aria-hidden'];

function skipped(el) {
  if (SKIP_TAGS.has(el.tagName)) return true;
  for (const a of SKIP_ATTR) if (el.getAttribute(a) === 'true' || el.hasAttribute(a)) return true;
  // Collapsed <details> — on screen it is one line, so it copies as one line.
  // The contents are genuinely not being shown and pasting them would be a
  // different document from the one the person is looking at.
  if (el.tagName === 'DETAILS' && !el.open) return true;
  // A block that is nothing but links is navigation — the "related tools" row
  // at the foot of a result. Structural rather than matching its heading,
  // which would have to be done in thirteen languages.
  const links = el.querySelectorAll ? el.querySelectorAll('a') : [];
  if (links.length >= 2) {
    const linkText = Array.from(links).map(a => a.textContent).join('');
    if (clean(el.textContent).length <= clean(linkText).length + 24) return true;
  }
  return false;
}

// A heading is anything the page presents as one: real heading tags, or the
// bold/uppercase label pattern the tools use for section titles.
function headingLevel(el) {
  const m = /^H([1-6])$/.exec(el.tagName);
  if (m) return Math.min(3, Number(m[1]));
  if (el.tagName === 'SUMMARY') return 2;
  const cls = (el.className || '').toString();
  if (/\buppercase\b/.test(cls) && /\bfont-(bold|black|semibold)\b/.test(cls)) return 3;
  return 0;
}

/**
 * Walk a subtree and emit Markdown lines.
 * Leaf-first: an element with no element children contributes its own text,
 * which keeps the tools' deeply-nested <div><span>label</span> value</div>
 * markup from producing one word per line.
 */
function walk(el, out, depth) {
  if (!(el instanceof Element) || skipped(el)) return;

  const style = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return;

  const h = headingLevel(el);
  if (h) {
    const text = clean(el.textContent);
    if (text) out.push('', '#'.repeat(h) + ' ' + text, '');
    return;
  }

  if (el.tagName === 'LI') {
    const text = clean(el.textContent);
    if (text) out.push('- ' + text);
    return;
  }

  const hasElementChildren = Array.from(el.children).some(c => c instanceof Element);
  if (!hasElementChildren) {
    const text = clean(el.textContent);
    if (text) out.push(text);
    return;
  }

  // A container whose own direct text is meaningful (label + value on one
  // line) would otherwise lose the label. Emit it once, then recurse.
  const ownText = clean(Array.from(el.childNodes)
    .filter(n => n.nodeType === 3).map(n => n.textContent).join(' '));
  if (ownText) out.push(ownText);

  for (const child of el.children) walk(child, out, depth + 1);
}

/**
 * Serialise the tool's rendered output.
 * @param {string} title  tool name, used as the document heading
 * @returns {string|null} Markdown, or null if there is nothing worth copying
 */
export function serializeResults(title) {
  if (typeof document === 'undefined') return null;
  // Prefer the results region. Marking it was worth the one attribute per
  // tool: serialising all of <main> dragged in the form's own labels
  // ("Audience 1", "Audience 2"), the empty message box and the pre-result
  // cross-reference, split across lines and out of order. 82 tools carry the
  // marker; the rest fall back to <main>, which is still better than a
  // three-field summary, and to the tool's own text if even that is thin.
  const regions = document.querySelectorAll('[data-copy-results]');
  const roots = regions.length ? Array.from(regions)
                              : [document.querySelector('[data-print-main]')].filter(Boolean);
  if (!roots.length) return null;

  const out = [];
  for (const root of roots) for (const child of root.children) walk(child, out, 0);

  // Collapse the blank lines the heading rule introduces, and drop the
  // duplicate-adjacent lines that nested markup produces.
  const lines = [];
  for (const raw of out) {
    const line = raw === '' ? '' : raw;
    if (line === '' && lines[lines.length - 1] === '') continue;
    if (line !== '' && line === lines[lines.length - 1]) continue;
    lines.push(line);
  }
  while (lines.length && lines[0] === '') lines.shift();
  while (lines.length && lines[lines.length - 1] === '') lines.pop();

  // Nested badge markup produces orphans: a line that is only an emoji, a
  // one-word severity on its own, a label whose value rendered elsewhere.
  // None of them mean anything once the colour and position are gone.
  const EMOJI_ONLY = /^[^\p{L}\p{N}]+$/u;
  const isHeading = l => /^#{1,6}\s/.test(l);
  const tidy = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && EMOJI_ONLY.test(line)) continue;                 // "🔴", "\"\""
    if (/^[^\s].{0,28}:$/.test(line) && !lines[i + 1]) continue; // "Trade-off:" with nothing after
    // A heading with no body — the section rendered empty for this result.
    if (isHeading(line)) {
      let j = i + 1;
      while (j < lines.length && lines[j] === '') j++;
      if (j >= lines.length || isHeading(lines[j])) continue;
    }
    // A bare one-word qualifier belongs to the line above it — but ONLY when
    // that line is itself a label. Without the punctuation test this happily
    // welds the next audience's name onto the end of the previous sentence:
    // "…I have data behind it. (Mom)".
    const prev = tidy[tidy.length - 1];
    if (tidy.length && /^\w[\w-]{0,14}$/.test(line) && prev && !isHeading(prev) && !/[.!?:;"'\u201d\u2019]$/.test(prev)) {
      tidy[tidy.length - 1] += ` (${line})`;
      continue;
    }
    tidy.push(line);
  }
  while (tidy.length && tidy[tidy.length - 1] === '') tidy.pop();
  lines.length = 0;
  lines.push(...tidy);

  // Below this the page is almost certainly still on the input form and the
  // tool's own summary will be better than a transcript of empty labels.
  const words = lines.join(' ').split(/\s+/).length;
  if (words < 40) return null;

  const stamp = new Date().toLocaleDateString(undefined,
    { year: 'numeric', month: 'long', day: 'numeric' });
  return `# ${title}\n_${stamp}_\n\n${lines.join('\n')}`;
}
