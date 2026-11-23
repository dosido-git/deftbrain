/**
 * SiteEnd — the band every page ends with, just above the footer (2026-10-04):
 * the ideas box on the left, the newsletter on the right, stacked on a phone.
 * Replaces EmailCapture (newsletter only) on the React pages; the static pages
 * render the same markup from getSiteEndHTML() in src/seo/chrome.js. Styled
 * only by public/site-footer.css. Keep the copy here and there identical.
 *
 * Ideas POST to /api/idea (backend/routes/metrics.js); the newsletter POSTs
 * to /api/subscribe, which forwards to Buttondown (double opt-in).
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PARTNERS from '../data/partners.json';

const FAILED = 'Something went wrong — try again.';
// How long "Got it — thank you" shows before the ideas box comes back.
const IDEA_RESET_MS = 6000;

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok && d.ok !== false, d };
}

function Part({ kicker, intro, label, placeholder, type, button, onSend, autoComplete, maxLength, resetAfter }) {
  const [value, setValue] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done
  const [msg, setMsg] = useState('');
  // resetAfter (ms): bring the empty box back so another one can be sent.
  useEffect(() => {
    if (state !== 'done' || !resetAfter) return undefined;
    const t = setTimeout(() => { setValue(''); setMsg(''); setState('idle'); }, resetAfter);
    return () => clearTimeout(t);
  }, [state, resetAfter]);
  const submit = async (e) => {
    e.preventDefault();
    if (state === 'sending' || !value.trim()) return;
    setState('sending');
    setMsg('');
    try {
      const done = await onSend(value.trim());
      setState('done');
      setMsg(done);
    } catch (err) {
      setState('idle');
      setMsg(err.message || FAILED);
    }
  };
  const id = `se-${type}-${button.toLowerCase()}`;
  return (
    <div className="site-end-part">
      <p className="site-end-kicker">{kicker}</p>
      <p className="site-end-text">{intro}</p>
      {state !== 'done' && (
        <form className="site-end-form" onSubmit={submit}>
          <label className="sr-only-se" htmlFor={id}>{label}</label>
          <input id={id} type={type} required value={value} onChange={e => setValue(e.target.value)}
            placeholder={placeholder} autoComplete={autoComplete} maxLength={maxLength} />
          <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : button}</button>
        </form>
      )}
      <p className="site-end-msg" role="status">{msg}</p>
    </div>
  );
}

export default function SiteEnd() {
  // Partner pages (/for/<id>) show each form only if that partner opted in
  // (partners.json `suggestions` / `newsletter`), labelled as DeftBrain's.
  const { pathname } = useLocation();
  const partnerId = (pathname.match(/^\/for\/([^/]+)/) || [])[1];
  const partner = partnerId && Object.prototype.hasOwnProperty.call(PARTNERS, partnerId) ? PARTNERS[partnerId] : null;
  const onPartnerPage = partnerId !== undefined;
  const showIdeas = !onPartnerPage || !!partner?.suggestions;
  const showNews = !onPartnerPage || !!partner?.newsletter;
  const sendIdea = async (problem) => {
    const { ok } = await post('/api/idea', { problem, source: partner ? 'partner-page' : 'site-end', path: window.location.pathname });
    if (!ok) throw new Error(FAILED);
    return '🙏 Got it — thank you.';
  };
  const subscribe = async (email) => {
    const { ok, d } = await post('/api/subscribe', { email, source: window.location.pathname });
    if (!ok) throw new Error(d.error || FAILED);
    return d.already
      ? 'You’re already on the list. Bruce admires the enthusiasm.'
      : 'Check your inbox — confirm the email and you’re in.';
  };
  if (!showIdeas && !showNews) return null;
  return (
    // data-site-tail: omitted from a tool's printed handout only (printStyles).
    <section className="site-end" aria-label="Ideas and newsletter" data-site-tail>
      <div className="site-end-inner">
        {showIdeas && <Part
          kicker="💡 Missing something?"
          intro={partner
            ? <><strong>Didn’t find what you need?</strong> Tell the DeftBrain team. This goes to DeftBrain, not {partner.name}. Please leave out names and account details.</>
            : <><strong>Didn’t find what you need?</strong> Suggest a tool. We read every suggestion, and the best become new tools.</>}
          label="What are you trying to deal with?" placeholder="What are you trying to deal with?"
          type="text" button="Send" maxLength={1000} onSend={sendIdea} resetAfter={IDEA_RESET_MS}
        />}
        {showNews && <Part
          kicker="📮 Newsletter"
          intro={partner
            ? <><strong>DeftBrain’s own newsletter</strong>, one useful tool a month. {partner.name} won’t see your email.</>
            : <><strong>One useful tool a month</strong> — the one worth knowing about before life demands it.</>}
          label="Email address" placeholder="you@anywhere.com"
          type="email" button="Subscribe" autoComplete="email" onSend={subscribe}
        />}
      </div>
    </section>
  );
}
