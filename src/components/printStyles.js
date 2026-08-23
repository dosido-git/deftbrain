/**
 * The one print stylesheet.
 *
 * Two things print a tool page: the browser's own Cmd+P, and the DeftBrain
 * Print button. Both render the LIVE DOM, so both need exactly these rules —
 * and for a while both carried their own copy. The Print button's copy stopped
 * at the white-background rules, missing the entire dark-mode-to-paper mapping
 * added later, so the two disagreed about what a printed page looks like. A
 * stylesheet with two authors drifts silently, because the second copy only
 * runs on the path nobody tests.
 *
 * Injected once, keyed by id, by whichever mounts first.
 */
export const PRINT_STYLE_ID = 'db-wrapper-print-css';

export const PRINT_CSS = `
      [data-print-show-flex] { display: none; }
      /* Print-only blocks: hidden on screen via Tailwind, shown on paper. */
      @media print {
        /* Hide chrome */
        [data-print-hide] { display: none !important; }
        /* Buttons print as outlines, not as white text on nothing.
           Browsers drop background fills on paper unless asked otherwise, and
           every primary action in the product is white text on a coloured
           fill — so on paper the fill disappeared and the label went with it.
           A printed Cold Open Craft form had no submit button at all, and the
           same was true of every tool: the control was there, in white, on
           white. Forcing the fill instead (print-color-adjust: exact) would
           fix the contrast by spending a block of someone's ink, so these
           become outlined buttons, which read correctly in both themes. */
        /* button[class] rather than button: several tools set their idle state
           with Tailwind's !important escape (!text-cyan-300), and a class with
           !important beats an element selector with !important. The attribute
           selector adds the specificity needed to win, without reaching for
           anything uglier. */
        button[class], [role="button"][class], button, [role="button"] {
          background: transparent !important;
          background-image: none !important;
          color: #111 !important;
          border: 1px solid #999 !important;
          box-shadow: none !important;
        }
        /* The keyboard-shortcut chip is screen affordance — it tells you to
           press Cmd+Enter, which paper cannot offer. */
        button kbd { display: none !important; }
        /* Show print-only branding */
        [data-print-show-flex] { display: flex !important; }
        [data-print-show] { display: block !important; }
        /* Collapse sidebar grid to single column */
        [data-print-grid] { display: block !important; }
        [data-print-main] { grid-column: 1 / -1 !important; max-width: 100% !important; }
        /* White page background — works for both light and dark mode */
        html, body { background: white !important; background-color: white !important; }
        /* The outer wrapper (min-h-screen bg-zinc-900 in dark mode) */
        [data-print-wrapper] { background: white !important; background-color: white !important; }
        /* THE KEY FIX: the tool card section and its immediate child (the p-8 gradient div).
           In dark mode these are bg-zinc-800 / transparent-over-zinc-800.
           Setting them white removes the black gaps between content cards. */
        [data-print-section],
        [data-print-section] > div {
          background: white !important;
          background-color: white !important;
          overflow: visible !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        /* ...and once that inner div has no border, no background and no
           radius, it is an invisible box — but it still carries the m-8 p-6 it
           needs on screen to sit inside the card. On paper that is 56px of
           inset on every side, indenting the content away from an edge nobody
           can see. Vertically it is 112px of the page spent twice over; the
           real cost is horizontal, because 112px of lost column width rewraps
           every paragraph and makes the whole document taller. The page margin
           is the margin on paper. */
        [data-print-section] > div { margin: 0 !important; padding: 0 !important; }
        /* A pane that scrolls on screen is a crop on paper. Paper cannot
           scroll, so overflow:auto prints the visible slice and drops the rest
           without a trace — a Virtual Body Double session log is a 360px
           window onto a conversation that is usually much longer, and the
           print ended after the third message.

           Releasing overflow is only half of it: the box keeps its height, so
           the freed content paints outside its own borders and lands on top of
           whatever follows. Both have to go together.

           Scoped to boxes that actually clip. An element with a max-height and
           no overflow rule does not hide anything — its content already spills
           and already prints — so it is left alone. The [style*="overflow"]
           half is not redundant: the session log sets its height and overflow
           inline, and a CSS !important is the only thing that outranks an
           inline style. 37 tools have at least one of these. */
        [data-print-section] [style*="overflow"],
        [data-print-section] [class*="overflow-"] {
          overflow: visible !important;
          max-height: none !important;
        }
        /* This used to read [data-print-main] > header, aimed at Firefox
           breaking between the title and the tool card. It matched nothing —
           on every tool page the header element is a SIBLING of
           [data-print-main],
           and carries data-print-hide, so it is not even on the paper. What
           prints above the card is the [data-print-show-flex] block below.
           A dead selector fixed nothing, which is why the break came back. */
        /* A tall card that cannot be fragmented does not shrink — the engine
           moves it whole to the next page and overflows from there, leaving
           the rest of the current page empty. WebKit does this readily, and
           it is why an Apology Calibrator printout opened with two-thirds of
           page one blank; Firefox does it to Procedure Probe, whose form is
           one 875px card. The old rule reached the card's descendants but not
           the card itself, so the outermost — and only unfragmentable —
           element was the one element it missed. Nothing here sets
           break-inside: avoid, so this only overrides what the engine decides
           on its own. */
        [data-print-main],
        [data-print-section],
        [data-print-section] div { break-inside: auto !important; page-break-inside: auto !important; }
        /* Interactive controls mean nothing on paper. */
        /* ...except the one the form exists to reach. A disabled dead control is
           noise on paper; a disabled primary CTA is what tells a reader where the
           page was going, and hiding it made a printed form look like it led
           nowhere. Opt out with data-print-keep. */
        [data-print-section] button:disabled:not([data-print-keep]) { display: none !important; }
        /* The branding line is 29px tall and lives at the very end of the
           document, which is exactly the position an engine will drop when the
           last page break lands on top of it. Keeping it whole, and off the
           boundary, costs nothing and removes the failure mode. */
        [data-print-show-flex] {
          break-inside: avoid !important; page-break-inside: avoid !important;
          break-before: avoid !important; page-break-before: avoid !important;
        }
        /* ── Dark mode must not survive onto paper ──────────────────────────
           The DeftBrain Print button builds its own light document, so it has
           always come out readable. Cmd+P prints the live DOM, and the rules
           above only whitened [data-print-section] and its immediate child —
           so every card INSIDE it kept bg-zinc-800 while its text stayed light,
           and any pale-tinted card (the hero, the anniversary box, "Make it
           even better") composited over white and turned light-on-light,
           i.e. invisible. Compare the two PDFs from 2026-08-08.

           This cannot be solved by flipping a theme token: dark mode here is
           chosen in JavaScript -- isDark ? 'bg-zinc-800' : 'bg-white' -- so the
           class names are already baked into the markup by the time CSS runs.
           The surface is small and enumerable, so map it directly. */
        [data-print-section] .bg-zinc-600,
        [data-print-section] .bg-zinc-700,
        [data-print-section] .bg-zinc-800,
        [data-print-section] .bg-zinc-900,
        [data-print-section] [class*="bg-zinc-700/"],
        [data-print-section] [class*="bg-zinc-800/"] {
          background-color: #ffffff !important;
          background-image: none !important;
        }
        /* Light-on-dark text, now on white. Zinc 100–400 all become ink; 500+
           is already mid-grey and stays legible as secondary text. */
        [data-print-section] .text-white,
        [data-print-section] .text-zinc-50,
        [data-print-section] .text-zinc-100,
        [data-print-section] .text-zinc-200,
        [data-print-section] .text-zinc-300 { color: #18181b !important; }
        [data-print-section] .text-zinc-400 { color: #52525b !important; }
        /* ...except where white text is still correct: a saturated badge or
           pill that keeps its fill on paper would get dark text on a dark
           background. Only zinc backgrounds were whitened above, so anything
           carrying a non-zinc bg- class is exempt. Must follow the rule it
           overrides.

           BUTTONS ARE NOT EXEMPT, and this pairing is what made the submit
           button invisible on paper. The rule above turns a button's fill
           transparent; this one was still painting its label white, for a fill
           that is no longer there. It was broken before that too: nothing in
           this stylesheet sets print-color-adjust, so browsers were already
           dropping the fill by default while this rule kept the label white.
           White on white, on every tool, for as long as both rules have
           existed. */
        [data-print-section] [class*="bg-"]:not([class*="bg-zinc"]):not([class*="bg-white"]).text-white:not(button):not([role="button"]) {
          color: #ffffff !important;
        }
        /* Accent text picked for a dark card. On white these land at 1.7–2.8:1
           (cyan-400 on white is 1.81). The Print button's document already uses
           the light-mode shades, so map each to its 700 counterpart to match. */
        [data-print-section] .text-amber-300,
        [data-print-section] .text-amber-400 { color: #b45309 !important; }
        [data-print-section] .text-cyan-300,
        [data-print-section] .text-cyan-400 { color: #0e7490 !important; }
        [data-print-section] .text-emerald-300,
        [data-print-section] .text-emerald-400 { color: #047857 !important; }
        [data-print-section] .text-fuchsia-300,
        [data-print-section] .text-fuchsia-400 { color: #a21caf !important; }
        [data-print-section] .text-green-300,
        [data-print-section] .text-green-400 { color: #15803d !important; }
        [data-print-section] .text-lime-300,
        [data-print-section] .text-lime-400 { color: #4d7c0f !important; }
        [data-print-section] .text-orange-300,
        [data-print-section] .text-orange-400 { color: #c2410c !important; }
        [data-print-section] .text-red-300,
        [data-print-section] .text-red-400 { color: #b91c1c !important; }
        [data-print-section] .text-sky-300,
        [data-print-section] .text-sky-400 { color: #0369a1 !important; }
        [data-print-section] .text-yellow-300,
        [data-print-section] .text-yellow-400 { color: #a16207 !important; }
        /* Borders drawn for a dark ground disappear on white. */
        [data-print-section] .border-zinc-600,
        [data-print-section] .border-zinc-700,
        [data-print-section] .border-zinc-800 { border-color: #d4d4d8 !important; }
        /* Tinted cards (hero, budget, callouts) keep their colour — the Print
           button's output keeps them too, and matching it is the goal. Their
           TEXT is the part that breaks, and the rules above already fix it. */

        /* Suppress transitions during print capture */
        * { transition: none !important; animation: none !important; }
      }
    `;

export function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = PRINT_STYLE_ID;
  el.textContent = PRINT_CSS;
  document.head.appendChild(el);
}
