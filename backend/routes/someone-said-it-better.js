const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext, cleanJsonResponse } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { quoteResearch, quoteResearchState } = require('../lib/quoteResearch');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

router.outputStandard = 'v2';
// validateResult() below IS the check this declares — it enforces every one
// of these against the model's picks before a response ever reaches the
// visitor, by construction (a quote_id it can't map to the verified packet,
// or an unrecognized role, is dropped rather than passed through).
router.outputGuard = {
  prohibit: [
    'quote_id_not_present_in_verified_packet',
    'quotation_text_or_attribution_altered_from_the_verified_packet',
    'unrecognized_role_label_passed_through_unmapped',
    'duplicate_quote_id_returned_as_a_second_distinct_pick',
    'fewer_than_two_verified_picks_returned_as_a_success_response',
  ],
  require: ['fulfills_tool_promise'],
};

const VOICES = new Set(['wise', 'reassuring', 'bracing', 'witty', 'unexpected', 'any']);
const NEEDS = new Set(['perspective', 'courage', 'comfort', 'motivation', 'reality_check', 'humor', 'surprise_me']);
const compact = (s, n = 1200) => String(s || '').trim().replace(/\s+/g, ' ').slice(0, n);

function validateResult(result, packet) {
  if (!result || typeof result !== 'object') return null;
  const byId = new Map(packet.quotes.map(q => [q.id, q]));
  const picks = (Array.isArray(result.picks) ? result.picks : []).slice(0, 3).map(p => {
    const q = byId.get(String(p?.quote_id || '').toUpperCase());
    if (!q) return null;
    return {
      quote_id: q.id,
      role: ['different_way', 'another_angle', 'one_to_keep'].includes(p?.role) ? p.role : 'another_angle',
      why_this_one: compact(p?.why_this_one, 650),
      quote: q,
    };
  }).filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const p of picks) if (!seen.has(p.quote_id)) { seen.add(p.quote_id); unique.push(p); }
  if (unique.length < 2) return null;
  return {
    situation_as_understood: compact(result.situation_as_understood, 500),
    // Short label for a Recent Finds list entry ("Retirement and what comes
    // next") — distinct from situation_as_understood, which is a full sentence.
    situation_label: compact(result.situation_label, 60) || compact(result.situation_as_understood, 60),
    picks: unique,
  };
}

// Polling-friendly limit for the readiness endpoint: a poll costs nothing (no
// model call, no web search of its own) so it gets its own key prefix and a
// generous budget — two tabs, or a shared office IP, must not fail each
// other while one cold search is in flight. Same numbers as Signal vs.
// Noise's research-poll limit.
const RESEARCH_POLL_LIMITS = { perMinute: 40, perDay: 1200 };

