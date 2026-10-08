const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { setByPath } = require('../lib/factCheck');

// No real names (owner, 2026-10-08). The tool-page example attributed fake
// findings to the Max Planck Institute and a "Copenhagen Institute". A joke
// that cites a real body can be screenshotted and passed on as a finding.
// The prompt now says so; this catches what still slips through and has a
// fast call rename the institution to an invented one.
const REAL_BODY = /\b(?:University of [A-Z][a-z]+|[A-Z][a-z]+ University|Max Planck|Harvard|Stanford|Oxford|Cambridge|MIT\b|Yale|Princeton|Caltech|Sorbonne|Karolinska|Pasteur|Mayo Clinic|Johns Hopkins|NASA|CDC\b|NIH\b|World Health|WHO\b|Smithsonian|Royal Society|CERN|Lancet|Nature journal|New England Journal|Copenhagen Institute|[A-Z][a-z]+ Institute of Technology|ETH Zurich|National Institutes? of|Imperial College)/;
async function renameRealBodies(parsed, userLanguage) {
  const hits = [];
  const walk = (v, path) => {
    if (typeof v === 'string') { if (REAL_BODY.test(v)) hits.push([path, v]); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => k !== 'real_answer_hint' && walk(x, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  if (!hits.length) return;
  try {
    const out = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 1500,
      system: withLanguage('You edit a comedy answer. Replace every real or real-sounding institution, university, journal, agency or famous person with an invented, slightly absurd one (Lower Wobbleton Institute of Applied Napping). Change nothing else. Same language as the text. Return ONLY valid JSON. Never place a double-quote character inside a JSON string value.', userLanguage),
      messages: [{ role: 'user', content: `${hits.map(([, v], i) => `${i}: ${v}`).join('\n')}\n\nReturn {"fixes":[{"n":0,"value":"the full rewritten text"}]}` }],
    }, { label: 'wrong-answers-only-names', maxRetries: 1 });
    for (const f of Array.isArray(out?.fixes) ? out.fixes : []) {
      const hit = hits[Number(f?.n)];
      if (hit && typeof f.value === 'string' && f.value.trim()) setByPath(parsed, hit[0], f.value.trim());
    }
    console.log(`[wrong-answers-only] renamed real bodies in ${hits.length} field(s)`);
  } catch (e) { console.warn('[wrong-answers-only] rename skipped:', e.message); }
}

const PERSONALITY = `World's most confidently wrong expert. Give beautifully structured, internally consistent, completely incorrect answers. The humor is HOW right you sound while being totally wrong — impeccable logic, unshakeable confidence, surgically fabricated facts.

RULES: Every wrong answer must be internally consistent. Use real expert structure (citations, percentages, researcher names, "as research shows..."). Wrongness escalates — start plausible, end absurd. Never offensive. Real answer must not appear anywhere in the response.

NO HEDGING, EVER. This is the one tool on this site where uncertainty is the enemy. No "perhaps", no "might", no "one possibility", no "it is worth noting", no "some researchers believe". You are not speculating; you are stating settled fact that happens to be entirely false. The comedy is the gap between the confidence and the content, and a single qualifier collapses it.

INVENT THE EXPLANATION, NEVER THE INSTRUCTION. Fake mechanisms, fake studies, fake statistics, fake history, fake experts, fake terminology — all of it, without limit, on any safe subject. What you never write is a thing to DO. No instruction to apply anything to a body, ingest anything, hold a position, press on a place, breathe a certain way, or perform any physical procedure, however harmless it sounds in context. It is obviously nonsense here and it is a pattern, and the same pattern with a different question is how somebody gets hurt.
  NO:  press an ice pack to your anterior insula for 12 seconds
  YES: professional athletes reportedly train their anterior insulas to resist synchronisation, a technique known as Competitive Yawn Independence
Equally ridiculous, and nobody puts ice on their head. Describe what the fictional experts believe, discovered or practise; do not tell the reader to do it.

THE ONE THING YOU WILL NOT DO. The premise is authoritative misinformation delivered straight, and it only works where believing it costs nobody anything. If a wrong answer could plausibly get someone hurt — medication and doses, allergies and first aid, electrical or gas work, chemicals that should not be mixed, driving, firearms, what to do in an emergency, whether symptoms need a doctor, anything about a child's safety — do not answer it wrongly. Do not lecture either. Decline in character, in one line, and hand them something better: set decline_reason and leave every other field null.`;

// ════════════════════════════════════════════════════════════
// POST /wrong-answers-only — Confidently incorrect answers
// ════════════════════════════════════════════════════════════
router.post('/wrong-answers-only', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, seriousness, userLanguage } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Ask me anything — I\'ll get it wrong!' });
    }

    const seriousnessMap = {
      deadpan: 'DEADPAN — 100% serious delivery. No winks, no hints you\'re joking. Pure confidence. Academic tone throughout.',
      playful: 'PLAYFUL — Mostly serious but with increasing absurdity. Start believable, end ridiculous. The slide from plausible to insane is the joke.',
      unhinged: 'UNHINGED — Start vaguely plausible, rapidly descend into beautiful nonsense. Conspiracy-theory-uncle-at-Thanksgiving energy but intellectual.'
    };

    const userPrompt = `WRONG ANSWERS ONLY:

QUESTION: "${question.trim()}"

Work out for yourself what field this belongs to and answer as its most confident practitioner — the scientist with the fake study, the historian with the invented treaty, the chef with the impossible temperature, the nature documentary narrator with the made-up Latin. Nobody told you the category and nobody needed to.

TONE: ${seriousnessMap[seriousness] || seriousnessMap.playful}

Return ONLY valid JSON:

{
  "question_rephrased": "Repeat the question back slightly more formally, as if you're taking it very seriously",
  "confident_answer": "Your main wrong answer — 100-200 words of beautifully incorrect explanation delivered with full expert confidence. Include fake specifics (dates, percentages, studies).",
  "supporting_evidence": [
    {
      "fake_fact": "A specific fake supporting detail",
      "fake_source": "A fake source with an invented person and an invented, clearly fictional institution (e.g., 'Dr. Helena Marchetti, Lower Wobbleton Institute of Applied Napping, 2019')",
      "how_wrong": "HIDDEN — How wrong this actually is (for the reveal)"
    }
  ],
  "common_misconception": "What you claim is the 'common misconception' — which is actually the real answer, framed as something only amateurs believe",
  "expert_tip": "A final piece of confidently wrong bonus lore that takes the wrongness to its logical extreme. DESCRIPTIVE, never an instruction - what the fictional experts believe or do, not what the reader should do to themselves.",
  "wrongness_level": 7,
  "real_answer_hint": "A very brief, subtle hint toward the actual truth — for people who want to learn something real after laughing",
  "decline_reason": "null in almost every case. ONLY when a wrong answer could get someone hurt: one line, in character, no lecture, that names something better to ask instead. Every other field null when this is set."
}

RULES:
1. Generate EXACTLY 2-3 supporting_evidence items. Fake sources get specific names and years, but NO REAL NAMES ANYWHERE in the answer: never a real university, institute, journal, agency, museum, company or famous person, and never a real city's university. Invent the institution and make it a little absurd, so the joke cannot travel as a real finding with a real name attached.
2. "wrongness_level" MUST be a bare integer from 1 to 10 (e.g. 7) — no text, no scale description, no quotes.
3. Keep every string field to one tight sentence (confident_answer is the exception: 100-200 words).
4. Never place a double-quote (") character inside any JSON string value — write quoted phrases and fake citations with no inner quote marks, or it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.FAST,
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'wrong-answers-only' });
    // A decline is a valid answer, not a failure — it arrives with every other
    // field null on purpose.
    if (parsed.decline_reason) {
      return res.json({ decline_reason: parsed.decline_reason });
    }
    if (!parsed.confident_answer) {
      return res.status(500).json({ error: 'Could not generate a wrong answer. Please try again.' });
    }
    await renameRealBodies(parsed, userLanguage);
    res.json(parsed);

  } catch (error) {
    console.error('WrongAnswersOnly error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
