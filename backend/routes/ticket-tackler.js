// ticket-tackler.js — Ticket Tackler: build your parking/camera-ticket appeal.
// Positioning (deliberate): a writing + evidence tool that helps the user draft
// their own appeal — never an "AI lawyer", never an outcome promise.
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted ticket text, signage wording, or things-to-say must be written plainly or with single quotes, or it breaks the JSON.';

const TYPE_LABELS = {
  parking: 'parking ticket',
  camera:  'automated camera ticket (red-light or speed camera)',
};

// Grounded facts PRE-PASS (shared lib/groundedFacts.js pattern + cache):
// appeal deadlines and filing procedures are hyper-local and volatile — the
// textbook invented-procedure risk. Verified or generic, never invented.
async function groundAppealFacts({ city, ticketType }) {
  return groundedFacts({
    cacheKey: `ticket-appeal:${normalizeKeyPart(city)}:${normalizeKeyPart(ticketType)}`,
    label: 'ticket-tackler-facts',
    userPrompt: `Verify with web_search, as of today, how a ${TYPE_LABELS[ticketType] || 'parking ticket'} is contested in: ${city}.

Cover ONLY: (1) the official appeal/contest deadline, (2) the official filing method(s) (portal name/URL, mail address, or in-person — only if verifiable on an official government source), (3) the stages of review available (e.g. initial review, hearing, appeal), (4) any grounds for dismissal the authority itself lists. Skip anything you cannot verify from an official or clearly authoritative source.

Return ONLY valid JSON:
{ "jurisdiction": "City/authority these rules apply to", "verified": [{ "topic": "deadline | filing | stages | grounds", "rule": "The current rule in one sentence", "source": "Domain of the official source verified against" }] }`,
    render: (cleanFacts) => {
      if (Array.isArray(cleanFacts.verified) && cleanFacts.verified.length) {
        return `\n\nVERIFIED APPEAL PROCESS (web-checked today for ${cleanFacts.jurisdiction || city}) — these facts OVERRIDE your training knowledge; use them verbatim:\n` +
          cleanFacts.verified.map(f => `- [${f.topic}] ${f.rule} (source: ${f.source})`).join('\n');
      }
      return '';
    },
  });
}

