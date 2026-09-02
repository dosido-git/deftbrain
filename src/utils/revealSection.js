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
 * @param {HTMLElement|null|undefined} node   the section to reveal
 * @param {{ block?: ScrollLogicalPosition, focus?: boolean }} [opts]
 */
export function revealSection(node, opts = {}) {
  if (!node || typeof node.scrollIntoView !== 'function') return;

  const { block = 'start', focus = true } = opts;

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

  node.scrollIntoView({ behavior, block });
}

export default revealSection;
