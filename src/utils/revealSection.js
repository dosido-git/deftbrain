/**
 * src/utils/revealSection.js
 * ──────────────────────────────────────────────────────────────────────
 * Put a newly-revealed section at the top of the window, and tell people
 * using a screen reader that it happened.
 *
 * WHY THIS EXISTS. 105 tools each wrote their own version of this line:
 *
 *   resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
 *
 * It scrolls, which is the visible half of the job. It does nothing for the
 * other half. A visitor using a screen reader presses the submit button, the
 * results render somewhere below, focus stays on the button they just pressed,
 * and nothing is announced — from where they are sitting the page did not
 * change. Scrolling is a fix for people who are looking at the screen.
 *
 * The accepted answer is to move focus and let the viewport follow. Focus is
 * what makes assistive technology start reading the new content; the scroll is
 * a side effect that sighted visitors get for free. So this does both, in that
 * order, and every tool gets the second half it never had.
 *
 * WHAT IT DOES NOT DO. It does not compute an offset for the sticky header.
 * That is `scroll-margin-top` on the target element — `scroll-mt-24` in
 * Tailwind — which `scrollIntoView` honours natively. Arithmetic here would
 * drift out of sync with the layout the moment the header changed height.
 *
 * TWO THINGS LEARNED THE HARD WAY, both about animation frames:
 *
 *   - `behavior: 'smooth'` is driven by the frame loop, and a hidden tab has
 *     no frame loop. Called there it registers as a scroll and moves the page
 *     nowhere. Any tool a visitor can leave running in a background tab — a
 *     timer, a long generation — needs the instant scroll, so a hidden document
 *     falls back to 'auto'.
 *   - Someone who has asked for less motion has asked for less motion. The
 *     same fallback covers prefers-reduced-motion.
 *
 * FRAME MODE. When a whole screen is replaced — a form becomes a result, a
 * setup becomes a running timer — the visitor has not merely gained content
 * below what they were reading; they have moved. There the useful thing at the
 * top of the window is the top of the tool, header and all, so they can see
 * where they are and reach the controls.
 *
 * When results are merely appended below a form that is still on screen, that
 * is wrong: it would spend a third of a phone screen re-showing a heading and
 * the visitor's own input before the answer they waited for. Measured on Get
 * Noticed at 375x812: framing costs 310px of chrome and 43% of the visible
 * answer.
 *
 * So frame mode scrolls the frame and focuses the content. Those can differ,
 * and here they should: the viewport shows the header, while a screen reader
 * still starts reading at what actually changed instead of re-reading the
 * tagline, the example button and the recap on every submit.
 *
 * @param {HTMLElement|null|undefined} node   the content to reveal and focus
 * @param {{ block?: ScrollLogicalPosition, focus?: boolean, frame?: boolean }} [opts]
 */
export function revealSection(node, opts = {}) {
  if (!node || typeof node.scrollIntoView !== 'function') return;

  const { block = 'start', focus = true, frame = false } = opts;

  let behavior = 'smooth';
  try {
    const stillMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (stillMotion || document.visibilityState === 'hidden') behavior = 'auto';
  } catch (_) {
    // matchMedia missing (jsdom, very old browsers). Smooth is the safe default.
  }

  if (focus) {
    // A results panel is not focusable on its own. tabIndex -1 makes it a focus
    // target without putting it in the tab order, so nobody tabbing through the
    // page has to pass through the container to reach what is inside it.
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
    try {
      // preventScroll because the browser's own jump-to-focus ignores
      // scroll-margin-top; the scrollIntoView below honours it.
      node.focus({ preventScroll: true });
    } catch (_) {
      // Focus can throw on a detached node mid-transition. The scroll still runs.
    }
  }

  // The tool card's own <section> is the frame. Every tool page has one —
  // ToolPageWrapper puts data-print-section on it — and falling back to the
  // node keeps this safe anywhere that is not a tool page.
  let target = node;
  if (frame && typeof node.closest === 'function') {
    const section = node.closest('[data-print-section]');
    // Frame only when the header actually fits. A tool whose header and recap
    // are taller than this would push the answer most of the way off a phone
    // screen, which is the failure the measurement above describes — so past
    // that point the content wins. Costs nothing to check and means no tool
    // has to be classified by hand.
    if (section) {
      try {
        const gap = node.getBoundingClientRect().top - section.getBoundingClientRect().top;
        if (gap <= window.innerHeight * 0.4) target = section;
      } catch (_) {
        target = section;
      }
    }
  }

  target.scrollIntoView({ behavior, block });
}

/**
 * The focus half on its own, for the handful of places that already scroll
 * themselves for reasons worth keeping. VirtualBodyDouble is the example: it
 * computes against the document rather than scrollIntoView because of the
 * scroll containers between it and the root, and it scrolls twice, instantly,
 * because a smooth glide lost a race with scroll anchoring. None of that should
 * be replaced by this file — but it still never told anyone the screen changed.
 */
export function focusSection(node) {
  if (!node || typeof node.focus !== 'function') return;
  if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
  try {
    node.focus({ preventScroll: true });
  } catch (_) {
    // Detached mid-transition. The caller's own scroll still runs.
  }
}

export default revealSection;
