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

async function progressive(req, res, { label, parts, ready = () => true, complete = () => true, check = null, after = null, finish = d => d }) {
  const draft = {};
  let open = false;
  const send = (frame) => {
    if (!open) {
      // no-transform: compression() would otherwise buffer the frames.
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      open = true;
    }
    res.write(`data: ${JSON.stringify(frame)}\n\n`);
  };
  const t0 = Date.now();
  let firstAt = 0;

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
    const changed = changedPaths(before, draft);
    send({ checked: finish(draft), changed });
  }
  console.log(`[${label}] progressive: first part ${((firstAt - t0) / 1000).toFixed(1)}s, all parts ${((shownAt - t0) / 1000).toFixed(1)}s, checked ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  send({ done: true });
  res.end();
}

// answer — one route body for both callers (2026-10-15). A browser that asks
// (`progressive: true`) gets the parts as they land and the check afterwards;
// anything else (saved test cases, older pages, scripts) gets the finished,
// checked answer as one JSON body, exactly as before. Same parts, same check,
// so the two can't drift apart.
async function answer(req, res, opts) {
  if (req.body?.progressive === true) return progressive(req, res, opts);
  const { label, parts, ready = () => true, complete = () => true, check = null, after = null, finish = d => d } = opts;
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
  return res.json(finish(draft));
}

module.exports = { progressive, answer };
