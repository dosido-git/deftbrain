#!/usr/bin/env node
/**
 * test-crash-alert — prove a render-crash alert actually reaches err@deftbrain.com.
 * ────────────────────────────────────────────────────────────────────────────
 * There are three separate things that can be broken, and they fail in
 * different places, so this tests them separately.
 *
 *   1. THE MAILER          Does Resend accept `alerts@deftbrain.com` as a
 *                          sender? Only `ideas@` is known-good; if the Resend
 *                          domain verification covers deftbrain.com broadly
 *                          this passes, and if it was per-address it 403s.
 *                          THIS IS THE ONE MOST LIKELY TO FAIL.
 *
 *   2. THE GUARDS          Dedupe, cooldown, hourly cap. Needs no key and
 *                          sends nothing — run it any time.
 *
 *   3. THE WIRING          Does a beacon posted to /api/events reach the
 *                          mailer, and do the bot/IP filters still block what
 *                          they should? Needs a running server.
 *
 * USAGE
 *   node scripts/test-crash-alert.js --guards
 *       Guard logic only. No key, no network, nothing sent.
 *
 *   RESEND_API_KEY=re_xxx node scripts/test-crash-alert.js --send
 *       Sends ONE real email. This is the real test of #1.
 *       Take the key from Railway → Variables. Paste it into your shell, not
 *       into a file — this script never writes it anywhere and never logs it.
 *
 *   node scripts/test-crash-alert.js --endpoint http://localhost:3001
 *       Posts synthetic beacons at a running server and checks the wiring.
 *       Add --send-from-server (and set the key on the SERVER) to let that
 *       server actually mail.
 *
 * PRODUCTION GOTCHAS, if you point --endpoint at deftbrain.com:
 *   • curl's default User-Agent matches the bot filter, so the beacon is
 *     dropped before it reaches the mailer. This script sends a browser UA.
 *   • If your own IP is in METRICS_EXCLUDE_IPS (it probably is), your beacons
 *     are excluded no matter what UA you send. Test from a phone on cellular,
 *     or use --send locally instead.
 */

const path = require('path');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i === -1 ? d : argv[i + 1]; };

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.0 Safari/605.1.15';

let failures = 0;
const check = (ok, label, detail) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
  if (!ok) failures++;
};

// ── 2. Guards ───────────────────────────────────────────────────────────────
function testGuards() {
  console.log('\nGUARDS (no key, nothing sent)\n');
  process.env.RESEND_API_KEY = 'test-key-never-sent';
  const sent = [];
  const realFetch = global.fetch;
  global.fetch = (_u, o) => { sent.push(JSON.parse(o.body)); return Promise.resolve({ ok: true }); };
  const realErr = console.error;
  let logLines = 0;
  console.error = () => { logLines++; };

  const { reportRenderCrash, fingerprintOf, _resetCrashAlertState } =
    require(path.join(__dirname, '..', 'backend', 'lib', 'crashAlert'));

  console.error = realErr;
  check(fingerprintOf('X', 'bad at 3') === fingerprintOf('X', 'bad at 47'),
    'varying numbers collapse to one bug');
  check(fingerprintOf('A', 'same') !== fingerprintOf('B', 'same'),
    'the same message in two tools stays two bugs');

  _resetCrashAlertState(); sent.length = 0;
  const first = reportRenderCrash({ tool: 'A', message: 'boom at 1' });
  const dupe = reportRenderCrash({ tool: 'A', message: 'boom at 2' });
  check(first.reason === 'new' && dupe.reason === 'cooldown' && sent.length === 1,
    'first occurrence mails, immediate repeat does not', `${sent.length} email(s) for 2 events`);

  reportRenderCrash({ tool: 'B', message: 'a genuinely different crash' });
  check(sent.length === 2, 'a different bug still gets through');

  _resetCrashAlertState(); sent.length = 0;
  console.error = () => { logLines++; };
  logLines = 0;
  for (let i = 0; i < 200; i++) reportRenderCrash({ tool: `T${i}`, message: `distinct ${i}` });
  console.error = realErr;
  check(sent.length === 10, 'a 200-crash flood is capped', `${sent.length} email(s), cap is 10`);
  check(logLines === 1, 'the cap logs once, not once per suppressed event', `${logLines} line(s)`);

  _resetCrashAlertState(); sent.length = 0;
  delete process.env.RESEND_API_KEY;
  const noKey = reportRenderCrash({ tool: 'Z', message: 'no key' });
  check(noKey.reason === 'no-key' && sent.length === 0, 'no key degrades quietly');

  global.fetch = realFetch;
}

