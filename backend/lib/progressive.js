// progressive — show an answer as its parts arrive; check it after it shows.
//
// Speed (2026-10-15, owner: "cut tool response by an order of magnitude").
// A model writes about 50 tokens a second, so a 1,500-token answer takes ~30s
// however it is served, and the number/consistency checks added 5-15s more
// before the visitor saw anything. Two levers, one helper:
//   1. The answer is written as small parts at once; each part is sent the
//      moment it is done, so the first lines show in a few seconds.
//   2. The checks run on the finished draft AFTER it is on screen; the
//      corrected answer follows, with the paths the checks changed, and the
//      page says that details were corrected (never a silent swap).
// One request, one rate-limit count: parts and checks never trust a draft the
// browser sends back.
//
// Wire format (server-sent events, like the streaming routes):
//   data: {"draft": {...}}                 the answer so far (whole object)
//   data: {"checked": {...}, "changed": ["analogies[1].analogy", ...]}
//   data: {"error": "message"}
//   data: {"done": true}
// Browser side: useClaudeAPI().callToolEndpointProgressive.
//
// Usage:
//   await progressive(req, res, {
//     label: 'analogy-engine',
//     parts: [{ run: () => callClaudeWithRetry(...), apply: (draft, out) => {...}, required: true }, ...],
//     ready: draft => Boolean(draft.one_liner),      // enough to show at all
//     complete: draft => Boolean(...),               // a usable whole answer
//     after: async draft => {...},   // optional: needs every part (a summary); sent as a draft
//     check: async draft => { await bothChecks(draft, ...) },  // mutates draft
//   });

const { changedPaths } = require('./bothChecks');

// Timing switch (2026-10-15, owner: keep test costs down). A local timing run
// measures how soon the answer shows, which the checks don't affect — and the
// checks were half of a night's test spend. `x-skip-checks: 1` skips them, on
// a development server only; production ignores the header.
const skipChecks = (req) => req.headers?.['x-skip-checks'] === '1' && process.env.NODE_ENV !== 'production';

