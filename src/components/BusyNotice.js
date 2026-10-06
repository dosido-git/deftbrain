/**
 * BusyNotice — what a visitor sees when the site is overloaded (2026-10-05).
 *
 * Driven by src/utils/busySignal.js:
 *   waiting — the run was refused as busy and useClaudeAPI is waiting to try
 *             again: "you're in line", so a slow answer reads as a queue, not
 *             as a hang.
 *   failed  — it still could not finish: say so kindly, say their input is
 *             still there, and offer the monthly email, so someone we could
 *             not serve today has a reason to come back.
 *   clear   — a run succeeded: the notice goes away.
 *
 * Styled by public/site-footer.css (.site-end-* and .busy-notice), the same
 * look as the ideas and newsletter boxes. English by design, like the rest of
 * the page chrome (SiteEnd, IdeaPrompt).
 */
import React, { useEffect, useState } from 'react';
import { onBusy } from '../utils/busySignal';

export default function BusyNotice() {
  const [phase, setPhase] = useState(null);
  useEffect(() => onBusy(p => setPhase(p === 'clear' ? null : p)), []);
  if (!phase) return null;

  const toNewsletter = () => {
    const input = document.getElementById('se-email-subscribe');
    if (input) { input.scrollIntoView({ behavior: 'smooth', block: 'center' }); input.focus({ preventScroll: true }); }
    setPhase(null);
  };

  return (
    <div className="busy-notice" role="status" aria-live="polite">
      <div className="site-end site-end-card">
        <div className="site-end-part">
          {phase === 'waiting' ? (
            <p className="site-end-text"><strong>🕐 Lots of people are here right now.</strong> You’re in line, and your answer is on its way. It may just take a little longer than usual.</p>
          ) : (
            <>
              <p className="site-end-text"><strong>We’re swamped right now and couldn’t finish this one.</strong> What you entered is still here. Please try again in a minute.</p>
              <p className="site-end-text">Want a reason to come back? <button type="button" className="busy-notice-link" onClick={toNewsletter}>Get one useful tool a month →</button></p>
            </>
          )}
        </div>
        <button type="button" className="busy-notice-close" aria-label="Close" onClick={() => setPhase(null)}>×</button>
      </div>
    </div>
  );
}