router.post('/ticket-tackler', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      ticketType, ticketText, ticketImageBase64, imageMediaType,
      city, whatHappened, fineAmount, deadline,
      userLanguage, userLocale, userCurrency, userRegion,
    } = req.body;

    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City or jurisdiction is required' });
    }
    if (!ticketText?.trim() && !ticketImageBase64 && !whatHappened?.trim()) {
      return res.status(400).json({ error: 'Paste the ticket, upload a photo, or describe what happened' });
    }

    const typeLabel = TYPE_LABELS[ticketType] || TYPE_LABELS.parking;

    const imageBlocks = [];
    if (ticketImageBase64) {
      const commaIndex = ticketImageBase64.indexOf(',');
      const rawBase64 = commaIndex !== -1 ? ticketImageBase64.substring(commaIndex + 1) : ticketImageBase64;
      imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: imageMediaType || 'image/jpeg', data: rawBase64 } });
      imageBlocks.push({ type: 'text', text: 'The image above is the ticket/citation. Read every field on it (violation code, date, time, location, amount, deadline) and use those details.' });
    }

    const verifiedBlock = await groundAppealFacts({ city: city.trim(), ticketType });

    const sharedContext = `TICKET TYPE: ${typeLabel}
CITY / JURISDICTION: ${city.trim()}
${fineAmount ? `FINE AMOUNT (as entered by the user): ${String(fineAmount).slice(0, 40)}` : ''}
${deadline ? `APPEAL DEADLINE (as entered by the user): ${String(deadline).slice(0, 60)}` : ''}
${ticketText?.trim() ? `\nTICKET TEXT (pasted):\n${ticketText.trim().slice(0, 6000)}` : ''}
${whatHappened?.trim() ? `\nWHAT HAPPENED (the user's account):\n${whatHappened.trim().slice(0, 4000)}` : ''}
${imageBlocks.length ? '\nThe ticket was also provided as a photo above.' : ''}
${verifiedBlock}

SHARED RULES:
- You help the user WRITE THEIR OWN appeal. Never promise or predict an outcome ("you will win"); frame strengths honestly. If the case is weak, say so plainly — recommending paying is a valid, respectful answer.
- PROCESS FACTS: when a VERIFIED APPEAL PROCESS block is present above, use its deadlines/methods verbatim. For anything NOT covered by it, NEVER invent a portal name, URL, address, phone number, or deadline — describe generically how to find the official channel (e.g. the payment/appeal address printed on the ticket itself, or the city authority's official website).
- Engage the user's SPECIFIC details (signage, timing, dates, the exact wording on the ticket) — no generic advice that fits any ticket.
- Cite a specific statute/ordinance section number ONLY when certain it is exactly right; otherwise describe the rule without a section number — a correct principle beats a slightly-wrong citation.
- Keep every string field to ONE concise sentence unless the schema says otherwise. Never restate the same point across fields. A focused, fully-closed response beats a long truncated one.
- ${NO_QUOTE_RULE}`;

    const caseSchema = `Analyze this ${typeLabel} and assess the case.

${sharedContext}

Return ONLY valid JSON:
{
  "case_assessment": {
    "verdict": "FIGHT | BORDERLINE | JUST PAY",
    "fight_worthiness": <integer 1-10 — how much substance this case has (bare number, no text)>,
    "summary": "2-3 honest sentences: the strongest thing going for them, the weakest, and what the verdict rests on"
  },
  "defense_angles": [
    { "angle": "Short name of the defense", "strength": "strong | moderate | weak", "how_to_argue": "How to make this argument concretely, using their details — 1-2 sentences", "evidence_needed": "What would prove it — one sentence" }
  ],
  "evidence_checklist": [
    { "item": "Specific thing to photograph, save, or request", "why": "What it proves — one sentence", "urgency": "today | before_filing" }
  ]
}

Your response MUST contain ALL 3 top-level keys: case_assessment, defense_angles, evidence_checklist. "verdict" MUST be EXACTLY one of the English tokens FIGHT, BORDERLINE, or JUST PAY and "strength"/"urgency" MUST be the exact English tokens shown — they are code values the UI switches on; never translate them (all prose fields ARE in the user's language). "fight_worthiness" is a bare integer. LIMITS: defense_angles ≤ 5 (strongest first), evidence_checklist ≤ 6. Include ONLY defense angles grounded in the user's own account — never list hypothetical statutory defenses (e.g. stolen or leased vehicle) the user has not claimed.`;

    const appealSchema = `Draft the appeal package for this ${typeLabel}.

${sharedContext}

Return ONLY valid JSON:
{
  "appeal_letter": "COMPLETE ready-to-send appeal letter: date placeholder, citation number placeholder [CITATION #], recipient line, the user's account woven in factually and respectfully, a clear request (dismissal or review), polite closing with [YOUR NAME]. 120-200 words. Factual tone — never emotional, never accusatory.",
  "how_to_file": {
    "where": "Where to submit — verified channel if known, otherwise how to find the official one (one sentence)",
    "method_tips": "Practical filing tips for this jurisdiction/type — 1-2 sentences",
    "deadline_note": "The deadline if verified or user-provided, else a warning to check the date printed on the ticket — one sentence. Never state a specific number of days unless it appears in the VERIFIED block or was user-provided"
  },
  "decision_math": {
    "cost_of_paying": "The fine plus any knock-on costs, in the user's currency — one sentence",
    "cost_of_fighting": "Realistic time/effort (and any hearing cost) — one sentence",
    "bottom_line": "Honest recommendation weighing the two — 1-2 sentences. If the user's own account leaves no legally recognized defense, recommend paying; never suggest filing merely because it is low-effort"
  },
  "dont_say": [ "A thing people say that hurts their appeal, and why — one sentence" ]
}

Your response MUST contain ALL 4 top-level keys: appeal_letter, how_to_file, decision_math, dont_say. LIMITS: dont_say ≤ 3. All prose in the user's language.`;

    const systemPrompt = 'You are a seasoned parking/traffic-ticket appeals advocate — practical, honest, and precise. You know what hearing officers actually respond to: facts, evidence, and procedure, not outrage.';

    const content = (schemaText) => imageBlocks.length
      ? [...imageBlocks, { type: 'text', text: schemaText }]
      : schemaText;

    // Parallel split from day one (latency budget <60s): two ~half-size
    // generations with disjoint top-level keys, merged to one response.
    const [casePart, appealPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: content(caseSchema) }],
      }, { label: 'ticket-tackler-case' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: content(appealSchema) }],
      }, { label: 'ticket-tackler-appeal' }),
    ]);

    const parsed = { ...appealPart, ...casePart };
    if (!parsed.case_assessment) {
      return res.status(500).json({ error: 'Could not analyze your ticket. Please try again.' });
    }
    res.json(stripCites(parsed));
  } catch (error) {
    console.error('[TicketTackler]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── FOLLOW-UP Q&A ──────────────────────────────────────────────
router.post('/ticket-tackler/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, analysisContext, city, ticketType, userLanguage, userLocale, userCurrency, userRegion } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'What do you want to know?' });

    const prompt = withLanguage(`Answer a follow-up question about a ${TYPE_LABELS[ticketType] || 'parking ticket'} appeal in ${city || 'the stated jurisdiction'}.

PRIOR ANALYSIS (summary): ${String(analysisContext || 'N/A').slice(0, 3000)}
QUESTION: ${question.trim().slice(0, 1000)}

RULES: honest and practical; never promise outcomes; never invent portals, phone numbers, or deadlines — point to the ticket itself or the official channel generically when unverified. ${NO_QUOTE_RULE}

Return ONLY valid JSON:
{
  "answer": "Clear, direct answer — 2-4 sentences",
  "watch_out": "A pitfall related to this question, or null",
  "next_step": "The single most useful next action, or null"
}

Your response MUST contain ALL 3 keys: answer, watch_out, next_step.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage('Practical ticket-appeal advocate. Direct, honest, protective. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'ticket-tackler-followup' });
    if (!parsed.answer) {
      return res.status(500).json({ error: 'Could not answer that. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[TicketTackler/followup]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
