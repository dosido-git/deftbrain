/**
 * LetterDoc — a letter shown and printed as a letter (2026-10-25).
 *
 * Owner's review: the printed letters collapsed addresses, paragraphs and
 * numbered requests into one dense block, and split across pages. Here a
 * letter keeps its own line breaks, sits on a plain page in one document
 * style, never splits on paper, and can be printed on its own.
 *
 *   <LetterDoc text={letter} title="Debt validation letter" note="Send by certified mail." />
 *
 * `note` is how to send it — kept outside the letter on purpose.
 */
import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../i18n/useTranslation';
import { PRINT_HEADER_LOGO, PRINT_FOOTER_BRAND } from '../utils/printBranding';

// Text that is a letter rather than a line to say: it has its own lines, or
// is long enough to be one.
export const isLetter = (text) => typeof text === 'string' && (/\n/.test(text.trim()) || text.length > 400);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function printLetter(title, text) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || 'Letter')}</title>
<style>body{font-family:Georgia,'Times New Roman',serif;font-variant-ligatures:none;color:#111;margin:40px;max-width:680px}
.letter{white-space:pre-line;font-size:14px;line-height:1.6;margin:28px 0}@page{margin:18mm}</style></head>
<body>${PRINT_HEADER_LOGO}<div class="letter">${esc(text)}</div>${PRINT_FOOTER_BRAND}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 300);
}

export default function LetterDoc({ text, title, note }) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  if (!text) return null;
  return (
    <div className="space-y-1.5">
      {note && <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-stone-600'}`}>{note}</p>}
      {/* No joined letters (fi, ff): copied from a PDF they came out as
          'veriHcation' and 'ocer' (Firefox, 2026-10-26). */}
      <div data-letter="" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', fontFamily: "'Source Serif 4', Georgia, serif", fontVariantLigatures: 'none', orphans: 4, widows: 4 }}
        className={`rounded-lg border px-5 py-4 text-[13px] leading-relaxed whitespace-pre-line ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-stone-200 text-stone-900'}`}>
        {text}
      </div>
      <button data-print-hide type="button" onClick={() => printLetter(title, text)}
        className={`text-xs font-semibold underline underline-offset-2 ${isDark ? 'text-zinc-300' : 'text-stone-600'}`}>
        🖨️ {t('print_letter')}
      </button>
    </div>
  );
}
