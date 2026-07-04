// POST /api/subscribe — email-capture endpoint.
//
// Forwards to Buttondown's API so the form stays first-party (no embed, no
// third-party script on the page — consistent with the privacy policy). The
// email address goes to Buttondown and nowhere else; we log only the fact
// that a subscription happened (source page), never the address.
//
// Buttondown handles double opt-in (confirmation email) and unsubscribe.
// Requires BUTTONDOWN_API_KEY in the environment; without it the endpoint
// answers 503 so the frontend can show a graceful "not available" state.
const express = require('express');
const router = express.Router();
const { rateLimit } = require('../lib/rateLimiter');

// Deliberately tight: humans subscribe once, bots retry.
const SUBSCRIBE_LIMITS = {
  perMinute: 5,
  perDay: 20,
};

// Pragmatic shape check — Buttondown does the real validation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

router.post('/subscribe', rateLimit(SUBSCRIBE_LIMITS, 'subscribe:'), async (req, res) => {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) return res.status(503).json({ error: 'Subscriptions are not set up yet.' });

  const email = String((req.body && req.body.email) || '').trim().slice(0, 254);
  const source = String((req.body && req.body.source) || '').trim().slice(0, 100);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "That doesn't look like an email address." });
  }

  try {
    const r = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        tags: source ? [source] : [],
      }),
    });

    if (r.status === 201) {
      console.log(`METRIC ${JSON.stringify({ kind: 'event', event: 'subscribe', path: source, at: new Date().toISOString() })}`);
      return res.json({ ok: true });
    }

    const text = await r.text();
    // Buttondown answers 400 for both invalid and already-subscribed —
    // distinguish by message so repeat subscribers get a friendly answer.
    if (r.status === 400 && /already|exists|subscribed/i.test(text)) {
      return res.json({ ok: true, already: true });
    }
    console.error('subscribe: Buttondown rejected:', r.status, text.slice(0, 200));
    return res.status(502).json({ error: "Couldn't subscribe you just now — try again in a minute." });
  } catch (err) {
    console.error('subscribe: request failed:', err.message);
    return res.status(502).json({ error: "Couldn't subscribe you just now — try again in a minute." });
  }
});

module.exports = router;