async function progressive(req, res, { label, parts, ready = () => true, complete = () => true, check: checkFn = null, after = null, finish = d => d, heartbeat = false }) {
  const check = skipChecks(req) ? null : checkFn;
  const draft = {};
  let open = false;
  const openStream = () => {
    if (open) return;
    // no-transform: compression() would otherwise buffer the frames.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    open = true;
  };
  const send = (frame) => {
    openStream();
    res.write(`data: ${JSON.stringify(frame)}\n\n`);
  };
  const t0 = Date.now();
  let firstAt = 0;
  // heartbeat (2026-10-16): for a route whose first part waits on slow
  // research (Ticket Tackler's web search), open the stream now and send an
  // SSE comment every 10s, which the page ignores, so the connection is not
  // dropped as idle. The cost: an error before any part lands travels as a
  // frame, not as an HTTP status.
  let beat = null;
  if (heartbeat) {
    openStream();
    beat = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* gone */ } }, 10000);
  }
  try {

    // Every part starts now. A part that fails is dropped (logged) unless it is
    // required; the answer is judged by ready/complete, not by the part count.
    let fatal = null;
    await Promise.all(parts.map(async (p, i) => {
      try {
        const out = await p.run();
        if (fatal) return;
        p.apply(draft, out);
        if (ready(draft)) {
          if (!firstAt) firstAt = Date.now();
          send({ draft: finish(draft) });
        }
      } catch (err) {
        console.warn(`[${label}] part ${i + 1}/${parts.length} failed:`, err.message);
        if (p.required && !fatal) fatal = err;
        // A failure can be what makes the answer ready (the last of a set
        // settling — Name Storm's picks wait for every lead), so check again.
        if (!fatal && !firstAt && ready(draft)) {
          firstAt = Date.now();
          send({ draft: finish(draft) });
        }
      }
    }));

    if (fatal || !ready(draft) || !complete(draft)) {
      // Nothing shown yet: an ordinary error status, so the busy middleware can
      // still turn an overload into its 503 + retry. Once frames are out, the
      // error travels as a frame.
      if (!open) throw fatal || new Error('incomplete answer');
      send({ error: 'Something went wrong. Please try again.' });
      return res.end();
    }

    // `after(draft)`: a part that needs all the others (a summary over every
    // name). It adds to the answer, so it goes out as a draft, not as a check.
    if (after) {
      try { await after(draft); send({ draft: finish(draft) }); } catch (err) { console.warn(`[${label}] after-part failed (answer kept as shown):`, err.message); }
    }
    const shownAt = Date.now();
    if (check) {
      const before = JSON.parse(JSON.stringify(draft));
      try { await check(draft); } catch (err) { console.warn(`[${label}] check failed (answer kept as shown):`, err.message); }
      // Compared as the visitor sees them (finish), so bookkeeping a check does
      // to the raw draft never reads as a correction.
      const changed = changedPaths(finish(before), finish(draft));
      send({ checked: finish(draft), changed });
    }
    console.log(`[${label}] progressive: first part ${((firstAt - t0) / 1000).toFixed(1)}s, all parts ${((shownAt - t0) / 1000).toFixed(1)}s, checked ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    send({ done: true });
    res.end();
  } finally {
    if (beat) clearInterval(beat);
  }
}

// answer — one route body for both callers (2026-10-15). A browser that asks
// (`progressive: true`) gets the parts as they land and the check afterwards;
// anything else (saved test cases, older pages, scripts) gets the finished,
// checked answer as one JSON body, exactly as before. Same parts, same check,
// so the two can't drift apart.
async function answer(req, res, opts) {
  if (req.body?.progressive === true) return progressive(req, res, opts);
  const { label, parts, ready = () => true, complete = () => true, after = null, finish = d => d, heartbeat = false } = opts;
  const check = skipChecks(req) ? null : (opts.check || null);
  // heartbeat: the one-JSON caller gets the old keep-alive — headers now, a
  // space every 10s (JSON ignores leading whitespace), the body at the end.
  let beat = null;
  if (heartbeat) {
    res.setHeader('Content-Type', 'application/json');
    res.flushHeaders();
    beat = setInterval(() => { try { res.write(' '); } catch { /* gone */ } }, 10000);
  }
  try {
    const draft = {};
    await Promise.all(parts.map(async (p, i) => {
      try { p.apply(draft, await p.run()); } catch (err) {
        if (p.required) throw err;
        console.warn(`[${label}] part ${i + 1}/${parts.length} failed:`, err.message);
      }
    }));
    if (!ready(draft) || !complete(draft)) throw new Error('incomplete answer');
    if (after) { try { await after(draft); } catch (err) { console.warn(`[${label}] after-part failed:`, err.message); } }
    if (check) { try { await check(draft); } catch (err) { console.warn(`[${label}] check failed:`, err.message); } }
    if (heartbeat) return res.end(JSON.stringify(finish(draft)));
    return res.json(finish(draft));
  } catch (err) {
    if (!heartbeat) throw err;
    console.error(`[${label}]`, err);
    return res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }));
  } finally {
    if (beat) clearInterval(beat);
  }
}

// onlyKeys — the same prompt, cut down to the keys one pass writes
// (2026-10-16). A pass that saw the WHOLE answer template sometimes wrote the
// whole answer anyway, ran into its smaller max_tokens and lost a section
// (Contract Decoder's before_you_sign came back empty). This keeps the
// template's own text for the named top-level keys only, then adds a line
// saying so. The template is the first block that opens with a line "{" and
// closes with a line "}", its keys at two-space indent — the shape every
// route here writes. With no such block the line is simply appended.
function onlyKeys(prompt, keys) {
  const line = `\n\nTHIS PASS writes ONLY these top-level keys: ${keys.join(', ')}. Other passes write the rest at the same time — leave them out, and keep every rule above for the keys you write.`;
  const lines = String(prompt).split('\n');
  const start = lines.findIndex(l => l === '{');
  const end = start < 0 ? -1 : lines.findIndex((l, i) => i > start && l === '}');
  if (start < 0 || end < 0) return prompt + line;
  const body = lines.slice(start + 1, end);
  const pre = [], chunks = [];
  for (const l of body) {
    const m = l.match(/^ {2}"([A-Za-z0-9_]+)":/);
    if (m) chunks.push({ key: m[1], lines: [l] });
    else if (chunks.length) chunks[chunks.length - 1].lines.push(l);
    else pre.push(l);
  }
  const kept = chunks.filter(c => keys.includes(c.key));
  if (!kept.length) return prompt + line;
  const out = kept.flatMap(c => c.lines);
  while (out.length && !out[out.length - 1].trim()) out.pop();
  out[out.length - 1] = out[out.length - 1].replace(/,\s*$/, '');
  return [...lines.slice(0, start + 1), ...pre, ...out, ...lines.slice(end)].join('\n') + line;
}

// keyGroups — split a one-call answer into parts by its top-level keys
// (2026-10-16). run(keys, i) builds and sends one pass, normally with
// onlyKeys(prompt, keys). The first group should be the small one a visitor
// reads first; it is required.
function keyGroups(groups, run) {
  return groups.map((keys, i) => ({
    required: i === 0,
    run: () => run(keys, i),
    apply: takeKeys(keys),
  }));
}

// takeKeys — copy a pass's own keys into the draft, and say so when it wrote
// others (2026-10-16). Extra keys are thrown away, but writing them is where
// the time went: Upsell Shield's first pass wrote all six sections (1,427
// tokens, 28s) because the prompt's numbered instructions described them all.
function takeKeys(keys) {
  return (d, out) => {
    keys.forEach(k => { if (out?.[k] !== undefined) d[k] = out[k]; });
    const extra = out && typeof out === 'object' ? Object.keys(out).filter(k => !keys.includes(k)) : [];
    if (extra.length) console.warn(`[progressive] a pass for ${keys.join(', ')} also wrote ${extra.join(', ')} — trim its prompt`);
  };
}

// planFirst — parts that must agree with one choice (2026-10-16). The plan
// pass writes the choice (a verdict, the change to try) and is shown first;
// the other groups start the moment it lands, all at once, and each is handed
// the plan so it builds on it instead of making its own. runFollow(keys, i,
// plan) builds one pass, normally with onlyKeys and the plan quoted after it.
function planFirst(planKeys, runPlan, groups, runFollow) {
  const plan = runPlan();
  plan.catch(() => {}); // the plan part reports its own failure
  return [
    { required: true, run: () => plan, apply: takeKeys(planKeys) },
    ...groups.map((keys, i) => ({ run: async () => runFollow(keys, i, await plan), apply: takeKeys(keys) })),
  ];
}

// The plan, quoted for a follow-up pass.
// T11 (audit/DEFECT-TYPES.md): "final" — a pass handed finished letters once
// questioned the pronouns they used.
const planNote = (plan, keys) => `\n\nALREADY WRITTEN by another pass — treat it as final. Build on it; never contradict, replace or question its choices (names, pronouns, facts, wording):\n${JSON.stringify(Object.fromEntries(keys.map(k => [k, plan?.[k]])))}`;

module.exports = { progressive, answer, keyGroups, onlyKeys, planFirst, planNote, takeKeys };
