import { useEffect, useRef } from 'react';
import { revealSection } from '../utils/revealSection';

/**
 * Bring a newly-revealed screen to the top of the window when the tool advances.
 *
 * A React re-render keeps whatever scroll position the page already had. So when
 * a tool swaps one screen for another — setup → plan → running → review — the
 * visitor keeps looking at the spot where the *old* screen's button happened to
 * be, which is usually somewhere in the middle of the new one. They have to
 * scroll up to work out what just happened.
 *
 * The fix is not `scrollTo(0)`. The page chrome is sticky and about 97px tall,
 * and the tool's own title is context the visitor read on the way in. What
 * belongs at the top of the window is the top of the screen they just moved to.
 *
 * Offsetting for the sticky header is CSS's job, not arithmetic here: put
 * `scroll-mt-24` (or any `scroll-margin-top`) on the target element and
 * `scrollIntoView` honours it. That way the offset lives next to the layout it
 * depends on instead of drifting out of sync with a magic number.
 *
 * Usage:
 *   const stageRef = useRef(null);
 *   useScrollToSection(stageRef, phase);   // phase changes → scroll
 *   <div ref={stageRef} className="scroll-mt-24"> … </div>
 *
 * The first run is skipped deliberately: landing on a tool should leave you at
 * the top of the page, not jumped into its first card.
 *
 * Two decisions here both come from the same measured fact: a hidden tab
 * freezes every animation frame.
 *
 *   - The scroll is scheduled on a timer, not requestAnimationFrame, because
 *     rAF callbacks in a background tab simply never run.
 *   - The scroll is instant, not smooth, because `behavior: 'smooth'` is itself
 *     animated by the same frame loop. Called in a hidden tab it records as a
 *     scroll and moves the page nowhere — verified, not assumed.
 *
 * That is not a hypothetical. Focus Pocus is a focus timer: the visitor is
 * *expected* to be in another tab when the session ends and the screen advances
 * to the review. A smooth, rAF-scheduled scroll would silently do nothing for
 * exactly the tool that needs it most. Instant is also the honest choice for a
 * screen swap — the content has already been replaced, so animating the
 * journey shows motion that no longer corresponds to anything on screen.
 *
 * @param {React.RefObject<HTMLElement>} ref  container of the screen being shown
 * @param {*} key  changes when the screen changes; `null`/`undefined` never scrolls
 */
export function useScrollToSection(ref, key) {
  const previous = useRef(key);

  useEffect(() => {
    if (previous.current === key) return undefined;
    previous.current = key;
    if (key === null || key === undefined) return undefined;

    const node = ref.current;
    if (!node || typeof node.scrollIntoView !== 'function') return undefined;

    // Yield one task so React has finished committing the swap before we
    // measure — the outgoing screen is still in the DOM during the effect.
    // `scrollIntoView` forces layout when called, so the geometry is correct
    // whether or not a frame has been painted since.
    const id = window.setTimeout(() => {
      // revealSection moves focus first, which is what tells a screen reader
      // the screen changed; the scroll is the visible half. It also resolves
      // the behaviour itself, and a hidden tab is one of the cases it forces
      // to instant — the reason this hook already passed 'auto' by hand.
      // frame: this hook exists for screen changes, which is exactly the case
      // where the top of the tool is the right thing to show.
      revealSection(ref.current, { frame: true });
    }, 0);
    return () => window.clearTimeout(id);
  }, [ref, key]);
}

export default useScrollToSection;