// ── Phase 1: research readiness ─────────────────────────────────────────
// Returns immediately. On a cold situation the first call STARTS the
// research fetch (groundedFacts dedupes concurrent starts) and reports
// `pending`; the client polls until `ready`. Nothing here is a tool result —
// no model call beyond the search itself, no cost to the visitor if they
// never reach phase 2. Without this, the main endpoint's synchronous cold
// wait (45s) was shorter than a cold search regularly takes (~60-90s),
// so a visitor's FIRST search for a new situation would routinely 503 even
// though the research was seconds from landing — this is that fix, not a
// deeper search on its own (see the MAX_USES/token bump above for that half).
router.post('/someone-said-it-better/research', rateLimit(RESEARCH_POLL_LIMITS, 'ssib-research:'), async (req, res) => {
  try {
    const situation = compact(req.body.situation, 2200);
    if (!situation) return res.status(400).json({ error: 'Tell me what is going on.' });
    const voice = VOICES.has(req.body.voice) ? req.body.voice : 'any';
    const research = await quoteResearch({ situation, voice, force: req.body.force === true, coldWaitMs: 0 });
    if (!research.packet) {
      // A failed fetch is negative-cached for a few minutes; without this the
      // client would poll "pending" for its whole budget and only then learn
      // there was nothing coming. 200, not an error status — the poll itself
      // succeeded; it is the research that did not.
      const state = quoteResearchState({ situation, voice });
      if (state === 'failed') return res.json({ status: 'failed', code: 'quote_research_unavailable' });
      return res.status(202).json({ status: 'pending' });
    }
    res.json({ status: 'ready', researched_at: research.packet.researched_at, quote_count: research.packet.quotes.length });
  } catch (err) {
    console.error('someone-said-it-better/research:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/someone-said-it-better', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const situation = compact(req.body.situation, 2200);
    if (!situation) return res.status(400).json({ error: 'Tell me what is going on.' });
    const voice = VOICES.has(req.body.voice) ? req.body.voice : 'any';
    const need = NEEDS.has(req.body.need) ? req.body.need : 'perspective';
    // "Find different words for this" replays the same situation but wants a
    // genuinely fresh research pass, not the cached candidate set re-served.
    // The readiness endpoint above has normally already forced the refetch by
    // the time this call arrives; passing it here too keeps a direct caller
    // (one that skips phase 1) honest.
    const force = req.body.force === true;

    const research = await quoteResearch({ situation, voice, force });
    if (!research.packet) return res.status(503).json({
      error: 'The source check did not finish in time. Try again in a moment — the research is usually ready by then.',
      code: 'quote_research_unavailable',
    });

    // Optional: quote text already shown for this situation ("Find different
    // words for this"). Best-effort steer away from repeats; never blocks a
    // response if the fresh packet doesn't have enough distinct alternatives.
    const previousQuotes = Array.isArray(req.body.previousQuotes)
      ? req.body.previousQuotes.map(t => compact(t, 360)).filter(Boolean).slice(0, 10)
      : [];

    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const system = `You are the matching and explanation stage for Someone Said It Better, a DeftBrain tool. The quotations have already been retrieved and verified. Your job is ONLY to choose the 2-3 that best fit the visitor's supplied situation and explain the connection.

RULES:
- Never create, alter, complete, translate, or paraphrase quotation text or attribution.
- Never infer the visitor's feelings, motives, diagnosis, relationships, history, or hidden circumstances.
- Connect each quote only to facts the visitor actually supplied.
- Choose quotes that offer meaningfully different angles. Do not return three versions of the same lesson.
- Do not force optimism. A bracing, witty, skeptical, or unresolved thought may be the best fit.
- Keep each explanation to 1-2 useful sentences. No generic inspirational filler.
- The explanation may interpret the idea in the quote, but must not invent historical context beyond the packet.
- Return ONLY valid JSON.

${NO_QUOTE_RULE}`;

    const avoidBlock = previousQuotes.length
      ? `\n\nALREADY SHOWN FOR THIS SITUATION (the visitor asked for different words — prefer other quote_ids from the packet where a good fit exists; only repeat one of these if nothing else in the packet fits):\n${previousQuotes.map(t => `- "${t}"`).join('\n')}`
      : '';

    const prompt = `VISITOR'S SITUATION:\n${situation}\n\nWHAT WOULD HELP: ${need}\nDESIRED VOICE: ${voice}\n${research.block}${avoidBlock}\n\nChoose the best 2-3 quotes. Use each quote_id at most once.\n\nReturn ONLY:\n{\n  "situation_as_understood": "one concise sentence grounded only in what the visitor said",\n  "situation_label": "a short 3-6 word label for this situation, for a history list entry (e.g. \\"Retirement and what comes next\\", \\"A difficult decision\\") — describe the situation itself, never the visitor",\n  "picks": [\n    {\n      "quote_id": "Q1",\n      "role": "different_way | another_angle | one_to_keep",\n      "why_this_one": "1-2 sentences connecting the quote to the supplied situation without inventing facts"\n    }\n  ]\n}`;

    const raw = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1800,
      system: withLanguage(system, req.body.userLanguage) + locale,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'someone-said-it-better:match' });
    const parsed = typeof raw === 'string' ? JSON.parse(cleanJsonResponse(raw)) : raw;
    const result = validateResult(parsed, research.packet);
    if (!result) return res.status(502).json({ error: 'The verified quotes could not be matched cleanly. Please try again.' });
    res.json({ ...result, researched_at: research.packet.researched_at });
  } catch (err) {
    console.error('someone-said-it-better:', err);
    res.status(500).json({ error: 'Something went wrong while finding the words.' });
  }
});

module.exports = router;
