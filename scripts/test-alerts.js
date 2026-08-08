#!/usr/bin/env node
/**
 * test-alerts — prove the alert emails actually reach err@deftbrain.com.
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
 *   node scripts/test-alerts.js --guards
 *       Guard logic only. No key, no network, nothing sent.
 *
 *   RESEND_API_KEY=re_xxx node scripts/test-alerts.js --send
 *       Sends ONE real email. This is the real test of #1.
 *       Take the key from Railway → Variables. Paste it into your shell, not
 *       into a file — this script never writes it anywhere and never logs it.
 *
 *   node scripts/test-alerts.js --endpoint http://localhost:3001
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
  console.log('\nGUARDS — render crashes and tool errors (no key, nothing sent)\n');
  process.env.RESEND_API_KEY = 'test-key-never-sent';
  const sent = [];
  const realFetch = global.fetch;
  global.fetch = (_u, o) => { sent.push(JSON.parse(o.body)); return Promise.resolve({ ok: true }); };
  const realErr = console.error;
  let logLines = 0;
  console.error = () => { logLines++; };

  const { reportRenderCrash, reportToolError, classifyError, fingerprintOf, _resetAlertState } =
    require(path.join(__dirname, '..', 'backend', 'lib', 'alerts'));
  const _resetCrashAlertState = _resetAlertState;

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

  // ── tool_error: rate-based, so the rules are different ──
  console.log('');
  process.env.RESEND_API_KEY = 'test-key-never-sent';

  check(classifyError('Server error: 500') === 'server', 'a 500 classifies as server');
  check(classifyError('Load failed') === 'network', '"Load failed" classifies as network');
  check(classifyError('Failed to fetch') === 'network', '"Failed to fetch" classifies as network');
  check(classifyError('Server error: 429 too many requests') === 'limit', 'a 429 classifies as limit');

  _resetCrashAlertState(); sent.length = 0;
  const one = reportToolError({ tool: 'A', message: 'Server error: 500' });
  check(one.reason === 'below-threshold' && sent.length === 0,
    'ONE server error is silent — that is the whole point', `hits ${one.hits}`);
  reportToolError({ tool: 'A', message: 'Server error: 500' });
  const third = reportToolError({ tool: 'A', message: 'Server error: 500' });
  check(third.reason === 'threshold-crossed' && sent.length === 1,
    'the 3rd server error in the window mails once', `hits ${third.hits}`);
  const fourth = reportToolError({ tool: 'A', message: 'Server error: 500' });
  check(fourth.reason === 'cooldown' && sent.length === 1,
    'it does not mail again on every subsequent failure');

  _resetCrashAlertState(); sent.length = 0;
  for (let i = 0; i < 9; i++) reportToolError({ tool: 'B', message: 'Load failed' });
  check(sent.length === 0, 'network errors stay silent below their higher bar', '9 of 10');
  reportToolError({ tool: 'B', message: 'Load failed' });
  check(sent.length === 1, 'the 10th network error mails — that is a latency regression');

  _resetCrashAlertState(); sent.length = 0;
  // Each fingerprint must actually CROSS its threshold, or this asserts nothing:
  // 40 tools with one failure each is 40 fingerprints all sitting below the bar.
  for (let i = 0; i < 40; i++) {
    for (let n = 0; n < 3; n++) reportToolError({ tool: `E${i}`, message: 'Server error: 500' });
  }
  const errorAlerts = sent.length;
  reportRenderCrash({ tool: 'CrashDuringErrorStorm', message: 'Objects are not valid' });
  check(errorAlerts === 5, 'error alerts take exactly half the hourly cap, no more', `${errorAlerts} of 10`);
  check(sent.length === errorAlerts + 1,
    'a render crash still gets through during an error storm');

  delete process.env.RESEND_API_KEY;
  global.fetch = realFetch;
}

// ── 1. The mailer: one real email ───────────────────────────────────────────
async function testSend() {
  console.log('\nMAILER (sends ONE real email)\n');
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('  RESEND_API_KEY is not set in this shell.');
    console.log('  Copy it from Railway → Variables and prefix the command:');
    console.log('    RESEND_API_KEY=re_xxx node scripts/test-alerts.js --send');
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
        'Sent by scripts/test-alerts.js --send.',
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
  const post = (uaLabel, ua, event, props, p) =>
    fetch(`${base}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
      body: JSON.stringify({ event, path: p, props }),
    }).then(r => ({ uaLabel, status: r.status }))
      .catch(e => ({ uaLabel, status: 'ERR', err: e.message }));

  const stamp = Date.now(); // keeps this run's fingerprints distinct from the last
  const a = await post('browser', BROWSER_UA, 'tool_render_error',
    { tool: 'TestTool', message: `synthetic crash ${stamp} at index 1`, where: 'at Results' }, '/TestTool');
  const b = await post('browser', BROWSER_UA, 'tool_render_error',
    { tool: 'TestTool', message: `synthetic crash ${stamp} at index 9`, where: 'at Results' }, '/TestTool');
  const c = await post('bot', 'Googlebot/2.1', 'tool_render_error',
    { tool: 'BotShouldNotAlert', message: `bot crash ${stamp}` }, '/BotShouldNotAlert');

  check(a.status === 204, 'render-crash beacon accepted', `HTTP ${a.status}`);
  check(b.status === 204, 'duplicate beacon accepted (and deduped server-side)', `HTTP ${b.status}`);
  check(c.status === 204, 'bot beacon accepted but excluded before the mailer', `HTTP ${c.status}`);

  // tool_error is rate-based, so one beacon proves nothing — send enough to
  // cross the server threshold, and one lone network error that must NOT alert.
  let lastErr;
  for (let i = 0; i < 3; i++) {
    lastErr = await post('browser', BROWSER_UA, 'tool_error',
      { tool: 'TestTool', message: `Server error: 500 synthetic ${stamp}` }, '/TestTool');
  }
  const lone = await post('browser', BROWSER_UA, 'tool_error',
    { tool: 'LonelyTool', message: 'Load failed' }, '/LonelyTool');
  check(lastErr.status === 204, 'tool_error beacons accepted (3, crossing the server threshold)', `HTTP ${lastErr.status}`);
  check(lone.status === 204, 'a single network error accepted and stays silent', `HTTP ${lone.status}`);

  console.log('\n  Now check the SERVER log:');
  console.log('    • no "[alerts]" line  → sent cleanly (or no key set there)');
  console.log('    • "Resend rejected … HTTP 401/403" → key wrong or sender unverified');
  console.log('  Expected mail from this run: 1 render crash + 1 server-error alert.');
  console.log('  NOT expected: anything for LonelyTool (1 network error is below the bar),');
  console.log('  and nothing at all for BotShouldNotAlert.');
}

(async () => {
  const wantGuards = has('--guards') || (!has('--send') && !has('--endpoint'));
  if (wantGuards) testGuards();
  if (has('--send')) await testSend();
  if (has('--endpoint')) await testEndpoint(String(val('--endpoint', 'http://localhost:3001')).replace(/\/$/, ''));

  console.log(`\n${failures ? `${failures} check(s) FAILED` : 'All checks passed.'}\n`);
  process.exit(failures ? 1 : 0);
})();