// ── 1. The mailer: one real email ───────────────────────────────────────────
async function testSend() {
  console.log('\nMAILER (sends ONE real email)\n');
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('  RESEND_API_KEY is not set in this shell.');
    console.log('  Copy it from Railway → Variables and prefix the command:');
    console.log('    RESEND_API_KEY=re_xxx node scripts/test-crash-alert.js --send');
    failures++;
    return;
  }
  const from = process.env.ALERT_EMAIL_FROM || 'DeftBrain Alerts <alerts@deftbrain.com>';
  const to = process.env.CRASH_ALERT_TO || 'err@deftbrain.com';
  console.log(`  from: ${from}\n  to:   ${to}\n`);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: '🧪 TEST — render crash alerting works',
      text: [
        'This is a TEST of the render-crash alerting path. No tool actually crashed.',
        '',
        'Sent by scripts/test-crash-alert.js --send.',
        '',
        'If this arrived, the sender is verified and real alerts will reach you.',
        'A real one looks like this:',
        '',
        '  Tool:      MarkupDetective',
        '  Path:      /MarkupDetective',
        '  Message:   Objects are not valid as a React child',
        '  Where:     at Results',
        '  Browser:   Safari/605',
      ].join('\n'),
    }),
  }).catch(err => ({ ok: false, status: 'NETWORK', text: async () => err.message }));

  const body = await res.text().catch(() => '');
  check(res.ok, `Resend accepted the email`, `HTTP ${res.status}`);
  if (!res.ok) {
    console.log(`\n  Response: ${body.slice(0, 300)}`);
    if (String(res.status) === '403' || /domain|verif/i.test(body)) {
      console.log(`\n  → The sender is not verified. Either verify ${from.replace(/.*</, '').replace('>', '')}`);
      console.log(`    in Resend, or set ALERT_EMAIL_FROM to the address ideas@ already uses.`);
    }
  } else {
    console.log(`\n  Sent. Check ${to} — it should arrive within a minute.`);
  }
}

// ── 3. The wiring, against a running server ─────────────────────────────────
async function testEndpoint(base) {
  console.log(`\nWIRING (against ${base})\n`);
  const post = (uaLabel, ua, props, p) =>
    fetch(`${base}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
      body: JSON.stringify({ event: 'tool_render_error', path: p, props }),
    }).then(r => ({ uaLabel, status: r.status }))
      .catch(e => ({ uaLabel, status: 'ERR', err: e.message }));

  const stamp = Date.now(); // keeps this run's fingerprints distinct from the last
  const a = await post('browser', BROWSER_UA,
    { tool: 'TestTool', message: `synthetic crash ${stamp} at index 1`, where: 'at Results' }, '/TestTool');
  const b = await post('browser', BROWSER_UA,
    { tool: 'TestTool', message: `synthetic crash ${stamp} at index 9`, where: 'at Results' }, '/TestTool');
  const c = await post('bot', 'Googlebot/2.1',
    { tool: 'BotShouldNotAlert', message: `bot crash ${stamp}` }, '/BotShouldNotAlert');

  check(a.status === 204, 'beacon accepted', `HTTP ${a.status}`);
  check(b.status === 204, 'duplicate beacon accepted (and deduped server-side)', `HTTP ${b.status}`);
  check(c.status === 204, 'bot beacon accepted but excluded before the mailer', `HTTP ${c.status}`);
  console.log('\n  Now check the SERVER log:');
  console.log('    • no "[crash-alert]" line  → sent cleanly (or no key set there)');
  console.log('    • "Resend rejected … HTTP 401/403" → key wrong or sender unverified');
  console.log(`  And the dashboard: TestTool should show render err = 2, BotShouldNotAlert absent.`);
}

(async () => {
  const wantGuards = has('--guards') || (!has('--send') && !has('--endpoint'));
  if (wantGuards) testGuards();
  if (has('--send')) await testSend();
  if (has('--endpoint')) await testEndpoint(String(val('--endpoint', 'http://localhost:3001')).replace(/\/$/, ''));

  console.log(`\n${failures ? `${failures} check(s) FAILED` : 'All checks passed.'}\n`);
  process.exit(failures ? 1 : 0);
})();
